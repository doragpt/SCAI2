import { Router } from 'express';
import { db } from '../db';
import { store_profiles, storeProfileSchema, applications } from '@shared/schema';
import { eq, and, gte, sql, count } from 'drizzle-orm';
import { log } from '../utils/logger';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// 店舗プロフィール取得
router.get("/profile", authenticate, authorize("store"), async (req: any, res) => {
  try {
    log('info', '店舗プロフィール取得開始', {
      userId: req.user.id,
      displayName: req.user.display_name
    });

    // 全てのフィールドを取得するようにSELECT *を使用
    const [profile] = await db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.user_id, req.user.id));

    if (!profile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }

    log('info', '店舗プロフィール取得成功', {
      userId: req.user.id,
      profileId: profile.id
    });

    return res.json(profile);
  } catch (error) {
    log('error', '店舗プロフィール取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    return res.status(500).json({ message: "店舗プロフィールの取得に失敗しました" });
  }
});

// 店舗プロフィール更新
router.patch("/profile", authenticate, authorize("store"), async (req: any, res) => {
  try {
    log('info', '店舗プロフィール更新開始', {
      userId: req.user.id,
      displayName: req.user.display_name,
      requestBody: req.body
    });

    // 認証済みユーザー情報の確認
    if (!req.user.display_name || !req.user.location || !req.user.service_type) {
      log('error', '店舗情報が不足しています', {
        userId: req.user.id,
        displayName: req.user.display_name,
        location: req.user.location,
        serviceType: req.user.service_type,
      });
      return res.status(400).json({
        message: "店舗情報が正しく設定されていません。管理者にお問い合わせください。"
      });
    }

    const [existingProfile] = await db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.user_id, req.user.id));

    if (!existingProfile) {
      // プロフィールが存在しない場合は新規作成
      log('info', '店舗プロフィール新規作成', {
        userId: req.user.id,
        displayName: req.user.display_name
      });

      const insertData = {
        user_id: req.user.id,
        business_name: req.user.display_name,
        location: req.user.location,
        service_type: req.user.service_type,
        catch_phrase: req.body.catch_phrase,
        description: req.body.description,
        benefits: req.body.benefits || [],
        minimum_guarantee: Number(req.body.minimum_guarantee) || 0,
        maximum_guarantee: Number(req.body.maximum_guarantee) || 0,
        working_time_hours: Number(req.body.working_time_hours) || 0,
        average_hourly_pay: Number(req.body.average_hourly_pay) || 0,
        status: req.body.status || "draft",
        top_image: req.body.top_image || "",
        created_at: new Date(),
        updated_at: new Date()
      };

      log('info', '新規作成データ', { insertData });

      // バリデーション（新規作成用）
      const validatedData = storeProfileSchema.parse({
        catch_phrase: insertData.catch_phrase,
        description: insertData.description, 
        benefits: insertData.benefits,
        minimum_guarantee: insertData.minimum_guarantee,
        maximum_guarantee: insertData.maximum_guarantee,
        working_time_hours: insertData.working_time_hours,
        average_hourly_pay: insertData.average_hourly_pay,
        status: insertData.status,
        top_image: insertData.top_image
      });

      // 必須フィールドとvalidatedDataを結合
      const fullData = {
        ...validatedData,
        user_id: insertData.user_id,
        business_name: insertData.business_name,
        location: insertData.location,
        service_type: insertData.service_type,
        created_at: insertData.created_at,
        updated_at: insertData.updated_at
      };

      // insert処理を実行（型エラーを解消するため直接SQL実行に変更）
      const result = await db.execute(
        sql`INSERT INTO store_profiles 
            (user_id, business_name, location, service_type, catch_phrase, description, 
             benefits, minimum_guarantee, maximum_guarantee, working_time_hours, average_hourly_pay, 
             status, top_image, created_at, updated_at)
            VALUES 
            (${fullData.user_id}, ${fullData.business_name}, ${fullData.location}, ${fullData.service_type}, 
             ${fullData.catch_phrase}, ${fullData.description}, ${JSON.stringify(fullData.benefits)}, 
             ${fullData.minimum_guarantee}, ${fullData.maximum_guarantee}, 
             ${fullData.working_time_hours}, ${fullData.average_hourly_pay}, 
             ${fullData.status}, ${fullData.top_image}, ${fullData.created_at}, ${fullData.updated_at})
            RETURNING *`
      );
      
      const newProfile = result.rows[0];

      log('info', '店舗プロフィール作成成功', {
        userId: req.user.id,
        profileId: newProfile.id
      });

      return res.status(201).json(newProfile);
    }

    // 既存プロフィールの更新
    const updateData = {
      catch_phrase: req.body.catch_phrase,
      description: req.body.description,
      benefits: req.body.benefits || existingProfile.benefits,
      minimum_guarantee: Number(req.body.minimum_guarantee) || existingProfile.minimum_guarantee,
      maximum_guarantee: Number(req.body.maximum_guarantee) || existingProfile.maximum_guarantee,
      working_time_hours: Number(req.body.working_time_hours) || existingProfile.working_time_hours || 0,
      average_hourly_pay: Number(req.body.average_hourly_pay) || existingProfile.average_hourly_pay || 0,
      status: req.body.status || existingProfile.status,
      top_image: req.body.top_image || existingProfile.top_image,
      
      // 追加フィールド
      recruiter_name: req.body.recruiter_name,
      phone_numbers: req.body.phone_numbers || [],
      email_addresses: req.body.email_addresses || [],
      address: req.body.address || existingProfile.address || "",
      
      // SNS情報
      sns_id: req.body.sns_id || existingProfile.sns_id || "",
      sns_url: req.body.sns_url || existingProfile.sns_url || "",
      sns_text: req.body.sns_text || existingProfile.sns_text || "",
      
      // ウェブサイト情報
      pc_website_url: req.body.pc_website_url || existingProfile.pc_website_url || "",
      mobile_website_url: req.body.mobile_website_url || existingProfile.mobile_website_url || "",
      
      // 応募要件
      application_requirements: req.body.application_requirements || existingProfile.application_requirements || "",
      
      // 各種サポート情報
      transportation_support: req.body.transportation_support !== undefined ? req.body.transportation_support : (existingProfile.transportation_support || false),
      housing_support: req.body.housing_support !== undefined ? req.body.housing_support : (existingProfile.housing_support || false),
      
      updated_at: new Date()
    };

    log('info', '更新データ', { updateData });

    // バリデーション（更新用）
    const validatedData = storeProfileSchema.parse({
      catch_phrase: updateData.catch_phrase,
      description: updateData.description,
      benefits: updateData.benefits,
      minimum_guarantee: updateData.minimum_guarantee,
      maximum_guarantee: updateData.maximum_guarantee,
      working_time_hours: updateData.working_time_hours,
      average_hourly_pay: updateData.average_hourly_pay,
      status: updateData.status,
      top_image: updateData.top_image,
      
      // 追加フィールド
      recruiter_name: updateData.recruiter_name,
      phone_numbers: updateData.phone_numbers,
      email_addresses: updateData.email_addresses,
      address: updateData.address,
      
      // SNS情報
      sns_id: updateData.sns_id,
      sns_url: updateData.sns_url,
      sns_text: updateData.sns_text,
      
      // ウェブサイト情報
      pc_website_url: updateData.pc_website_url,
      mobile_website_url: updateData.mobile_website_url,
      
      // 応募要件
      application_requirements: updateData.application_requirements,
      
      // 各種サポート情報
      transportation_support: updateData.transportation_support,
      housing_support: updateData.housing_support
    });

    // 更新用のオブジェクトを作成
    const fullUpdateData = {
      ...validatedData,
      updated_at: updateData.updated_at
    };

    // 更新処理
    const result = await db.execute(
      sql`UPDATE store_profiles
          SET catch_phrase = ${fullUpdateData.catch_phrase},
              description = ${fullUpdateData.description},
              benefits = ${JSON.stringify(fullUpdateData.benefits)},
              minimum_guarantee = ${fullUpdateData.minimum_guarantee},
              maximum_guarantee = ${fullUpdateData.maximum_guarantee},
              working_time_hours = ${fullUpdateData.working_time_hours},
              average_hourly_pay = ${fullUpdateData.average_hourly_pay},
              status = ${fullUpdateData.status},
              top_image = ${fullUpdateData.top_image},

              -- 追加フィールド
              recruiter_name = ${fullUpdateData.recruiter_name},
              phone_numbers = ${JSON.stringify(fullUpdateData.phone_numbers)},
              email_addresses = ${JSON.stringify(fullUpdateData.email_addresses)},
              address = ${fullUpdateData.address},

              -- SNS情報
              sns_id = ${fullUpdateData.sns_id},
              sns_url = ${fullUpdateData.sns_url},
              sns_text = ${fullUpdateData.sns_text},

              -- ウェブサイト情報
              pc_website_url = ${fullUpdateData.pc_website_url},
              mobile_website_url = ${fullUpdateData.mobile_website_url},

              -- 応募要件
              application_requirements = ${fullUpdateData.application_requirements},

              -- 各種サポート情報
              transportation_support = ${fullUpdateData.transportation_support},
              housing_support = ${fullUpdateData.housing_support},
              
              updated_at = ${fullUpdateData.updated_at}
          WHERE user_id = ${req.user.id}
          RETURNING *`
    );
    
    const updatedProfile = result.rows[0];

    log('info', '店舗プロフィール更新成功', {
      userId: req.user.id,
      profileId: updatedProfile.id,
      updatedData: validatedData
    });

    return res.json(updatedProfile);
  } catch (error) {
    log('error', '店舗プロフィール更新エラー', {
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

    return res.status(500).json({ message: "店舗プロフィールの更新に失敗しました" });
  }
});

