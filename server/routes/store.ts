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
import { dataUtils } from '@shared/utils/dataTypeUtils';
import { customJsonb } from '@shared/utils/customTypes';

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

// 特別オファーの配列の整合性を確保するヘルパー関数
function processSpecialOffers(offers: any): any[] {
  // 入力がnullまたはundefinedの場合は空配列を返す
  if (offers === null || offers === undefined) {
    console.log("special_offersがnullまたはundefinedです。空配列を返します。");
    return [];
  }
  
  // JSONB型への変更に伴う修正: 文字列の場合はJSONとしてパースを試みる
  if (typeof offers === 'string') {
    try {
      console.log("特別オファーが文字列として渡されました。JSON解析を試みます。");
      const parsedOffers = JSON.parse(offers);
      if (Array.isArray(parsedOffers)) {
        console.log("文字列からJSONに変換成功。配列として処理します。要素数:", parsedOffers.length);
        offers = parsedOffers;
      } else {
        console.log("special_offersがJSONとしてパースされましたが、配列ではありません。空配列を返します。");
        return [];
      }
    } catch (e) {
      console.error("special_offersが文字列ですが、有効なJSONではありません:", e);
      return [];
    }
  }
  
  // 配列ではない場合は空配列を返す
  if (!Array.isArray(offers)) {
    console.log("special_offersが配列ではありません。空配列を返します。タイプ:", typeof offers);
    return [];
  }
  
  try {
    // 有効な要素を持つ配列に変換（null、undefinedを除去）
    const filteredOffers = offers.filter(offer => offer !== null && offer !== undefined);
    console.log("フィルタリング前後の配列サイズ比較:", {
      before: offers.length,
      after: filteredOffers.length,
    });
    
    // 有効なオファーオブジェクトのみをマッピングして正規化
    const normalizedOffers = filteredOffers
      .filter(offer => typeof offer === 'object')
      .map(offer => {
        // 数値フィールドの適切な処理
        let amount = null;
        if (offer.amount !== undefined) {
          if (typeof offer.amount === 'number') {
            amount = offer.amount;
          } else if (typeof offer.amount === 'string') {
            const trimmedAmount = offer.amount.trim();
            if (trimmedAmount !== '') {
              const parsedAmount = Number(trimmedAmount);
              amount = !isNaN(parsedAmount) ? parsedAmount : null;
            }
          }
        }

        let limitedCount = null;
        if (offer.limitedCount !== undefined) {
          if (typeof offer.limitedCount === 'number') {
            limitedCount = offer.limitedCount;
          } else if (typeof offer.limitedCount === 'string') {
            const trimmedCount = offer.limitedCount.trim();
            if (trimmedCount !== '') {
              const parsedCount = Number(trimmedCount);
              limitedCount = !isNaN(parsedCount) ? parsedCount : null;
            }
          }
        }

        // 文字列フィールドの安全な処理
        const safeString = (value: any, defaultValue: string = "") => {
          if (typeof value === 'string') return value;
          return defaultValue;
        };

        // 必須フィールドの確保 - 各項目にデフォルト値を設定して対応
        const normalizedOffer = {
          id: typeof offer.id === 'string' && offer.id.trim() !== '' ? 
            offer.id : Math.random().toString(36).substring(2, 9),
          title: safeString(offer.title, "特別オファー"),
          description: safeString(offer.description, ""),
          // 重要: typeフィールドは常に"bonus"を使用（必須フィールド）
          type: "bonus",
          backgroundColor: typeof offer.backgroundColor === 'string' && offer.backgroundColor.trim() !== '' ? 
            offer.backgroundColor : "#fff9fa",
          textColor: typeof offer.textColor === 'string' && offer.textColor.trim() !== '' ? 
            offer.textColor : "#333333",
          isActive: typeof offer.isActive === 'boolean' ? offer.isActive : true,
          isLimited: typeof offer.isLimited === 'boolean' ? offer.isLimited : false,
          icon: safeString(offer.icon, "sparkles"),
          order: typeof offer.order === 'number' ? offer.order : 0,
          targetAudience: Array.isArray(offer.targetAudience) ? 
            offer.targetAudience.filter((i: any) => typeof i === 'string') : [],
          amount: amount,
          conditions: typeof offer.conditions === 'string' && offer.conditions.trim() !== '' ? 
            offer.conditions : null,
          limitedCount: limitedCount,
          startDate: typeof offer.startDate === 'string' && offer.startDate.trim() !== '' ? 
            offer.startDate : null,
          endDate: typeof offer.endDate === 'string' && offer.endDate.trim() !== '' ? 
            offer.endDate : null
        };

        // JSON互換性チェック - JSONBカラムに保存するための重要なステップ
        try {
          const serialized = JSON.stringify(normalizedOffer);
          console.log("オファー処理成功:", {
            title: normalizedOffer.title,
            type: normalizedOffer.type,
            serializedLength: serialized.length
          });
          return normalizedOffer;
        } catch (jsonError) {
          console.error("JSON変換エラー:", jsonError, "問題のフィールド:", Object.keys(normalizedOffer).map(key => {
            return { 
              key, 
              type: typeof normalizedOffer[key as keyof typeof normalizedOffer], 
              value: normalizedOffer[key as keyof typeof normalizedOffer]
            };
          }));
          // エラーが発生した場合は最低限のオブジェクトを返す
          return {
            id: Math.random().toString(36).substring(2, 9),
            title: "エラー発生オファー",
            description: "",
            type: "bonus", // 必ず型を持つようにする
            backgroundColor: "#fff9fa",
            textColor: "#333333",
            isActive: true,
            isLimited: false,
            icon: "alert-triangle",
            order: 0,
            targetAudience: [],
            amount: null,
            conditions: null,
            limitedCount: null,
            startDate: null,
            endDate: null
          };
        }
      });
    
    console.log("特別オファーの処理完了。最終的な配列サイズ:", normalizedOffers.length);
    
    // 処理結果の詳細なデバッグ情報を出力
    console.log("特別オファーの処理結果 (JSON形式):", JSON.stringify(normalizedOffers, null, 2));
    console.log("特別オファーの処理結果 (型情報):", {
      isArray: Array.isArray(normalizedOffers),
      length: normalizedOffers.length,
      objectType: typeof normalizedOffers,
      firstItem: normalizedOffers.length > 0 ? Object.keys(normalizedOffers[0]) : 'empty'
    });
    
    return normalizedOffers;
  } catch (error) {
    console.error("special_offers処理中の一般エラー:", error);
    return [];
  }
}



