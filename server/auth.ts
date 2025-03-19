import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { log } from "./utils/logger";

declare global {
  namespace Express {
    interface User {
      id: number;
      role: "talent" | "store";
      email: string;
      username: string;
    }
  }
}

export async function setupAuth(app: Express) {
  // セッション設定
  const sessionSettings: session.SessionOptions = {
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  };

  // セッションミドルウェアの初期化
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // 認証関連のルートで必ずJSONを返すように設定
  app.use('/api/auth', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // セッション状態のログ出力
  app.use((req, res, next) => {
    log('debug', 'セッション状態', {
      sessionId: req.sessionID,
      session: req.session,
      isAuthenticated: req.isAuthenticated(),
      user: req.user
    });
    next();
  });

  passport.serializeUser((user: Express.User, done) => {
    log('debug', 'ユーザーシリアライズ', { userId: user.id });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        log('warn', 'デシリアライズ失敗: ユーザーが見つかりません', { userId: id });
        return done(null, false);
      }
      log('debug', 'ユーザーデシリアライズ成功', { userId: id });
      done(null, user);
    } catch (error) {
      log('error', 'デシリアライズエラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: id
      });
      done(error);
    }
  });

  // Passportの設定
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }
          const isValidPassword = await storage.comparePasswords(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // ログインAPI
  app.post("/api/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        log('error', 'ログイン処理エラー', { error: err });
        return res.status(500).json({
          status: 'error',
          message: "ログイン処理中にエラーが発生しました"
        });
      }
      if (!user) {
        log('warn', 'ログイン失敗', {
          email: req.body.email,
          reason: info?.message || "認証失敗"
        });
        return res.status(401).json({
          status: 'error',
          message: info?.message || "認証に失敗しました"
        });
      }

      req.login(user, (err) => {
        if (err) {
          log('error', 'セッション作成エラー', { error: err });
          return res.status(500).json({
            status: 'error',
            message: "セッションの作成に失敗しました"
          });
        }

        log('info', 'ログイン成功', {
          userId: user.id,
          sessionId: req.sessionID
        });
        res.json({
          status: 'success',
          user: sanitizeUser(user)
        });
      });
    })(req, res, next);
  });

  // ログアウトAPI
  app.post("/api/logout", (req, res) => {
    const userRole = req.user?.role;
    req.logout((err) => {
      if (err) {
        log('error', 'ログアウトエラー', { error: err });
        return res.status(500).json({
          status: 'error',
          message: "ログアウト処理中にエラーが発生しました"
        });
      }
      req.session.destroy((err) => {
        if (err) {
          log('error', 'セッション破棄エラー', { error: err });
          return res.status(500).json({
            status: 'error',
            message: "セッションの破棄に失敗しました"
          });
        }
        res.clearCookie('sessionId');
        return res.status(200).json({
          status: 'success',
          message: "ログアウトしました",
          role: userRole
        });
      });
    });
  });

  // 認証チェックAPI
  app.get("/api/check", (req, res) => {
    try {
      log('debug', '認証チェックリクエスト', {
        isAuthenticated: req.isAuthenticated(),
        sessionID: req.sessionID,
        user: req.user
      });

      if (!req.isAuthenticated()) {
        return res.status(401).json({
          status: 'error',
          message: "認証されていません"
        });
      }

      res.json({
        status: 'success',
        user: sanitizeUser(req.user as User)
      });
    } catch (error) {
      log('error', '認証チェックエラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        status: 'error',
        message: '認証チェック中にエラーが発生しました'
      });
    }
  });

  // その他の認証関連ルートも同様に...
  return app;
}

// ユーザー情報から機密情報を除外
function sanitizeUser(user: User) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}