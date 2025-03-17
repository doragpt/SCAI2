import { Router } from 'express';
import { storage } from '../storage';
import { authenticate } from '../middleware/auth';
import { talentRegisterFormSchema } from '@shared/schema';
import { NextFunction, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { log } from '../utils/logger';
import passport from 'passport';
import { z } from 'zod';

// ログインスキーマの定義
const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
});

const router = Router();

// ユーザー情報取得エンドポイント
router.get("/user", authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      log('warn', 'ユーザー認証なし');
      return res.status(401).json({ message: "認証が必要です" });
    }

    log('info', 'ユーザー情報取得成功', {
      userId: user.id,
      role: user.role,
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID
    });

    res.json(user);
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

    const { username, location, preferredLocations } = req.body;

    // データベースの更新
    const updatedUser = await storage.updateUser(user.id, {
      username,
      location,
      preferredLocations,
      displayName: username // displayName を username と同期
    });

    // レスポンスデータの形式を統一
    const response = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      birthDate: updatedUser.birthDate,
      location: updatedUser.location,
      preferredLocations: Array.isArray(updatedUser.preferredLocations) ? updatedUser.preferredLocations : [],
      role: updatedUser.role,
      displayName: updatedUser.username
    };

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
      ...validatedData,
      password: hashedPassword,
      displayName: validatedData.username // displayName を username として設定
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
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }
      req.login(user, (err) => {
        if (err) return next(err);

        log('info', 'ログイン成功とセッション作成', {
          userId: user.id,
          sessionID: req.sessionID,
          isAuthenticated: req.isAuthenticated()
        });

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
    req.session.destroy((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
});

// セッション状態確認エンドポイント
router.get("/check-session", (req, res) => {
  log('info', 'セッション状態確認', {
    isAuthenticated: req.isAuthenticated(),
    sessionID: req.sessionID,
    hasUser: !!req.user,
    userId: req.user?.id
  });

  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user || null
  });
});

export default router;