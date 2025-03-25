import { db } from '../db';
import { store_profiles, talentProfiles, users } from '../../shared/schema';
import { eq, and, gte, lte, inArray, like } from 'drizzle-orm';
import { log } from '../utils/logger';

/**
 * マッチングスコア計算のための重み付け
 */
const WEIGHTS = {
  AGE: 25,       // 年齢要件の重み
  LOCATION: 20,  // 地域の重み
  BODY_TYPE: 15, // 体型の重み
  CUP_SIZE: 15,  // カップサイズの重み
  GUARANTEE: 15, // 最低保証の重み
  SERVICE: 10,   // サービスタイプの重み
};

/**
 * スペック計算関数（身長-体重の値）
 */
function calculateSpec(height: number, weight: number): number {
  return height - weight;
}

/**
 * 年齢によるマッチングスコア計算
 */
function calculateAgeScore(talentAge: number, minAge?: number | null, maxAge?: number | null): number {
  // 年齢の条件がない場合は満点
  if (!minAge && !maxAge) return 1.0;
  
  // 下限も上限もある場合
  if (minAge && maxAge) {
    // 範囲内なら満点
    if (talentAge >= minAge && talentAge <= maxAge) return 1.0;
    
    // 範囲外の場合、近さによってスコアを下げる
    const distanceFromRange = talentAge < minAge 
      ? minAge - talentAge 
      : talentAge - maxAge;
      
    return Math.max(0, 1 - (distanceFromRange / 10)); // 10歳以上離れていたら0点
  }
  
  // 下限だけある場合
  if (minAge && !maxAge) {
    if (talentAge >= minAge) return 1.0;
    return Math.max(0, 1 - ((minAge - talentAge) / 10));
  }
  
  // 上限だけある場合
  if (!minAge && maxAge) {
    if (talentAge <= maxAge) return 1.0;
    return Math.max(0, 1 - ((talentAge - maxAge) / 10));
  }
  
  return 0.5; // デフォルト値
}

/**
 * 体型スペックによるマッチングスコア計算
 */
function calculateSpecScore(talentSpec: number, minSpec?: number | null, maxSpec?: number | null, cupSizeConditions?: any[]): number {
  // カップサイズ特別条件チェック
  if (cupSizeConditions && cupSizeConditions.length > 0) {
    // 特定のカップサイズに対する特別なスペック条件がある場合の処理
    // この部分は talent.cup_size が利用可能になった時点で拡張予定
  }
  
  // 通常のスペック条件チェック
  if (!minSpec && !maxSpec) return 1.0;
  
  if (minSpec && maxSpec) {
    if (talentSpec >= minSpec && talentSpec <= maxSpec) return 1.0;
    
    const rangeSize = maxSpec - minSpec;
    if (rangeSize <= 0) return 0.5; // 不正な範囲の場合
    
    const distanceFromRange = talentSpec < minSpec 
      ? minSpec - talentSpec 
      : talentSpec - maxSpec;
      
    return Math.max(0, 1 - (distanceFromRange / 20)); // 20ポイント以上離れていたら0点
  }
  
  if (minSpec && !maxSpec) {
    if (talentSpec >= minSpec) return 1.0;
    return Math.max(0, 1 - ((minSpec - talentSpec) / 20));
  }
  
  if (!minSpec && maxSpec) {
    if (talentSpec <= maxSpec) return 1.0;
    return Math.max(0, 1 - ((talentSpec - maxSpec) / 20));
  }
  
  return 0.5;
}

/**
 * 地域によるマッチングスコア計算
 */
function calculateLocationScore(talentLocation: string, storeLocation: string, talentPreferredLocations: string[]): number {
  // 完全一致
  if (talentLocation === storeLocation) return 1.0;
  
  // 希望エリアに含まれている
  if (talentPreferredLocations.includes(storeLocation)) return 0.8;
  
  // エリアグループによる近接スコア（必要に応じて実装）
  // 例: 関東圏内、関西圏内など
  
  return 0.2; // デフォルト値（マッチしない）
}

/**
 * 報酬によるマッチングスコア計算
 */
