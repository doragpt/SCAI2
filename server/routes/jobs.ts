import { Router } from 'express';
import { db } from '../db';
import { jobs, jobSchema } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { log } from '../utils/logger';
import { authenticate, authorize } from '../middleware/auth';
import { sql } from 'drizzle-orm';

const router = Router();

// パブリック求人一覧取得
router.get("/public", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(jobs)
      .where(eq(jobs.status, 'published'));

    const jobListings = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, 'published'))
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
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(500).json({ message: "求人情報の取得に失敗しました" });
  }
});

// 店舗の求人一覧取得
router.get("/store", authenticate, authorize("store"), async (req: any, res) => {
  try {
    log('info', '店舗求人一覧の取得を開始', {
      userId: req.user.id,
      role: req.user.role
    });

    const jobListings = await db
      .select({
        id: jobs.id,
        businessName: jobs.businessName,
        location: jobs.location,
        serviceType: jobs.serviceType,
        title: jobs.title,
        mainCatch: jobs.mainCatch,
        mainDescription: jobs.mainDescription,
        selectedBenefits: jobs.selectedBenefits,
        minimumGuarantee: jobs.minimumGuarantee,
        maximumGuarantee: jobs.maximumGuarantee,
        status: jobs.status,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt
      })
      .from(jobs)
      .where(eq(jobs.businessName, req.user.displayName))
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
    log('error', '店舗求人一覧取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    return res.status(500).json({ message: "求人情報の取得に失敗しました" });
  }
});

// 求人作成 (店舗ユーザーのみ)
router.post("/", authenticate, authorize("store"), async (req: any, res) => {
  try {
    // 認証済みユーザー情報の詳細なログ出力
    log('info', '求人作成 - 認証済みユーザー情報', {
      userId: req.user.id,
      displayName: req.user.displayName,
      location: req.user.location,
      role: req.user.role,
      isAuthenticated: req.isAuthenticated(),
    });

    const validatedData = jobSchema.parse(req.body);

    if (!req.user.displayName || !req.user.location) {
      log('error', '店舗情報が不足しています', {
        userId: req.user.id,
        displayName: req.user.displayName,
        location: req.user.location,
      });
      return res.status(400).json({
        message: "店舗情報が正しく設定されていません。管理者にお問い合わせください。"
      });
    }

    // 店舗情報を認証済みユーザーから取得
    const [newJob] = await db
      .insert(jobs)
      .values({
        ...validatedData,
        businessName: req.user.displayName, // 認証済みユーザーの店舗名を使用
        location: req.user.location, // 認証済みユーザーの所在地を使用
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    log('info', '求人作成成功', {
      userId: req.user.id,
      jobId: newJob.id,
      businessName: newJob.businessName,
      location: newJob.location,
    });

    return res.status(201).json(newJob);
  } catch (error) {
    log('error', '求人作成エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      requestBody: req.body,
    });

    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        message: '入力内容に誤りがあります',
        details: error.message
      });
    }

    return res.status(500).json({ message: "求人情報の作成に失敗しました" });
  }
});

// 求人更新 (店舗ユーザーのみ)
router.patch("/:id", authenticate, authorize("store"), async (req: any, res) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ message: "無効な求人IDです" });
    }

    // 権限チェック
    const existingJob = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!existingJob.length) {
      return res.status(404).json({ message: "求人が見つかりません" });
    }

    if (existingJob[0].businessName !== req.user.displayName) {
      return res.status(403).json({ message: "この求人を編集する権限がありません" });
    }

    const validatedData = jobSchema.parse({
      ...req.body,
      businessName: req.user.displayName
    });

    const [updatedJob] = await db
      .update(jobs)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, jobId))
      .returning();

    return res.json(updatedJob);
  } catch (error) {
    log('error', '求人更新エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });

    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        message: '入力内容に誤りがあります',
        details: error.message
      });
    }

    return res.status(500).json({ message: "求人情報の更新に失敗しました" });
  }
});

export default router;