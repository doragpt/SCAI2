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
          if (!user) {
            log('warn', 'ユーザーが見つかりません', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          // パスワードの検証を行う前にログを出力
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

  // ユーザー情報取得API
  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証が必要です" });
    }
    res.json(req.user);
  });

  // ログインAPI
  app.post("/api/login", (req, res, next) => {
    log('info', 'ログインリクエスト受信', {
      email: req.body.email
    });

    passport.authenticate('local', (err, user, info) => {
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

  // ログアウトAPI
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

  // セッションチェックAPI
  app.get("/api/check", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }
    res.json(req.user);
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

function sanitizeUser(user: SelectUser) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}

export { hashPassword, comparePasswords };