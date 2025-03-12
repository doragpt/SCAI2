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
  return bcrypt.compare(supplied, stored);
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

  // 共通のローカル認証戦略
  passport.use(
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

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
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

    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }

      if (user.role !== role) {
        return res.status(403).json({ message: "このアカウントではログインできません" });
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