// ギャラリー写真の配列の整合性を確保するヘルパー関数
function processGalleryPhotos(photos: any): any[] {
  // 入力がnullまたはundefinedの場合は空配列を返す
  if (photos === null || photos === undefined) {
    console.log("gallery_photosがnullまたはundefinedです。空配列を返します。");
    return [];
  }
  
  // JSONB型への変更に伴う修正: 文字列の場合はJSONとしてパースを試みる
  if (typeof photos === 'string') {
    try {
      const parsedPhotos = JSON.parse(photos);
      if (Array.isArray(parsedPhotos)) {
        photos = parsedPhotos;
      } else {
        console.log("gallery_photosがJSONとしてパースされましたが、配列ではありません。空配列を返します。");
        return [];
      }
    } catch (e) {
      console.log("gallery_photosが文字列ですが、有効なJSONではありません。空配列を返します。", e);
      return [];
    }
  }
  
  // 配列ではない場合は空配列を返す
  if (!Array.isArray(photos)) {
    console.log("gallery_photosが配列ではありません。空配列を返します。タイプ:", typeof photos);
    return [];
  }
  
  try {
    // 有効な写真オブジェクトのみフィルタリング
    return photos
      .filter(photo => typeof photo === 'object' && photo !== null)
      .map(photo => {
        // 文字列フィールドの安全な処理
        const safeString = (value: any, defaultValue: string = "") => {
          if (typeof value === 'string') return value;
          return defaultValue;
        };

        // 必須フィールドの確保 - 各項目にデフォルト値を設定して対応
        const normalizedPhoto = {
          id: typeof photo.id === 'string' && photo.id.trim() !== '' ? 
            photo.id : `photo-${Math.random().toString(36).substring(2, 15)}`,
          url: safeString(photo.url),
          title: safeString(photo.title, `写真 ${photo.order || 0}`),
          description: safeString(photo.description),
          alt: safeString(photo.alt),
          category: safeString(photo.category, "その他"),
          featured: typeof photo.featured === 'boolean' ? photo.featured : false,
          order: typeof photo.order === 'number' ? photo.order : 0
        };

        // JSON互換性チェック - JSONBカラムに保存するための重要なステップ
        try {
          JSON.stringify(normalizedPhoto);
          console.log("写真処理成功:", normalizedPhoto.title);
        } catch (jsonError) {
          console.error("JSON変換エラー:", jsonError, "問題のフィールド:", Object.keys(normalizedPhoto).map(key => {
            return { 
              key, 
              type: typeof normalizedPhoto[key as keyof typeof normalizedPhoto], 
              value: normalizedPhoto[key as keyof typeof normalizedPhoto]
            };
          }));
          // エラーが発生した場合は最低限のオブジェクトを返す
          return {
            id: `photo-error-${Math.random().toString(36).substring(2, 9)}`,
            url: "",
            title: "エラー発生写真",
            description: "",
            alt: "",
            category: "その他",
            featured: false,
            order: 0
          };
        }

        return normalizedPhoto;
      });
  } catch (error) {
    console.error("gallery_photos処理中のエラー:", error);
    return [];
  }
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

    // 明示的にsuccess:trueフラグを付けて返却
    return res.json({
      ...profile,
      success: true
    });
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
  console.log("PATCH /api/store/profile エンドポイントが呼び出されました:", {
    requestBody: req.body,
    requestHeaders: req.headers,
    timestamp: new Date().toISOString(),
    userId: req.user?.id
  });
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
          // 修正: special_offersをSQL文としてJSONBに直接変換してPostgreSQLの二重エンコードを回避
          special_offers: sql`${JSON.stringify(processSpecialOffers(fullData.special_offers))}::jsonb`,
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
      requirements: req.body.requirements 
        ? (typeof req.body.requirements === 'string' 
            ? req.body.requirements 
            : JSON.stringify(typeof req.body.requirements === 'object' 
              ? {
                ...req.body.requirements,
                // cup_size_conditionsが配列であることを保証
                cup_size_conditions: Array.isArray(req.body.requirements.cup_size_conditions) 
                  ? req.body.requirements.cup_size_conditions 
                  : []
              }
              : {}))
        : (typeof existingProfile.requirements === 'string'
            ? existingProfile.requirements
            : JSON.stringify(existingProfile.requirements || {
              accepts_temporary_workers: false,
              requires_arrival_day_before: false,
              other_conditions: [],
              cup_size_conditions: []
            })),
      
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
      application_notes: req.body.application_notes || existingProfile.application_notes || "",
      
      // アクセス情報とセキュリティ対策
      access_info: req.body.access_info || existingProfile.access_info || "",
      security_measures: req.body.security_measures || existingProfile.security_measures || "",
      privacy_measures: req.body.privacy_measures || existingProfile.privacy_measures || "",
      commitment: req.body.commitment || existingProfile.commitment || "",
      
      // 各種サポート情報
      transportation_support: req.body.transportation_support !== undefined ? req.body.transportation_support : (existingProfile.transportation_support || false),
      housing_support: req.body.housing_support !== undefined ? req.body.housing_support : (existingProfile.housing_support || false),
      
      // カスタム特典
      special_offers: Array.isArray(req.body.special_offers) 
        ? processSpecialOffers(req.body.special_offers) 
        : (existingProfile.special_offers || []),
      
      // ギャラリー写真（JSONB型として処理）
      gallery_photos: req.body.gallery_photos
        ? processGalleryPhotos(req.body.gallery_photos)
        : (existingProfile.gallery_photos || []),
      
      // デザイン設定（JSONB型として処理）
      design_settings: req.body.design_settings 
        ? dataUtils.processDesignSettings(req.body.design_settings)
        : (existingProfile.design_settings || { sections: [], globalSettings: {} }),
      
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
      application_notes: updateData.application_notes,
      
      // アクセス情報とセキュリティ対策
      access_info: updateData.access_info,
      security_measures: updateData.security_measures,
      privacy_measures: updateData.privacy_measures,
      commitment: updateData.commitment,
      
      // 各種サポート情報
      transportation_support: updateData.transportation_support,
      housing_support: updateData.housing_support,
      
      // カスタム特典
      special_offers: updateData.special_offers,
      
      // ギャラリー写真
      gallery_photos: updateData.gallery_photos,
      
      // デザイン設定
      design_settings: updateData.design_settings
    });

    // 更新用のオブジェクトを作成
    const fullUpdateData = {
      ...validatedData,
      updated_at: updateData.updated_at,
      design_settings: updateData.design_settings
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
          : existingProfile.requirements || {
            accepts_temporary_workers: false,
            requires_arrival_day_before: false,
            prioritize_titles: false,
            other_conditions: [],
            cup_size_conditions: []
          },
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
        application_notes: updateData.application_notes || existingProfile.application_notes || "",
        access_info: fullUpdateData.access_info,
        security_measures: fullUpdateData.security_measures,
        privacy_measures: updateData.privacy_measures || existingProfile.privacy_measures || "",
        commitment: updateData.commitment || existingProfile.commitment || "",
        transportation_support: fullUpdateData.transportation_support,
        housing_support: fullUpdateData.housing_support,
        // 修正: special_offersをSQL文としてJSONBに直接変換してPostgreSQLの二重エンコードを回避
        special_offers: sql`${JSON.stringify(processSpecialOffers(fullUpdateData.special_offers))}::jsonb`,
        gallery_photos: processGalleryPhotos(fullUpdateData.gallery_photos || []),
        // デザイン設定の更新を処理（JSONB型として正しく保存）
        design_settings: dataUtils.processDesignSettings(fullUpdateData.design_settings || existingProfile.design_settings),
        updated_at: fullUpdateData.updated_at
      })
      .where(eq(store_profiles.user_id, req.user.id))
      .returning();
    
    log('info', '店舗プロフィール更新成功', {
      userId: req.user.id,
      profileId: updatedProfile.id,
      updatedData: validatedData
    });

    // Drizzleの返却値の型を明示的に処理して応答を正確に整形
    if (updatedProfile) {
      console.log("店舗プロフィール更新レスポンス送信前:", {
        profileId: updatedProfile.id,
        responseStatus: 200,
        success: true,
        timestamp: new Date().toISOString()
      });
      
      // 特別オファーが正しく保存されたか確認
      try {
        // データベースに保存された special_offers が文字列かどうか確認
        const specialOffersData = updatedProfile.special_offers;
        let specialOffersJson, parsedSpecialOffers;
        
        if (typeof specialOffersData === 'string') {
          // すでに文字列の場合はパースを試みる
          specialOffersJson = specialOffersData;
          parsedSpecialOffers = JSON.parse(specialOffersJson);
        } else {
          // オブジェクトの場合は文字列化してから再度パース
          specialOffersJson = JSON.stringify(specialOffersData);
          parsedSpecialOffers = JSON.parse(specialOffersJson);
        }
        
        console.log("特別オファーのJSON検証:", {
          isValid: true,
          dataType: typeof specialOffersData,
          serialized: (typeof specialOffersJson === 'string') ? specialOffersJson.substring(0, 100) + "..." : "invalid", // 長すぎる場合は切る
          objectAfterParse: typeof parsedSpecialOffers
        });
      } catch (jsonError) {
        console.error("特別オファーのJSON検証エラー:", {
          error: jsonError instanceof Error ? jsonError.message : String(jsonError),
          specialOffersType: typeof updatedProfile.special_offers
        });
        
        // 特別オファーが無効な場合は安全な空の配列に置き換える
        updatedProfile.special_offers = [];
      }
      
      // クライアント側での処理のためにレスポンスの形式を明確に
      const response = {
        ...updatedProfile,
        success: true,
        message: "店舗プロフィールを更新しました"
      };
      
      // レスポンスデータをログ出力
      log('info', '店舗プロフィール更新レスポンスの詳細', {
        userId: req.user.id,
        profileId: updatedProfile.id,
        responseKeys: Object.keys(response),
        responseSuccess: response.success,
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json(response);
    } else {
      console.error("店舗プロフィール更新エラー - 更新後のデータが取得できない:", {
        userId: req.user.id,
        timestamp: new Date().toISOString()
      });
      
      return res.status(500).json({ 
        success: false, 
        message: "店舗プロフィールの更新処理は完了しましたが、更新後のデータを取得できませんでした"
      });
    }

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

// 体験入店情報関連のエンドポイントを削除しました

// キャンペーン関連のエンドポイントを削除しました

// 特別オファー取得エンドポイント
router.get("/special-offers", authenticate, authorize("store"), async (req: any, res) => {
  try {
    log('info', '特別オファー取得開始', {
      userId: req.user.id,
      displayName: req.user.display_name
    });

    // 店舗プロフィールを取得
    const [profile] = await db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.user_id, req.user.id));

    if (!profile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }

    // 特別オファーを取得して返す
    // 特別オファーデータを取得
    let specialOffers;
    try {
      // string型である可能性があるのでJSON.parseを試みる
      if (typeof profile.special_offers === 'string') {
        specialOffers = processSpecialOffers(JSON.parse(profile.special_offers));
      } else {
        specialOffers = processSpecialOffers(profile.special_offers);
      }
    } catch (e) {
      console.error("special_offers解析エラー:", e);
      specialOffers = [];
    }
    
    log('info', '特別オファー取得成功', {
      userId: req.user.id,
      offersCount: specialOffers.length
    });

    return res.json(specialOffers);
  } catch (error) {
    log('error', '特別オファー取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    return res.status(500).json({ message: "特別オファーの取得に失敗しました" });
  }
});

// ギャラリー写真取得エンドポイント
router.get("/gallery-photos", authenticate, authorize("store"), async (req: any, res) => {
  try {
    log('info', 'ギャラリー写真取得開始', {
      userId: req.user.id,
      displayName: req.user.display_name
    });

    // 店舗プロフィールを取得
    const [profile] = await db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.user_id, req.user.id));

    if (!profile) {
      return res.status(404).json({ message: "店舗プロフィールが見つかりません" });
    }

    // ギャラリー写真データを取得
    let galleryPhotos;
    try {
      // string型である可能性があるのでJSON.parseを試みる
      if (typeof profile.gallery_photos === 'string') {
        galleryPhotos = processGalleryPhotos(JSON.parse(profile.gallery_photos));
      } else {
        galleryPhotos = processGalleryPhotos(profile.gallery_photos);
      }
    } catch (e) {
      console.error("gallery_photos解析エラー:", e);
      galleryPhotos = [];
    }
    
    log('info', 'ギャラリー写真取得成功', {
      userId: req.user.id,
      photosCount: galleryPhotos.length
    });

    return res.json(galleryPhotos);
  } catch (error) {
    log('error', 'ギャラリー写真取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    return res.status(500).json({ message: "ギャラリー写真の取得に失敗しました" });
  }
});

