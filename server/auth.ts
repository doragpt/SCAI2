import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import * as bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./utils/logger";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  } catch (error) {
    log('error', 'パスワードハッシュ化エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('パスワードのハッシュ化に失敗しました');
  }
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
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
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
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

        log('info', 'パスワード検証開始', { 
          email,
          userRole: user.role,
        });

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

        return done(null, sanitizeUser(user));
      } catch (error) {
        log('error', 'ログイン認証エラー', {
          error: error instanceof Error ? error.message : 'Unknown error',
          email
        });
        return done(error);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    log('info', 'セッションシリアライズ', { userId: user.id });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        log('warn', 'セッションデシリアライズ失敗: ユーザーが見つかりません', { id });
        return done(null, false);
      }
      log('info', 'セッションデシリアライズ成功', { userId: user.id });
      done(null, sanitizeUser(user));
    } catch (error) {
      log('error', 'セッションデシリアライズエラー', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id 
      });
      done(error);
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証が必要です" });
    }
    res.json(req.user);
  });

  app.post("/api/login", (req, res, next) => {
    log('info', 'ログインリクエスト受信', {
      email: req.body.email
    });

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        log('error', 'ログイン認証エラー', { error: err });
        return next(err);
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
          return next(err);
        }
        log('info', 'ログイン成功', {
          userId: user.id,
          email: user.email,
          role: user.role
        });
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    if (req.user) {
      const user = req.user as SelectUser;
      log('info', 'ログアウトリクエスト受信', {
        userId: user.id,
        email: user.email
      });
    }
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/check", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }
    res.json(req.user);
  });
}

function sanitizeUser(user: SelectUser) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}

export { hashPassword, comparePasswords };