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
import { generateToken } from './jwt';

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

// ログインスキーマの定義
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上必要です')
});

export function setupAuth(app: Express) {
  // セッション設定
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

  // ログインAPI
  app.post("/api/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(validatedData.email);

      if (!user || !(await comparePasswords(validatedData.password, user.password))) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが間違っています" });
      }

      // JWTトークンの生成
      const token = generateToken(user);

      // レスポンスの送信
      res.json({
        token,
        user: sanitizeUser(user)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "入力内容に誤りがあります",
          errors: error.errors
        });
      }

      log('error', 'ログインエラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({
        message: "ログイン処理中にエラーが発生しました"
      });
    }
  });

  // 新規登録API
  app.post("/api/auth/register", async (req, res) => {
    try {
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

      // ユーザー作成
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // JWTトークンの生成
      const token = generateToken(user);

      log('info', 'ユーザー登録成功', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // レスポンスの送信
      res.status(201).json({
        token,
        user: sanitizeUser(user)
      });
    } catch (error) {
      log('error', '新規登録エラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "入力内容に誤りがあります",
          errors: error.errors
        });
      }

      res.status(500).json({
        message: "登録処理中にエラーが発生しました"
      });
    }
  });

  // セッションチェックAPI
  app.get("/api/auth/check", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: "無効な認証トークンです" });
      }

      res.json({ authenticated: true });
    } catch (error) {
      log('error', '認証チェックエラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(401).json({ message: "認証に失敗しました" });
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
        log('warn', '認証なしでの更新試行');
        return res.status(401).json({ message: "認証が必要です" });
      }

      // リクエストデータをログ出力
      log('info', '更新リクエストデータ', req.body);

      const { username, location, preferredLocations, currentPassword, newPassword } = req.body;

      // パスワード変更のリクエストがある場合
      if (currentPassword && newPassword) {
        const user = await storage.getUser(req.user.id);
        if (!user) {
          return res.status(404).json({ message: "ユーザーが見つかりません" });
        }

        // 現在のパスワードを確認
        const isValidPassword = await comparePasswords(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ message: "現在のパスワードが正しくありません" });
        }

        // 新しいパスワードをハッシュ化
        const hashedPassword = await hashPassword(newPassword);

        // ユーザー情報を更新（パスワードを含む）
        const updatedUser = await storage.updateUser(req.user.id, {
          username,
          location,
          preferredLocations,
          password: hashedPassword
        });

        log('info', 'ユーザー情報更新成功（パスワード変更含む）', {
          id: updatedUser.id,
          email: updatedUser.email
        });

        return res.json({
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          birthDate: updatedUser.birthDate,
          location: updatedUser.location,
          preferredLocations: updatedUser.preferredLocations || [],
          role: updatedUser.role
        });
      }

      // 通常の情報更新
      const updatedUser = await storage.updateUser(req.user.id, {
        username,
        location,
        preferredLocations
      });

      log('info', 'ユーザー情報更新成功', {
        id: updatedUser.id,
        email: updatedUser.email
      });

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        birthDate: updatedUser.birthDate,
        location: updatedUser.location,
        preferredLocations: updatedUser.preferredLocations || [],
        role: updatedUser.role
      });
    } catch (error) {
      log('error', 'ユーザー情報更新エラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({
        message: "ユーザー情報の更新に失敗しました"
      });
    }
  });


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

  // セッションチェックAPI (This is already defined above, this line is redundant and should be removed)
  //app.get("/api/check", (req, res) => {
  //  if (!req.isAuthenticated()) {
  //    return res.status(401).json({ message: "認証されていません" });
  //  }
  //  res.json(sanitizeUser(req.user));
  //});

}

export { hashPassword, comparePasswords };