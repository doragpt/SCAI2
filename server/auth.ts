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
    const isValid = await bcrypt.compare(supplied, stored);
    console.log('Password comparison result:', {
      isValid,
      timestamp: new Date().toISOString()
    });
    return isValid;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

function sanitizeUser(user: SelectUser) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
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
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    "store",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          log('info', '店舗ログイン試行:', {
            email,
            timestamp: new Date().toISOString()
          });

          const user = await storage.getUserByEmail(email);

          console.log('Store login attempt:', {
            email,
            hasUser: !!user,
            role: user?.role,
            timestamp: new Date().toISOString()
          });

          if (!user || user.role !== "store") {
            log('warn', '店舗ログイン失敗:', {
              email,
              reason: 'ユーザー不在またはロール不正'
            });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          const isValid = await comparePasswords(password, user.password);

          if (!isValid) {
            log('warn', '店舗ログイン失敗:', {
              email,
              reason: 'パスワード不一致'
            });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          log('info', '店舗ログイン成功:', {
            userId: user.id,
            email: user.email
          });

          return done(null, user);
        } catch (error) {
          log('error', '店舗ログインエラー:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            email
          });
          return done(error);
        }
      }
    )
  );

  // タレント用のストラテジー
  passport.use(
    "talent",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          log('info', 'タレントログイン試行:', {
            email,
            timestamp: new Date().toISOString()
          });

          const user = await storage.getUserByEmail(email);
          if (!user || user.role !== "talent") {
            log('warn', 'タレントログイン失敗 - ユーザー不正:', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            log('warn', 'タレントログイン失敗 - パスワード不正:', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          log('info', 'タレントログイン成功:', {
            userId: user.id,
            email: user.email
          });

          return done(null, user);
        } catch (error) {
          log('error', 'タレントログインエラー:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            email
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

    passport.authenticate(role, (err: any, user: any, info: any) => {
      if (err) {
        log('error', 'ログインエラー', {
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
          email: user.email,
          role: user.role
        });

        res.json(sanitizeUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    if (req.user) {
      log('info', 'ログアウト', {
        userId: req.user.id,
        role: req.user.role
      });
    }

    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie("connect.sid");
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/auth/check", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }
    res.json(sanitizeUser(req.user));
  });
}

export { hashPassword, comparePasswords };