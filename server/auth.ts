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

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const isValid = await bcrypt.compare(supplied, stored);
    log('info', 'パスワード比較結果', {
      isValid,
      timestamp: new Date().toISOString()
    });
    return isValid;
  } catch (error) {
    log('error', 'パスワード比較エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

function sanitizeUser(user: SelectUser) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
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
          log('info', 'タレントログイン試行', {
            email,
            timestamp: new Date().toISOString()
          });

          const user = await storage.getUserByEmail(email);

          if (!user) {
            log('warn', 'タレントログイン失敗 - ユーザー不在', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          if (user.role !== "talent") {
            log('warn', 'タレントログイン失敗 - ロール不正', { 
              email,
              actualRole: user.role 
            });
            return done(null, false, { message: "タレントアカウントでログインしてください" });
          }

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            log('warn', 'タレントログイン失敗 - パスワード不正', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          log('info', 'タレントログイン成功', {
            userId: user.id,
            email: user.email
          });

          return done(null, sanitizeUser(user));
        } catch (error) {
          log('error', 'タレントログイン処理エラー', {
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
          log('info', '店舗ログイン試行', {
            email,
            timestamp: new Date().toISOString()
          });

          const user = await storage.getUserByEmail(email);

          if (!user) {
            log('warn', '店舗ログイン失敗 - ユーザー不在', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          if (user.role !== "store") {
            log('warn', '店舗ログイン失敗 - ロール不正', { 
              email,
              actualRole: user.role 
            });
            return done(null, false, { message: "店舗アカウントでログインしてください" });
          }

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            log('warn', '店舗ログイン失敗 - パスワード不正', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          log('info', '店舗ログイン成功', {
            userId: user.id,
            email: user.email
          });

          return done(null, sanitizeUser(user));
        } catch (error) {
          log('error', '店舗ログイン処理エラー', {
            error: error instanceof Error ? error.message : 'Unknown error',
            email
          });
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    const { id, role } = user;
    done(null, { id, role });
  });

  passport.deserializeUser(async (data: { id: number; role: string }, done) => {
    try {
      const user = await storage.getUser(data.id);
      if (!user || user.role !== data.role) {
        return done(null, false);
      }
      done(null, sanitizeUser(user));
    } catch (error) {
      done(error);
    }
  });

  // ログインエンドポイント
  app.post("/api/auth/login/:role", (req, res, next) => {
    const role = req.params.role as "talent" | "store";
    if (!["talent", "store"].includes(role)) {
      return res.status(400).json({ message: "無効なロールです" });
    }

    passport.authenticate(role, (err: any, user: any, info: any) => {
      if (err) {
        log('error', 'ログインエラー', {
          error: err instanceof Error ? err.message : 'Unknown error',
          role,
          timestamp: new Date().toISOString()
        });
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user); // すでにsanitize済み
      });
    })(req, res, next);
  });

  // ログアウトエンドポイント
  app.post("/api/auth/logout", (req, res, next) => {
    if (req.user) {
      log('info', 'ログアウト処理', {
        userId: req.user.id,
        role: req.user.role
      });
    }

    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  });

  // セッションチェックエンドポイント
  app.get("/api/auth/check", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }
    res.json(req.user); // すでにsanitize済み
  });
}

export { hashPassword, comparePasswords };