import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./utils/logger";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// パスワード関連の定数
const SALT_LENGTH = 32; // 一定のソルト長を使用
const KEY_LENGTH = 64;  // scryptの出力長

// パスワードハッシュ化関数
async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('無効なパスワードです');
    }

    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const buf = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    const hashedPassword = buf.toString('hex');

    log('info', 'パスワードハッシュ化完了', {
      saltLength: salt.length,
      hashedLength: hashedPassword.length
    });

    return `${hashedPassword}.${salt}`;
  } catch (error) {
    log('error', 'パスワードハッシュ化エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('パスワードのハッシュ化に失敗しました');
  }
}

// パスワード比較関数
async function comparePasswords(inputPassword: string, storedPassword: string): Promise<boolean> {
  try {
    if (!inputPassword || !storedPassword) {
      log('error', '無効なパスワード入力', {
        hasInput: !!inputPassword,
        hasStored: !!storedPassword
      });
      return false;
    }

    const [hashedPassword, salt] = storedPassword.split('.');

    if (!hashedPassword || !salt || salt.length !== SALT_LENGTH * 2) {
      log('error', 'パスワード形式が不正', {
        hasHashedPassword: !!hashedPassword,
        hasSalt: !!salt,
        saltLength: salt?.length,
        expectedLength: SALT_LENGTH * 2
      });
      return false;
    }

    const buf = (await scryptAsync(inputPassword, salt, KEY_LENGTH)) as Buffer;
    const inputHash = buf.toString('hex');

    const result = timingSafeEqual(
      Buffer.from(hashedPassword, 'hex'),
      Buffer.from(inputHash, 'hex')
    );

    log('info', 'パスワード検証結果', { isValid: result });

    return result;
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
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        log('info', 'ログイン試行', { username });

        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "ユーザー名またはパスワードが間違っています" });
        }

        log('info', 'ログイン成功', {
          userId: user.id,
          username: user.username,
          role: user.role
        });

        return done(null, user);
      } catch (error) {
        log('error', 'ログインエラー', {
          error: error instanceof Error ? error.message : 'Unknown error',
          username
        });
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    log('debug', 'ユーザーシリアライズ', { userId: user.id });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      log('debug', 'ユーザーデシリアライズ', { userId: id });
      const user = await storage.getUser(id);
      if (!user) {
        log('warn', 'デシリアライズ時にユーザーが見つかりません', { userId: id });
        return done(new Error('ユーザーが見つかりません'));
      }
      done(null, user);
    } catch (error) {
      log('error', 'デシリアライズエラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: id
      });
      done(error);
    }
  });

  // 新規登録APIエンドポイント
  app.post("/api/auth/register", async (req, res) => {
    try {
      log('info', '新規登録リクエスト受信', {
        username: req.body.username,
        role: req.body.role
      });

      // バリデーション
      if (!req.body.username || !req.body.password) {
        return res.status(400).json({
          message: "ユーザー名とパスワードは必須です"
        });
      }

      if (req.body.password.length < 8) {
        return res.status(400).json({
          message: "パスワードは8文字以上である必要があります"
        });
      }

      // 既存ユーザーチェック
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({
          message: "このユーザー名は既に使用されています"
        });
      }

      // パスワードのハッシュ化
      const hashedPassword = await hashPassword(req.body.password);

      // ユーザー作成
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        createdAt: new Date()
      });

      log('info', 'ユーザー登録成功', {
        userId: user.id,
        username: user.username,
        role: user.role
      });

      return res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          displayName: user.displayName,
          location: user.location,
          birthDate: user.birthDate,
          preferredLocations: user.preferredLocations
        }
      });
    } catch (error) {
      log('error', '新規登録エラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        message: "登録処理中にエラーが発生しました"
      });
    }
  });

  // ログインAPIエンドポイント
  app.post("/api/auth/login", (req, res, next) => {
    log('info', 'ログインリクエスト受信', {
      username: req.body.username,
      role: req.body.role
    });

    if (!req.body.username || !req.body.password) {
      return res.status(400).json({
        message: "ユーザー名とパスワードは必須です"
      });
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        log('error', 'ログインエラー', { error: err });
        return res.status(500).json({
          message: "ログイン処理中にエラーが発生しました"
        });
      }

      if (!user) {
        log('warn', 'ログイン失敗', {
          username: req.body.username,
          reason: info?.message || "認証失敗"
        });
        return res.status(401).json({
          message: info?.message || "ユーザー名またはパスワードが間違っています"
        });
      }

      // 店舗ユーザーのロールチェック
      if (req.body.role === "store" && user.role !== "store") {
        return res.status(403).json({
          message: "店舗管理者用のログインページです"
        });
      }

      req.login(user, async (loginErr) => {
        if (loginErr) {
          log('error', 'ログインセッションエラー', { error: loginErr });
          return res.status(500).json({
            message: "ログインセッションの作成に失敗しました"
          });
        }

        log('info', 'ログイン成功', {
          userId: user.id,
          username: user.username,
          role: user.role
        });

        return res.status(200).json({
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            displayName: user.displayName,
            location: user.location,
            birthDate: user.birthDate,
            preferredLocations: user.preferredLocations
          }
        });
      });
    })(req, res, next);
  });

  // ログアウトAPIエンドポイント
  app.post("/api/auth/logout", (req, res) => {
    try {
      if (req.user) {
        log('info', 'ログアウトリクエスト受信', {
          userId: (req.user as SelectUser).id,
          username: (req.user as SelectUser).username
        });
      }

      req.logout((err) => {
        if (err) {
          log('error', 'ログアウトエラー', { error: err });
          return res.status(500).json({
            message: "ログアウト処理中にエラーが発生しました"
          });
        }
        return res.status(200).json({
          message: "ログアウトしました"
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

  // セッションチェックAPIエンドポイント
  app.get("/api/auth/check", (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          message: "認証されていません"
        });
      }

      const user = req.user as SelectUser;
      log('info', '認証チェック成功', {
        userId: user.id,
        username: user.username,
        role: user.role
      });

      return res.status(200).json({
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        location: user.location,
        birthDate: user.birthDate,
        preferredLocations: user.preferredLocations
      });
    } catch (error) {
      log('error', '認証チェックエラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        message: "認証確認中にエラーが発生しました"
      });
    }
  });
}

export { hashPassword, comparePasswords };