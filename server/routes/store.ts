import { Router } from 'express';
import { db, pool } from '../db';
import { 
  store_profiles, 
  storeProfileSchema, 
  applications, 
  allBenefitTypes, 
  BenefitType
} from '@shared/schema';
import { eq, and, gte, sql, count, desc } from 'drizzle-orm';
import { log } from '../utils/logger';
import { authenticate, authorize } from '../middleware/auth';

// 配列フィールドを安全に処理するヘルパー関数
function validateArrayField(field: any): string[] {
  if (Array.isArray(field)) {
    return field.filter((item): item is string => typeof item === 'string');
  }
  return [];
}
function validateBenefits(benefits: any): BenefitType[] {
  if (Array.isArray(benefits)) {
    // 有効なbenefit項目のみをフィルタリング
    return benefits.filter((benefit): benefit is BenefitType => 
      typeof benefit === 'string' && allBenefitTypes.includes(benefit as any)
    );
  }
  return [];
}

const router = Router();

// ルータレベルのミドルウェアでリクエストをログ出力
router.use((req, res, next) => {
  console.log(`[STORE ROUTER] ${req.method} ${req.path} が呼び出されました`);
  console.log(`[STORE ROUTER] 認証情報: User=${req.user?.id}, Role=${req.user?.role}`);
  console.log(`[STORE ROUTER] リクエストボディのキー: ${Object.keys(req.body || {}).join(', ')}`);
  next();
});

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

    // requirementsフィールドが存在するか確認し、空のオブジェクトでないことを確認
    if (!profile.requirements || typeof profile.requirements !== 'object') {
      profile.requirements = {
        accepts_temporary_workers: false,
        requires_arrival_day_before: false,
        other_conditions: [],
        cup_size_conditions: [],
        prioritize_titles: false
      };
    }

    // cup_size_conditionsフィールドが存在するか確認
    if (!profile.requirements.cup_size_conditions) {
      profile.requirements.cup_size_conditions = [];
    }
    
    // 必須フィールドが存在するか確認
    if (profile.requirements.accepts_temporary_workers === undefined) {
      profile.requirements.accepts_temporary_workers = false;
    }
    
    if (profile.requirements.requires_arrival_day_before === undefined) {
      profile.requirements.requires_arrival_day_before = false;
    }
    
    if (!profile.requirements.other_conditions) {
      profile.requirements.other_conditions = [];
    }

    log('info', '店舗プロフィール取得成功', {
      userId: req.user.id,
      profileId: profile.id,
      requirementsData: profile.requirements
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
    console.log("PATCH /profile エンドポイントが呼び出されました");
    log('info', '店舗プロフィール更新開始 - 詳細ログ', {
      userId: req.user?.id,
      displayName: req.user?.display_name,
      requestHeaders: req.headers,
      requestPath: req.path,
      requestMethod: req.method,
      bodyKeys: Object.keys(req.body || {}),
      isAuthenticated: !!req.user,
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
        special_offers: req.body.special_offers || [],
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
        top_image: insertData.top_image,
        special_offers: insertData.special_offers
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

      // Drizzleを使用して直接挿入
      const [newProfile] = await db
        .insert(store_profiles)
        .values({
          user_id: fullData.user_id,
          business_name: fullData.business_name,
          location: fullData.location,
          service_type: fullData.service_type,
          catch_phrase: fullData.catch_phrase,
          description: fullData.description,
          benefits: validateBenefits(fullData.benefits),
          minimum_guarantee: fullData.minimum_guarantee,
          maximum_guarantee: fullData.maximum_guarantee,
          working_time_hours: fullData.working_time_hours,
          average_hourly_pay: fullData.average_hourly_pay,
          status: fullData.status,
          top_image: fullData.top_image,
          special_offers: fullData.special_offers || [],
          created_at: fullData.created_at,
          updated_at: fullData.updated_at
        })
        .returning();

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
      
      // 勤務時間と応募条件
      working_hours: req.body.working_hours || existingProfile.working_hours || "",
      requirements: typeof req.body.requirements === 'object' 
        ? {
            ...req.body.requirements,
            // cup_size_conditionsが配列であることを保証
            cup_size_conditions: Array.isArray(req.body.requirements.cup_size_conditions) 
              ? req.body.requirements.cup_size_conditions 
              : []
          }
        : existingProfile.requirements || {
            accepts_temporary_workers: false,
            requires_arrival_day_before: false,
            other_conditions: [],
            cup_size_conditions: []
          },
      
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
      
      // アクセス情報とセキュリティ対策
      access_info: req.body.access_info || existingProfile.access_info || "",
      security_measures: req.body.security_measures || existingProfile.security_measures || "",
      
      // 各種サポート情報
      transportation_support: req.body.transportation_support !== undefined ? req.body.transportation_support : (existingProfile.transportation_support || false),
      housing_support: req.body.housing_support !== undefined ? req.body.housing_support : (existingProfile.housing_support || false),
      
      // カスタム特典
      special_offers: req.body.special_offers || existingProfile.special_offers || [],
      
      // ギャラリー写真（重要：ここが抜けていたため写真が保存されなかった）
      gallery_photos: req.body.gallery_photos || existingProfile.gallery_photos || [],
      
      updated_at: new Date()
    };

    log('info', '更新データ', { 
      updateData,
      requirementsType: typeof updateData.requirements,
      requirementsValue: updateData.requirements,
      hasCupSizeConditions: updateData.requirements && typeof updateData.requirements === 'object' && 'cup_size_conditions' in updateData.requirements,
      cupSizeConditions: updateData.requirements && typeof updateData.requirements === 'object' && 'cup_size_conditions' in updateData.requirements ? updateData.requirements.cup_size_conditions : 'none'
    });

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
      
      // 勤務時間と応募条件
      working_hours: updateData.working_hours,
      requirements: updateData.requirements,
      
      // 追加フィールド
      recruiter_name: updateData.recruiter_name,
      phone_numbers: updateData.phone_numbers || [],
      email_addresses: updateData.email_addresses || [],
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
      
      // アクセス情報とセキュリティ対策
      access_info: updateData.access_info,
      security_measures: updateData.security_measures,
      
      // 各種サポート情報
      transportation_support: updateData.transportation_support,
      housing_support: updateData.housing_support,
      
      // カスタム特典
      special_offers: updateData.special_offers,
      
      // ギャラリー写真
      gallery_photos: updateData.gallery_photos
    });

    // 更新用のオブジェクトを作成
    const fullUpdateData = {
      ...validatedData,
      updated_at: updateData.updated_at
    };

    log('info', 'SQLクエリ実行準備中', {
      userId: req.user.id,
      profileId: existingProfile.id
    });
    
    // DrizzleのupdateOne操作を使用
    const [updatedProfile] = await db
      .update(store_profiles)
      .set({
        catch_phrase: fullUpdateData.catch_phrase,
        description: fullUpdateData.description,
        benefits: validateBenefits(fullUpdateData.benefits),
        minimum_guarantee: fullUpdateData.minimum_guarantee,
        maximum_guarantee: fullUpdateData.maximum_guarantee,
        working_time_hours: fullUpdateData.working_time_hours,
        average_hourly_pay: fullUpdateData.average_hourly_pay,
        status: fullUpdateData.status,
        top_image: fullUpdateData.top_image,
        working_hours: fullUpdateData.working_hours,
        requirements: typeof fullUpdateData.requirements === 'object' 
          ? {
              ...fullUpdateData.requirements,
              // cup_size_conditionsが配列であることを保証
              cup_size_conditions: Array.isArray(fullUpdateData.requirements.cup_size_conditions) 
                ? fullUpdateData.requirements.cup_size_conditions 
                : []
            }
          : existingProfile.requirements || {},
        recruiter_name: fullUpdateData.recruiter_name,
        phone_numbers: validateArrayField(fullUpdateData.phone_numbers),
        email_addresses: validateArrayField(fullUpdateData.email_addresses),
        address: fullUpdateData.address,
        sns_id: fullUpdateData.sns_id,
        sns_url: fullUpdateData.sns_url,
        sns_text: fullUpdateData.sns_text,
        pc_website_url: fullUpdateData.pc_website_url,
        mobile_website_url: fullUpdateData.mobile_website_url,
        application_requirements: fullUpdateData.application_requirements,
        access_info: fullUpdateData.access_info,
        security_measures: fullUpdateData.security_measures,
        transportation_support: fullUpdateData.transportation_support,
        housing_support: fullUpdateData.housing_support,
        special_offers: fullUpdateData.special_offers || [],
        gallery_photos: fullUpdateData.gallery_photos || [],
        updated_at: fullUpdateData.updated_at
      })
      .where(eq(store_profiles.user_id, req.user.id))
      .returning();
    
    log('info', '店舗プロフィール更新成功', {
      userId: req.user.id,
      profileId: updatedProfile.id,
      updatedData: validatedData
    });

    return res.json(updatedProfile);

  } catch (error) {
    console.error('詳細エラー情報:', error);
    
    if (error instanceof Error) {
      log('error', '店舗プロフィール更新エラー - 詳細', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        userId: req.user?.id,
        requestBody: JSON.stringify(req.body)
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: '入力内容に誤りがあります',
          details: error.message
        });
      }
      
      if (error.message.includes('relation') || error.message.includes('column') || error.message.includes('syntax')) {
        // SQL関連のエラー
        return res.status(500).json({ 
          message: "データベースエラーが発生しました", 
          sqlError: error.message 
        });
      }
    }

    // 詳細なエラー情報をログに記録
    console.error('店舗プロフィール更新時のエラー詳細:', {
      error,
      userId: req.user?.id,
      body: req.body
    });

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

