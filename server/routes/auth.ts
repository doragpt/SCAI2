import { Router } from 'express';
import { storage } from '../storage';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema } from '@shared/schema';
import { NextFunction, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { log } from '../utils/logger';
import passport from 'passport';

const router = Router();

// セッション確認エンドポイント
router.get("/session", authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "認証が必要です" });
    }
    res.json(req.user);
  } catch (error) {
    log('error', 'セッション確認エラー', { error });
    res.status(500).json({ message: "セッション確認に失敗しました" });
  }
});

// 登録エンドポイント
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await storage.createUser({
      ...validatedData,
      hashedPassword,
    });

    req.login(user, (err) => {
      if (err) {
        log('error', '登録後のログインエラー', { error: err });
        return next(err);
      }

      const { hashedPassword, ...userResponse } = user;
      res.status(201).json(userResponse);
    });
  } catch (error) {
    log('error', '登録エラー', { error });
    res.status(400).json({
      message: "登録に失敗しました",
      details: error instanceof Error ? error.message : undefined
    });
  }
});

// ログインエンドポイント
router.post("/login", async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        log('error', 'ログインエラー', { error: err });
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }

      req.login(user, (err) => {
        if (err) {
          log('error', 'セッション作成エラー', { error: err });
          return next(err);
        }

        res.json(user);
      });
    })(req, res, next);
  } catch (error) {
    log('error', 'ログインバリデーションエラー', { error });
    res.status(400).json({
      message: error instanceof Error ? error.message : "ログインに失敗しました"
    });
  }
});

// ログアウトエンドポイント
router.post("/logout", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "既にログアウトしています" });
  }

  req.logout((err) => {
    if (err) {
      log('error', 'ログアウトエラー', { error: err });
      return next(err);
    }

    req.session.destroy((err) => {
      if (err) {
        log('error', 'セッション削除エラー', { error: err });
        return next(err);
      }

      res.clearCookie('sessionId');
      res.sendStatus(200);
    });
  });
});

export default router;