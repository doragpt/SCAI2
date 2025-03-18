import { Router } from 'express';
import { db } from '../db';
import { jobs, jobSchema } from '@shared/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { log } from '../utils/logger';
import { sql } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

const router = Router();

// 求人基本情報の保存
router.post("/basic-info", authenticate, async (req: any, res) => {
  try {
    log('info', '求人基本情報の保存リクエスト受信', {
      userId: req.user?.id,
      method: req.method,
      path: req.path,
      body: req.body
    });

    // リクエストデータのバリデーション
    const validatedData = jobSchema.parse(req.body);

    log('debug', 'バリデーション後のデータ', { 
      validatedData,
      validation: {
        hasRequiredFields: {
          businessName: !!validatedData.businessName,
          location: !!validatedData.location,
          serviceType: !!validatedData.serviceType,
          phoneNumber1: !!validatedData.phoneNumber1,
        }
      }
    });

    if (!req.user?.id) {
      throw new Error('ユーザーIDが見つかりません');
    }

    // データの変換（フィールド名の調整）
    const jobData = {
      business_name: validatedData.businessName,
      location: validatedData.location,
      service_type: validatedData.serviceType,
      display_service_type: validatedData.displayServiceType,
      title: validatedData.catch_phrase?.substring(0, 50) || '',
      catch_phrase: validatedData.catch_phrase,
      description: validatedData.description,
      benefits: JSON.stringify(validatedData.selectedBenefits || []),
      minimum_guarantee: validatedData.minimumGuarantee || null,
      maximum_guarantee: validatedData.maximumGuarantee || null,
      transportation_support: validatedData.transportationSupport || false,
      housing_support: validatedData.housingSupport || false,
      phone_number1: validatedData.phoneNumber1,
      phone_number2: validatedData.phoneNumber2 || null,
      phone_number3: validatedData.phoneNumber3 || null,
      phone_number4: validatedData.phoneNumber4 || null,
      contact_email: validatedData.contactEmail || null,
      contact_sns: validatedData.contactSns || null,
      contact_sns_url: validatedData.contactSnsUrl || null,
      store_id: req.user.id,
      status: validatedData.status || 'draft',
      created_at: new Date(),
      updated_at: new Date()
    };

    log('debug', 'DB挿入前のデータ', { 
      jobData,
      requiredFields: {
        business_name: jobData.business_name,
        location: jobData.location,
        service_type: jobData.service_type,
        store_id: jobData.store_id,
        phone_number1: jobData.phone_number1
      }
    });

    try {
      // 新規求人データを作成
      const [job] = await db
        .insert(jobs)
        .values(jobData)
        .returning();

      log('info', '求人基本情報の保存成功', {
        jobId: job.id,
        userId: req.user?.id,
        savedData: job
      });

      res.status(201).json(job);
    } catch (dbError) {
      // データベースエラーの詳細なログ
      log('error', 'データベース保存エラー', {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        errorDetails: JSON.stringify(dbError, null, 2),
        jobData,
        stack: dbError instanceof Error ? dbError.stack : undefined
      });
      throw dbError;
    }
  } catch (error) {
    log('error', '求人基本情報の保存エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      requestBody: req.body,
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      message: error instanceof Error ? error.message : "求人情報の保存に失敗しました"
    });
  }
});

// パブリック求人一覧取得（ページネーション対応）
router.get("/public", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    // 総件数を取得
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'published'),
          isNotNull(jobs.business_name),
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
          isNotNull(jobs.business_name),
          isNotNull(jobs.location)
        )
      )
      .orderBy(desc(jobs.created_at))
      .limit(limit)
      .offset(offset);

    return res.json({
      jobs: jobListings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(Number(count) / limit),
        totalItems: Number(count)
      }
    });
  } catch (error) {
    log('error', 'パブリック求人一覧取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return res.status(500).json({
      message: "求人情報の取得に失敗しました"
    });
  }
});

export default router;