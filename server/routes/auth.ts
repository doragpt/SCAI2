import { Router } from 'express';
import { storage } from '../storage';
import { authenticate } from '../middleware/auth';
import { talentRegisterFormSchema } from '@shared/schema';
import { NextFunction, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';

const router = Router();

// ユーザー情報取得エンドポイント
router.get("/user", authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "認証が必要です" });
    }

    // 必要なユーザー情報のみを返す
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      birthDate: user.birth_date, // スネークケースからキャメルケースに変換
      location: user.location,
      preferredLocations: user.preferred_locations || [], // スネークケースからキャメルケースに変換
      role: user.role
    };

    console.log('Sending user data:', sanitizedUser); // デバッグ用ログ
    res.json(sanitizedUser);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({
      message: "ユーザー情報の取得に失敗しました",
      error: error instanceof Error ? error.message : undefined
    });
  }
});

// 認証エンドポイント
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // リクエストデータのバリデーション
    const validatedData = talentRegisterFormSchema.parse(req.body);

    // 既存ユーザーのチェック
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(400).json({ message: "このユーザー名は既に使用されています" });
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // birthDateを日付オブジェクトに変換
    const birthDate = new Date(validatedData.birthDate);

    // ユーザーの作成
    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword,
      birthDate,
      birthDateModified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // セッションの作成
    req.login(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      res.status(201).json(user);
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: "登録処理中にエラーが発生しました",
      details: error instanceof Error ? error.message : undefined
    });
  }
});

// ログインエンドポイント
router.post("/login", async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    // 認証処理は auth.ts で実装済み
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "ログインに失敗しました"
    });
  }
});

// ログアウトエンドポイント
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

// セッションチェックエンドポイント
router.get("/check", authenticate, (req, res) => {
  res.json(req.user);
});

export default router;