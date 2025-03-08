import type { Express, Request, Response, NextFunction } from "express";
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
  viewHistorySchema,
  jobSchema,
  type Job,
  type JobRequirements,
  loginSchema,
  type LoginData,
  type SelectUser,
  users,
  talentProfiles,
  blogPosts,
  storeImages,
  type BlogPost,
  type BlogPostListResponse,
  type JobListingResponse,
  blogPostSchema,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { generateToken, verifyToken } from "./jwt";
import { authenticate } from "./middleware/auth";
import { uploadToS3, getSignedS3Url } from "./utils/s3";
interface S3UploadResult {
  key: string;
  url: string;
}
import { generateDailyStats, getStoreStats } from "./utils/access-stats";
import multer from "multer";
import { validateImageUpload, getTotalImagesCount } from "./utils/image-validation";

// multerの設定を一箇所にまとめる
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 // 500KB
  }
});

const scryptAsync = promisify(scrypt);

// パスワード関連の定数
const SALT_LENGTH = 32; // 一定のソルト長を使用
const KEY_LENGTH = 64;  // scryptの出力長

// パスワードハッシュ化関数の実装を修正
export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('無効なパスワードです');
    }

    // 新しいソルトを生成（32バイト固定）
    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const buf = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    const hashedPassword = buf.toString('hex');

    console.log('パスワードハッシュ化完了:', {
      saltLength: salt.length,
      hashedLength: hashedPassword.length,
      timestamp: new Date().toISOString()
    });

    return `${hashedPassword}.${salt}`;
  } catch (error) {
    console.error('パスワードハッシュ化エラー:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw new Error('パスワードのハッシュ化に失敗しました');
  }
}

