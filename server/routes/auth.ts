import { Router } from 'express';
import { storage } from '../storage';
import { authenticate } from '../middleware/auth';
import { loginSchema } from '@shared/schema';

const router = Router();

// 認証エンドポイント
router.post("/register", async (req, res) => {
  try {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ message: "このユーザー名は既に使用されています" });
    }

    const user = await storage.createUser({
      ...req.body,
      password: await storage.hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "ユーザー登録に失敗しました"
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
