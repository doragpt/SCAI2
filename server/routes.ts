import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  talentProfileSchema,
  talentProfileUpdateSchema,
  type TalentProfile,
  jobs,
  applications,
  type Application,
  type ViewHistory,
  type KeepList,
  applicationSchema,
  keepListSchema,
  viewHistorySchema,
  jobSchema,
  type Job,
  type JobRequirements,
  loginSchema,
  type LoginData,
  type SelectUser,
  blogPostSchema,
  blogPosts,
  type BlogPost,
  type BlogPostListResponse,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { users, talentProfiles } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { generateToken, verifyToken } from "./jwt";
import { authenticate } from "./middleware/auth";
import { uploadToS3, getSignedS3Url } from "./utils/s3";
import multer from "multer";

const scryptAsync = promisify(scrypt);

// パスワード関連の定数
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

// Multerの設定
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('許可されていないファイル形式です'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // APIルートのグローバルミドルウェア
  app.use("/api/*", (req, res, next) => {
    if (req.headers.accept?.includes("application/json")) {
      res.setHeader("Content-Type", "application/json");
    }
    next();
  });

  // HTTPサーバーの作成
  const server = createServer(app);

  // 認証関連のルート
  app.post("/api/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, loginData.username));

      if (!user || !(await comparePasswords(loginData.password, user.password))) {
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

  // ブログ関連のルート
  app.post("/api/blog/posts", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const postData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const [post] = await db
        .insert(blogPosts)
        .values(postData)
        .returning();

      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "ブログ記事の作成に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // 画像アップロードエンドポイント
  app.post("/api/upload", authenticate, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "ファイルがアップロードされていません" });
      }

      const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const result = await uploadToS3(base64Data, req.file.originalname);

      res.json(result);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "ファイルのアップロードに失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

    // 求人情報取得エンドポイント
  app.get("/api/jobs/public", async (req, res) => {
    try {
      const jobListings = await db
        .select({
          id: jobs.id,
          title: jobs.title,
          catchPhrase: jobs.catchPhrase,
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
          status: jobs.status
        })
        .from(jobs)
        .where(eq(jobs.status, 'published'))
        .orderBy(desc(jobs.createdAt))
        .limit(12);

      res.json(jobListings);
    } catch (error) {
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

  // 求人一覧取得エンドポイント（店舗用）
  app.get("/api/jobs/store", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      const jobListings = await db
        .select()
        .from(jobs)
        .where(eq(jobs.storeId, req.user.id))
        .orderBy(desc(jobs.createdAt));

      const response: JobListingResponse = {
        jobs: jobListings,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: jobListings.length
        }
      };

      return res.json(response);
    } catch (error) {
      return res.status(500).json({
        message: "求人情報の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ログアウトエンドポイント
  app.post("/api/logout", authenticate, async (req: any, res) => {
    try {
      res.json({ message: "ログアウトしました" });
    } catch (error) {
      res.status(500).json({ message: "ログアウトに失敗しました" });
    }
  });

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

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
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

      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      const userProfile = {
        ...user,
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : null,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
        preferredLocations: Array.isArray(user.preferredLocations) ? user.preferredLocations : [],
      };

      res.json(userProfile);
    } catch (error) {
      res.status(500).json({
        message: "ユーザー情報の取得に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });


  // 求人詳細の取得
  app.get("/api/jobs/:id", authenticate, async (req: any, res, next) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "無効な求人IDです" });
      }

      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, jobId));

      if (!job) {
        return res.status(404).json({ message: "求人が見つかりません" });
      }

      if (job.status !== 'published') {
        if (!req.user || (req.user.role === 'store' && job.storeId !== req.user.id)) {
          return res.status(403).json({ message: "この求人情報へのアクセス権限がありません" });
        }
        if (req.user.role !== 'store') {
          return res.status(403).json({ message: "この求人情報は現在非公開です" });
        }
      }

      const responseData = {
        ...job,
        ...(req.user?.role === 'store' && job.storeId === req.user.id ? {
          requirements: job.requirements,
        } : {})
      };

      res.json(responseData);
    } catch (error) {
      res.status(500).json({
        message: "求人詳細の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // 求人情報の更新
  app.put("/api/jobs/:id", authenticate, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "無効な求人IDです" });
      }

      if (req.user.role !== 'store') {
        return res.status(403).json({ message: "店舗アカウントのみ求人情報を更新できます" });
      }

      const [existingJob] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, jobId));

      if (!existingJob) {
        return res.status(404).json({ message: "求人が見つかりません" });
      }

      if (existingJob.storeId !== req.user.id) {
        return res.status(403).json({ message: "この求人情報の更新権限がありません" });
      }

      const updateData = jobSchema
        .omit({ storeId: true, status: true })
        .parse(req.body);

      const [updatedJob] = await db
        .update(jobs)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId))
        .returning();

      res.json(updatedJob);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          error: true,
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      } else {
        res.status(500).json({
          error: true,
          message: "求人情報の更新に失敗しました"
        });
      }
    }
  });

  // 求人応募エンドポイント
  app.post("/api/jobs/:id/apply", authenticate, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      const validatedData = applicationSchema.parse({
        ...req.body,
        userId: req.user.id,
        jobId
      });

      const [existingJob] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, jobId));

      if (!existingJob) {
        return res.status(404).json({ message: "求人が見つかりません" });
      }

      const [existingApplication] = await db
        .select()
        .from(applications)
        .where(and(
          eq(applications.jobId, jobId),
          eq(applications.userId, req.user.id)
        ));

      if (existingApplication) {
        return res.status(400).json({ message: "既に応募済みです" });
      }

      const [application] = await db
        .insert(applications)
        .values(validatedData)
        .returning();

      res.status(201).json(application);
    } catch (error) {
      res.status(500).json({
        message: "応募処理に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // 認証エンドポイント
  app.post("/api/register", async (req, res) => {
    try {
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

      const token = generateToken(user);

      res.status(201).json({ user, token });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "ユーザー登録に失敗しました"
      });
    }
  });


  // 認証が必要なエンドポイント
  app.get("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      const [profile] = await db
        .select()
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, req.user.id));

      if (!profile) {
        return res.status(404).json({
          message: "プロフィールが見つかりません。新規登録が必要です。",
          isNewUser: true
        });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({
        message: "プロフィールの取得に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      const profileData = talentProfileSchema.parse(req.body);

      const [newProfile] = await db
        .insert(talentProfiles)
        .values({
          userId: req.user.id,
          ...profileData,
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json(newProfile);
    } catch (error) {
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

  app.put("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const updateData = talentProfileUpdateSchema.parse(req.body);

      const [updatedProfile] = await db
        .update(talentProfiles)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(talentProfiles.userId, userId))
        .returning();

      if (!updatedProfile) {
        return res.status(404).json({ message: "プロフィールが見つかりません" });
      }

      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({
        message: "プロフィールの更新に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  app.patch("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updatedProfile = await db.transaction(async (tx) => {
        const [currentProfile] = await tx
          .select()
          .from(talentProfiles)
          .where(eq(talentProfiles.userId, userId));

        if(!currentProfile) {
          throw new Error("プロフィールが見つかりません");
        }

        const updateData = talentProfileUpdateSchema.parse(req.body);
        const immutableFields = ['birthDate', 'createdAt', 'id', 'userId'] as const;
        const processedData = {
          ...currentProfile,  
          ...updateData,      
          ...immutableFields.reduce((acc, field) => ({
            ...acc,
            [field]: currentProfile[field as keyof typeof currentProfile]
          }), {} as Partial<typeof currentProfile>),
          userId,
          updatedAt: new Date(),
        };

        const [updated] = await tx
          .update(talentProfiles)
          .set(processedData)
          .where(eq(talentProfiles.userId, userId))
          .returning();

        if (!updated) {
          throw new Error("プロフィールの更新に失敗しました");
        }

        const [freshProfile] = await tx
          .select()
          .from(talentProfiles)
          .where(eq(talentProfiles.userId, userId));

        return freshProfile;
      });

      res.json(updatedProfile);
    } catch (error) {
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

      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId)); 

      if (!currentUser) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      const updatableFields = ['username', 'displayName', 'location', 'preferredLocations'];
      const updateData = Object.entries(req.body).reduce((acc, [key, value]) => {
        if (updatableFields.includes(key)) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      if (req.body.newPassword && req.body.currentPassword) {
        await updateUserProfile(userId, { currentPassword: req.body.currentPassword, newPassword: req.body.newPassword });
        delete updateData.currentPassword;
        delete updateData.newPassword;
      }

      updateData.updatedAt = new Date();

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error("ユーザー情報の更新に失敗しました");
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        message: "ユーザー情報を更新しました",
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(400).json({
        error: true,
        message: error instanceof Error ? error.message : "ユーザー情報の更新に失敗しました"
      });
    }
  });

  app.get("/api/get-signed-url", authenticate, async (req: any, res) => {
    try {
      const { key } = req.query;
      if (!key) {
        return res.status(400).json({ message: "画像キーが必要です。" });
      }

      const signedUrl = await getSignedS3Url(key as string);
      res.json({ url: signedUrl });
    } catch (error) {
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

  app.post("/api/upload-photo", authenticate, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
          return res.status(400).json({ message: "ファイルがアップロードされていません" });
      }

      const s3Url = await uploadToS3(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        `${req.user.id}-${Date.now()}.jpg`
      );
      res.json({ url: s3Url });
    } catch (error) {
      res.status(500).json({
        message: "写真のアップロードに失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/upload-photo-chunk", authenticate, async (req: any, res) => {
    try {
      const { photo, totalChunks, chunkIndex, photoId, tag, order } = req.body;

      if (!photo || !photo.startsWith('data:')) {
        return res.status(400).json({ message: "Invalid photo data" });
      }

      try {
        const [header, content] = photo.split(',');
        const base64Content = content;
        const chunkKey = `${req.user.id}-${photoId}`;
        let chunks = photoChunksStore.get(chunkKey) || new Array(totalChunks);
        chunks[chunkIndex] = base64Content;
        photoChunksStore.set(chunkKey, chunks);

        if (chunkIndex === totalChunks - 1) {
          try {
            if (chunks.some(chunk => !chunk)) {
              throw new Error(`Missing chunk data. Expected ${totalChunks} chunks, got ${chunks.filter(Boolean).length}`);
            }

            const completeBase64 = chunks.join('');

            const s3Url = await uploadToS3(
              `${header},${completeBase64}`,
              `${req.user.id}-${photoId}.jpg`
            );

            photoChunksStore.delete(chunkKey);

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
            throw s3Error;
          }
        } else {
          res.set({
            'ETag': `"${photoId}-${chunkIndex}"`,
            'Content-Type': 'application/json'
          }).json({ status: 'chunk_uploaded' });
        }
      } catch (uploadError) {
        throw uploadError;
      }
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "写真のアップロードに失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/talent/matching", authenticate, async (req: any, res) => {
    try {
      const conditions = req.body;

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
        })
        .from(jobs)
        .orderBy(desc(jobs.createdAt))
        .limit(50);

      const matchedJobs = await Promise.all(
        jobListings.map(async (job) => {
          const score = await calculateMatchScore(job, conditions);
          const matches: string[] = [];

          if (conditions.preferredLocations.includes(job.location)) {
            matches.push('希望エリア');
          }
          if (Number(job.minimumGuarantee) >= Number(conditions.desiredGuarantee)) {
            matches.push('希望給与');
          }
          if (conditions.workTypes.includes(job.serviceType)) {
            matches.push('希望業態');
          }
          if (job.transportationSupport) {
            matches.push('交通費サポート');
          }
          if (job.housingSupport) {
            matches.push('宿泊サポート');
          }

          return {
            ...job,
            matchScore: score,
            matches: matches,
            features: [
              job.transportationSupport ? '交通費サポートあり' : null,
              job.housingSupport ? '宿泊費サポートあり' : null,
              `保証${job.minimumGuarantee}円～`,
              job.workingHours ? `勤務時間: ${job.workingHours}` : null,
            ].filter(Boolean),
          };
        })
      );

      const results = matchedJobs
        .filter(job => job.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

      res.json(results);
    } catch (error) {
      res.status(500).json({
        message: "マッチング処理に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/jobs", authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'store') {
        return res.status(403).json({
          message: "店舗アカウントのみ求人投稿が可能です"
        });
      }

      const jobData = jobSchema.parse({
        ...req.body,
        storeId: req.user.id,
        status: 'draft'
      });

      const [newJob] = await db
        .insert(jobs)
        .values(jobData)
        .returning();

      res.status(201).json(newJob);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          error: true,
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      } else {
        res.status(500).json({
          error: true,
          message: "求人情報の投稿に失敗しました"
        });
      }
    }
  });

  app.patch("/api/jobs/:id/status", authenticate, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "無効な求人IDです" });
      }

      const { status } = req.body;
      if (!status || !["draft", "published", "closed"].includes(status)) {
        return res.status(400).json({ message: "無効なステータスです" });
      }

      if (req.user.role !== 'store') {
        return res.status(403).json({ message: "店舗アカウントのみステータスを更新できます" });
      }

      const [existingJob] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, jobId));

      if (!existingJob) {
        return res.status(404).json({ message: "求人が見つかりません" });
      }

      if (existingJob.storeId !== req.user.id) {
        return res.status(403).json({ message: "この求人情報の更新権限がありません" });
      }

      const [updatedJob] = await db
        .update(jobs)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId))
        .returning();

      res.json(updatedJob);
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "ステータスの更新に失敗しました"
      });
    }
  });

  app.get("/api/blog/posts", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      const posts = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.storeId, req.user.id))
        .orderBy(desc(blogPosts.createdAt));

      const response: BlogPostListResponse = {
        posts,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: posts.length
        }
      };

      return res.json(response);
    } catch (error) {
      return res.status(500).json({
        message: "ブログ記事の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  app.put("/api/blog/posts/:id", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }
      if (!req.user?.id) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const [existingPost] = await db
.select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      if (existingPost.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事を編集する権限がありません" });
      }

      const updateData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id,
        updatedAt: new Date()
      });

      const [updatedPost] = await db
        .update(blogPosts)
        .set(updateData)
        .where(eq(blogPosts.id, postId))
        .returning();

      res.json(updatedPost);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "ブログ記事の更新に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  app.patch("/api/blog/posts/:id/status", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }

      const { status, scheduledAt } = req.body;

      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみステータスを更新できます" });
      }

      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      if (existingPost.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事の更新権限がありません" });
      }

      if (!["draft", "published", "scheduled"].includes(status)) {
        return res.status(400).json({ message: "無効なステータスです" });
      }

      if (status === "scheduled" && !scheduledAt) {
        return res.status(400).json({ message: "予約投稿には公開日時の指定が必要です" });
      }

      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          status,
          scheduledAt: status === "scheduled" ? scheduledAt : null,
          publishedAt: status === "published" ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(blogPosts.id, postId))
        .returning();

      res.json(updatedPost);
    } catch (error) {
      res.status(500).json({
        message: "記事のステータス更新に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  app.delete("/api/blog/posts/:id", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }

      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみ記事を削除できます" });
      }

      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      if (existingPost.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事の削除権限がありません" });
      }

      await db
        .delete(blogPosts)
        .where(eq(blogPosts.id, postId));

      res.json({ message: "記事を削除しました" });
    } catch (error) {
      res.status(500).json({
        message: "記事の削除に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  app.post("/api/blog/cleanup", authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== "store") {
        return res.status(403).json({ message: "管理者のみアクセス可能です" });
      }

      const deletedPosts = await cleanupOldBlogPosts();

      return res.json({
        success: true,
        deletedCount: deletedPosts?.length || 0,
        message: `${deletedPosts?.length || 0}件の古い記事を削除しました`
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "クリーンアップ処理に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  app.post("/api/search", async (req, res) => {
    try {
      const { location, serviceType, page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        return res.status(400).json({
          message: "ページネーションパラメータが不正です",
          timestamp: new Date().toISOString()
        });
      }

      const offset = (pageNum - 1) * limitNum;

      let baseQuery = db
        .select()
        .from(jobs)
        .where(eq(jobs.status, 'published'));

      if (location && location !== "all") {
        baseQuery = baseQuery.where(eq(jobs.location, location as string));
      }

      if (serviceType && serviceType !== "all") {
        baseQuery = baseQuery.where(eq(jobs.serviceType, serviceType as string));
      }

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(eq(jobs.status, 'published'));

      const jobListings = await baseQuery
        .orderBy(desc(jobs.createdAt))
        .limit(limitNum)
        .offset(offset);

      const response = {
        jobs: jobListings,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(count / limitNum),
          totalItems: count
        }
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        message: "求人検索に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function calculateMatchScore(job: Job, conditions: any): Promise<number> {
  let score = 0;
  if (conditions.preferredLocations.includes(job.location)) {
    score++;
  }
  if (Number(job.minimumGuarantee) >= Number(conditions.desiredGuarantee)) {
    score++;
  }
  if (conditions.workTypes.includes(job.serviceType)) {
    score++;
  }
  return score;
}

async function cleanupOldBlogPosts(): Promise<BlogPost[] | undefined> {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const oldPosts = await db.select().from(blogPosts).where(
    eq(blogPosts.createdAt, "<", threeMonthsAgo)
  );

  if(oldPosts.length === 0) return undefined;

  await db.delete(blogPosts).where(
    eq(blogPosts.createdAt, "<", threeMonthsAgo)
  );
  return oldPosts;
}

async function updateUserProfile(userId: number, updateData: any) {
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!currentUser) {
    throw new Error("ユーザーが見つかりません");
  }

  if (updateData.newPassword && updateData.currentPassword) {
    const isValidPassword = await comparePasswords(updateData.currentPassword, currentUser.password);
    if (!isValidPassword) {
      throw new Error("現在のパスワードが正しくありません");
    }
    updateData.password = await hashPassword(updateData.newPassword);
    delete updateData.newPassword;
    delete updateData.currentPassword;
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      ...updateData,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning();

  return updatedUser;
}

export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('無効なパスワードです');
    }

    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const buf = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    const hashedPassword = buf.toString('hex');

    return `${hashedPassword}.${salt}`;
  } catch (error) {
    throw new Error('パスワードのハッシュ化に失敗しました');
  }
}

const photoChunksStore = new Map();