import { Router } from 'express';
import { storage } from '../storage';
import { authenticate } from '../middleware/auth';
import { talentRegisterFormSchema } from '@shared/schema';
import { NextFunction, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { log } from '../utils/logger';

const router = Router();

// ユーザー情報取得エンドポイント
router.get("/user", authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      log('warn', 'ユーザー認証なし');
      return res.status(401).json({ message: "認証が必要です" });
    }

    // データベースから最新のユーザー情報を取得
    const userData = await storage.getUser(user.id);
    if (!userData) {
      log('warn', 'ユーザーが見つかりません', { id: user.id });
      return res.status(404).json({ message: "ユーザーが見つかりません" });
    }

    // データベースの値をログ出力
    log('info', 'データベースから取得したユーザー情報', {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      birthDate: userData.birthDate,
      location: userData.location,
      preferredLocations: userData.preferredLocations
    });

    // 必要なユーザー情報のみを返す
    const response = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      birthDate: userData.birthDate,
      location: userData.location,
      preferredLocations: Array.isArray(userData.preferredLocations) ? userData.preferredLocations : [],
      role: userData.role
    };

    // レスポンスデータをログ出力
    log('info', 'クライアントに送信するレスポンス', response);

    res.json(response);
  } catch (error) {
    log('error', 'ユーザー情報取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      message: "ユーザー情報の取得に失敗しました"
    });
  }
});

// ユーザー情報更新エンドポイント
router.patch("/user", authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      log('warn', '認証なしでの更新試行');
      return res.status(401).json({ message: "認証が必要です" });
    }

    // リクエストデータをログ出力
    log('info', '更新リクエストデータ', req.body);

    const { username, location, preferredLocations } = req.body;

    // データベースの更新
    const updatedUser = await storage.updateUser(user.id, {
      username,
      location,
      preferredLocations
    });

    // レスポンスデータの形式を統一
    const response = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      birthDate: updatedUser.birthDate,
      location: updatedUser.location,
      preferredLocations: Array.isArray(updatedUser.preferredLocations) ? updatedUser.preferredLocations : [],
      role: updatedUser.role
    };

    // 更新後のデータをログ出力
    log('info', '更新後のユーザーデータ', response);

    res.json(response);
  } catch (error) {
    log('error', 'ユーザー情報更新エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      message: "ユーザー情報の更新に失敗しました"
    });
  }
});

// 認証エンドポイント
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // リクエストデータのバリデーション
    const validatedData = talentRegisterFormSchema.parse(req.body);

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // ユーザーの作成
    const user = await storage.createUser({
      email: validatedData.email,
      username: validatedData.username,
      password: hashedPassword,
      birthDate: validatedData.birthDate,
      location: validatedData.location,
      preferredLocations: validatedData.preferredLocations,
      role: "talent"
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
      message: "登録処理中にエラーが発生しました",
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