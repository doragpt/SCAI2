import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./utils/logger";
import * as bcrypt from 'bcrypt';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // BCrypt形式のハッシュかどうかを確認
    if (!stored.startsWith('$2b$')) {
      log('error', 'パスワードハッシュ形式が不正', {
        storedHashType: stored.substring(0, 4)
      });
      return false;
    }

    log('debug', 'パスワード比較開始', {
      hashedPasswordLength: stored.length
    });

    const isValid = await bcrypt.compare(supplied, stored);

    log('debug', 'パスワード比較結果', {
      isValid
    });

    return isValid;
  } catch (error) {
    log('error', 'パスワード比較エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

export function setupAuth(app: Express) {
  app.use(passport.initialize());
  app.use(passport.session());

  // タレント用の認証戦略
  passport.use(
    "talent",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          log('debug', 'タレント認証開始', { email });

          const user = await storage.getUserByEmail(email);

          if (!user) {
            log('warn', 'ユーザーが存在しません', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          if (user.role !== "talent") {
            log('warn', '不正なロール', { email, role: user.role });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            log('warn', 'パスワード不一致', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          log('info', 'タレント認証成功', { userId: user.id });
          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          log('error', 'タレント認証エラー', {
            error: error instanceof Error ? error.message : 'Unknown error',
            email
          });
          return done(error);
        }
      }
    )
  );

  // 店舗用の認証戦略
  passport.use(
    "store",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          log('debug', '店舗認証開始', { email });

          const user = await storage.getUserByEmail(email);

          if (!user) {
            log('warn', 'ユーザーが存在しません', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          if (user.role !== "store") {
            log('warn', '不正なロール', { email, role: user.role });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            log('warn', 'パスワード不一致', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          log('info', '店舗認証成功', { userId: user.id });
          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          log('error', '店舗認証エラー', {
            error: error instanceof Error ? error.message : 'Unknown error',
            email
          });
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    log('debug', 'セッションシリアライズ', { userId: user.id });
    done(null, { id: user.id, role: user.role });
  });

  passport.deserializeUser(async (data: { id: number; role: string }, done) => {
    try {
      const user = await storage.getUser(data.id);
      if (!user || user.role !== data.role) {
        log('warn', 'セッションデシリアライズ失敗', { id: data.id, role: data.role });
        return done(null, false);
      }
      log('debug', 'セッションデシリアライズ成功', { userId: user.id });
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      log('error', 'セッションデシリアライズエラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      done(error);
    }
  });

  app.post("/api/auth/login/:role", (req, res, next) => {
    const role = req.params.role as "talent" | "store";
    if (!["talent", "store"].includes(role)) {
      return res.status(400).json({ message: "無効なロールです" });
    }

    log('debug', 'ログインリクエスト受信', {
      email: req.body.email,
      role,
      sessionID: req.sessionID
    });

    passport.authenticate(role, (err: any, user: any, info: any) => {
      if (err) {
        log('error', 'ログイン処理エラー', {
          error: err instanceof Error ? err.message : 'Unknown error',
          role
        });
        return next(err);
      }

      if (!user) {
        log('warn', 'ログイン失敗', {
          email: req.body.email,
          role,
          reason: info?.message
        });
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }

      req.login(user, (err) => {
        if (err) {
          log('error', 'セッション作成エラー', {
            error: err instanceof Error ? err.message : 'Unknown error',
            userId: user.id
          });
          return next(err);
        }

        log('info', 'ログイン成功', {
          userId: user.id,
          role: user.role,
          sessionID: req.sessionID
        });

        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    const sessionID = req.sessionID;
    const userId = req.user?.id;

    log('debug', 'ログアウト開始', { userId, sessionID });

    req.logout((err) => {
      if (err) {
        log('error', 'ログアウトエラー', {
          error: err instanceof Error ? err.message : 'Unknown error'
        });
        return next(err);
      }

      req.session.destroy((err) => {
        if (err) {
          log('error', 'セッション削除エラー', {
            error: err instanceof Error ? err.message : 'Unknown error'
          });
          return next(err);
        }

        res.clearCookie('sessionId');
        log('info', 'ログアウト完了', { userId, sessionID });
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/auth/check", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }
    res.json(req.user);
  });
}

export { comparePasswords };