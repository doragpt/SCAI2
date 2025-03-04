import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  talentProfileSchema,
  talentProfileUpdateSchema,
  type TalentProfileData,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, talentProfiles } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { generateToken, verifyToken } from "./jwt";
import { authenticate } from "./middleware/auth";

const scryptAsync = promisify(scrypt);

export async function registerRoutes(app: Express): Promise<Server> {
  // ヘルスチェックエンドポイント
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ユーザー情報取得エンドポイント
  app.get("/api/user", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.id));

      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      // パスワードハッシュを除外して返す
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({
        message: "ユーザー情報の取得に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // 求人情報取得エンドポイント
  app.get("/api/jobs/public", async (req, res) => {
    try {
      // 仮実装：空の配列を返す
      res.json([]);
    } catch (error) {
      console.error("Public jobs fetch error:", error);
      res.status(500).json({
        message: "求人情報の取得に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // 認証エンドポイント
  app.post("/api/register", async (req, res) => {
    try {
      console.log('Registration request received:', req.body);

      const hashedPassword = await hashPassword(req.body.password);

      const [user] = await db
        .insert(users)
        .values({
          ...req.body,
          password: hashedPassword,
          createdAt: new Date(),
        })
        .returning();

      if (!user) {
        throw new Error("ユーザーの作成に失敗しました");
      }

      // JWTトークンを生成
      const token = generateToken(user);

      res.status(201).json({ user, token });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "ユーザー登録に失敗しました"
      });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "認証に失敗しました" });
      }

      // JWTトークンを生成
      const token = generateToken(user);

      res.json({ user, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "ログインに失敗しました" });
    }
  });

  // 認証が必要なエンドポイント
  app.get("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('Profile fetch request for user:', userId);

      // プロフィール情報を取得
      const [profile] = await db
        .select()
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, userId));

      // プロフィールが存在しない場合は404を返す
      if (!profile) {
        console.log('Profile not found for user:', userId);
        return res.status(404).json({
          message: "プロフィールが見つかりません",
          isNewUser: true
        });
      }

      console.log('Profile fetch successful:', { userId });
      res.json(profile);
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({
        message: "プロフィールの取得に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      console.log('Profile creation request received:', req.body);

      // バリデーション
      const profileData = talentProfileSchema.parse(req.body);

      // プロフィールの作成
      const [newProfile] = await db
        .insert(talentProfiles)
        .values({
          userId: req.user.id,
          ...profileData,
          updatedAt: new Date(),
        })
        .returning();

      console.log('Profile created successfully:', { userId: req.user.id, profileId: newProfile.id });
      res.status(201).json(newProfile);
    } catch (error) {
      console.error('Profile creation error:', error);
      if (error instanceof Error) {
        res.status(400).json({
          error: true,
          message: error.message
        });
      } else {
        res.status(500).json({
          error: true,
          message: "プロフィールの作成に失敗しました"
        });
      }
    }
  });

  // PUT /api/talent/profile
  app.put("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('Profile update request received:', { userId, requestData: req.body });

      // バリデーション
      const updateData = talentProfileUpdateSchema.parse(req.body);

      // プロフィールの更新
      const [updatedProfile] = await db
        .update(talentProfiles)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(talentProfiles.userId, userId))
        .returning();

      if (!updatedProfile) {
        throw new Error("プロフィールの更新に失敗しました");
      }

      console.log('Profile update successful:', { userId, profileId: updatedProfile.id });
      res.json(updatedProfile);
    } catch (error) {
      console.error('Profile update error:', error);
      const status = error instanceof Error && error.message === "プロフィールが見つかりません" ? 404 : 400;
      res.status(status).json({
        error: true,
        message: error instanceof Error ? error.message : "プロフィールの更新に失敗しました"
      });
    }
  });
  app.patch("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('Profile update request received:', {
        userId,
        requestData: req.body,
        timestamp: new Date().toISOString()
      });

      const updatedProfile = await db.transaction(async (tx) => {
        // 現在のプロフィールを取得
        const [currentProfile] = await tx
          .select()
          .from(talentProfiles)
          .where(eq(talentProfiles.userId, userId));

        if (!currentProfile) {
          throw new Error("プロフィールが見つかりません");
        }

        // リクエストデータをバリデーション
        const updateData = talentProfileUpdateSchema.parse(req.body);

        // 編集不可フィールドのリスト
        const immutableFields = ['birthDate', 'createdAt', 'id', 'userId'] as const;

        // マージされたデータを準備
        const processedData = {
          ...currentProfile,  // 既存のデータをベースに
          ...updateData,      // 更新データを上書き
          // 編集不可フィールドは必ず既存の値を維持
          ...immutableFields.reduce((acc, field) => ({
            ...acc,
            [field]: currentProfile[field as keyof typeof currentProfile]
          }), {} as Partial<typeof currentProfile>),
          userId,
          updatedAt: new Date(),
        };


        console.log('Prepared update values:', {
          userId,
          processedData,
          timestamp: new Date().toISOString()
        });

        // プロフィールを更新
        const [updated] = await tx
          .update(talentProfiles)
          .set(processedData)
          .where(eq(talentProfiles.userId, userId))
          .returning();

        if (!updated) {
          throw new Error("プロフィールの更新に失敗しました");
        }

        // 更新されたプロフィールを再取得して返す（完全なデータを確実に返す）
        const [freshProfile] = await tx
          .select()
          .from(talentProfiles)
          .where(eq(talentProfiles.userId, userId));

        console.log('Profile update successful:', {
          userId,
          profileId: freshProfile.id,
          timestamp: new Date().toISOString()
        });

        return freshProfile;
      });

      // 完全なプロフィールデータを返す
      res.json(updatedProfile);
    } catch (error) {
      console.error('Profile update error:', {
        error,
        userId: req.user.id,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      });

      if (error instanceof Error) {
        const status = error.message === "プロフィールが見つかりません" ? 404 : 400;
        res.status(status).json({
          error: true,
          message: error.message,
          details: error.stack,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          error: true,
          message: "プロフィールの更新に失敗しました",
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  // ユーザー基本情報の更新エンドポイント
  app.patch("/api/user", authenticate, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('User update request received:', {
        userId,
        requestData: req.body,
        timestamp: new Date().toISOString()
      });

      // 現在のユーザー情報を取得
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!currentUser) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      // 更新可能なフィールド
      const updatableFields = ['username', 'displayName', 'location', 'preferredLocations'];

      // 更新データの準備
      const updateData = Object.entries(req.body).reduce((acc, [key, value]) => {
        if (updatableFields.includes(key)) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // 更新データに必ずタイムスタンプを追加
      updateData.updatedAt = new Date();

      // ユーザー情報の更新
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error("ユーザー情報の更新に失敗しました");
      }

      // パスワード情報を除外
      const { password, ...userWithoutPassword } = updatedUser;

      console.log('User update successful:', {
        userId,
        timestamp: new Date().toISOString()
      });

      res.json(userWithoutPassword);
    } catch (error) {
      console.error('User update error:', {
        error,
        userId: req.user?.id,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      });

      // JSONレスポンスを返す
      res.status(400).json({
        error: true,
        message: error instanceof Error ? error.message : "ユーザー情報の更新に失敗しました"
      });
    }
  });

  app.post("/api/logout", (req: any, res, next) => {
    req.logout((err: any) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

// パスワードハッシュ化関数
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// パスワード検証関数
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}