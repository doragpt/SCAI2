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
 */
function calculateTotalScore(scores: Record<string, number>): number {
  let totalWeight = 0;
  let weightedScore = 0;
  
  for (const [key, score] of Object.entries(scores)) {
    const weight = WEIGHTS[key as keyof typeof WEIGHTS] || 0;
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
  
  if (scores.AGE > 0.8) reasons.push("年齢条件に合致しています");
  if (scores.LOCATION > 0.8) reasons.push("希望エリアに合致しています");
  if (scores.BODY_TYPE > 0.8) reasons.push("体型条件に合致しています");
  if (scores.CUP_SIZE > 0.8) reasons.push("スタイル条件に合致しています");
  if (scores.GUARANTEE > 0.8) reasons.push("希望報酬条件を満たしています");
  if (scores.SERVICE === 1.0) reasons.push("希望業種に合致しています");
  
  // 店舗特有の魅力ポイント
  if (storeProfile.benefits && storeProfile.benefits.length > 0) {
    if (storeProfile.benefits.includes("transportation_support")) {
      reasons.push("交通費サポートあり");
    }
    if (storeProfile.benefits.includes("housing_support")) {
      reasons.push("宿泊サポートあり");
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
    
    // 希望報酬額（デフォルト値を設定）
    // talentProfileには直接desired_guaranteeがないので固定値を設定
    const desiredGuarantee = 20000;
    
    // 希望業種取得（デフォルト空配列）
    // talentProfileには直接service_typesがないため、対応するものがあれば設定
    const serviceTypes: string[] = [];
    
    // 希望エリア取得
    const preferredLocations = userResult.preferred_locations || [];
    
    // 店舗情報の取得
    const storeResults = await db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.status, 'published'));
      
    // マッチング結果配列
    const matchResults = [];
    
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
      
      // カップサイズスコア（現在は仮スコア、データが利用可能になったら拡張）
      scores.CUP_SIZE = 0.5;
      
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
        benefits: store.benefits,
        matchScore: Math.round(totalScore * 100), // 0-100のスコアに変換
        matches: matchReasons,
      };
      
      matchResults.push(matchResult);
    }
    
    // スコア順にソート
    matchResults.sort((a, b) => b.matchScore - a.matchScore);
    
    return {
      matches: matchResults,
      totalMatches: matchResults.length
    };
  } catch (error) {
    log('error', 'AIマッチングエラー', { error, userId });
    return { error: 'マッチング処理中にエラーが発生しました', matches: [] };
  }
}