// 店舗ブログ一覧取得エンドポイント
router.get("/blog", authenticate, authorize("store"), async (req: any, res) => {
  try {
    log('info', '店舗ブログ記事取得開始', {
      userId: req.user.id,
      displayName: req.user.display_name
    });

    // クエリパラメータの取得（ページネーション用）
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // blogPostsテーブルからブログ記事データを取得する
    const { blogPosts } = await import('@shared/schema');
    
    // 総記事数のカウントを取得
    const countResult = await db
      .select({ count: count() })
      .from(blogPosts)
      .where(eq(blogPosts.store_id, req.user.id));
    
    const totalItems = countResult[0].count;
    const totalPages = Math.ceil(totalItems / limit);
    
    // 記事一覧を取得
    const posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.store_id, req.user.id))
      .orderBy(desc(blogPosts.created_at))
      .limit(limit)
      .offset(offset);
    
    log('info', '店舗ブログ記事取得成功', {
      userId: req.user.id,
      postsCount: posts.length,
      totalItems: totalItems
    });

    return res.json({
      posts: posts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems
      }
    });
  } catch (error) {
    console.error('ブログ記事取得エラー:', error);
    log('error', '店舗ブログ記事取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    return res.status(500).json({ message: "店舗ブログ記事の取得に失敗しました" });
  }
});

export default router;