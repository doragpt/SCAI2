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

// 特別オファーの配列の整合性を確保するヘルパー関数
function processSpecialOffers(offers: any): any[] {
  // デバッグログを追加
  console.log("処理前のspecial_offers:", JSON.stringify(offers));
  
  if (!Array.isArray(offers)) {
    console.log("special_offersが配列ではありません。空配列を返します。");
    return [];
  }
  
  try {
    const processedOffers = offers.map(offer => {
      if (typeof offer !== 'object' || offer === null) {
        console.log("無効なオファーオブジェクト:", offer);
        return null;
      }
      
      // 必須フィールドの存在を確認
      const id = typeof offer.id === 'string' ? offer.id : Math.random().toString(36).substring(2, 9);
      const title = typeof offer.title === 'string' ? offer.title : "";
      const description = typeof offer.description === 'string' ? offer.description : "";
      const type = typeof offer.type === 'string' ? offer.type : "bonus";
      
      // キャメルケースとスネークケースの両方に対応（バックグラウンドカラー）
      const backgroundColor = typeof offer.backgroundColor === 'string' ? offer.backgroundColor : 
                              typeof offer.background_color === 'string' ? offer.background_color : "#fff9fa";
      
      // キャメルケースとスネークケースの両方に対応（テキストカラー）
      const textColor = typeof offer.textColor === 'string' ? offer.textColor : 
                        typeof offer.text_color === 'string' ? offer.text_color : "#333333";
      
      // 他のフィールドの整合性確保
      const isActive = typeof offer.isActive === 'boolean' ? offer.isActive : true;
      const isLimited = typeof offer.isLimited === 'boolean' ? offer.isLimited : false;
      const icon = typeof offer.icon === 'string' ? offer.icon : "";
      const order = typeof offer.order === 'number' ? offer.order : 0;
      
      // 新しいオブジェクトを構築 (すべてのプロパティを明示的に設定)
      const targetAudienceArray = Array.isArray(offer.targetAudience) ? 
        offer.targetAudience.filter((item: any) => typeof item === 'string') : [];
      
      const amount = typeof offer.amount === 'number' ? offer.amount : 
                    typeof offer.amount === 'string' && offer.amount ? Number(offer.amount) : null;
                    
      const conditions = typeof offer.conditions === 'string' ? offer.conditions : null;
      
      const limitedCount = typeof offer.limitedCount === 'number' ? offer.limitedCount : 
                          typeof offer.limitedCount === 'string' && offer.limitedCount ? Number(offer.limitedCount) : null;
                          
      // 日付フィールドは文字列として保存
      let startDate = null;
      if (offer.startDate) {
        if (offer.startDate instanceof Date) {
          startDate = offer.startDate.toISOString();
        } else if (typeof offer.startDate === 'string') {
          startDate = offer.startDate;
        }
      }
      
      let endDate = null;
      if (offer.endDate) {
        if (offer.endDate instanceof Date) {
          endDate = offer.endDate.toISOString();
        } else if (typeof offer.endDate === 'string') {
          endDate = offer.endDate;
        }
      }
      
      const cleanedOffer = {
        id,
        title,
        description,
        type,
        backgroundColor,
        textColor,
        isActive,
        isLimited,
        icon,
        order,
        targetAudience: targetAudienceArray,
        amount,
        conditions,
        limitedCount,
        startDate,
        endDate
      };
      
      // 型安全なアクセス用にオブジェクトを拡張
      const typedOffer: Record<string, any> = cleanedOffer;
      
      // オプションのフィールドは型チェック後に追加
      if (offer.amount !== undefined) {
        typedOffer.amount = typeof offer.amount === 'number' ? offer.amount : Number(offer.amount) || 0;
      }
      
      if (offer.conditions !== undefined) {
        typedOffer.conditions = typeof offer.conditions === 'string' ? offer.conditions : String(offer.conditions);
      }
      
      // Date型は特別に処理
      if (offer.startDate) {
        try {
          // ISO文字列に変換してからJSONで安全に扱えるようにする
          if (offer.startDate instanceof Date) {
            typedOffer.startDate = offer.startDate.toISOString();
          } else if (typeof offer.startDate === 'string') {
            const date = new Date(offer.startDate);
            if (!isNaN(date.getTime())) {
              typedOffer.startDate = date.toISOString();
            }
          }
        } catch (e) {
          console.error("startDate処理エラー:", e);
        }
      }
      
      if (offer.endDate) {
        try {
          if (offer.endDate instanceof Date) {
            typedOffer.endDate = offer.endDate.toISOString();
          } else if (typeof offer.endDate === 'string') {
            const date = new Date(offer.endDate);
            if (!isNaN(date.getTime())) {
              typedOffer.endDate = date.toISOString();
            }
          }
        } catch (e) {
          console.error("endDate処理エラー:", e);
        }
      }
      
      if (offer.limitedCount !== undefined) {
        typedOffer.limitedCount = typeof offer.limitedCount === 'number' ? 
          offer.limitedCount : Number(offer.limitedCount) || 0;
      }
      
      // targetAudienceは初期オブジェクトで既に処理済み
      
      // オブジェクトを完全に新しく作り直し、PostgreSQLのJSONB型に安全な値だけを含める
      const jsonSafeObject = {
        id,
        title,
        description,
        type,
        backgroundColor,
        textColor,
        isActive,
        isLimited,
        icon,
        order,
        targetAudience: Array.isArray(cleanedOffer.targetAudience) ? cleanedOffer.targetAudience : [],
        amount: cleanedOffer.amount,
        conditions: cleanedOffer.conditions,
        limitedCount: cleanedOffer.limitedCount,
        startDate: cleanedOffer.startDate,
        endDate: cleanedOffer.endDate
      };
      
      // 各オファーの処理後の状態をログ出力
      console.log(`オファー "${title}" の処理後のデータ:`, JSON.stringify(jsonSafeObject));
      
      return jsonSafeObject;
    }).filter(Boolean); // null値を除外
    
    console.log("処理後のspecial_offers:", JSON.stringify(processedOffers));
    return processedOffers;
  } catch (error) {
    console.error("special_offers処理中のエラー:", error);
    // エラーが発生しても最低限の形式を保持する
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
          special_offers: processSpecialOffers(fullData.special_offers) || [],
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
      special_offers: req.body.special_offers || existingProfile.special_offers || [],
      
      // ギャラリー写真（重要：ここが抜けていたため写真が保存されなかった）
      gallery_photos: req.body.gallery_photos || existingProfile.gallery_photos || [],
      
      // デザイン設定
      design_settings: req.body.design_settings || existingProfile.design_settings,
      
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
        special_offers: processSpecialOffers(fullUpdateData.special_offers) || [],
        gallery_photos: fullUpdateData.gallery_photos || [],
        // デザイン設定の更新を処理
        design_settings: fullUpdateData.design_settings || existingProfile.design_settings,
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
        // データベースに保存された special_offers をJSON文字列化して、有効なJSONであることを確認
        const specialOffersJson = JSON.stringify(updatedProfile.special_offers);
        // 文字列化したものを再度パースして問題ないか確認
        const parsedSpecialOffers = JSON.parse(specialOffersJson);
        
        console.log("特別オファーのJSON検証:", {
          isValid: true,
          serialized: specialOffersJson.substring(0, 100) + "...", // 長すぎる場合は切る
          objectAfterParse: typeof parsedSpecialOffers
        });
      } catch (jsonError) {
        console.error("特別オファーのJSON検証エラー:", {
          error: jsonError instanceof Error ? jsonError.message : String(jsonError),
          specialOffers: updatedProfile.special_offers
        });
        
        // 特別オファーが無効な場合は安全な配列に置き換える
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
    const specialOffers = processSpecialOffers(profile.special_offers) || [];
    
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