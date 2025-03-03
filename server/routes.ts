import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import {
  talentProfileSchema,
  type TalentProfileData,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, talentProfiles } from "@shared/schema";
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

  app.put("/api/talent/profile", requireAuth, async (req: any, res) => {
    const userId = req.user.id;
    console.log('Profile update request for user:', userId);

    try {
      const updateData = talentProfileUpdateSchema.parse(req.body);

      const updatedUser = await db.transaction(async (tx) => {
        const [currentUser] = await tx
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (!currentUser) {
          throw new Error("ユーザーが見つかりません");
        }

        if (updateData.currentPassword && updateData.newPassword) {
          const isPasswordValid = await comparePasswords(
            updateData.currentPassword,
            currentUser.password
          );

          if (!isPasswordValid) {
            throw new Error("現在のパスワードが正しくありません");
          }

          updateData.password = await hashPassword(updateData.newPassword);
        }

        const [updated] = await tx
          .update(users)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();

        if (!updated) {
          throw new Error("プロフィールの更新に失敗しました");
        }

        return updated;
      });

      console.log('Profile updated successfully:', { userId });
      res.json(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof Error) {
        res.status(error.message === "ユーザーが見つかりません" ? 404 : 500).json({
          message: error.message
        });
      } else {
        res.status(500).json({
          message: "プロフィールの更新に失敗しました"
        });
      }
    }
  });

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

      console.log('Profile fetch successful:', user);
      res.json(user);
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: "プロフィールの取得に失敗しました" });
    }
  });

  app.post("/api/talent/profile", requireAuth, async (req: any, res) => {
    try {
      console.log('Profile creation request received:', req.body);

      // リクエストデータの整形
      const requestData = {
        ...req.body,
        // 数値フィールドの処理
        bust: req.body.bust === "" || req.body.bust === undefined ? null : Number(req.body.bust),
        waist: req.body.waist === "" || req.body.waist === undefined ? null : Number(req.body.waist),
        hip: req.body.hip === "" || req.body.hip === undefined ? null : Number(req.body.hip),
      };

      // 空のフィールドにデフォルト値を設定
      const defaultFields = {
        ngOptions: { common: [], others: [] },
        allergies: { types: [], others: [], hasAllergy: false },
        smoking: { enabled: false, types: [], others: [] },
        snsUrls: [],
        currentStores: [],
        previousStores: [],
        photoDiaryUrls: [],
        estheOptions: { available: [], ngOptions: [] },
      };

      // データを結合
      const profileData = talentProfileSchema.parse({
        ...defaultFields,
        ...requestData,
      });

      const profile = await db.transaction(async (tx) => {
        // 既存のプロフィールチェック
        const [existingProfile] = await tx
          .select()
          .from(talentProfiles)
          .where(eq(talentProfiles.userId, req.user.id));

        if (existingProfile) {
          throw new Error("プロフィールは既に作成されています");
        }

        // 新しいプロフィールの作成
        const [newProfile] = await tx
          .insert(talentProfiles)
          .values({
            userId: req.user.id,
            ...profileData,
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

  app.post("/api/login", passport.authenticate("local"), (req: any, res) => {
    console.log('Login successful:', { userId: req.user.id });
    res.json(req.user);
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