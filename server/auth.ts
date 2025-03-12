import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { storage } from "./storage";
import { UserRole } from "@shared/schema";
import { log } from "./utils/logger";
import * as bcrypt from 'bcrypt';

// Expressのユーザー型定義
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      role: UserRole;
      displayName: string;
    }
  }
}

// パスワード比較関数
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    return await bcrypt.compare(supplied, stored);
  } catch (error) {
    log('error', 'パスワード比較エラー', { error });
    return false;
  }
}

export function setupAuth(app: Express) {
  // Passportの初期化
  app.use(passport.initialize());
  app.use(passport.session());

  // ローカル認証戦略の設定
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const role = req.body.role as UserRole;
        if (!role) {
          return done(null, false, { message: "ロールが指定されていません" });
        }

        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
        }

        if (user.role !== role) {
          return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
        }

        const isValid = await comparePasswords(password, user.hashedPassword);
        if (!isValid) {
          return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
        }

        // パスワードを除外したユーザー情報を返す
        const { hashedPassword, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        log('error', '認証エラー', { error, email });
        return done(error);
      }
    }
  ));

  // セッションのシリアライズ
  passport.serializeUser((user, done) => {
    done(null, { id: user.id, role: user.role });
  });

  // セッションのデシリアライズ
  passport.deserializeUser(async (data: { id: number; role: UserRole }, done) => {
    try {
      const user = await storage.getUser(data.id);
      if (!user || user.role !== data.role) {
        return done(null, false);
      }
      const { hashedPassword, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        log('error', 'Login error', { error: err });
        return next(err);
      }

      if (!user) {
        log('warn', 'Login failed', { 
          email: req.body.email,
          role: req.body.role,
          reason: info?.message 
        });
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }

      req.login(user, (err) => {
        if (err) {
          log('error', 'Session creation error', { error: err });
          return next(err);
        }

        log('info', 'Login complete', {
          userId: user.id,
          role: user.role,
          sessionId: req.sessionID
        });

        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    const userId = req.user?.id;
    const sessionId = req.sessionID;

    log('debug', 'Logout started', { userId, sessionId });

    req.logout((err) => {
      if (err) {
        log('error', 'Logout error', { error: err });
        return next(err);
      }

      req.session.destroy((err) => {
        if (err) {
          log('error', 'Session destruction error', { error: err });
          return next(err);
        }

        res.clearCookie('sessionId');
        log('info', 'Logout complete', { userId, sessionId });
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }
    res.json(req.user);
  });
}

export { comparePasswords };