// 体験入店情報取得
router.get("/trial-entry", authenticate, authorize("store"), async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // 店舗プロフィールIDの取得
    const [storeProfile] = await db
      .select({ id: store_profiles.id })
      .from(store_profiles)
      .where(eq(store_profiles.user_id, userId));
      
    if (!storeProfile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }
    
    // 体験入店情報の取得
    const [trialEntry] = await db
      .select()
      .from(trialEntries)
      .where(eq(trialEntries.store_profile_id, storeProfile.id));
      
    if (!trialEntry) {
      return res.status(404).json({ message: "体験入店情報が見つかりません" });
    }
    
    return res.json(trialEntry);
  } catch (error) {
    console.error('体験入店情報取得エラー:', error);
    return res.status(500).json({ message: "体験入店情報の取得に失敗しました" });
  }
});

// 体験入店情報作成・更新
router.post("/trial-entry", authenticate, authorize("store"), async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // 店舗プロフィールIDの取得
    const [storeProfile] = await db
      .select({ id: store_profiles.id })
      .from(store_profiles)
      .where(eq(store_profiles.user_id, userId));
      
    if (!storeProfile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }
    
    // リクエストデータの検証
    const validatedData = trialEntrySchema.parse({
      ...req.body,
      storeProfileId: storeProfile.id
    });
    
    // 既存のエントリーを確認
    const [existingEntry] = await db
      .select({ id: trialEntries.id })
      .from(trialEntries)
      .where(eq(trialEntries.store_profile_id, storeProfile.id));
      
    if (existingEntry) {
      // 更新
      const [updatedEntry] = await db
        .update(trialEntries)
        .set({
          daily_guarantee: validatedData.dailyGuarantee,
          hourly_rate: validatedData.hourlyRate,
          working_hours: validatedData.workingHours,
          benefits_description: validatedData.benefitsDescription,
          requirements: validatedData.requirements,
          qa_items: validatedData.qaItems || [],
          examples: validatedData.examples || [],
          required_documents: validatedData.requiredDocuments || [],
          start_date: validatedData.startDate ? new Date(validatedData.startDate) : null,
          end_date: validatedData.endDate ? new Date(validatedData.endDate) : null,
          is_active: validatedData.isActive,
          updated_at: new Date()
        })
        .where(eq(trialEntries.id, existingEntry.id))
        .returning();
        
      return res.json(updatedEntry);
    } else {
      // 新規作成
      const [newEntry] = await db
        .insert(trialEntries)
        .values({
          store_profile_id: storeProfile.id,
          daily_guarantee: validatedData.dailyGuarantee,
          hourly_rate: validatedData.hourlyRate,
          working_hours: validatedData.workingHours,
          benefits_description: validatedData.benefitsDescription,
          requirements: validatedData.requirements,
          qa_items: validatedData.qaItems || [],
          examples: validatedData.examples || [],
          required_documents: validatedData.requiredDocuments || [],
          start_date: validatedData.startDate ? new Date(validatedData.startDate) : null,
          end_date: validatedData.endDate ? new Date(validatedData.endDate) : null,
          is_active: validatedData.isActive,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
        
      return res.status(201).json(newEntry);
    }
  } catch (error) {
    console.error('体験入店情報保存エラー:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: '入力内容に誤りがあります',
        details: error.message
      });
    }
    
    return res.status(500).json({ message: "体験入店情報の保存に失敗しました" });
  }
});

