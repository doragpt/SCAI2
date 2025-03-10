import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import {
  loginSchema,
  users,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { generateToken } from "./jwt";

const scryptAsync = promisify(scrypt);

// パスワード関連の定数
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

// パスワードハッシュ化関数
async function hashPassword(password: string): Promise<string> {
  try {
    if (!password) {
      throw new Error('Invalid password');
    }
    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const buf = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  } catch (error) {
    throw new Error('Password hashing failed');
  }
}

// パスワード比較関数
async function comparePasswords(inputPassword: string, storedPassword: string): Promise<boolean> {
  try {
    if (!inputPassword || !storedPassword) {
      return false;
    }
    const [hashedPassword, salt] = storedPassword.split('.');
    if (!hashedPassword || !salt) {
      return false;
    }
    const buf = (await scryptAsync(inputPassword, salt, KEY_LENGTH)) as Buffer;
    const hashedInput = buf.toString('hex');
    return timingSafeEqual(Buffer.from(hashedPassword, 'hex'), Buffer.from(hashedInput, 'hex'));
  } catch (error) {
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // HTTPサーバーの作成
  const server = createServer(app);

  // ヘルスチェックエンドポイント
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // APIルートのグローバルミドルウェア
  app.use("/api/*", (req, res, next) => {
    if (req.headers.accept?.includes("application/json")) {
      res.setHeader("Content-Type", "application/json");
    }
    next();
  });

  // 認証関連のルート（最重要機能）
  app.post("/api/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, loginData.username));

      if (!user) {
        return res.status(401).json({ message: "ユーザー名またはパスワードが間違っています" });
      }

      const isValidPassword = await comparePasswords(loginData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "ユーザー名またはパスワードが間違っています" });
      }

      const token = generateToken(user);
      const { password, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "ログインに失敗しました"
      });
    }
  });

  return server;
}