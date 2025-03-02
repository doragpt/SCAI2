import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}