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
  app.use(session({
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
  }));

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
          log('info', 'ログイン成功', { userId: user.id, email: user.email });
          return done(null, sanitizeUser(user));
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
      done(null, sanitizeUser(user));
    } catch (error) {
      done(error);
    }
  });

  // 認証ステータスチェックAPI
  app.get("/api/auth/check", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }
    res.json(sanitizeUser(req.user));
  });

  // ログインAPI
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        log('error', 'ログインエラー', { error: err });
        return res.status(500).json({ message: "ログイン処理中にエラーが発生しました" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }
      req.login(user, (err) => {
        if (err) {
          log('error', 'セッション作成エラー', { error: err });
          return res.status(500).json({ message: "セッションの作成に失敗しました" });
        }
        log('info', 'ログイン成功', { userId: user.id });
        res.json(user);
      });
    })(req, res, next);
  });

  // ログアウトAPI
  app.post("/api/auth/logout", (req, res) => {
    if (req.user) {
      log('info', 'ログアウト', { userId: (req.user as SelectUser).id });
    }
    req.logout((err) => {
      if (err) {
        log('error', 'ログアウトエラー', { error: err });
        return res.status(500).json({ message: "ログアウト処理中にエラーが発生しました" });
      }
      req.session.destroy((err) => {
        if (err) {
          log('error', 'セッション破棄エラー', { error: err });
          return res.status(500).json({ message: "セッションの破棄に失敗しました" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "ログアウトしました" });
      });
    });
  });

  // 新規登録API
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = talentRegisterFormSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "このメールアドレスは既に使用されています" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      req.login(sanitizeUser(user), (err) => {
        if (err) {
          log('error', 'セッション作成エラー', { error: err });
          return res.status(500).json({ message: "ログインセッションの作成に失敗しました" });
        }
        log('info', '新規登録成功', { userId: user.id });
        res.status(201).json({ user: sanitizeUser(user) });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "入力内容に誤りがあります",
          errors: error.errors
        });
      }
      log('error', '新規登録エラー', { error });
      res.status(500).json({ message: "登録処理中にエラーが発生しました" });
    }
  });
}

export { hashPassword, comparePasswords };