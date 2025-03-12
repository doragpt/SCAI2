import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Router } from "express";
import session from "express-session";
import * as bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./utils/logger";

// ユーザー型の拡張
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// パスワードハッシュ化
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// パスワード検証
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

const authRouter = Router();

// Passport LocalStrategy設定
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      log('info', 'ログイン試行', { email });

      const user = await storage.getUserByEmail(email);
      if (!user) {
        log('warn', 'ユーザーが見つかりません', { email });
        return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        log('warn', 'パスワードが一致しません', { email });
        return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
      }

      const { password: _, ...userWithoutPassword } = user;
      log('info', 'ログイン認証成功', { email, role: user.role });
      return done(null, userWithoutPassword);
    } catch (error) {
      log('error', 'ログイン認証エラー', { error: error instanceof Error ? error.message : 'Unknown error' });
      return done(error);
    }
  }
));

// セッション管理
passport.serializeUser((user: any, done) => {
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
    const { password: _, ...userWithoutPassword } = user;
    log('info', 'セッションデシリアライズ成功', { userId: id });
    done(null, userWithoutPassword);
  } catch (error) {
    log('error', 'セッションデシリアライズエラー', { error: error instanceof Error ? error.message : 'Unknown error' });
    done(error);
  }
});

// ログインAPI
authRouter.post('/login', (req, res, next) => {
  log('info', 'ログインリクエスト受信', { 
    email: req.body.email,
    headers: req.headers 
  });

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      log('error', 'ログイン認証エラー', { error: err });
      return next(err);
    }
    if (!user) {
      log('warn', 'ログイン失敗', { email: req.body.email, reason: info?.message });
      return res.status(401).json({ message: info?.message || "認証に失敗しました" });
    }
    req.login(user, (err) => {
      if (err) {
        log('error', 'セッション作成エラー', { error: err });
        return next(err);
      }
      log('info', 'ログイン成功', { userId: user.id, email: user.email, role: user.role });
      res.json(user);
    });
  })(req, res, next);
});

// ログアウトAPI
authRouter.post('/logout', (req, res) => {
  if (req.user) {
    log('info', 'ログアウトリクエスト受信', { userId: req.user.id });
  }
  req.logout(() => {
    res.sendStatus(200);
  });
});

// ユーザー情報取得API
authRouter.get('/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "認証が必要です" });
  }
  res.json(req.user);
});

// セッションチェックAPI
authRouter.get('/check', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "認証されていません" });
  }
  res.json(req.user);
});

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
      maxAge: 24 * 60 * 60 * 1000 // 24時間
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use('/api/auth', authRouter);
}

function sanitizeUser(user: SelectUser) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}

export { hashPassword, comparePasswords };