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
    return await bcrypt.compare(supplied, stored);
  } catch (error) {
    log('error', 'パスワード比較エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

export function setupAuth(app: Express) {
  // Passportの初期化
  app.use(passport.initialize());
  app.use(passport.session());

  // 認証ストラテジーの設定
  passport.use("talent", new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
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

        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.use("store", new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
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

        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }
  ));

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
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  // 認証エンドポイント
  app.post("/api/auth/login/:role", (req, res, next) => {
    const role = req.params.role as "talent" | "store";
    if (!["talent", "store"].includes(role)) {
      return res.status(400).json({ message: "無効なロールです" });
    }

    passport.authenticate(role, (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

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

  app.get("/api/auth/check", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }
    res.json(req.user);
  });
}

export { hashPassword, comparePasswords };