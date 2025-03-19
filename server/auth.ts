import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./utils/logger";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export function setupAuth(app: Express) {
  // セッション設定
  const sessionSettings: session.SessionOptions = {
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // セッションクッキーの名前を設定
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24時間
    }
  };

  // セッションミドルウェアの初期化
  app.use(session(sessionSettings));

  // Passportの初期化
  app.use(passport.initialize());
  app.use(passport.session());

  // デバッグ用：セッション状態をログ出力
  app.use((req, res, next) => {
    log('debug', 'セッション状態', {
      sessionId: req.sessionID,
      userId: req.session?.userId,
      isAuthenticated: req.isAuthenticated(),
      user: req.user
    });
    next();
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
          log('info', 'ログイン試行', { email });
          const user = await storage.getUserByEmail(email);

          if (!user) {
            log('warn', 'ユーザーが見つかりません', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            log('warn', 'パスワードが一致しません', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          log('info', 'ログイン成功', { 
            userId: user.id,
            email: user.email,
            role: user.role
          });
          return done(null, user);
        } catch (error) {
          log('error', 'ログインエラー', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
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

  // ログインAPI
  app.post("/api/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        log('error', 'ログイン処理エラー', { error: err });
        return res.status(500).json({ message: "ログイン処理中にエラーが発生しました" });
      }
      if (!user) {
        log('warn', 'ログイン失敗', {
          email: req.body.email,
          reason: info?.message || "認証失敗"
        });
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }

      req.login(user, (err) => {
        if (err) {
          log('error', 'セッション作成エラー', { error: err });
          return res.status(500).json({ message: "セッションの作成に失敗しました" });
        }

        // セッションにユーザーIDを保存
        req.session.userId = user.id;
        req.session.save((err) => {
          if (err) {
            log('error', 'セッション保存エラー', { error: err });
            return res.status(500).json({ message: "セッションの保存に失敗しました" });
          }
          log('info', 'ログイン・セッション作成成功', {
            userId: user.id,
            sessionId: req.sessionID
          });
          res.json({ user: sanitizeUser(user) });
        });
      });
    })(req, res, next);
  });

  // ログアウトAPI (from original code)
  app.post("/api/logout", (req, res) => {
    try {
      const userRole = req.user?.role; // ログアウト前にロールを保存

      if (req.user) {
        log('info', 'ログアウトリクエスト受信', {
          userId: req.user.id,
          role: userRole
        });
      }

      req.logout((err) => {
        if (err) {
          log('error', 'ログアウトエラー', { error: err });
          return res.status(500).json({ message: "ログアウト処理中にエラーが発生しました" });
        }
        req.session.destroy((err) => {
          if (err) {
            log('error', 'セッション破棄エラー', { error: err });
            return res.status(500).json({ message: "セッションの破棄に失敗しました" });
          }
          res.clearCookie('sessionId'); // Use the new session name
          return res.status(200).json({ 
            message: "ログアウトしました",
            role: userRole // ログアウト前のロールを返す
          });
        });
      });
    } catch (error) {
      log('error', 'ログアウトエラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return res.status(500).json({ message: "ログアウト処理中にエラーが発生しました" });
    }
  });

  // 認証チェックAPI (from original code)
  app.get("/api/check", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }
    res.json(sanitizeUser(req.user));
  });

  app.set("trust proxy", 1);
  return app;
}

// ユーザー情報から機密情報を除外
function sanitizeUser(user: SelectUser) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    const [hashedPassword, salt] = stored.split('.');
    const derivedKey = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(hashedPassword, 'hex');
    return timingSafeEqual(derivedKey, storedBuffer);
  } catch (error) {
    log('error', 'パスワード比較エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

export { hashPassword, comparePasswords };