// パスワード比較関数の実装を修正
export async function comparePasswords(inputPassword: string, storedPassword: string): Promise<boolean> {
  try {
    if (!inputPassword || !storedPassword) {
      console.error('無効なパスワード入力:', {
        hasInput: !!inputPassword,
        hasStored: !!storedPassword,
        timestamp: new Date().toISOString()
      });
      return false;
    }

    const [hashedPassword, salt] = storedPassword.split('.');

    if (!hashedPassword || !salt || salt.length !== SALT_LENGTH * 2) { // hex文字列なので長さは2倍
      console.error('パスワード形式が不正:', {
        hasHashedPassword: !!hashedPassword,
        hasSalt: !!salt,
        saltLength: salt?.length,
        expectedLength: SALT_LENGTH * 2,
        timestamp: new Date().toISOString()
      });
      return false;
    }

    console.log('パスワード比較開始:', {
      storedHashLength: hashedPassword.length,
      saltLength: salt.length,
      timestamp: new Date().toISOString()
    });

    const buf = (await scryptAsync(inputPassword, salt, KEY_LENGTH)) as Buffer;
    const inputHash = buf.toString('hex');

    // 厳密な比較を行う
    const result = timingSafeEqual(
      Buffer.from(hashedPassword, 'hex'),
      Buffer.from(inputHash, 'hex')
    );

    console.log('パスワード検証結果:', {
      isValid: result,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    console.error('パスワード比較エラー:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

// ユーザー情報更新処理の修正
async function updateUserProfile(userId: number, updateData: any) {
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));  // 修正：正しいwhere句

  if (!currentUser) {
    throw new Error("ユーザーが見つかりません");
  }

  // パスワード更新の処理
  if (updateData.newPassword && updateData.currentPassword) {
    const isValidPassword = await comparePasswords(updateData.currentPassword, currentUser.password);
    if (!isValidPassword) {
      throw new Error("現在のパスワードが正しくありません");
    }
    // 新しいパスワードをハッシュ化
    updateData.password = await hashPassword(updateData.newPassword);
    // 更新データから不要なフィールドを削除
    delete updateData.newPassword;
    delete updateData.currentPassword;
  }

  // ユーザー情報の更新
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

export async function registerRoutes(app: Express): Promise<Server> {
  // APIルートを最初に登録
  app.use("/api/*", (req, res, next) => {
    console.log('API request received:', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    if (req.headers.accept?.includes("application/json")) {
      res.setHeader("Content-Type", "application/json");
    }
    next();
  });

  // 求人一覧取得エンドポイント（店舗用）を先に定義
  app.get("/api/jobs/store", authenticate, async (req: any, res) => {
    try {
      // 認証状態の詳細なログ
      console.log('Store jobs request authentication:', {
        userId: req.user?.id,
        userRole: req.user?.role,
        headers: req.headers,
        timestamp: new Date().toISOString()
      });

      // 店舗ユーザーの認証チェック
      if (!req.user?.id || req.user.role !== "store") {
        console.log('Unauthorized store access:', {
          userId: req.user?.id,
          role: req.user?.role,
          timestamp: new Date().toISOString()
        });
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      console.log('Store jobs fetch request:', {
        storeId: req.user.id,
        timestamp: new Date().toISOString()
      });

      // 店舗の求人一覧を取得
      const jobListings = await db
        .select()
        .from(jobs)
        .where(eq(jobs.storeId, req.user.id))
        .orderBy(desc(jobs.createdAt));

      console.log('Store jobs fetched:', {
        storeId: req.user.id,
        count: jobListings.length,
        jobs: jobListings.map(job => ({
          id: job.id,
          title: job.title,
          status: job.status
        })),
        timestamp: new Date().toISOString()
      });

      // JobListingResponse型に従ってレスポンスを整形
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
      console.error('Store jobs fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        storeId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        message: "求人情報の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // 統合ログインエンドポイント
  app.post("/api/login", async (req, res) => {
    try {
      console.log('ログインリクエスト受信:', {
        username: req.body.username,
        role: req.body.role,
        timestamp: new Date().toISOString()
      });

      // リクエストボディのバリデーション
      const loginData = loginSchema.parse(req.body);

      // ユーザーの取得とロールチェック
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, loginData.username));

      if (!user) {
        console.log('ログイン失敗: ユーザーが存在しません', {
          username: loginData.username,
          timestamp: new Date().toISOString()
        });
        return res.status(401).json({ message: "ユーザー名またはパスワードが間違っています" });
      }

      // パスワード検証
      console.log('パスワード検証:', {
        username: loginData.username,
        hashedPasswordLength: user.password.length,
        timestamp: new Date().toISOString()
      });

      const isValidPassword = await comparePasswords(loginData.password, user.password);

      if (!isValidPassword) {
        console.log('ログイン失敗: パスワードが無効', {
          username: loginData.username,
          timestamp: new Date().toISOString()
        });
        return res.status(401).json({ message: "ユーザー名またはパスワードが間違っています" });
      }

      // 店舗ユーザーの場合のロールチェック
      if (loginData.role === "store" && user.role !== "store") {
        return res.status(403).json({ message: "店舗管理者用のログインページです" });
      }

      // JWTトークンを生成
      const token = generateToken(user);

      console.log('ログイン成功:', {
        userId: user.id,
        username: user.username,
        role: user.role,
        timestamp: new Date().toISOString()
      });

      // パスワードハッシュを除外して返す
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error('ログインエラー:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      res.status(400).json({
        message: error instanceof Error ? error.message : "ログインに失敗しました"
      });
    }
  });

  // ログアウトエンドポイント
  app.post("/api/logout", authenticate, async (req: any, res) => {
    try {
      console.log('Logout request:', {
        userId: req.user?.id,
        role: req.user?.role,
        timestamp: new Date().toISOString()
      });

      res.json({ message: "ログアウトしました" });
    } catch (error) {
      console.error('Logout error:', {
        error,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({ message: "ログアウトに失敗しました" });
    }
  });

  // 画像アップロードエンドポイント
  app.post("/api/blog/upload-image", authenticate, upload.single("image"), async (req: any, res) => {
    try {
      console.log('Image upload request received:', {
        userId: req.user?.id,
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : 'No file received',
        timestamp: new Date().toISOString()
      });

      // 認証チェック
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみアップロード可能です" });
      }

      // ファイルチェック
      if (!req.file) {
        return res.status(400).json({ message: "画像ファイルを選択してください" });
      }

      // 現在の画像数を取得
      const currentImagesCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(storeImages)
        .where(eq(storeImages.storeId, req.user.id))
        .then(result => result[0]?.count || 0);

      console.log('Current images count:', {
        userId: req.user.id,
        count: currentImagesCount
      });

      // バリデーション
      const validation = validateImageUpload(req.file, currentImagesCount);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }

      try {
        // S3にアップロード
        const uploadResult = await uploadToS3(req.file.buffer, {
          contentType: req.file.mimetype,
          extension: req.file.originalname.split(".").pop() || "",
          prefix: `blog/${req.user.id}/`
        });

        // DBに画像情報を保存
        const [storeImage] = await db
          .insert(storeImages)
          .values({
            storeId: req.user.id,
            url: uploadResult.url,
            key: uploadResult.key,
          })
          .returning();

        console.log('Image upload successful:', {
          userId: req.user.id,
          imageId: storeImage.id,
          key: uploadResult.key,
          url: uploadResult.url
        });

        res.json(uploadResult);
      } catch (uploadError) {
        console.error('S3 upload or DB insert error:', {
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
          userId: req.user.id,
          file: req.file.originalname
        });
        throw uploadError;
      }
    } catch (error) {
      console.error('Image upload error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "画像のアップロードに失敗しました",
        error: process.env.NODE_ENV === "development" ? error : undefined
      });
    }
  });

  // ブログ投稿の作成
  app.post("/api/blog/posts", authenticate, async (req: any, res) => {
    try {
      console.log('Blog post creation request:', {
        userId: req.user?.id,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      });

      // 店舗ユーザーのみ許可
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみブログを投稿できます" });
      }

      // リクエストデータのバリデーション
      const postData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // ブログ投稿を作成
      const [post] = await db
        .insert(blogPosts)
        .values(postData)
        .returning();

      console.log('Blog post created:', {
        userId: req.user.id,
        postId: post.id,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Blog post creation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "ブログ投稿の作成に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ブログ投稿の更新
  app.put("/api/blog/posts/:id", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な投稿IDです" });
      }

      console.log('Blog post update request:', {
        userId: req.user?.id,
        postId,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      });

      // 店舗ユーザーのみ許可
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみブログを更新できます" });
      }

      // 投稿の存在確認
      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return res.status(404).json({ message: "投稿が見つかりません" });
      }

      // 投稿者本人のみ更新可能
      if (existingPost.storeId !== req.user.id) {
        return res.status(403).json({ message: "この投稿の更新権限がありません" });
      }

      // リクエストデータのバリデーション
      const updateData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id,
        updatedAt: new Date()
      });

      // ブログ投稿を更新
      const [updatedPost] = await db
        .update(blogPosts)
        .set(updateData)
        .where(eq(blogPosts.id, postId))
        .returning();

      console.log('Blog post updated:', {
        userId: req.user.id,
        postId,
        timestamp: new Date().toISOString()
      });

      res.json(updatedPost);
    } catch (error) {
      console.error('Blog post update error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        postId: req.params.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "ブログ投稿の更新に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
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

      // クエリの構築を修正
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

      // 総件数の取得
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(eq(jobs.status, 'published'));

      // 求人データの取得
      const jobListings = await baseQuery
        .orderBy(desc(jobs.createdAt))
        .limit(limitNum)
        .offset(offset);

      console.log('Jobs search successful:', {
        filters: { location, serviceType },
        pagination: { page: pageNum, limit: limitNum, total: count },
        timestamp: new Date().toISOString()
      });

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
      console.error("Jobs search error:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        query: req.query,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "求人検索に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 求人詳細の取得 (Corrected implementation)
  app.get("/api/jobs/:id", authenticate, async (req: any, res, next) => {
    try {
      // リクエストパスのログ追加
      console.log('Job detail request path:', {
        originalUrl: req.originalUrl,
        path: req.path,
        params: req.params,
        timestamp: new Date().toISOString()
      });

      // 'store'という文字列の場合はスキップ
      if (req.params.id === 'store') {
        return next();
      }

      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        console.log('Invalid job ID:', {
          params: req.params,
          parsedId: jobId,
          timestamp: new Date().toISOString()
        });
        return res.status(400).json({ message: "無効な求人IDです" });
      }

      console.log('Job detail fetch request received:', {
        userId: req.user?.id,
        jobId,
        userRole: req.user?.role,
        timestamp: new Date().toISOString()
      });

      // 求人情報の取得
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, jobId));

      if (!job) {
        return res.status(404).json({ message: "求人が見つかりません" });
      }

      // 非公開求人へのアクセス制御
      if (job.status !== 'published') {
        // 店舗ユーザーの場合、自身の求人のみアクセス可能
        if (!req.user || (req.user.role === 'store' && job.storeId !== req.user.id)) {
          return res.status(403).json({ message: "この求人情報へのアクセス権限がありません" });
        }
        // 一般ユーザーの場合、公開済みの求人のみアクセス可能
        if (req.user.role !== 'store') {
          return res.status(403).json({ message: "この求人情報は現在非公開です" });
        }
      }

      // レスポンスデータの準備
      const responseData = {
        ...job,
        // 店舗ユーザーの場合、内部情報も含める
        ...(req.user?.role === 'store' && job.storeId === req.user.id ? {
          requirements: job.requirements,
        } : {})
      };

      res.json(responseData);
    } catch (error) {
      console.error("Job detail fetch error:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        jobId: req.params.id,
        timestamp: new Date().toISOString()
      });

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

      console.log('Job update request received:', {
        userId: req.user?.id,
        jobId,
        requestData: req.body,
        timestamp: new Date().toISOString()
      });

      // 店舗ユーザーのみ許可
      if (req.user.role !== 'store') {
        return res.status(403).json({ message: "店舗アカウントのみ求人情報を更新できます" });
      }

      // 求人情報の取得
      const [existingJob] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, jobId));

      if (!existingJob) {
        return res.status(404).json({ message: "求人が見つかりません" });
      }

      // 自身の求人のみ更新可能
      if (existingJob.storeId !== req.user.id) {
        return res.status(403).json({ message: "この求人情報の更新権限がありません" });
      }

      // バリデーション（statusは別エンドポイントで更新）
      const updateData = jobSchema
        .omit({ storeId: true, status: true })
        .parse(req.body);

      // 求人情報の更新
      const [updatedJob] = await db
        .update(jobs)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId))
        .returning();

      console.log('Job update successful:', {
        userId: req.user.id,
        jobId,
        timestamp: new Date().toISOString()
      });

      res.json(updatedJob);
    } catch (error) {
      console.error('Job update error:', {
        error,
        userId: req.user?.id,
        jobId: req.params.id,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      });

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

      // バリデーション
      const validatedData = applicationSchema.parse({
        ...req.body,
        userId: req.user.id,
        jobId
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
          eq(applications.jobId, jobId),
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
  // ブログ投稿の作成
  app.post("/api/blog/posts", authenticate, async (req: any, res) => {
    try {
      console.log('Blog post creation request:', {
        userId: req.user?.id,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      });

      // 店舗ユーザーのみ許可
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみブログを投稿できます" });
      }

      // リクエストデータのバリデーション
      const postData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // ブログ投稿を作成
      const [post] = await db
        .insert(blogPosts)
        .values(postData)
        .returning();

      console.log('Blog post created:', {
        userId: req.user.id,
        postId: post.id,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Blog post creation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "ブログ投稿の作成に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ブログ投稿の更新
  app.put("/api/blog/posts/:id", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な投稿IDです" });
      }

      console.log('Blog post update request:', {
        userId: req.user?.id,
        postId,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      });

      // 店舗ユーザーのみ許可
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみブログを更新できます" });
      }

      // 投稿の存在確認
      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return res.status(404).json({ message: "投稿が見つかりません" });
      }

      // 投稿者本人のみ更新可能
      if (existingPost.storeId !== req.user.id) {
        return res.status(403).json({ message: "この投稿の更新権限がありません" });
      }

      // リクエストデータのバリデーション
      const updateData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id,
        updatedAt: new Date()
      });

      // ブログ投稿を更新
      const [updatedPost] = await db
        .update(blogPosts)
        .set(updateData)
        .where(eq(blogPosts.id, postId))
        .returning();

      console.log('Blog post updated:', {
        userId: req.user.id,
        postId,
        timestamp: new Date().toISOString()
      });

      res.json(updatedPost);
    } catch (error) {
      console.error('Blog post update error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        postId: req.params.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "ブログ投稿の更新に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

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


  // 認証が必要なエンドポイント
  // profilesテーブルのデータ取得のエラーハンドリングを改善
  app.get("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('Profile fetch request received:', {
        userId,
        authHeader: req.headers.authorization,
        timestamp: new Date().toISOString()
      });

      // データベースクエリの実行を詳細にログ
      console.log('Executing database query for user:', req.user.id);
      const [profile] = await db
        .select()
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, req.user.id));

      console.log('Database query result:', {
        userId: req.user.id,
        hasProfile: !!profile,
        profileId: profile?.id,
        profileData: JSON.stringify(profile), // 完全なプロフィールデータをログに出力
        timestamp: new Date().toISOString()
      });

      // プロフィールが存在しない場合は404を返す
      if (!profile) {
        console.log('Profile not found for user:', req.user.id);
        return res.status(404).json({
          message: "プロフィールが見つかりません。新規登録が必要です。",
          isNewUser: true
        });
      }

      console.log('Profile fetch successful:', {
        userId: req.user.id,
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

  // PUT /api/talent/profile (Corrected implementation)
  app.put("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      const userId = req.user.id;

      if (!userId) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      // バリデーション
      const updateData = talentProfileUpdateSchema.parse(req.body);

      console.log('Profile update request received:', {
        userId,
        updateData,
        timestamp: new Date().toISOString()
      });

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
        return res.status(404).json({ message: "プロフィールが見つかりません" });
      }

      console.log('Profile updated successfully:', {
        userId,
        profileId: updatedProfile.id,
        timestamp: new Date().toISOString()
      });

      res.json(updatedProfile);
    } catch (error) {
      console.error('Profile update error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "プロフィールの更新に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });



  app.patch("/api/talent/profile", authenticate, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('Profile update request received:', {
        userId,
        requestData: req.body,
        timestamp:new Date().toISOString()      });

      const updatedProfile = await db.transaction(async (tx) => {
        // 現在のプロフィールを取得
        const [currentProfile] = await tx
          .select()
          .from(talentProfiles)
          .where(eq(talentProfiles.userId, userId));

        if(!currentProfile) {
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
        .where(eq(users.id, userId)); // 修正: 正しいwhere句を使用

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
        await updateUserProfile(userId, { currentPassword: req.body.currentPassword, newPassword: req.body.newPassword });
        delete updateData.currentPassword;
        delete updateData.newPassword;
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

  // マッチング結果取得エンドポイント
  app.post("/api/talent/matching", authenticate, async (req: any, res) => {
    try {
      console.log('Matching request received:', {
        userId: req.user?.id,
        conditions: req.body,
        timestamp: new Date().toISOString()
      });

      const conditions = req.body;

      // 求人情報を取得
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

      // マッチングスコアを計算
      const matchedJobs = await Promise.all(
        jobListings.map(async (job) => {
          const score = await calculateMatchScore(job, conditions);
          const matches: string[] = [];

          // マッチポイントの判定
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
            // ピックアップモード用の追加情報
            features: [
              job.transportationSupport ? '交通費サポートあり' : null,
              job.housingSupport ? '宿泊費サポートあり' : null,
              `保証${job.minimumGuarantee}円～`,
              job.workingHours ? `勤務時間: ${job.workingHours}` : null,
            ].filter(Boolean),
          };
        })
      );

      // スコアでソートし、上位の結果のみを返す
      const results = matchedJobs
        .filter(job => job.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

      console.log('Matching results generated:', {
        userId: req.user?.id,
        resultCount: results.length,
        timestamp: new Date().toISOString()
      });

      res.json(results);
    } catch (error) {
      console.error('Matching error:', {
        error,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        message: "マッチング処理に失敗しました",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // 求人情報の新規投稿
  app.post("/api/jobs", authenticate, async (req: any, res) => {
    try {
      console.log('Job posting request received:', {
        userId: req.user.id,
        requestData: req.body,
        timestamp: new Date().toISOString()
      });

      // 店舗ユーザーのみ許可
      if (req.user.role !== 'store') {
        return res.status(403).json({
          message: "店舗アカウントのみ求人投稿が可能です"
        });
      }

      // バリデーション
      const jobData = jobSchema.parse({
        ...req.body,
        storeId: req.user.id,
        status: 'draft'
      });

      // 求人情報の保存
      const [newJob] = await db
        .insert(jobs)
        .values(jobData)
        .returning();

      console.log('Job posting successful:', {
        userId: req.user.id,
        jobId: newJob.id,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(newJob);
    } catch (error) {
      console.error('Job posting error:', {
        error,
        userId: req.user?.id,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      });

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


  // 求人ステータスの更新
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

      console.log('Job status update request received:', {
        userId: req.user?.id,
        jobId,
        newStatus: status,
        timestamp: new Date().toISOString()
      });

      // 店舗ユーザーのみ許可
      if (req.user.role !== 'store') {
        return res.status(403).json({ message: "店舗アカウントのみステータスを更新できます" });
      }

      // 求人情報の取得
      const [existingJob] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, jobId));

      if (!existingJob) {
        return res.status(404).json({ message: "求人が見つかりません" });
      }

      // 自身の求人のみ更新可能
      if (existingJob.storeId !== req.user.id) {
        return res.status(403).json({ message: "この求人情報の更新権限がありません" });
      }

      // ステータスの更新
      const [updatedJob] = await db
        .update(jobs)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId))
        .returning();

      console.log('Job status update successful:', {
        userId: req.user.id,
        jobId,
        oldStatus: existingJob.status,
        newStatus: status,
        timestamp: new Date().toISOString()
      });

      res.json(updatedJob);
    } catch (error) {
      console.error('Job status update error:', {
        error,
        userId: req.user?.id,
        jobId: req.params.id,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        error: true,
        message: "ステータスの更新に失敗しました"
      });
    }
  });

  // 店舗のアクセス統計を取得するエンドポイント
  app.get("/api/stores/:storeId/stats", authenticate, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);

      if (isNaN(storeId)) {
        return res.status(400).json({ message: "無効な店舗IDです" });
      }

      // 認証チェック
      if (!req.user || (req.user.role === 'store' && req.user.id !== storeId)) {
        return res.status(403).json({ message: "アクセス権限がありません" });
      }

      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7); // 過去7日分のデータ

      const stats = await getStoreStats(storeId, startDate, today);

      if (!stats.length) {
        // 統計データがない場合は新規作成
        const todayStats = await generateDailyStats(today, storeId);
        await saveDailyStats(todayStats);
        return res.json(todayStats);
      }

      return res.json(stats[0]); // 最新の統計データを返す
    } catch (error) {
      console.error('Access stats fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "アクセス統計の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ブログ記事一覧の取得
  app.get("/api/blog/posts", authenticate, async (req: any, res) => {
    try {
      console.log('Blog posts fetch request received:', {
        userId: req.user?.id,
        userRole: req.user?.role,
        timestamp: new Date().toISOString()
      });

      // 店舗ユーザーの認証チェック
      if (!req.user?.id || req.user.role !== "store") {
        console.log('Unauthorized blog access:', {
          userId: req.user?.id,
          role: req.user?.role,
          timestamp: new Date().toISOString()
        });
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      // ブログ記事の取得
      const posts = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.storeId, req.user.id))
        .orderBy(desc(blogPosts.createdAt));

      console.log('Blog posts fetched:', {
        storeId: req.user.id,
        count: posts.length,
        timestamp: new Date().toISOString()
      });

      // BlogPostListResponse型に従ってレスポンスを整形
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
      console.error('Blog posts fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        storeId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        message: "ブログ記事の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ブログ記事の新規作成
  app.post("/api/blog/posts", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみブログを作成できます" });
      }

      console.log('Blog post creation request:', {
        userId: req.user.id,
        title: req.body.title,
        timestamp: new Date().toISOString()
      });

      // バリデーション
      const postData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id
      });

      // ブログ記事の作成
      const [post] = await db
        .insert(blogPosts)
        .values({
          ...postData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log('Blog post created:', {
        postId: post.id,
        storeId: req.user.id,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Blog post creation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(400).json({
        message: error instanceof Error ? error.message : "ブログ記事の作成に失敗しました"
      });
    }
  });

  // ブログ記事の詳細取得
  app.get("/api/blog/posts/:id", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }

      console.log('Blog post fetch request:', {
        postId,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // 記事の取得
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!post) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      // 権限チェック
      if (post.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事へのアクセス権限がありません" });
      }

      res.json(post);
    } catch (error) {
      console.error('Blog post fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        postId: req.params.id,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "ブログ記事の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ブログ記事の更新
  app.put("/api/blog/posts/:id", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }

      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみブログを更新できます" });
      }

      // 既存の記事を確認
      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      // 権限チェック
      if (existingPost.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事の更新権限がありません" });
      }

      // バリデーション
      const updateData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id
      });

      // 記事の更新
      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(blogPosts.id, postId))
        .returning();

      console.log('Blog post updated:', {
        postId,
        storeId: req.user.id,
        timestamp: new Date().toISOString()
      });

      res.json(updatedPost);
    } catch (error) {
      console.error('Blog post update error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        postId: req.params.id,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(400).json({
        message: error instanceof Error ? error.message : "ブログ記事の更新に失敗しました"
      });
    }
  });

  // ブログ記事の公開状態更新
  app.patch("/api/blog/posts/:id/status", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }

      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみステータスを更新できます" });
      }

      const { status, scheduledAt } = req.body;

      // 既存の記事を確認
      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      // 権限チェック
      if (existingPost.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事の更新権限がありません" });
      }

      // ステータス更新
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

      console.log('Blog post status updated:', {
        postId,
        status,
        scheduledAt,
        timestamp: new Date().toISOString()
      });

      res.json(updatedPost);
    } catch (error) {
      console.error('Blog post status update error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        postId: req.params.id,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(400).json({
        message: error instanceof Error ? error.message : "ステータスの更新に失敗しました"
      });
    }
  });

  // アクセス統計を取得するエンドポイント
  app.get("/api/stores/stats/detail", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

      const stats = await getStoreStats(req.user.id, startDate, today);

      // 過去7日間のデータを日付順に整形
      const dailyBreakdown = stats.map(stat => ({
        date: stat.date,
        totalVisits: stat.totalVisits,
        uniqueVisitors: stat.uniqueVisitors
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // 最新（今日）のデータ
      const latestStats = stats[0] || {
        totalVisits: 0,
        uniqueVisitors: 0,
        hourlyStats: {}
      };

      res.json({
        totalVisits: latestStats.totalVisits,
        uniqueVisitors: latestStats.uniqueVisitors,
        dailyBreakdown
      });
    } catch (error) {
      console.error('Access stats detail fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "アクセス統計の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // アップロード済み画像を取得するエンドポイント
  app.get("/api/store/images", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      // 店舗の全ブログ記事から画像を収集
      const posts = await db
        .select({
          images: blogPosts.images
        })
        .from(blogPosts)
        .where(eq(blogPosts.storeId, req.user.id));

      // 全画像URLを一つの配列にまとめる
      const allImages = posts.reduce((acc: string[], post) => {
        if (post.images) {
          return [...acc, ...post.images];
        }
        return acc;
      }, []);

      // 重複を除去
      const uniqueImages = Array.from(new Set(allImages));

      res.json(uniqueImages);
    } catch (error) {
      console.error("Store images fetch error:", error);
      res.status(500).json({
        message: "画像一覧の取得に失敗しました",
        error: process.env.NODE_ENV ==="development" ? error : undefined
      });
    }
  });

  // 画像一覧取得エンドポイント
  app.get("/api/store/images", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      const images = await db
        .select({
          id: storeImages.id,
          url: storeImages.url,
          key: storeImages.key,
          createdAt: storeImages.createdAt,
        })
        .from(storeImages)
        .where(eq(storeImages.storeId, req.user.id))
        .orderBy(desc(storeImages.createdAt));

      res.json(images);
    } catch (error) {
      console.error('Store images fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "画像一覧の取得に失敗しました",
        error: process.env.NODE_ENV === "development" ? error : undefined
      });
    }
  });

  // 画像アップロードエンドポイント
  app.post("/api/blog/upload-image", authenticate, upload.single("image"), async (req: any, res) => {
    try {
      console.log('Image upload request received:', {
        userId: req.user?.id,
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : 'No file received',
        timestamp: new Date().toISOString()
      });

      // 認証チェック
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみアップロード可能です" });
      }

      // ファイルチェック
      if (!req.file) {
        return res.status(400).json({ message: "画像ファイルを選択してください" });
      }

      // 現在の画像数を取得
      const posts = await db
        .select({
          images: blogPosts.images
        })
        .from(blogPosts)
        .where(eq(blogPosts.storeId, req.user.id));

      const currentImagesCount = posts.reduce((total, post) => {
        return total + (post.images?.length || 0);
      }, 0);

      console.log('Current images count:', {
        userId: req.user.id,
        count: currentImagesCount
      });

      // バリデーション
      const validation = validateImageUpload(req.file, currentImagesCount);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }

      try {
        // S3にアップロード
        const uploadResult = await uploadToS3(req.file.buffer, {
          contentType: req.file.mimetype,
          extension: req.file.originalname.split(".").pop() || "",
          prefix: `blog/${req.user.id}/`
        });

        // DBに画像情報を保存
        const [storeImage] = await db
          .insert(storeImages)
          .values({
            storeId: req.user.id,
            url: uploadResult.url,
            key: uploadResult.key,
          })
          .returning();

        // 署名付きURLを生成
        const signedUrl = await getSignedS3Url(uploadResult.key);

        console.log('Image upload successful:', {
          userId: req.user.id,
          imageId: storeImage.id,
          key: uploadResult.key,
          url: signedUrl
        });

        res.json({
          url: signedUrl,
          key: uploadResult.key
        });
      } catch (uploadError) {
        console.error('S3 upload error:', {
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
          userId: req.user.id,
          file: req.file.originalname
        });
        throw uploadError;
      }
    } catch (error) {
      console.error('Image upload error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "画像のアップロードに失敗しました",
        error: process.env.NODE_ENV === "development" ? error : undefined
      });
    }
  });

  // 店舗のアクセス統計を取得するエンドポイント
  app.get("/api/stores/:storeId/stats", authenticate, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);

      if (isNaN(storeId)) {
        return res.status(400).json({ message: "無効な店舗IDです" });
      }

      // 認証チェック
      if (!req.user || (req.user.role === 'store' && req.user.id !== storeId)) {
        return res.status(403).json({ message: "アクセス権限がありません" });
      }

      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7); // 過去7日分のデータ

      const stats = await getStoreStats(storeId, startDate, today);

      if (!stats.length) {
        // 統計データがない場合は新規作成
        const todayStats = await generateDailyStats(today, storeId);
        await saveDailyStats(todayStats);
        return res.json(todayStats);
      }

      return res.json(stats[0]); // 最新の統計データを返す
    } catch (error) {
      console.error('Access stats fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "アクセス統計の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ブログ記事一覧の取得
  app.get("/api/blog/posts", authenticate, async (req: any, res) => {
    try {
      console.log('Blog posts fetch request received:', {
        userId: req.user?.id,
        userRole: req.user?.role,
        timestamp: new Date().toISOString()
      });

      // 店舗ユーザーの認証チェック
      if (!req.user?.id || req.user.role !== "store") {
        console.log('Unauthorized blog access:', {
          userId: req.user?.id,
          role: req.user?.role,
          timestamp: new Date().toISOString()
        });
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      // ブログ記事の取得
      const posts = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.storeId, req.user.id))
        .orderBy(desc(blogPosts.createdAt));

      console.log('Blog posts fetched:', {
        storeId: req.user.id,
        count: posts.length,
        timestamp: new Date().toISOString()
      });

      // BlogPostListResponse型に従ってレスポンスを整形
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
      console.error('Blog posts fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        storeId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        message: "ブログ記事の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ブログ記事の新規作成
  app.post("/api/blog/posts", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみブログを作成できます" });
      }

      console.log('Blog post creation request:', {
        userId: req.user.id,
        title: req.body.title,
        timestamp: new Date().toISOString()
      });

      // バリデーション
      const postData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id
      });

      // ブログ記事の作成
      const [post] = await db
        .insert(blogPosts)
        .values({
          ...postData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log('Blog post created:', {
        postId: post.id,
        storeId: req.user.id,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Blog post creation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(400).json({
        message: error instanceof Error ? error.message : "ブログ記事の作成に失敗しました"
      });
    }
  });

  // ブログ記事の詳細取得
  app.get("/api/blog/posts/:id", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }

      console.log('Blog post fetch request:', {
        postId,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // 記事の取得
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!post) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      // 権限チェック
      if (post.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事へのアクセス権限がありません" });
      }

      res.json(post);
    } catch (error) {
      console.error('Blog post fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        postId: req.params.id,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "ブログ記事の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ブログ記事の更新
  app.put("/api/blog/posts/:id", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }

      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみブログを更新できます" });
      }

      // 既存の記事を確認
      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      // 権限チェック
      if (existingPost.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事の更新権限がありません" });
      }

      // バリデーション
      const updateData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id
      });

      // 記事の更新
      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(blogPosts.id, postId))
        .returning();

      console.log('Blog post updated:', {
        postId,
        storeId: req.user.id,
        timestamp: new Date().toISOString()
      });

      res.json(updatedPost);
    } catch (error) {
      console.error('Blog post update error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        postId: req.params.id,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(400).json({
        message: error instanceof Error ? error.message : "ブログ記事の更新に失敗しました"
      });
    }
  });

  // ブログ記事の公開状態更新
  app.patch("/api/blog/posts/:id/status", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }

      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみステータスを更新できます" });
      }

      const { status, scheduledAt } = req.body;

      // 既存の記事を確認
      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      // 権限チェック
      if (existingPost.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事の更新権限がありません" });
      }

      // ステータス更新
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

      console.log('Blog post status updated:', {
        postId,
        status,
        scheduledAt,
        timestamp: new Date().toISOString()
      });

      res.json(updatedPost);
    } catch (error) {
      console.error('Blog post status update error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        postId: req.params.id,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(400).json({
        message: error instanceof Error ? error.message : "ステータスの更新に失敗しました"
      });
    }
  });

  // アクセス統計を取得するエンドポイント
  app.get("/api/stores/stats/detail", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

      const stats = await getStoreStats(req.user.id, startDate, today);

      // 過去7日間のデータを日付順に整形
      const dailyBreakdown = stats.map(stat => ({
        date: stat.date,
        totalVisits: stat.totalVisits,
        uniqueVisitors: stat.uniqueVisitors
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // 最新（今日）のデータ
      const latestStats = stats[0] || {
        totalVisits: 0,
        uniqueVisitors: 0,
        hourlyStats: {}
      };

      res.json({
        totalVisits: latestStats.totalVisits,
        uniqueVisitors: latestStats.uniqueVisitors,
        dailyBreakdown
      });
    } catch (error) {
      console.error('Access stats detail fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "アクセス統計の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });



  // 画像アップロードエンドポイント
  app.post("/api/blog/upload-image", authenticate, upload.single("image"), async (req: any, res) => {
    try {
      console.log('Image upload request received:', {
        userId: req.user?.id,
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : 'No file received',
        timestamp: new Date().toISOString()
      });

      // 認証チェック
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみアップロード可能です" });
      }

      // ファイルチェック
      if (!req.file) {
        return res.status(400).json({ message: "画像ファイルを選択してください" });
      }

      // 現在の画像数を取得
      const posts = await db
        .select({
          images: blogPosts.images
        })
        .from(blogPosts)
        .where(eq(blogPosts.storeId, req.user.id));

      const currentImagesCount = posts.reduce((total, post) => {
        return total + (post.images?.length || 0);
      }, 0);

      console.log('Current images count:', {
        userId: req.user.id,
        count: currentImagesCount
      });

      // バリデーション
      const validation = validateImageUpload(req.file, currentImagesCount);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }

      try {
        // S3にアップロード
        const uploadResult = await uploadToS3(req.file.buffer, {
          contentType: req.file.mimetype,
          extension: req.file.originalname.split(".").pop() || "",
          prefix: `blog/${req.user.id}/`
        });

        // DBに画像情報を保存
        const [storeImage] = await db
          .insert(storeImages)
          .values({
            storeId: req.user.id,
            url: uploadResult.url,
            key: uploadResult.key,
          })
          .returning();

        // 署名付きURLを生成
        const signedUrl = await getSignedS3Url(uploadResult.key);

        console.log('Image upload successful:', {
          userId: req.user.id,
          imageId: storeImage.id,
          key: uploadResult.key,
          url: signedUrl
        });

        res.json({
          url: signedUrl,
          key: uploadResult.key
        });
      } catch (uploadError) {
        console.error('S3 upload error:', {
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
          userId: req.user.id,
          file: req.file.originalname
        });
        throw uploadError;
      }
    } catch (error) {
      console.error('Image upload error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "画像のアップロードに失敗しました",
        error: process.env.NODE_ENV === "development" ? error : undefined
      });
    }
  });

  // 店舗のアクセス統計を取得するエンドポイント
  app.get("/api/stores/:storeId/stats", authenticate, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);

      if (isNaN(storeId)) {
        return res.status(400).json({ message: "無効な店舗IDです" });
      }

      // 認証チェック
      if (!req.user || (req.user.role === 'store' && req.user.id !== storeId)) {
        return res.status(403).json({ message: "アクセス権限がありません" });
      }

      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7); // 過去7日分のデータ

      const stats = await getStoreStats(storeId, startDate, today);

      if (!stats.length) {
        // 統計データがない場合は新規作成
        const todayStats = await generateDailyStats(today, storeId);
        await saveDailyStats(todayStats);
        return res.json(todayStats);
      }

      return res.json(stats[0]); // 最新の統計データを返す
    } catch (error) {
      console.error('Access stats fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "アクセス統計の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ブログ記事一覧の取得
  app.get("/api/blog/posts", authenticate, async (req: any, res) => {
    try {
      console.log('Blog posts fetch request received:', {
        userId: req.user?.id,
        userRole: req.user?.role,
        timestamp: new Date().toISOString()
      });

      // 店舗ユーザーの認証チェック
      if (!req.user?.id || req.user.role !== "store") {
        console.log('Unauthorized blog access:', {
          userId: req.user?.id,
          role: req.user?.role,
          timestamp: new Date().toISOString()
        });
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      // ブログ記事の取得
      const posts = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.storeId, req.user.id))
        .orderBy(desc(blogPosts.createdAt));

      console.log('Blog posts fetched:', {
        storeId: req.user.id,
        count: posts.length,
        timestamp: new Date().toISOString()
      });

      // BlogPostListResponse型に従ってレスポンスを整形
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
      console.error('Blog posts fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        storeId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        message: "ブログ記事の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ブログ記事の新規作成
  app.post("/api/blog/posts", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみブログを作成できます" });
      }

      console.log('Blog post creation request:', {
        userId: req.user.id,
        title: req.body.title,
        timestamp: new Date().toISOString()
      });

      // バリデーション
      const postData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id
      });

      // ブログ記事の作成
      const [post] = await db
        .insert(blogPosts)
        .values({
          ...postData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log('Blog post created:', {
        postId: post.id,
        storeId: req.user.id,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Blog post creation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(400).json({
        message: error instanceof Error ? error.message : "ブログ記事の作成に失敗しました"
      });
    }
  });

  // ブログ記事の詳細取得
  app.get("/api/blog/posts/:id", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }

      console.log('Blog post fetch request:', {
        postId,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // 記事の取得
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!post) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      // 権限チェック
      if (post.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事へのアクセス権限がありません" });
      }

      res.json(post);
    } catch (error) {
      console.error('Blog post fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        postId: req.params.id,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "ブログ記事の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // ブログ記事の更新
  app.put("/api/blog/posts/:id", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }

      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみブログを更新できます" });
      }

      // 既存の記事を確認
      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      // 権限チェック
      if (existingPost.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事の更新権限がありません" });
      }

      // バリデーション
      const updateData = blogPostSchema.parse({
        ...req.body,
        storeId: req.user.id
      });

      // 記事の更新
      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(blogPosts.id, postId))
        .returning();

      console.log('Blog post updated:', {
        postId,
        storeId: req.user.id,
        timestamp: new Date().toISOString()
      });

      res.json(updatedPost);
    } catch (error) {
      console.error('Blog post update error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        postId: req.params.id,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(400).json({
        message: error instanceof Error ? error.message : "ブログ記事の更新に失敗しました"
      });
    }
  });

  // ブログ記事の公開状態更新
  app.patch("/api/blog/posts/:id/status", authenticate, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "無効な記事IDです" });
      }

      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみステータスを更新できます" });
      }

      const { status, scheduledAt } = req.body;

      // 既存の記事を確認
      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }

      // 権限チェック
      if (existingPost.storeId !== req.user.id) {
        return res.status(403).json({ message: "この記事の更新権限がありません" });
      }

      // ステータス更新
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

      console.log('Blog post status updated:', {
        postId,
        status,
        scheduledAt,
        timestamp: new Date().toISOString()
      });

      res.json(updatedPost);
    } catch (error) {
      console.error('Blog post status update error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        postId: req.params.id,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(400).json({
        message: error instanceof Error ? error.message : "ステータスの更新に失敗しました"
      });
    }
  });

  // アクセス統計を取得するエンドポイント
  app.get("/api/stores/stats/detail", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

      const stats = await getStoreStats(req.user.id, startDate, today);

      // 過去7日間のデータを日付順に整形
      const dailyBreakdown = stats.map(stat => ({
        date: stat.date,
        totalVisits: stat.totalVisits,
        uniqueVisitors: stat.uniqueVisitors
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // 最新（今日）のデータ
      const latestStats = stats[0] || {
        totalVisits: 0,
        uniqueVisitors: 0,
        hourlyStats: {}
      };

      res.json({
        totalVisits: latestStats.totalVisits,
        uniqueVisitors: latestStats.uniqueVisitors,
        dailyBreakdown
      });
    } catch (error) {
      console.error('Access stats detail fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "アクセス統計の取得に失敗しました",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // アップロード済み画像を取得するエンドポイント
  app.get("/api/store/images", authenticate, async (req: any, res) => {
    try {
      if (!req.user?.id || req.user.role !== "store") {
        return res.status(403).json({ message: "店舗アカウントのみアクセス可能です" });
      }

      // 店舗の画像一覧を取得
      const images = await db
        .select({
          id: storeImages.id,
          url: storeImages.url,
          key: storeImages.key,
          createdAt: storeImages.createdAt,
        })
        .from(storeImages)
        .where(eq(storeImages.storeId, req.user.id))
        .orderBy(desc(storeImages.createdAt));

      console.log('Store images fetch successful:', {
        userId: req.user.id,
        count: images.length,
        timestamp: new Date().toISOString()
      });

      res.json(images);
    } catch (error) {
      console.error('Store images fetch error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "画像一覧の取得に失敗しました",
        error: process.env.NODE_ENV === "development" ? error : undefined
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

async function saveDailyStats(stats: any) {
  // データベースへの保存処理を実装する必要があります。
  // 例：Prisma, Drizzle-ORM などを使用します。
  try {
    console.log('Saving daily stats:', stats);
    // ここにデータベースへの保存ロジックを記述します。
    // 例： await prisma.dailyStats.create({ data: stats });
  } catch (error) {
    console.error('Error saving daily stats:', error);
    throw new Error('統計データの保存に失敗しました。');
  }

}

const photoChunksStore = new Map();