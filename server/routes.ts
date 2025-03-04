import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  talentProfileSchema,
  talentProfileUpdateSchema,
  type TalentProfileData,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
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

      // まずユーザー情報を取得
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        console.error('User not found:', userId);
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

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
          isNewUser: true  // フロントエンド側で新規ユーザーかどうかを判断するためのフラグ
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

      // リクエストデータを整形
      const requestData = {
        ...req.body,
        // 数値フィールドの処理
        bust: req.body.bust === "" || req.body.bust === undefined ? null : Number(req.body.bust),
        waist: req.body.waist === "" || req.body.waist === undefined ? null : Number(req.body.waist),
        hip: req.body.hip === "" || req.body.hip === undefined ? null : Number(req.body.hip),
      };

      // バリデーション
      const profileData = talentProfileSchema.parse(requestData);

      const profile = await db.transaction(async (tx) => {
        // 既存のプロフィールチェック
        const [existingProfile] = await tx
          .select()
          .from(talentProfiles)
          .where(eq(talentProfiles.userId, req.user.id));

        if (existingProfile) {
          throw new Error("プロフィールは既に作成されています");
        }

        // プロフィールの作成（JSONB型のカラムを明示的にキャスト）
        const [newProfile] = await tx
          .insert(talentProfiles)
          .values({
            userId: req.user.id,
            lastName: profileData.lastName,
            firstName: profileData.firstName,
            lastNameKana: profileData.lastNameKana,
            firstNameKana: profileData.firstNameKana,
            location: profileData.location,
            nearestStation: profileData.nearestStation,
            availableIds: toJsonb(profileData.availableIds),
            canProvideResidenceRecord: profileData.canProvideResidenceRecord,
            height: profileData.height,
            weight: profileData.weight,
            cupSize: profileData.cupSize,
            bust: profileData.bust,
            waist: profileData.waist,
            hip: profileData.hip,
            faceVisibility: profileData.faceVisibility,
            canPhotoDiary: profileData.canPhotoDiary,
            canHomeDelivery: profileData.canHomeDelivery,
            ngOptions: toJsonb(profileData.ngOptions),
            allergies: toJsonb(profileData.allergies),
            smoking: toJsonb(profileData.smoking),
            hasSnsAccount: profileData.hasSnsAccount,
            snsUrls: toJsonb(profileData.snsUrls),
            currentStores: toJsonb(profileData.currentStores),
            previousStores: toJsonb(profileData.previousStores),
            photoDiaryUrls: toJsonb(profileData.photoDiaryUrls),
            selfIntroduction: profileData.selfIntroduction,
            notes: profileData.notes,
            estheOptions: toJsonb(profileData.estheOptions),
            hasEstheExperience: profileData.hasEstheExperience,
            estheExperiencePeriod: profileData.estheExperiencePeriod,
            updatedAt: new Date(),
          })
          .returning();

        if (!newProfile) {
          throw new Error("プロフィールの作成に失敗しました");
        }

        return newProfile;
      });

      console.log('Profile created successfully:', { userId: req.user.id, profileId: profile.id });
      res.status(201).json(profile);
    } catch (error) {
      console.error('Profile creation error:', error);
      if (error instanceof Error) {
        res.status(400).json({
          message: error.message
        });
      } else {
        res.status(500).json({
          message: "プロフィールの作成に失敗しました"
        });
      }
    }
  });

  // PUT /api/talent/profile のエンドポイントを修正
  app.put("/api/talent/profile", authenticate, async (req: any, res) => {
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
          ...currentProfile,
          ...updateData,
          // 編集不可フィールドは必ず既存の値を維持
          ...immutableFields.reduce((acc, field) => ({
            ...acc,
            [field]: currentProfile[field as keyof typeof currentProfile]
          }), {} as Partial<typeof currentProfile>),
          userId,
          updatedAt: new Date(),
          // 数値フィールドの特別処理
          bust: updateData.bust === "" || updateData.bust === undefined
            ? currentProfile.bust
            : Number(updateData.bust),
          waist: updateData.waist === "" || updateData.waist === undefined
            ? currentProfile.waist
            : Number(updateData.waist),
          hip: updateData.hip === "" || updateData.hip === undefined
            ? currentProfile.hip
            : Number(updateData.hip),
        };

        // JSONBフィールドのリスト
        const jsonbFields = [
          'availableIds',
          'ngOptions',
          'allergies',
          'smoking',
          'snsUrls',
          'currentStores',
          'previousStores',
          'photoDiaryUrls',
          'estheOptions'
        ] as const;

        // 更新データの準備（JSONBフィールドの処理）
        const updateValues = Object.entries(processedData).reduce((acc, [key, value]) => {
          // undefinedの場合はスキップ（既存の値を維持）
          if (value === undefined) return acc;

          // JSONBフィールドの場合は型キャストを行う
          if (jsonbFields.includes(key as typeof jsonbFields[number])) {
            acc[key] = value !== null ? sql`${JSON.stringify(value)}::jsonb` : null;
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);

        console.log('Prepared update values:', {
          userId,
          updateValues,
          timestamp: new Date().toISOString()
        });

        // プロフィールを更新
        const [updated] = await tx
          .update(talentProfiles)
          .set(updateValues)
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
          ...currentProfile,
          ...updateData,
          // 編集不可フィールドは必ず既存の値を維持
          ...immutableFields.reduce((acc, field) => ({
            ...acc,
            [field]: currentProfile[field as keyof typeof currentProfile]
          }), {} as Partial<typeof currentProfile>),
          userId,
          updatedAt: new Date(),
        };

        // JSONBフィールドのリスト
        const jsonbFields = [
          'availableIds',
          'ngOptions',
          'allergies',
          'smoking',
          'snsUrls',
          'currentStores',
          'previousStores',
          'photoDiaryUrls',
          'estheOptions'
        ] as const;

        // 更新データの準備（JSONBフィールドの処理）
        const updateValues = Object.entries(processedData).reduce((acc, [key, value]) => {
          // undefinedの場合はスキップ（既存の値を維持）
          if (value === undefined) return acc;

          // JSONBフィールドの場合は型キャストを行う
          if (jsonbFields.includes(key as typeof jsonbFields[number])) {
            acc[key] = value !== null ? sql`${JSON.stringify(value)}::jsonb` : null;
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);

        console.log('Prepared update values:', {
          userId,
          updateValues,
          timestamp: new Date().toISOString()
        });

        // プロフィールを更新
        const [updated] = await tx
          .update(talentProfiles)
          .set(updateValues)
          .where(eq(talentProfiles.userId, userId))
          .returning();

        if (!updated) {
          throw new Error("プロフィールの更新に失敗しました");
        }

        return updated;
      });

      console.log('Profile update successful:', {
        userId,
        profileId: updatedProfile.id,
        timestamp: new Date().toISOString()
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

// JSONB用のヘルパー関数
const toJsonb = (value: any) => {
  return sql`${JSON.stringify(value)}::jsonb`;
};