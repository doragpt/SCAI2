import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, talentRegisterFormSchema } from "@shared/schema";
import { log } from "./utils/logger";
import * as z from 'zod';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('無効なパスワードです');
    }
    const salt = randomBytes(32).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  } catch (error) {
    log('error', 'パスワードハッシュ化エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('パスワードのハッシュ化に失敗しました');
  }
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    log('error', 'パスワード比較エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

function sanitizeUser(user: SelectUser) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
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

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          log('info', 'ログイン試行', { email });
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            log('warn', 'ログイン失敗', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }
          log('info', 'ログイン成功', {
            userId: user.id,
            email: user.email,
            role: user.role
          });
          return done(null, user);
        } catch (error) {
          log('error', 'ログインエラー', {
            error: error instanceof Error ? error.message : 'Unknown error',
            email
          });
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
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // ユーザー情報取得API
  app.get("/api/user", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const userData = await storage.getUser(req.user.id);
      if (!userData) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      log('info', 'ユーザー情報取得', {
        id: userData.id,
        email: userData.email,
        role: userData.role
      });

      res.json(sanitizeUser(userData));
    } catch (error) {
      log('error', 'ユーザー情報取得エラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });

  // ユーザー情報更新API
  app.patch("/api/user", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const { username, location, preferredLocations } = req.body;

      log('info', 'ユーザー情報更新リクエスト', {
        userId: req.user.id,
        updates: { username, location, preferredLocations }
      });

      const updatedUser = await storage.updateUser(req.user.id, {
        username,
        location,
        preferredLocations
      });

      log('info', 'ユーザー情報更新成功', {
        userId: updatedUser.id,
        email: updatedUser.email
      });

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      log('error', 'ユーザー情報更新エラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ message: "ユーザー情報の更新に失敗しました" });
    }
  });

  // ログインAPI
  app.post("/api/login", (req, res, next) => {
    log('info', 'ログインリクエスト受信', { 
      email: req.body.email
    });
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        log('warn', 'ログイン失敗', {
          email: req.body.email,
          reason: info?.message || "認証失敗"
        });
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        log('info', 'ログイン成功', {
          userId: user.id,
          email: user.email,
          role: user.role
        });
        res.json(sanitizeUser(user));
      });
    })(req, res, next);
  });

  // ログアウトAPI
  app.post("/api/logout", (req, res, next) => {
    try {
      if (req.user) {
        const user = req.user as SelectUser;
        log('info', 'ログアウトリクエスト受信', {
          userId: user.id,
          email: user.email
        });
      }
      req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
          if (err) {
            log('error', 'セッション破棄エラー', { error: err });
            return res.status(500).json({
              message: "セッションの破棄に失敗しました"
            });
          }
          res.clearCookie('connect.sid');
          return res.status(200).json({
            message: "ログアウトしました"
          });
        });
      });
    } catch (error) {
      log('error', 'ログアウトエラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return res.status(500).json({
        message: "ログアウト処理中にエラーが発生しました"
      });
    }
  });

  // セッションチェックAPI
  app.get("/api/check", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }
    res.json(sanitizeUser(req.user));
  });
  
    // 新規登録APIエンドポイント
  app.post("/api/auth/register", async (req, res) => {
    try {
      log('info', '新規登録リクエスト受信', {
        email: req.body.email,
        role: req.body.role
      });

      // リクエストデータのバリデーション
      const validatedData = talentRegisterFormSchema.parse(req.body);

      // 既存ユーザーチェック
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({
          message: "このメールアドレスは既に使用されています"
        });
      }

      // パスワードのハッシュ化
      const hashedPassword = await hashPassword(validatedData.password);

      // birthDateを日付オブジェクトに変換
      const birthDate = new Date(validatedData.birthDate);

      // ユーザー作成
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        birthDate,
        birthDateModified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      log('info', 'ユーザー登録成功', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // セッションの作成とレスポンス
      req.login(user, (err) => {
        if (err) {
          log('error', 'ログインセッション作成エラー', { error: err });
          return res.status(500).json({
            message: "ログインセッションの作成に失敗しました"
          });
        }

        return res.status(201).json({
          user: sanitizeUser(user)
        });
      });
    } catch (error) {
      log('error', '新規登録エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "入力内容に誤りがあります",
          errors: error.errors
        });
      }

      return res.status(500).json({
        message: "登録処理中にエラーが発生しました"
      });
    }
  });
}

export { hashPassword, comparePasswords };