// キャンペーン一覧取得
router.get("/campaigns", authenticate, authorize("store"), async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // 店舗プロフィールIDの取得
    const [storeProfile] = await db
      .select({ id: store_profiles.id })
      .from(store_profiles)
      .where(eq(store_profiles.user_id, userId));
      
    if (!storeProfile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }
    
    // キャンペーン一覧の取得
    const campaignsList = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.store_profile_id, storeProfile.id))
      .orderBy(desc(campaigns.created_at));
      
    return res.json(campaignsList);
  } catch (error) {
    console.error('キャンペーン一覧取得エラー:', error);
    return res.status(500).json({ message: "キャンペーン一覧の取得に失敗しました" });
  }
});

// キャンペーン詳細取得
router.get("/campaigns/:id", authenticate, authorize("store"), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const campaignId = req.params.id;
    
    // 店舗プロフィールIDの取得
    const [storeProfile] = await db
      .select({ id: store_profiles.id })
      .from(store_profiles)
      .where(eq(store_profiles.user_id, userId));
      
    if (!storeProfile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }
    
    // キャンペーン詳細の取得
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(
        eq(campaigns.id, campaignId),
        eq(campaigns.store_profile_id, storeProfile.id)
      ));
      
    if (!campaign) {
      return res.status(404).json({ message: "キャンペーンが見つかりません" });
    }
    
    return res.json(campaign);
  } catch (error) {
    console.error('キャンペーン詳細取得エラー:', error);
    return res.status(500).json({ message: "キャンペーン詳細の取得に失敗しました" });
  }
});

