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
      .select()
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
    log('info', '求人作成を開始', {
      userId: req.user.id,
      role: req.user.role,
      requestBody: req.body
    });

    // バリデーション前にデフォルト値を設定
    const dataToValidate = {
      ...req.body,
      businessName: req.user.displayName,
      status: "draft"
    };

    log('info', 'バリデーション前のデータ', dataToValidate);

    // バリデーション
    const validatedData = jobSchema.parse(dataToValidate);

    log('info', 'バリデーション後のデータ', validatedData);

    // 必須フィールドの存在確認
    if (!validatedData.catchPhrase || !validatedData.description) {
      log('warn', '必須フィールド不足', {
        catchPhrase: !!validatedData.catchPhrase,
        description: !!validatedData.description
      });
      return res.status(400).json({
        message: "必須フィールドが不足しています",
        details: "キャッチコピー、詳細説明は必須です"
      });
    }

    try {
      // DB挿入前のデータログ
      log('info', 'DB挿入前のデータ', {
        ...validatedData,
        userId: req.user.id
      });

      // DB挿入
      const [newJob] = await db
        .insert(jobs)
        .values({
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      log('info', '求人作成成功', {
        userId: req.user.id,
        jobId: newJob.id,
        newJob
      });

      return res.status(201).json(newJob);
    } catch (dbError) {
      log('error', 'DB挿入エラー', {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        validatedData,
        sql: db.insert(jobs).values(validatedData).toSQL()
      });
      throw new Error('DB挿入に失敗しました');
    }

  } catch (error) {
    log('error', '求人作成エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      requestBody: req.body
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