import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { talentProfiles, applications, keepList, viewHistory } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

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

  // 認証チェックミドルウェア
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証が必要です" });
    }
    next();
  };

  // タレントプロフィール取得
  app.get("/api/talent/profile", requireAuth, async (req: any, res) => {
    try {
      const [profile] = await db
        .select()
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, req.user.id));

      if (!profile) {
        return res.status(404).json({ message: "プロフィールが見つかりません" });
      }

      res.json(profile);
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

  const httpServer = createServer(app);
  return httpServer;
}