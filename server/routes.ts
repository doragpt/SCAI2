import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { talentRegisterFormSchema, type RegisterFormData } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import passport from "passport";

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

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      console.log('認証失敗:', { session: req.session, user: req.user });
      return res.status(401).json({ message: "認証が必要です" });
    }
    console.log('認証成功:', { userId: req.user.id });
    next();
  };

  app.post("/api/register", async (req, res) => {
    try {
      console.log('Registration request received:', req.body);
      const userData = talentRegisterFormSchema.parse(req.body);

      const user = await db.transaction(async (tx) => {
        const [existingUser] = await tx
          .select()
          .from(users)
          .where(eq(users.username, userData.username));

        if (existingUser) {
          throw new Error("このニックネームは既に使用されています");
        }

        const hashedPassword = await hashPassword(userData.password);

        const [newUser] = await tx
          .insert(users)
          .values({
            username: userData.username,
            password: hashedPassword,
            role: userData.role,
            displayName: userData.displayName,
            location: userData.location,
            birthDate: new Date(userData.birthDate),
            preferredLocations: userData.preferredLocations,
            createdAt: new Date(),
          })
          .returning();

        if (!newUser) {
          throw new Error("ユーザーの作成に失敗しました");
        }

        return newUser;
      });

      console.log('User created successfully:', { userId: user.id });
      res.status(201).json(user);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "ユーザー登録に失敗しました"
      });
    }
  });

  // ログインエンドポイント
  app.post("/api/login", passport.authenticate("local"), (req: any, res) => {
    console.log('Login successful:', { userId: req.user.id });
    res.json(req.user);
  });

  // ログアウトエンドポイント
  app.post("/api/logout", (req: any, res, next) => {
    req.logout((err: any) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}