// 店舗ダッシュボード統計情報取得
router.get("/stats", authenticate, authorize("store"), async (req: any, res) => {
  try {
    log('info', '店舗統計情報取得開始', {
      userId: req.user.id,
      displayName: req.user.display_name
    });

    // 店舗プロフィール情報を取得（全てのフィールドを取得するようにSELECT *を使用）
    const [profile] = await db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.user_id, req.user.id));

    if (!profile) {
      log('warn', '店舗プロフィールがまだ作成されていません', {
        userId: req.user.id
      });
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }

    // 統計情報用計算
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // 応募数を取得
    const [applicationsStats] = await db
      .select({
        total: count(),
        pending: count(
          and(
            eq(applications.status, "pending")
          )
        ),
        accepted: count(
          and(
            eq(applications.status, "accepted")
          )
        ),
        new: count(
          and(
            eq(applications.status, "pending"),
            gte(applications.created_at, today)
          )
        )
      })
      .from(applications)
      .innerJoin(
        store_profiles,
        eq(applications.store_profile_id, store_profiles.id)
      )
      .where(eq(store_profiles.user_id, req.user.id));

    // 統計情報を構築
    const stats = {
      // 掲載情報
      storePlan: profile?.status === "published" ? "premium" : "free",
      storeArea: profile?.location || req.user.location,
      displayRank: profile?.status === "published" ? 1 : 999,

      // アクセス状況（実装が完了するまでモックデータ）
      todayPageViews: Math.floor(Math.random() * 100),
      todayUniqueVisitors: Math.floor(Math.random() * 50),
      monthlyPageViews: Math.floor(Math.random() * 1000),
      monthlyUniqueVisitors: Math.floor(Math.random() * 500),

      // 応募者対応状況
      newInquiriesCount: applicationsStats?.new || 0,
      pendingInquiriesCount: applicationsStats?.pending || 0,
      completedInquiriesCount: applicationsStats?.accepted || 0,
      totalApplicationsCount: applicationsStats?.total || 0
    };

    log('info', '店舗統計情報取得成功', {
      userId: req.user.id,
      statsData: stats
    });

    return res.json(stats);
  } catch (error) {
    log('error', '店舗統計情報取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    return res.status(500).json({ message: "統計情報の取得に失敗しました" });
  }
});

export default router;