// キャンペーン作成
router.post("/campaigns", authenticate, authorize("store"), async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // 店舗プロフィールIDの取得
    const [storeProfile] = await db
      .select({ id: store_profiles.id })
      .from(store_profiles)
      .where(eq(store_profiles.user_id, userId));
      
    if (!storeProfile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }
    
    // リクエストデータの検証
    const validatedData = campaignSchema.parse({
      ...req.body,
      storeProfileId: storeProfile.id
    });
    
    // 新規作成
    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        store_profile_id: storeProfile.id,
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        amount: validatedData.amount,
        conditions: validatedData.conditions,
        tagline: validatedData.tagline,
        image_url: validatedData.imageUrl,
        is_limited: validatedData.isLimited,
        target_audience: validatedData.targetAudience || [],
        start_date: validatedData.startDate ? new Date(validatedData.startDate) : null,
        end_date: validatedData.endDate ? new Date(validatedData.endDate) : null,
        is_active: validatedData.isActive,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning();
      
    return res.status(201).json(newCampaign);
  } catch (error) {
    console.error('キャンペーン作成エラー:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: '入力内容に誤りがあります',
        details: error.message
      });
    }
    
    return res.status(500).json({ message: "キャンペーンの作成に失敗しました" });
  }
});

// キャンペーン更新
router.patch("/campaigns/:id", authenticate, authorize("store"), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const campaignId = req.params.id;
    
    // 店舗プロフィールIDの取得
    const [storeProfile] = await db
      .select({ id: store_profiles.id })
      .from(store_profiles)
      .where(eq(store_profiles.user_id, userId));
      
    if (!storeProfile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }
    
    // 既存キャンペーンの存在確認
    const [existingCampaign] = await db
      .select()
      .from(campaigns)
      .where(and(
        eq(campaigns.id, campaignId),
        eq(campaigns.store_profile_id, storeProfile.id)
      ));
      
    if (!existingCampaign) {
      return res.status(404).json({ message: "キャンペーンが見つかりません" });
    }
    
    // リクエストデータの検証
    const validatedData = campaignSchema.parse({
      ...req.body,
      storeProfileId: storeProfile.id
    });
    
    // 更新
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        amount: validatedData.amount,
        conditions: validatedData.conditions,
        tagline: validatedData.tagline,
        image_url: validatedData.imageUrl,
        is_limited: validatedData.isLimited,
        target_audience: validatedData.targetAudience || [],
        start_date: validatedData.startDate ? new Date(validatedData.startDate) : null,
        end_date: validatedData.endDate ? new Date(validatedData.endDate) : null,
        is_active: validatedData.isActive,
        updated_at: new Date()
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
      
    return res.json(updatedCampaign);
  } catch (error) {
    console.error('キャンペーン更新エラー:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: '入力内容に誤りがあります',
        details: error.message
      });
    }
    
    return res.status(500).json({ message: "キャンペーンの更新に失敗しました" });
  }
});

// キャンペーン削除
router.delete("/campaigns/:id", authenticate, authorize("store"), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const campaignId = req.params.id;
    
    // 店舗プロフィールIDの取得
    const [storeProfile] = await db
      .select({ id: store_profiles.id })
      .from(store_profiles)
      .where(eq(store_profiles.user_id, userId));
      
    if (!storeProfile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }
    
    // 既存キャンペーンの存在確認
    const [existingCampaign] = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(and(
        eq(campaigns.id, campaignId),
        eq(campaigns.store_profile_id, storeProfile.id)
      ));
      
    if (!existingCampaign) {
      return res.status(404).json({ message: "キャンペーンが見つかりません" });
    }
    
    // 削除
    await db
      .delete(campaigns)
      .where(eq(campaigns.id, campaignId));
      
    return res.json({ message: "キャンペーンを削除しました" });
  } catch (error) {
    console.error('キャンペーン削除エラー:', error);
    return res.status(500).json({ message: "キャンペーンの削除に失敗しました" });
  }
});

export default router;