import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // 認証チェックミドルウェア
  const requireAuth = (req: any, res: any, next: any) => {
    console.log('Auth check:', {
      isAuthenticated: req.isAuthenticated(),
      session: req.session,
      user: req.user
    });

    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証が必要です" });
    }
    next();
  };

  // ユーザー登録エンドポイント
  app.post("/api/register", async (req, res) => {
    try {
      console.log('Registration request received:', req.body);
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      console.log('User created:', user);
      res.status(201).json(user);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "ユーザー登録に失敗しました"
      });
    }
  });

  // プロフィール更新エンドポイント
  app.put("/api/talent/profile", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('Profile update request:', {
        userId,
        body: req.body,
        headers: req.headers
      });

      // 更新前のユーザー情報を取得
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!currentUser) {
        console.error('User not found:', userId);
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      console.log('Current user found:', currentUser);

      // 基本情報の更新
      const [updatedUser] = await db
        .update(users)
        .set({
          username: req.body.username,
          displayName: req.body.displayName,
          location: req.body.location,
          preferredLocations: req.body.preferredLocations,
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        console.error('Update failed for user:', userId);
        throw new Error("更新に失敗しました");
      }

      console.log('User updated:', updatedUser);

      // パスワード変更が要求された場合
      if (req.body.currentPassword && req.body.newPassword) {
        console.log('Password update requested for user:', userId);

        // 現在のパスワードを確認
        const isPasswordValid = await comparePasswords(req.body.currentPassword, currentUser.password);
        if (!isPasswordValid) {
          return res.status(400).json({ message: "現在のパスワードが正しくありません" });
        }

        // 新しいパスワードをハッシュ化して更新
        const hashedPassword = await hashPassword(req.body.newPassword);
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, userId));

        console.log('Password updated for user:', userId);
      }

      // 最新のユーザー情報を返す
      const [finalUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!finalUser) {
        throw new Error("更新後のユーザー情報の取得に失敗しました");
      }

      console.log('Profile update successful:', {
        userId,
        hasPasswordUpdate: Boolean(req.body.currentPassword && req.body.newPassword)
      });

      res.json(finalUser);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: "プロフィールの更新に失敗しました" });
    }
  });

  // プロフィール取得エンドポイント
  app.get("/api/talent/profile", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('Profile fetch request for user:', userId);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        console.error('User not found:', userId);
        return res.status(404).json({ message: "プロフィールが見つかりません" });
      }

      console.log('Profile fetch successful:', userId);
      res.json(user);
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: "プロフィールの取得に失敗しました" });
    }
  });

  // 応募履歴取得
  app.get("/api/applications", requireAuth, async (req: any, res) => {
    try {
      const userApplications = await db
        .select()
        .from(applications)
        .where(eq(applications.userId, req.user.id));

      res.json(userApplications);
    } catch (error) {
      console.error('Applications fetch error:', error);
      res.status(500).json({ message: "応募履歴の取得に失敗しました" });
    }
  });

  // キープリスト取得
  app.get("/api/keep-list", requireAuth, async (req: any, res) => {
    try {
      const userKeepList = await db
        .select()
        .from(keepList)
        .where(eq(keepList.userId, req.user.id));

      res.json(userKeepList);
    } catch (error) {
      console.error('Keep list fetch error:', error);
      res.status(500).json({ message: "キープリストの取得に失敗しました" });
    }
  });

  // 閲覧履歴取得
  app.get("/api/view-history", requireAuth, async (req: any, res) => {
    try {
      const userViewHistory = await db
        .select()
        .from(viewHistory)
        .where(eq(viewHistory.userId, req.user.id));

      res.json(userViewHistory);
    } catch (error) {
      console.error('View history fetch error:', error);
      res.status(500).json({ message: "閲覧履歴の取得に失敗しました" });
    }
  });

  // ログインエンドポイント
  app.post("/api/login", async (req, res) => {
    try {
      console.log('Login request received:', req.body);
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "ユーザー名またはパスワードが正しくありません" });
      }
      res.json(user);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "ログインに失敗しました" });
    }
  });
  const httpServer = createServer(app);
  return httpServer;
}