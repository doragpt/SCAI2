import { Router } from 'express';
import { storage } from '../storage';
import { authenticate } from '../middleware/auth';
import { registrationSchema, loginSchema } from '@shared/schema';
import { NextFunction, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { log } from '../utils/logger';
import passport from 'passport';

const router = Router();

// ユーザー情報取得エンドポイント
router.get("/session", authenticate, async (req, res) => {
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

    // 必要なユーザー情報のみを返す
    const response = {
      id: userData.id,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      location: userData.location,
      preferredLocations: userData.preferredLocations,
      birthDate: userData.birthDate
    };

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

// ユーザー登録エンドポイント
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // リクエストデータのバリデーション
    const validatedData = registrationSchema.parse(req.body);

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // ユーザーの作成
    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword
    });

    // セッションの作成
    req.login(user, (err) => {
      if (err) {
        log('error', 'Login error:', err);
        return next(err);
      }

      // パスワードを除外したユーザー情報を返す
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    });
  } catch (error) {
    log('error', 'Registration error:', error);
    res.status(400).json({
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
        // パスワードを除外したユーザー情報を返す
        const { password, ...userResponse } = user;
        res.json(userResponse);
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
      res.clearCookie('sessionId');
      res.sendStatus(200);
    });
  });
});

export default router;