import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
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
    log('info', 'パスワード比較処理開始', {
      suppliedLength: supplied?.length,
      storedHashLength: stored?.length,
      timestamp: new Date().toISOString()
    });

    const isValid = await bcrypt.compare(supplied, stored);

    log('info', 'パスワード比較結果', {
      isValid,
      timestamp: new Date().toISOString()
    });

    return isValid;
  } catch (error) {
    log('error', 'パスワード比較エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

export function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24時間
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

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
          log('info', '店舗ログイン認証開始', {
            email,
            timestamp: new Date().toISOString()
          });

          const user = await storage.getUserByEmail(email);

          // ユーザー検索結果のログ
          log('info', '店舗ユーザー検索結果', {
            exists: !!user,
            userId: user?.id,
            userRole: user?.role,
            timestamp: new Date().toISOString()
          });

          if (!user) {
            log('warn', '店舗ログイン失敗 - ユーザー不在', {
              email,
              timestamp: new Date().toISOString()
            });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          if (user.role !== "store") {
            log('warn', '店舗ログイン失敗 - ロール不正', {
              email,
              expectedRole: 'store',
              actualRole: user.role,
              timestamp: new Date().toISOString()
            });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          const isValid = await comparePasswords(password, user.password);

          // パスワード比較結果の詳細ログ
          log('info', '店舗ログインパスワード比較', {
            userId: user.id,
            isValid,
            timestamp: new Date().toISOString()
          });

          if (!isValid) {
            log('warn', '店舗ログイン失敗 - パスワード不正', {
              email,
              userId: user.id,
              timestamp: new Date().toISOString()
            });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          log('info', '店舗ログイン成功', {
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString()
          });

          return done(null, user);
        } catch (error) {
          log('error', '店舗ログイン処理エラー', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            email,
            timestamp: new Date().toISOString()
          });
          return done(error);
        }
      }
    )
  );

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
          log('info', 'タレントログイン認証開始', {
            email,
            timestamp: new Date().toISOString()
          });

          const user = await storage.getUserByEmail(email);

          if (!user || user.role !== "talent") {
            log('warn', 'タレントログイン失敗 - ユーザー不正', {
              email,
              exists: !!user,
              role: user?.role,
              timestamp: new Date().toISOString()
            });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          const isValid = await comparePasswords(password, user.password);

          if (!isValid) {
            log('warn', 'タレントログイン失敗 - パスワード不正', {
              email,
              userId: user.id,
              timestamp: new Date().toISOString()
            });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          log('info', 'タレントログイン成功', {
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString()
          });

          return done(null, user);
        } catch (error) {
          log('error', 'タレントログイン処理エラー', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            email,
            timestamp: new Date().toISOString()
          });
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, { id: user.id, role: user.role });
  });

  passport.deserializeUser(async (data: { id: number; role: string }, done) => {
    try {
      const user = await storage.getUser(data.id);
      if (!user || user.role !== data.role) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/login/:role", (req, res, next) => {
    const role = req.params.role as "talent" | "store";
    if (!["talent", "store"].includes(role)) {
      return res.status(400).json({ message: "無効なロールです" });
    }

    log('info', 'ログインリクエスト受信', {
      email: req.body.email,
      role,
      timestamp: new Date().toISOString()
    });

    passport.authenticate(role, (err: any, user: any, info: any) => {
      if (err) {
        log('error', 'ログイン処理エラー', {
          error: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          role,
          timestamp: new Date().toISOString()
        });
        return next(err);
      }

      if (!user) {
        log('warn', 'ログイン認証失敗', {
          email: req.body.email,
          role,
          reason: info?.message,
          timestamp: new Date().toISOString()
        });
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }

      req.login(user, (err) => {
        if (err) {
          log('error', 'セッション作成エラー', {
            error: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : undefined,
            userId: user.id,
            timestamp: new Date().toISOString()
          });
          return next(err);
        }

        log('info', 'ログイン成功', {
          userId: user.id,
          email: user.email,
          role: user.role,
          timestamp: new Date().toISOString()
        });

        // パスワードを除外してユーザー情報を返す
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    if (req.user) {
      log('info', 'ログアウト処理開始', {
        userId: req.user.id,
        role: req.user.role,
        timestamp: new Date().toISOString()
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

  app.get("/api/auth/check", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }

    // パスワードを除外してユーザー情報を返す
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

export { hashPassword, comparePasswords };