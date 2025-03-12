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
    return isValid;
  } catch (error) {
    log('error', 'パスワード比較エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

export function setupAuth(app: Express) {
  // セッション設定
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
          const user = await storage.getUserByEmail(email);

          if (!user) {
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          if (user.role !== "talent") {
            return done(null, false, { message: "タレントアカウントでログインしてください" });
          }

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          return done(null, user);
        } catch (error) {
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
          const user = await storage.getUserByEmail(email);

          if (!user) {
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          if (user.role !== "store") {
            return done(null, false, { message: "店舗アカウントでログインしてください" });
          }

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // セッション管理
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

  // ログインエンドポイント
  app.post("/api/auth/login/:role", (req, res, next) => {
    const role = req.params.role as "talent" | "store";
    if (!["talent", "store"].includes(role)) {
      return res.status(400).json({ message: "無効なロールです" });
    }

    passport.authenticate(role, (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // ログアウトエンドポイント
  app.post("/api/auth/logout", (req, res, next) => {
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
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

export { hashPassword, comparePasswords };