function calculateGuaranteeScore(talentDesiredGuarantee: number, storeMinGuarantee?: number | null, storeMaxGuarantee?: number | null): number {
  if (!storeMinGuarantee && !storeMaxGuarantee) return 0.5;
  
  // 店舗の最大保証が希望額を上回っている
  if (storeMaxGuarantee && storeMaxGuarantee >= talentDesiredGuarantee) return 1.0;
  
  // 店舗の最低保証が希望額を上回っている
  if (storeMinGuarantee && storeMinGuarantee >= talentDesiredGuarantee) return 1.0;
  
  // 最低保証はあるが希望額に届かない場合
  if (storeMinGuarantee) {
    const ratio = storeMinGuarantee / talentDesiredGuarantee;
    return Math.min(1, Math.max(0, ratio)); // 0〜1の範囲に収める
  }
  
  return 0.3; // デフォルト値（条件不明確の場合）
}

/**
 * サービスタイプによるマッチングスコア計算
 */
function calculateServiceTypeScore(talentServiceTypes: string[], storeServiceType: string): number {
  if (talentServiceTypes.includes(storeServiceType)) return 1.0;
  return 0.0; // マッチしない場合
}

/**
 * 総合マッチングスコアの計算
 * 
 * @param scores 各項目のスコア
 * @param options カスタマイズオプション
 */
