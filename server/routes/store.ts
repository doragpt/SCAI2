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
import { dataUtils, DEFAULT_REQUIREMENTS } from '@shared/utils/dataTypeUtils';
import { customJsonb } from '@shared/utils/customTypes';
import { processAllFields, prepareFieldForDatabase, extractJsonErrorDetails } from '@shared/utils/dataTypeHandler';

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

/**
 * 特別オファーデータを処理し、正規化する関数
 * - 文字列をパースして配列にする
 * - すべてのオファーにtypeフィールドを"bonus"として統一
 * - 必須フィールドを保証する
 * @param offers 変換対象のデータ
 * @returns 正規化された特別オファー配列
 */
function processSpecialOffers(offers: any): any[] {
  console.log("===== processSpecialOffers関数開始 =====");
  console.log("受け取った特別オファーデータ:", {
    type: typeof offers,
    isArray: Array.isArray(offers),
    isNull: offers === null,
    isUndefined: offers === undefined
  });
  
  // 入力がnullまたはundefinedの場合は空配列を返す
  if (offers === null || offers === undefined) {
    console.log("特別オファーがnullまたはundefinedです。空配列を返します。");
    return [];
  }
  
  // JSONB型への変更に伴う修正: 文字列の場合はJSONとしてパースを試みる
  if (typeof offers === 'string') {
    try {
      console.log("特別オファーが文字列として渡されました。JSON解析を試みます");
      const parsedOffers = JSON.parse(offers);
      console.log("JSON解析結果:", {
        type: typeof parsedOffers,
        isArray: Array.isArray(parsedOffers),
        keys: typeof parsedOffers === 'object' ? Object.keys(parsedOffers) : 'not-an-object'
      });
      
      if (Array.isArray(parsedOffers)) {
        console.log("文字列からJSONに変換成功。配列として処理します。要素数:", parsedOffers.length);
        offers = parsedOffers;
      } else {
        console.log("特別オファーがJSONとしてパースされましたが、配列ではありません。空配列を返します。");
        return [];
      }
    } catch (e) {
      console.error("特別オファーが文字列ですが、JSON解析に失敗しました:", e);
      return [];
    }
  }
  
  // 配列ではない場合は空配列を返す
  if (!Array.isArray(offers)) {
    console.log("特別オファーが配列ではありません。空配列を返します。データタイプ:", typeof offers);
    return [];
  }
  
  try {
    // 有効な要素を持つ配列に変換（null、undefinedを除去）
    const filteredOffers = offers.filter(offer => offer !== null && offer !== undefined);
    console.log("フィルタリング前後の配列サイズ比較:", {
      before: offers.length,
      after: filteredOffers.length,
    });
    
    // 各オファーの詳細をログ出力
    filteredOffers.forEach((offer, index) => {
      console.log(`オファー[${index}]の詳細:`, {
        id: offer.id,
        type: offer.type,
        title: offer.title,
        isObject: typeof offer === 'object',
        hasSpecialChars: offer.title && /["\\\/\b\f\n\r\t]/g.test(offer.title), // 特殊文字チェック
        keys: typeof offer === 'object' ? Object.keys(offer) : 'not-an-object'
      });
    });
    
    // 有効なオファーオブジェクトのみをマッピングして正規化
    const normalizedOffers = filteredOffers
      .filter(offer => {
        const isValidObject = typeof offer === 'object';
        if (!isValidObject) {
          console.log("無効なオファーをスキップします:", offer);
        }
        return isValidObject;
      })
      .map((offer, index) => {
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
        const safeString = (value: any, defaultValue: string = "", fieldName: string = "unknown") => {
          if (typeof value === 'string') {
            // 特殊文字のチェック
            if (/["\\\/\b\f\n\r\t]/g.test(value)) {
              console.log(`警告: ${fieldName}フィールド[${index}]に特殊文字が含まれています:`, value);
            }
            return value;
          }
          console.log(`フィールド'${fieldName}'が文字列ではないためデフォルト値を使用:`, {
            originalValue: value,
            originalType: typeof value,
            defaultValue: defaultValue
          });
          return defaultValue;
        };
        
        // null許容文字列フィールド用の処理関数
        const safeNullableString = (value: any, fieldName: string = "unknown") => {
          if (value === null) return "";
          if (typeof value === 'string') return value;
          console.log(`nullable フィールド'${fieldName}'が文字列ではないため空文字を使用:`, {
            originalValue: value,
            originalType: typeof value
          });
          return "";
        };

        // 一意のIDを確保
        const id = (typeof offer.id === 'string' && offer.id.trim() !== '') ? 
          offer.id : `offer-${Math.random().toString(36).substring(2, 9)}`;
        
        // 必須フィールドの確保 - 各項目にデフォルト値を設定して対応
        const normalizedOffer = {
          id: id,
          title: safeString(offer.title, "特別オファー", "title"),
          description: safeString(offer.description, "", "description"),
          // 重要: typeフィールドは常に"bonus"を使用（必須フィールド）
          type: "bonus",
          backgroundColor: safeString(offer.backgroundColor, "#fff9fa", "backgroundColor"),
          textColor: safeString(offer.textColor, "#333333", "textColor"),
          isActive: typeof offer.isActive === 'boolean' ? offer.isActive : true,
          isLimited: typeof offer.isLimited === 'boolean' ? offer.isLimited : false,
          icon: safeString(offer.icon, "sparkles", "icon"),
          order: typeof offer.order === 'number' ? offer.order : 0,
          targetAudience: Array.isArray(offer.targetAudience) ? 
            offer.targetAudience.filter((i: any) => typeof i === 'string') : [],
          amount: amount,
          // 空文字をデフォルト値に設定
          conditions: typeof offer.conditions === 'string' ? offer.conditions : "",
          limitedCount: limitedCount,
          // null 値を許容しない文字列フィールド
          startDate: typeof offer.startDate === 'string' ? offer.startDate : "",
          endDate: typeof offer.endDate === 'string' ? offer.endDate : ""
        };

        // JSON互換性チェック - JSONBカラムに保存するための重要なステップ
        try {
          const serialized = JSON.stringify(normalizedOffer);
          console.log(`オファー[${index}]: 正規化完了 - ID: ${normalizedOffer.id}, Type: ${normalizedOffer.type}`);
          return normalizedOffer;
        } catch (jsonError) {
          console.error(`オファー[${index}]: JSON変換エラー:`, jsonError);
          console.log("問題のあるオファーデータ:", normalizedOffer);
          
          // エラーが発生した場合は最低限のオブジェクトを返す
          return {
            id: id,
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
            conditions: "",
            limitedCount: null,
            startDate: "",
            endDate: ""
          };
        }
      });
    
    console.log("特別オファーの処理完了。最終配列サイズ:", normalizedOffers.length);
    
    // 最終結果のJSON文字列を生成して検証
    let finalJsonString;
    try {
      finalJsonString = JSON.stringify(normalizedOffers);
      console.log("最終JSONデータ (安全な長さに切り詰め):", 
        finalJsonString.length > 200 ? 
        finalJsonString.substring(0, 200) + "..." : 
        finalJsonString
      );
      // 検証のため再パース
      JSON.parse(finalJsonString);
      console.log("JSONデータの検証: 有効なJSON形式です");
    } catch (finalJsonError) {
      console.error("最終JSONデータの検証でエラー:", finalJsonError);
      // 空配列を返す - 重大なJSONエラーがある場合
      return [];
    }
    
    // 詳細な型情報
    console.log("特別オファー処理結果 (型情報):", {
      isArray: Array.isArray(normalizedOffers),
      length: normalizedOffers.length,
      objectType: typeof normalizedOffers,
      firstItem: normalizedOffers.length > 0 ? Object.keys(normalizedOffers[0]) : 'empty',
      jsonStringLength: finalJsonString ? finalJsonString.length : 0
    });
    
    // PostgreSQLのJSONB型との互換性を確認するための追加検証
    if (!Array.isArray(normalizedOffers)) {
      console.error("重大なエラー: normalizedOffersが配列ではありません。データ型:", typeof normalizedOffers);
      console.log("データ内容:", normalizedOffers);
      // 配列でない場合は常に空配列を返す
      return [];
    }
    
    // 各要素のチェックと修正を追加
    const finalOffers = normalizedOffers.map(offer => {
      // 各特別オファーがオブジェクトであることを確認
      if (typeof offer !== 'object' || offer === null) {
        console.error("特別オファー要素が有効なオブジェクトではありません:", offer);
        return {
          id: `offer-${Math.random().toString(36).substring(2, 9)}`,
          title: "特別オファー",
          description: "",
          type: "bonus", // 必須フィールド
          backgroundColor: "#fff9fa",
          textColor: "#333333",
          isActive: true,
          isLimited: false,
          icon: "sparkles",
          order: 0,
          targetAudience: [],
          amount: null,
          conditions: "",
          limitedCount: null,
          startDate: "",
          endDate: ""
        };
      }
      
      // typeフィールドが"bonus"であることを強制
      if (offer.type !== "bonus") {
        console.log(`特別オファー[${offer.id}]のtypeを強制的に"bonus"に設定します。元の値:`, offer.type);
        offer.type = "bonus";
      }
      
      return offer;
    });
    
    console.log("最終的な特別オファー配列:", {
      isArray: Array.isArray(finalOffers),
      length: finalOffers.length,
      allElementsHaveType: finalOffers.every(o => o.type === "bonus")
    });
    
    console.log("===== processSpecialOffers関数終了 =====");
    return finalOffers;
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
        average_salary: Number(req.body.average_salary) || 0,
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
        average_salary: insertData.average_salary,
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
          average_salary: fullData.average_salary,
          status: fullData.status,
          top_image: fullData.top_image,
          // special_offersを正規の配列として処理（SQLテンプレートリテラルは使わない）
          special_offers: processSpecialOffers(fullData.special_offers),
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
      average_salary: Number(req.body.average_salary) || existingProfile.average_salary || 0,
      status: req.body.status || existingProfile.status,
      top_image: req.body.top_image || existingProfile.top_image,
      
      // 勤務時間と応募条件
      working_hours: req.body.working_hours || existingProfile.working_hours || "",
      // requirementsフィールドの処理改善 - 一貫したオブジェクト処理と型安全性の向上
      requirements: (() => {
        let requirementsObj: any = {
          accepts_temporary_workers: false,
          requires_arrival_day_before: false,
          other_conditions: [],
          cup_size_conditions: []
        };
        
        // 新しいrequirementsデータがある場合
        if (req.body.requirements) {
          try {
            // 文字列の場合はパースを試みる
            if (typeof req.body.requirements === 'string') {
              requirementsObj = JSON.parse(req.body.requirements);
            } 
            // オブジェクトの場合は直接使用
            else if (typeof req.body.requirements === 'object') {
              requirementsObj = { ...req.body.requirements };
            }
            
            // cup_size_conditionsが配列であることを保証
            requirementsObj.cup_size_conditions = Array.isArray(requirementsObj.cup_size_conditions)
              ? requirementsObj.cup_size_conditions
              : [];
              
            // その他の必須フィールドが存在することを確認
            requirementsObj.accepts_temporary_workers = 
              typeof requirementsObj.accepts_temporary_workers === 'boolean' 
                ? requirementsObj.accepts_temporary_workers 
                : false;
                
            requirementsObj.requires_arrival_day_before = 
              typeof requirementsObj.requires_arrival_day_before === 'boolean' 
                ? requirementsObj.requires_arrival_day_before 
                : false;
                
            requirementsObj.other_conditions = Array.isArray(requirementsObj.other_conditions)
              ? requirementsObj.other_conditions
              : [];
          } catch (error) {
            console.error('Requirements パース中のエラー:', error);
            // エラー時は既存のプロファイルの値を使用
            requirementsObj = existingProfile.requirements || requirementsObj;
          }
        }
        // 新しいデータがない場合は既存のデータを使用
        else if (existingProfile.requirements) {
          try {
            if (typeof existingProfile.requirements === 'string') {
              requirementsObj = JSON.parse(existingProfile.requirements);
            } else if (typeof existingProfile.requirements === 'object') {
              requirementsObj = { ...existingProfile.requirements };
            }
          } catch (error) {
            console.error('既存 Requirements パース中のエラー:', error);
            // デフォルト値は既に設定済みなのでそのまま使用
          }
        }
        
        // ログ出力でデバッグ
        log('info', 'Requirements オブジェクト検証', {
          requirementsType: typeof requirementsObj,
          hasArrayProperties: requirementsObj && Array.isArray(requirementsObj.cup_size_conditions),
          cupSizeConditionsLength: requirementsObj && Array.isArray(requirementsObj.cup_size_conditions) 
            ? requirementsObj.cup_size_conditions.length 
            : 'not an array'
        });
        
        // オブジェクトをそのまま返す (Drizzle ORM が自動的に処理)
        return requirementsObj;
      })(),
      
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
      // privacy_measuresはJSONB型の配列として処理
      privacy_measures: prepareFieldForDatabase('privacy_measures', req.body.privacy_measures || existingProfile.privacy_measures),
      commitment: dataUtils.processTextFields(req.body.commitment || existingProfile.commitment, ""),
      
      // 各種サポート情報
      transportation_support: req.body.transportation_support !== undefined ? req.body.transportation_support : (existingProfile.transportation_support || false),
      housing_support: req.body.housing_support !== undefined ? req.body.housing_support : (existingProfile.housing_support || false),
      
      // カスタム特典
      special_offers: Array.isArray(req.body.special_offers) 
        ? processSpecialOffers(req.body.special_offers)
        : (existingProfile.special_offers || []),
      
      // ギャラリー写真（JSONB型として処理、SQLテンプレートリテラルを使用しない）
      gallery_photos: req.body.gallery_photos
        ? processGalleryPhotos(req.body.gallery_photos)
        : (existingProfile.gallery_photos || []),
      
      // デザイン設定（JSONB型として処理、SQLテンプレートリテラルを使用しない）
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
      average_salary: updateData.average_salary,
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
      privacy_measures: prepareFieldForDatabase('privacy_measures', updateData.privacy_measures),
      commitment: dataUtils.processTextFields(updateData.commitment),
      
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

    // 簡易バージョンのログ出力（エラー解決後に詳細版に戻す）
    log('info', 'データ更新準備中', {
      userId: req.user.id,
      profileId: existingProfile.id
    });
    
    log('info', 'SQLクエリ実行準備中', {
      userId: req.user.id,
      profileId: existingProfile.id
    });
    
    // Type augmentation to support indexable properties
    interface StoreProfileData {
      [key: string]: any;
      privacy_measures?: any;
      commitment?: any;
      security_measures?: any;
      special_offers?: any;
      gallery_photos?: any;
      design_settings?: any;
      requirements?: any;
      // 他の重要な既知のフィールドも列挙（タイプセーフティのため）
      updated_at: Date;
      catch_phrase: string;
      description: string;
      benefits: string[];
      status: "draft" | "published" | "closed";
    }
    
    // TEXTタイプのフィールドを文字列に確実に変換
    const textFields = ['commitment', 'security_measures']; // privacy_measuresはJSONB型なのでtextFieldsから削除
    
    // キャストしてフィールドへのインデックスアクセスを安全に
    const typedUpdateData = fullUpdateData as StoreProfileData;
    
    // 安全にオブジェクトフィールドにアクセスするヘルパー関数
    const safeGetField = (data: StoreProfileData, field: string): any => {
      return data && typeof data === 'object' && field in data ? data[field] : null;
    };
    
    // 安全に文字列にセットするヘルパー関数
    const safeSetTextField = (data: StoreProfileData, field: string, value: any): void => {
      if (!data || typeof data !== 'object') return;
      
      if (typeof value === 'object' && value !== null) {
        try {
          data[field] = JSON.stringify(value);
          console.log(`TEXT型フィールド "${field}" をJSON.stringifyで変換しました`);
        } catch (e) {
          console.error(`${field}の文字列化に失敗しました:`, e);
          data[field] = ''; // 失敗した場合は空文字列に
        }
      } else if (typeof value === 'string') {
        data[field] = value;
      } else if (value === null || value === undefined) {
        data[field] = ''; // null/undefinedの場合は空文字列に
      } else {
        data[field] = String(value); // その他の型は文字列に変換
      }
    };
    
    // 各TEXTフィールドを処理
    textFields.forEach(field => {
      const fieldValue = safeGetField(typedUpdateData, field);
      
      console.log(`TEXTフィールド "${field}" の処理:`, {
        type: typeof fieldValue,
        value: fieldValue,
        isArray: Array.isArray(fieldValue)
      });
      
      safeSetTextField(typedUpdateData, field, fieldValue);
    });
    
    // JSONB型フィールドが文字列の場合、パースして確保
    const jsonbFields = ['privacy_measures', 'special_offers', 'gallery_photos', 'design_settings', 'requirements'];
    
    jsonbFields.forEach(field => {
      const fieldValue = safeGetField(typedUpdateData, field);
      
      if (typeof fieldValue === 'string' && field !== 'requirements') { // requirementsは特別処理するので除外
        console.warn(`JSONB型フィールド "${field}" に文字列が渡されました。オブジェクトにパースします。`, {
          value: (fieldValue as string).substring(0, 30) + '...',
          length: (fieldValue as string).length
        });
        
        // パース試行
        try {
          typedUpdateData[field] = JSON.parse(fieldValue as string);
          console.log(`JSONBフィールド "${field}" をパースしました`);
        } catch (e) {
          console.error(`${field}のパースに失敗しました:`, e);
          // フィールドによってデフォルト値を設定
          if (field === 'special_offers' || field === 'gallery_photos') {
            typedUpdateData[field] = [];
          } else if (field === 'design_settings') {
            typedUpdateData[field] = {};
          }
        }
      }
    });
    
    // DrizzleのupdateOne操作を使用
    const [updatedProfile] = await db
      .update(store_profiles)
      .set({
        catch_phrase: typedUpdateData.catch_phrase,
        description: typedUpdateData.description,
        benefits: validateBenefits(typedUpdateData.benefits),
        minimum_guarantee: typedUpdateData.minimum_guarantee,
        maximum_guarantee: typedUpdateData.maximum_guarantee,
        working_time_hours: typedUpdateData.working_time_hours,
        average_salary: typedUpdateData.average_salary,
        status: typedUpdateData.status,
        top_image: typedUpdateData.top_image,
        working_hours: typedUpdateData.working_hours,
        // requirementsフィールドをオブジェクトとして確実に処理
        requirements: (() => {
          try {
            // 新しいユーティリティ関数を使用
            let requirementsObj = dataUtils.processRequirements(typedUpdateData.requirements || existingProfile.requirements);
            
            // データ検証ログ
            log('info', 'DB保存直前のrequirements検証', {
              requirementsType: typeof requirementsObj,
              isNull: requirementsObj === null,
              hasArrayProperties: requirementsObj && 'cup_size_conditions' in requirementsObj && Array.isArray(requirementsObj.cup_size_conditions),
              sample: JSON.stringify(requirementsObj).substring(0, 100) + "..."
            });
            
            return requirementsObj;
          } catch (error) {
            console.error('Requirements最終処理エラー:', error);
            // エラー時はデフォルト値を返す
            return {
              cup_size_conditions: [],
              accepts_temporary_workers: true,
              requires_arrival_day_before: false,
              prioritize_titles: false,
              other_conditions: []
            };
          }
        })(),
        recruiter_name: typedUpdateData.recruiter_name,
        phone_numbers: validateArrayField(typedUpdateData.phone_numbers),
        email_addresses: validateArrayField(typedUpdateData.email_addresses),
        address: typedUpdateData.address,
        sns_id: typedUpdateData.sns_id,
        sns_url: typedUpdateData.sns_url,
        sns_text: typedUpdateData.sns_text,
        pc_website_url: typedUpdateData.pc_website_url,
        mobile_website_url: typedUpdateData.mobile_website_url,
        application_requirements: typedUpdateData.application_requirements,
        application_notes: updateData.application_notes || existingProfile.application_notes || "",
        access_info: typedUpdateData.access_info,
        security_measures: typedUpdateData.security_measures,
        // テキストフィールドを適切に処理
        privacy_measures: prepareFieldForDatabase('privacy_measures', updateData.privacy_measures || existingProfile.privacy_measures),
        commitment: prepareFieldForDatabase('commitment', updateData.commitment || existingProfile.commitment),
        transportation_support: typedUpdateData.transportation_support,
        housing_support: typedUpdateData.housing_support,
        // JSONBフィールドを適切に処理
        special_offers: prepareFieldForDatabase('special_offers', typedUpdateData.special_offers),
        gallery_photos: prepareFieldForDatabase('gallery_photos', typedUpdateData.gallery_photos || []),
        // デザイン設定の更新を処理（JSONB型として正しく保存）
        design_settings: prepareFieldForDatabase('design_settings', typedUpdateData.design_settings || existingProfile.design_settings),
        updated_at: typedUpdateData.updated_at
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
      // 更新されたデータを出力（デバッグ用）
      const fieldTypes = {
        privacy_measures: typeof updatedProfile.privacy_measures,
        privacy_measures_sample: typeof updatedProfile.privacy_measures === 'string' 
          ? updatedProfile.privacy_measures.substring(0, 30)
          : String(updatedProfile.privacy_measures).substring(0, 30),
        commitment: typeof updatedProfile.commitment,
        requirements: typeof updatedProfile.requirements,
        special_offers: typeof updatedProfile.special_offers,
        gallery_photos: typeof updatedProfile.gallery_photos,
        design_settings: typeof updatedProfile.design_settings,
      };
      
      console.log("更新されたフィールドタイプ:", fieldTypes);
      
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
      // 拡張エラー診断情報を取得
      const errorInfo = extractJsonErrorDetails(error, req.body);
      
      // PostgreSQLの「Token x is invalid」エラーメッセージからトークン情報を抽出
      const tokenRegex = /Token "([^"]+)" is invalid/;
      const tokenMatch = error.message.match(tokenRegex);
      const invalidToken = tokenMatch ? tokenMatch[1] : null;
      
      // SQL構文エラーのカラム名を抽出する正規表現
      const sqlErrorFieldPattern = /column "([^"]+)"/;
      const columnMatch = error.message.match(sqlErrorFieldPattern);
      const errorField = columnMatch ? columnMatch[1] : null;
      
      // 期待される型とフィールド情報をログに出力
      console.log('拡張エラー診断情報:', {
        ...errorInfo,
        invalidToken,
        errorField,
        timestamp: new Date().toISOString()
      });
      
      // より詳細なエラー情報をログに記録
      log('error', '店舗プロフィール更新エラー - 詳細分析', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        userId: req.user?.id,
        requestBody: JSON.stringify(req.body),
        invalidToken: invalidToken,
        errorField: errorField,
        
        // さらに詳細な情報も追加
        requestDataTypes: {
          privacy_measures: typeof req.body.privacy_measures,
          commitment: typeof req.body.commitment,
          requirements: typeof req.body.requirements,
          special_offers: typeof req.body.special_offers,
          gallery_photos: typeof req.body.gallery_photos,
          design_settings: typeof req.body.design_settings
        },
        
        // 各フィールドのサンプル値
        fieldSamples: {
          privacy_measures: typeof req.body.privacy_measures === 'string' 
            ? req.body.privacy_measures.substring(0, 50) + (req.body.privacy_measures.length > 50 ? '...' : '')
            : JSON.stringify(req.body.privacy_measures || '').substring(0, 50) + '...',
          commitment: typeof req.body.commitment === 'string'
            ? req.body.commitment.substring(0, 50) + (req.body.commitment.length > 50 ? '...' : '')
            : JSON.stringify(req.body.commitment || '').substring(0, 50) + '...',
          security_measures: typeof req.body.security_measures === 'string'
            ? req.body.security_measures.substring(0, 50) + (req.body.security_measures.length > 50 ? '...' : '')
            : JSON.stringify(req.body.security_measures || '').substring(0, 50) + '...'
        }
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: '入力内容に誤りがあります',
          details: error.message
        });
      }
      
      if (error.message.includes('relation') || error.message.includes('column') || error.message.includes('syntax')) {
        // SQL関連のエラー - 詳細情報を追加
        const errorDetails = {
          message: "データベースエラーが発生しました",
          sqlError: error.message,
          invalidToken: invalidToken,
          errorField: errorField || (invalidToken ? `不正な値「${invalidToken}」が含まれているフィールドを確認してください` : null)
        };
        
        console.error('SQLエラー詳細:', errorDetails);
        
        return res.status(500).json(errorDetails);
      }
    }

    // 詳細なエラー情報をログに記録
    console.error('店舗プロフィール更新時のエラー詳細:', {
      error,
      userId: req.user?.id,
      body: req.body
    });

    // 新しいエラーハンドラを使用してエラー情報を抽出
    const errorDetails = extractJsonErrorDetails(error, req.body);
    console.error('SQLエラー詳細:', errorDetails);

    return res.status(500).json(errorDetails);
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
        specialOffers = dataUtils.processSpecialOffers(JSON.parse(profile.special_offers));
      } else {
        specialOffers = dataUtils.processSpecialOffers(profile.special_offers);
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
        galleryPhotos = dataUtils.processGalleryPhotos(JSON.parse(profile.gallery_photos));
      } else {
        galleryPhotos = dataUtils.processGalleryPhotos(profile.gallery_photos);
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