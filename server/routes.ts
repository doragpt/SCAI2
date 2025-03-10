import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import authRoutes from './routes/auth';
import jobsRoutes from './routes/jobs';
import applicationsRoutes from './routes/applications';
import blogRoutes from './routes/blog';
import { log } from './utils/logger';
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { users, talentProfiles, blogPosts, type BlogPost, type BlogPostListResponse, blogPostSchema } from "@shared/schema";
import multer from "multer";

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
  const server = createServer(app);

  // APIリクエストの共通ミドルウェア
  app.use("/api/*", (req, res, next) => {
    log('info', 'APIリクエスト受信', {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined
    });
    res.setHeader("Content-Type", "application/json");
    next();
  });

  // 各ルーターを登録
  app.use('/api/auth', authRoutes);
  app.use('/api/jobs', jobsRoutes);
  app.use('/api/applications', applicationsRoutes);
  app.use('/api/blog', blogRoutes);

  // APIエラーハンドリング
  app.use("/api/*", (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    log('error', 'APIエラー', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    res.status(500).json({
      message: process.env.NODE_ENV === 'development' ? err.message : '内部サーバーエラー'
    });
  });

  return server;
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
  // 古いブログ記事を削除するロジックを実装します。
  // 例: 3ヶ月以上前の記事を削除
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const oldPosts = await db.select().from(blogPosts).where(
    eq(blogPosts.createdAt, "<", threeMonthsAgo)
  );

  if (oldPosts.length === 0) return undefined;

  await db.delete(blogPosts).where(
    eq(blogPosts.createdAt, "<", threeMonthsAgo)
  );
  return oldPosts;
}

const photoChunksStore = new Map();