function calculateTotalScore(
  scores: Record<string, number>,
  options?: {
    prioritizeLocation?: boolean;
    prioritizeGuarantee?: boolean;
    customWeights?: Partial<Record<keyof typeof WEIGHTS, number>>;
  }
): number {
  // 基本の重み付けをコピー
  const weights = { ...WEIGHTS };
  
  // 特定項目の重み付けを調整（オプションによって）
  if (options) {
    // 地域優先
    if (options.prioritizeLocation) {
      weights.LOCATION = 35; // 地域の重みを増加
      // 他の項目を相対的に調整
      weights.AGE = 20;
      weights.BODY_TYPE = 10;
      weights.CUP_SIZE = 10;
      weights.GUARANTEE = 15;
      weights.SERVICE = 10;
    }
    
    // 給与優先
    if (options.prioritizeGuarantee) {
      weights.GUARANTEE = 35; // 給与の重みを増加
      // 他の項目を相対的に調整
      weights.AGE = 20;
      weights.BODY_TYPE = 10;
      weights.CUP_SIZE = 10;
      weights.LOCATION = 15;
      weights.SERVICE = 10;
    }
    
    // カスタム重み付けがあれば上書き
    if (options.customWeights) {
      Object.assign(weights, options.customWeights);
    }
  }
  
  // 重み付けスコアの計算
  let totalWeight = 0;
  let weightedScore = 0;
  
  for (const [key, score] of Object.entries(scores)) {
    const weight = weights[key as keyof typeof WEIGHTS] || 0;
    weightedScore += score * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

/**
 * タレントと店舗のマッチング理由の生成
 */
function generateMatchReasons(scores: Record<string, number>, storeProfile: any): string[] {
  const reasons: string[] = [];
  
  // 年齢によるマッチング
  if (scores.AGE > 0.9) reasons.push("年齢条件に完全に合致しています");
  else if (scores.AGE > 0.8) reasons.push("年齢条件に合致しています");
  else if (scores.AGE > 0.6) reasons.push("年齢条件にほぼ合致しています");
  
  // 地域によるマッチング
  if (scores.LOCATION === 1.0) reasons.push("あなたの現在地と同じエリアです");
  else if (scores.LOCATION > 0.8) reasons.push("あなたの希望エリアに含まれています");
  else if (scores.LOCATION > 0.5) reasons.push("あなたの希望エリアに近いエリアです");
  
  // 体型によるマッチング
  if (scores.BODY_TYPE > 0.9) reasons.push("あなたの体型条件に最適です");
  else if (scores.BODY_TYPE > 0.8) reasons.push("体型条件に合致しています");
  else if (scores.BODY_TYPE > 0.6) reasons.push("体型条件にほぼ合致しています");
  
  // カップサイズによるマッチング
  if (scores.CUP_SIZE > 0.9) reasons.push("スタイル条件に最適です");
  else if (scores.CUP_SIZE > 0.8) reasons.push("スタイル条件に合致しています");
  else if (scores.CUP_SIZE > 0.6) reasons.push("スタイル条件にほぼ合致しています");
  
  // 報酬によるマッチング
  if (scores.GUARANTEE === 1.0) reasons.push("あなたの希望報酬を上回る条件です");
  else if (scores.GUARANTEE > 0.9) reasons.push("希望報酬条件を満たしています");
  else if (scores.GUARANTEE > 0.7) reasons.push("希望報酬に近い条件です");
  
  // 業種によるマッチング
  if (scores.SERVICE === 1.0) reasons.push("あなたの希望業種に合致しています");
  else if (scores.SERVICE > 0.5) reasons.push("関連する業種です");
  
  // 店舗特有の魅力ポイント
  if (storeProfile.transportation_support) {
    reasons.push("交通費サポートあり");
  }
  
  if (storeProfile.housing_support) {
    reasons.push("宿泊サポートあり");
  }
  
  // 特典や待遇があれば追加
  if (storeProfile.benefits && storeProfile.benefits.length > 0) {
    // 特典の中から主要なものを最大2つまで追加
    const keyBenefits = [
      "日払い可", "週払い可", "寮完備", "未経験歓迎", "講習あり", "託児所あり", 
      "送迎あり", "個室待機", "自由出勤", "ノルマなし"
    ];
    
    const importantBenefits = storeProfile.benefits
      .filter((benefit: string) => keyBenefits.includes(benefit))
      .slice(0, 2);
    
    if (importantBenefits.length > 0) {
      reasons.push(`特典: ${importantBenefits.join('・')}`);
    }
  }
  
  // 特別オファーがあれば追加
  if (storeProfile.special_offers && storeProfile.special_offers.length > 0) {
    const firstOffer = storeProfile.special_offers[0];
    if (firstOffer && firstOffer.title) {
      reasons.push(`特別オファー: ${firstOffer.title}`);
    }
  }
  
  return reasons;
}

/**
 * AIマッチング検索の実行
 * 
 * @param userId タレントユーザーID
 * @param searchOptions 検索オプション
 * @returns マッチング結果リスト（スコア付き）
 */
export async function performAIMatching(userId: number, searchOptions?: any) {
  try {
    // ロギング用の検索オプション情報を安全に
    const safeSearchOptions = { ...searchOptions };
    log('info', 'AIマッチング検索開始', { 
      userId, 
      searchOptions: safeSearchOptions
    });
    
    // タレント情報を取得
    const [userResult] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
    if (!userResult) {
      log('error', 'ユーザーが見つかりません', { userId });
      return { error: 'ユーザーが見つかりません', matches: [] };
    }
    
    const [talentResult] = await db
      .select()
      .from(talentProfiles)
      .where(eq(talentProfiles.user_id, userId))
      .limit(1);
      
    if (!talentResult) {
      log('error', 'タレントプロフィールが見つかりません', { userId });
      return { error: 'タレントプロフィールが見つかりません', matches: [] };
    }
    
    // 年齢計算
    const birthDate = new Date(userResult.birth_date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear() - 
      (today.getMonth() < birthDate.getMonth() || 
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
    
    // スペック計算（身長-体重）
    let spec = 0;
    if (talentResult.height && talentResult.weight) {
      spec = calculateSpec(talentResult.height, talentResult.weight);
    }
    
    // ---- 希望条件の取得 ----
    
    // 希望報酬額 - クエリパラメータから取得、または標準値を使用
    // talentResult.desired_guaranteeはまだ実装されていないため、一旦代替値を使用
    const desiredGuarantee = searchOptions?.minGuarantee 
      ? parseInt(String(searchOptions.minGuarantee), 10) 
      : (talentResult.height ? talentResult.height * 100 : 20000); // 身長がなければデフォルト値
    
    // 希望業種 - クエリパラメータから取得、またはデフォルト空配列
    let serviceTypes: string[] = [];
    if (searchOptions?.serviceType) {
      serviceTypes = Array.isArray(searchOptions.serviceType) 
        ? searchOptions.serviceType 
        : [searchOptions.serviceType];
    }
    
    // 希望エリア - ユーザープロフィールから取得し、必要に応じてクエリパラメータで上書き
    let preferredLocations = userResult.preferred_locations || [];
    if (searchOptions?.location) {
      const locationParam = Array.isArray(searchOptions.location) 
        ? searchOptions.location 
        : [searchOptions.location];
      
      // 既存のpreferredLocationsとマージ（重複は除去）
      const uniqueLocations = new Set([...preferredLocations]);
      locationParam.forEach(loc => uniqueLocations.add(loc));
      preferredLocations = Array.from(uniqueLocations);
    }
    
    // 店舗情報の取得 - フィルター条件を適用
    let storeQuery = db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.status, 'published'));
    
    // 特定の地域でフィルタリング
    if (searchOptions?.filterByLocation) {
      storeQuery = storeQuery.where(eq(store_profiles.location, searchOptions.filterByLocation));
    }
    
    // 特定の業種でフィルタリング
    if (searchOptions?.filterByService) {
      storeQuery = storeQuery.where(eq(store_profiles.service_type, searchOptions.filterByService));
    }
    
    // 特定の保証額以上でフィルタリング
    if (searchOptions?.filterByMinGuarantee) {
      const minGuarantee = parseInt(searchOptions.filterByMinGuarantee, 10);
      if (!isNaN(minGuarantee)) {
        storeQuery = storeQuery.where(gte(store_profiles.minimum_guarantee, minGuarantee));
      }
    }
    
    const storeResults = await storeQuery;
    
    log('info', 'マッチング計算対象店舗数', {
      count: storeResults.length,
      desiredGuarantee,
      serviceTypes,
      preferredLocations: preferredLocations.length
    });
    
    // マッチング結果配列
    const matchResults = [];
    
    // カップサイズの数値化（評価用）
    const cupSizeValue: { [key: string]: number } = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9, 'J': 10, 'K': 11
    };
    
    // 各店舗とのマッチング計算
    for (const store of storeResults) {
      const scores: Record<string, number> = {};
      
      // 年齢スコア計算
      scores.AGE = calculateAgeScore(age, store.requirements?.age_min, store.requirements?.age_max);
      
      // スペックスコア計算
      scores.BODY_TYPE = calculateSpecScore(
        spec, 
        store.requirements?.spec_min, 
        store.requirements?.spec_max,
        store.requirements?.cup_size_conditions
      );
      
      // カップサイズスコア計算 - talentProfileからカップサイズを取得
      if (talentResult.cup_size && cupSizeValue[talentResult.cup_size]) {
        // 店舗側の希望カップサイズ条件があれば比較
        if (store.requirements?.cup_size_min && store.requirements?.cup_size_max) {
          const minCup = cupSizeValue[store.requirements.cup_size_min] || 0;
          const maxCup = cupSizeValue[store.requirements.cup_size_max] || 11;
          const talentCup = cupSizeValue[talentResult.cup_size];
          
          if (talentCup >= minCup && talentCup <= maxCup) {
            scores.CUP_SIZE = 1.0; // 完全マッチ
          } else {
            // 範囲外の場合、近さで評価
            const distFromRange = talentCup < minCup ? minCup - talentCup : talentCup - maxCup;
            scores.CUP_SIZE = Math.max(0, 1 - (distFromRange / 5)); // 5段階以上離れると0点
          }
        } else {
          scores.CUP_SIZE = 0.8; // 店舗側に条件がなければ高めのスコア
        }
      } else {
        scores.CUP_SIZE = 0.5; // カップサイズ情報がなければ中間スコア
      }
      
      // 地域スコア計算
      scores.LOCATION = calculateLocationScore(userResult.location, store.location, preferredLocations);
      
      // 報酬スコア計算
      scores.GUARANTEE = calculateGuaranteeScore(desiredGuarantee, store.minimum_guarantee, store.maximum_guarantee);
      
      // サービスタイプスコア計算
      scores.SERVICE = calculateServiceTypeScore(serviceTypes, store.service_type);
      
      // 総合スコア計算
      const totalScore = calculateTotalScore(scores);
      
      // マッチング理由生成
      const matchReasons = generateMatchReasons(scores, store);
      
      // 結果オブジェクトの構築
      const matchResult = {
        id: store.id,
        businessName: store.business_name,
        location: store.location,
        serviceType: store.service_type,
        catchPhrase: store.catch_phrase,
        description: store.description,
        minimumGuarantee: store.minimum_guarantee,
        maximumGuarantee: store.maximum_guarantee,
        transportationSupport: store.transportation_support,
        housingSupport: store.housing_support,
        workingHours: store.working_hours,
        benefits: store.benefits,
        matchScore: Math.round(totalScore * 100), // 0-100のスコアに変換
        matches: matchReasons,
      };
      
      matchResults.push(matchResult);
    }
    
    // スコア順にソート
    matchResults.sort((a, b) => b.matchScore - a.matchScore);
    
    log('info', 'AIマッチング結果生成完了', {
      totalMatches: matchResults.length,
      topScore: matchResults.length > 0 ? matchResults[0].matchScore : 0
    });
    
    return {
      matches: matchResults,
      totalMatches: matchResults.length
    };
  } catch (error) {
    log('error', 'AIマッチングエラー', { error, userId });
    return { error: 'マッチング処理中にエラーが発生しました', matches: [] };
  }
}