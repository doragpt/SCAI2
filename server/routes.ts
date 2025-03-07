import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  talentProfileSchema,
  talentProfileUpdateSchema,
  type TalentProfileData,
  jobs,
  applications,
  type Application,
  type ViewHistory,
  type KeepList,
  applicationSchema,
  keepListSchema,
  viewHistorySchema
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { users, talentProfiles } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { generateToken, verifyToken } from "./jwt";
import { authenticate } from "./middleware/auth";
import { uploadToS3, getSignedS3Url } from "./utils/s3";

const scryptAsync = promisify(scrypt);

// チャンク一時保存用のメモリストア
const photoChunksStore = new Map<string, string[]>();

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

app.get("/api/user/profile", authenticate, async (req: any, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "認証が必要です" });
    }

    console.log('Profile fetch request received:', {
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        displayName: users.displayName,
        location: users.location,
        birthDate: users.birthDate,
        birthDateModified: users.birthDateModified,
        preferredLocations: users.preferredLocations,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user.id));

    console.log('Database query result:', {
      userId: req.user.id,
      hasUser: !!user,
      userDetails: user ? {
        hasDisplayName: !!user.displayName,
        hasBirthDate: !!user.birthDate,
        hasPreferredLocations: !!user.preferredLocations,
      } : null,
      timestamp: new Date().toISOString()
    });

    if (!user) {
      return res.status(404).json({ message: "ユーザーが見つかりません" });
    }

    // 日付データと配列の存在チェックを行い、適切な形式に変換
    const userProfile = {
      ...user,
      birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : null,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
      preferredLocations: Array.isArray(user.preferredLocations) ? user.preferredLocations : [],
    };

    console.log('Profile fetch successful:', {
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });

    res.json(userProfile);
  } catch (error) {
    console.error('Profile fetch error:', {
      error,
      userId: req.user?.id,
      errorDetails: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      message: "ユーザー情報の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

  // 求人情報取得エンドポイント
  app.get("/api/jobs/public", async (req, res) => {
    try {
      console.log('Public jobs fetch request received:', {
        timestamp: new Date().toISOString()
      });

      const jobListings = await db
        .select({
          id: jobs.id,
          businessName: jobs.businessName,
          location: jobs.location,
          serviceType: jobs.serviceType,
          minimumGuarantee: jobs.minimumGuarantee,
          maximumGuarantee: jobs.maximumGuarantee,
          transportationSupport: jobs.transportationSupport,
          housingSupport: jobs.housingSupport,
          workingHours: jobs.workingHours,
          description: jobs.description,
          requirements: jobs.requirements,
          benefits: jobs.benefits,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
        })
        .from(jobs)
        .orderBy(desc(jobs.createdAt))
        .limit(12);

      console.log('Public jobs fetch successful:', {
        count: jobListings.length,
        timestamp: new Date().toISOString()
      });

      res.json(jobListings);
    } catch (error) {
      console.error("Public jobs fetch error:", {
        error,
        timestamp: new Date().toISOString()
      });

      // エラーメッセージの日本語化
      const errorMessage = error instanceof Error 
        ? error.message 
        : "求人情報の取得に失敗しました";

      res.status(500).json({
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 求人検索エンドポイント
  app.get("/api/jobs/search", async (req, res) => {
    try {
      const { location, serviceType, page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      console.log('Jobs search request received:', {
        filters: { location, serviceType },
        pagination: { page, limit },
        timestamp: new Date().toISOString()
      });

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        return res.status(400).json({ 
          message: "ページネーションパラメータが不正です",
          timestamp: new Date().toISOString()
        });
      }

      const offset = (pageNum - 1) * limitNum;

      let query = db
        .select({
          id: jobs.id,
          businessName: jobs.businessName,
          location: jobs.location,
          serviceType: jobs.serviceType,
          minimumGuarantee: jobs.minimumGuarantee,
          maximumGuarantee: jobs.maximumGuarantee,
          transportationSupport: jobs.transportationSupport,
          housingSupport: jobs.housingSupport,
          workingHours: jobs.workingHours,
          description: jobs.description,
          requirements: jobs.requirements,
          benefits: jobs.benefits,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
        })
        .from(jobs);

      if (location && location !== "all") {
        query = query.where(eq(jobs.location, location as string));
      }

      if (serviceType && serviceType !== "all") {
        query = query.where(eq(jobs.serviceType, serviceType as string));
      }

      // Get total count for pagination
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(
          and(
            ...[
              location && location !== "all" ? eq(jobs.location, location as string) : undefined,
              serviceType && serviceType !== "all" ? eq(jobs.serviceType, serviceType as string) : undefined,
            ].filter(Boolean)
          )
        );

      const totalCount = countResult[0].count;

      // Get paginated results
      const jobListings = await query
        .orderBy(desc(jobs.createdAt))
        .limit(limitNum)
        .offset(offset);

      console.log('Jobs search successful:', {
        filters: { location, serviceType },
        pagination: { page: pageNum, limit: limitNum, total: totalCount },
        timestamp: new Date().toISOString()
      });

      res.json({
        jobs: jobListings,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalItems: totalCount
        }
      });
    } catch (error) {
      console.error("Jobs search error:", {
        error,
        query: req.query,
        timestamp: new Date().toISOString()
      });

      const errorMessage = error instanceof Error 
        ? error.message 
        : "求人検索に失敗しました";

      res.status(500).json({
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 求人詳細取得エンドポイント
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, jobId));

      if (!job) {
        return res.status(404).json({ message: "求人が見つかりません" });
      }

      // ユーザーが認証済みの場合、応募状況も返す
      if (req.user?.id) {
        const [application] = await db
          .select()
          .from(applications)
          .where(and(
            eq(applications.storeId, jobId),
            eq(applications.userId, req.user.id)
          ));

        // 閲覧履歴を記録
        await db.insert(viewHistory).values({
          userId: req.user.id,
          storeId: jobId,
          viewedAt: new Date()
        });

        return res.json({
          ...job,
          application: application || null
        });
      }

      res.json(job);
    } catch (error) {
      console.error("Job detail fetch error:", {
        error,
        jobId: req.params.id,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        message: "求人詳細の取得に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // 求人応募エンドポイント
  app.post("/api/jobs/:id/apply", authenticate, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      // バリデーション
      const validatedData = applicationSchema.parse({
        ...req.body,
        userId: req.user.id,
        storeId: jobId
      });

      // 既存の求人確認
      const [existingJob] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, jobId));

      if (!existingJob) {
        return res.status(404).json({ message: "求人が見つかりません" });
      }

      // 重複応募チェック
      const [existingApplication] = await db
        .select()
        .from(applications)
        .where(and(
          eq(applications.storeId, jobId),
          eq(applications.userId, req.user.id)
        ));

      if (existingApplication) {
        return res.status(400).json({ message: "既に応募済みです" });
      }

      // 応募データを作成
      const [application] = await db
        .insert(applications)
        .values(validatedData)
        .returning();

      console.log('Job application successful:', {
        userId: req.user.id,
        jobId,
        applicationId: application.id,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(application);
    } catch (error) {
      console.error("Job application error:", {
        error,
        userId: req.user?.id,
        jobId: req.params.id,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        message: "応募処理に失敗しました",
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
  // profilesテーブルのデータ取得のエラーハンドリングを改善
  app.get("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('Profile fetch request received:', {
        userId,
        headers: req.headers,
        timestamp: new Date().toISOString()
      });

      // データベースクエリの実行を詳細にログ
      console.log('Executing database query for user:', userId);
      const [profile] = await db
        .select()
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, userId));

      console.log('Database query result:', {
        userId,
        hasProfile: !!profile,
        profileId: profile?.id,
        timestamp: new Date().toISOString()
      });

      // プロフィールが存在しない場合は404を返す
      if (!profile) {
        console.log('Profile not found for user:', userId);
        return res.status(404).json({
          message: "プロフィールが見つかりません。新規登録が必要です。",
          isNewUser: true
        });
      }

      console.log('Profile fetch successful:', {
        userId,
        profileId: profile.id,
        timestamp: new Date().toISOString()
      });

      res.json(profile);
    } catch (error) {
      console.error('Profile fetch error:', {
        error,
        userId: req.user?.id,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "プロフィールの取得に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error",
        details: process.env.NODE_ENV === 'development' ? error : undefined
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
      console.log('Profile update request received:', {
        userId,
        bodyMark: req.body.bodyMark,
        timestamp: new Date().toISOString()
      });

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

      console.log('Profile update successful:', {
        userId,
        bodyMark: updatedProfile.bodyMark,
        timestamp: new Date().toISOString()
      });

      res.json(updatedProfile);
    } catch (error) {
      console.error('Profile update error:', {
        error,
        userId: req.user?.id,
        bodyMark: req.body.bodyMark,
        timestamp: new Date().toISOString()
      });
      res.status(400).json({
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

      // パスワード更新の処理
      if (req.body.newPassword && req.body.currentPassword) {
        // 現在のパスワードを検証
        const [hashedPassword, salt] = currentUser.password.split('.');
        const buf = (await scryptAsync(req.body.currentPassword, salt, 64)) as Buffer;
        const suppliedHash = buf.toString('hex');

        if (suppliedHash !== hashedPassword) {
          return res.status(400).json({ message: "現在のパスワードが正しくありません" });
        }

        // 新しいパスワードをハッシュ化
        const newHashedPassword = await hashPassword(req.body.newPassword);
        updateData.password = newHashedPassword;
      }

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

      res.json({
        message: "ユーザー情報を更新しました",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('User update error:', {
        error,
        userId: req.user?.id,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      });

      res.status(400).json({
        error: true,
        message: error instanceof Error ? error.message : "ユーザー情報の更新に失敗しました"
      });
    }
  });

  // プリサインドURL取得エンドポイント
  app.get("/api/get-signed-url", authenticate, async (req: any, res) => {
    try {
      const { key } = req.query;

      if (!key) {
        return res.status(400).json({ message: "画像キーが必要です。" });
      }

      console.log('Signed URL request received:', {
        userId: req.user.id,
        key,
        timestamp: new Date().toISOString()
      });

      const signedUrl = await getSignedS3Url(key as string);

      console.log('Signed URL generated successfully:', {
        userId: req.user.id,
        key,
        timestamp: new Date().toISOString()
      });

      res.json({ url: signedUrl });
    } catch (error) {
      console.error('Signed URL generation error:', {
        error,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        message: "プリサインドURLの取得に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/logout", (req: any, res, next) => {
    req.logout((err: any) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // 写真アップロード用の新しいエンドポイント
  app.post("/api/upload-photo", authenticate, async (req: any, res) => {
    try {
      console.log('Photo upload request received:', {
        userId: req.user.id,
        timestamp: new Date().toISOString()
      });

      const { photo } = req.body;

      if (!photo || !photo.startsWith('data:')) {
        console.warn('Invalid photo data received:', {
          userId: req.user.id,
          hasPhoto: !!photo,
          timestamp: new Date().toISOString()
        });
        return res.status(400).json({ message: "Invalid photo data" });
      }

      const s3Url = await uploadToS3(
        photo,
        `${req.user.id}-${Date.now()}.jpg`
      );

      console.log('Photo upload successful:', {
        userId: req.user.id,
        url: s3Url,
        timestamp: new Date().toISOString()
      });

      res.json({ url: s3Url });
    } catch (error) {
      console.error('Photo upload error:', {
        error,
        userId: req.user.id,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        message: "写真のアップロードに失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // チャンクアップロード用のエンドポイント
  app.post("/api/upload-photo-chunk", authenticate, async (req: any, res) => {
    try {
      const { photo, totalChunks, chunkIndex, photoId, tag, order } = req.body;

      console.log('Photo chunk upload request received:', {
        userId: req.user.id,
        photoId,
        chunkIndex,
        totalChunks,
        tag,
        order,
        timestamp: new Date().toISOString()
      });

      if (!photo || !photo.startsWith('data:')) {
        console.warn('Invalid photo chunk data received:', {
          userId: req.user.id,
          hasPhoto: !!photo,
          timestamp: new Date().toISOString()
        });
        return res.status(400).json({ message: "Invalid photo data" });
      }

      try {
        // Base64データの処理
        const [header, content] = photo.split(',');
        const base64Content = content;

        // チャンクデータを一時保存
        const chunkKey = `${req.user.id}-${photoId}`;
        let chunks = photoChunksStore.get(chunkKey) || new Array(totalChunks);
        chunks[chunkIndex] = base64Content;
        photoChunksStore.set(chunkKey, chunks);

        console.log('Chunk stored in memory:', {
          userId: req.user.id,
          photoId,
          chunkIndex,
          totalChunks,
          tag,
          order,
          timestamp: new Date().toISOString()
        });

        // 最後のチャンクの場合、すべてのチャンクを結合してS3にアップロード
        if (chunkIndex === totalChunks - 1) {
          try {
            // チャンクの検証
            if (chunks.some(chunk => !chunk)) {
              throw new Error(`Missing chunk data. Expected ${totalChunks} chunks, got ${chunks.filter(Boolean).length}`);
            }

            const completeBase64 = chunks.join('');

            // S3にアップロード
            const s3Url = await uploadToS3(
              `${header},${completeBase64}`,
              `${req.user.id}-${photoId}.jpg`
            );

            // チャンクデータをクリア
            photoChunksStore.delete(chunkKey);

            console.log('Complete photo upload successful:', {
              userId: req.user.id,
              photoId,
              url: s3Url,
              tag,
              order,
              timestamp: new Date().toISOString()
            });

            res.set({
              'ETag': `"${photoId}"`,
              'Content-Type': 'application/json'
            }).json({
              url: s3Url,
              id: photoId,
              tag,
              order
            });
          } catch (s3Error) {
            console.error('S3 upload error:', {
              error: s3Error,
              userId: req.user.id,
              photoId,
              timestamp: new Date().toISOString()
            });
            throw s3Error;
          }
        } else {
          // 中間チャンクの場合は成功を返す
          res.set({
            'ETag': `"${photoId}-${chunkIndex}"`,
            'Content-Type': 'application/json'
          }).json({ status: 'chunk_uploaded' });
        }
      } catch (uploadError) {
        console.error('Upload processing error:', {
          error: uploadError,
          userId: req.user.id,
          photoId,
          timestamp: new Date().toISOString()
        });
        throw uploadError;
      }
    } catch (error) {
      console.error('Photo chunk upload error:', {
        error,
        userId: req.user.id,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        message: error instanceof Error ? error.message : "写真のアップロードに失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
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