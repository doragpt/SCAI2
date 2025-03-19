import { Router } from 'express';
import { db } from '../db';
import { jobs, jobSchema } from '@shared/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { log } from '../utils/logger';
import { sql } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

const router = Router();

// パブリック求人一覧取得（ページネーション対応）
router.get("/public", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    log('info', 'パブリック求人一覧の取得を開始', {
      path: req.path,
      method: req.method,
      query: { page, limit },
      timestamp: new Date().toISOString()
    });

    // 総件数を取得
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'published'),
          isNotNull(jobs.businessName),
          isNotNull(jobs.location)
        )
      );

    // データを取得
    const jobListings = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'published'),
          isNotNull(jobs.businessName),
          isNotNull(jobs.location)
        )
      )
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json({
      jobs: jobListings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count
      }
    });
  } catch (error) {
    log('error', 'パブリック求人一覧取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'InternalServerError',
      message: "求人情報の取得に失敗しました",
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
});

// 基本の求人一覧取得エンドポイント
router.get("/", async (_req, res) => {
  try {
    log('info', '求人一覧の取得を開始', {
      path: _req.path,
      method: _req.method,
      timestamp: new Date().toISOString()
    });

    const jobListings = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'published'),
          isNotNull(jobs.businessName),
          isNotNull(jobs.location)
        )
      )
      .orderBy(desc(jobs.createdAt));

    return res.json({
      jobs: jobListings,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: jobListings.length
      }
    });
  } catch (error) {
    log('error', '求人一覧取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'InternalServerError',
      message: "求人情報の取得に失敗しました",
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
});

// 求人作成エンドポイント
router.post("/", authenticate, async (req: any, res) => {
  try {
    log('info', '求人作成を開始', {
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });

    const validatedData = jobSchema.parse({
      ...req.body,
      status: "draft",
    });

    const [newJob] = await db
      .insert(jobs)
      .values(validatedData)
      .returning();

    log('info', '求人作成成功', {
      userId: req.user.id,
      jobId: newJob.id,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json(newJob);
  } catch (error) {
    log('error', '求人作成エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'ValidationError',
        message: '入力内容に誤りがあります',
        details: error.message
      });
    }

    return res.status(500).json({
      error: 'InternalServerError',
      message: "求人情報の作成に失敗しました",
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
});

// 求人更新エンドポイント
router.patch("/:id", authenticate, async (req: any, res) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ message: "無効な求人IDです" });
    }

    log('info', '求人更新を開始', {
      userId: req.user.id,
      jobId,
      timestamp: new Date().toISOString()
    });

    const validatedData = jobSchema.parse({
      ...req.body
    });

    const [updatedJob] = await db
      .update(jobs)
      .set(validatedData)
      .where(eq(jobs.id, jobId))
      .returning();

    if (!updatedJob) {
      return res.status(404).json({ message: "求人が見つかりません" });
    }

    log('info', '求人更新成功', {
      userId: req.user.id,
      jobId,
      timestamp: new Date().toISOString()
    });

    return res.json(updatedJob);
  } catch (error) {
    log('error', '求人更新エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      jobId: req.params.id,
      timestamp: new Date().toISOString()
    });

    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'ValidationError',
        message: '入力内容に誤りがあります',
        details: error.message
      });
    }

    return res.status(500).json({
      error: 'InternalServerError',
      message: "求人情報の更新に失敗しました",
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
});

export default router;