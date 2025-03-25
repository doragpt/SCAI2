import { db } from '../db';
import { store_profiles, talentProfiles, users } from '../../shared/schema';
import { eq, and, gte, lte, inArray, like } from 'drizzle-orm';
import { log } from '../utils/logger';

/**
 * マッチングスコア計算のための重み付け
 */
const WEIGHTS = {
  AGE: 25,                 // 年齢要件の重み
  LOCATION: 20,            // 地域の重み
  BODY_TYPE: 10,           // 体型の重み
  CUP_SIZE: 10,            // カップサイズの重み
  GUARANTEE: 15,           // 最低保証の重み
  SERVICE: 10,             // サービスタイプの重み
  TATTOO: 3,               // タトゥー許容レベルの重み
  HAIR_COLOR: 3,           // 髪色の重み
  APPEARANCE: 4,           // 外見スタイルの重み
  TITLES: 0,               // タイトル（特別経験）の重み - 基本スコアには含めず、必要な場合にのみ使用
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
 * 詳細な体型分類によるマッチングスコア計算
 */
function calculateBodyTypeScore(talentSpec: number, preferredBodyTypes?: string[] | null): number {
  if (!preferredBodyTypes || preferredBodyTypes.length === 0) return 1.0; // 条件なしは満点
  
  // スペックから体型カテゴリを決定
  let talentBodyType: string = "";
  if (talentSpec >= 110) talentBodyType = "スリム";
  else if (talentSpec >= 105) talentBodyType = "やや細め";
  else if (talentSpec >= 100) talentBodyType = "普通";
  else if (talentSpec >= 95) talentBodyType = "やや太め";
  else if (talentSpec >= 90) talentBodyType = "グラマー";
  else talentBodyType = "ぽっちゃり";
  
  // 完全一致
  if (preferredBodyTypes.includes(talentBodyType)) return 1.0;
  
  // 近い体型へのマッチングスコア
  const bodyTypeRanking = ["スリム", "やや細め", "普通", "やや太め", "グラマー", "ぽっちゃり"];
  const talentIndex = bodyTypeRanking.indexOf(talentBodyType);
  
  if (talentIndex === -1) return 0.5; // カテゴリが見つからない場合は中間スコア
  
  // 最も近い好みの体型を見つける
  let closestDistance = bodyTypeRanking.length;
  for (const bodyType of preferredBodyTypes) {
    const preferredIndex = bodyTypeRanking.indexOf(bodyType);
    if (preferredIndex !== -1) {
      const distance = Math.abs(talentIndex - preferredIndex);
      closestDistance = Math.min(closestDistance, distance);
    }
  }
  
  // 距離に基づいてスコアを計算（最大距離は5）
  return Math.max(0.3, 1 - (closestDistance * 0.15)); // 最低でも0.3点はつける
}

/**
 * タトゥー/傷の許容レベルによるマッチングスコア計算
 */
function calculateTattooScore(talentTattooLevel: string, storeTattooAcceptance?: string | null): number {
  if (!storeTattooAcceptance) return 1.0; // 条件なしは満点
  
  // タトゥーレベル順序
  const tattooLevels = ["なし", "目立たない", "目立つ", "要相談"];
  const talentIndex = tattooLevels.indexOf(talentTattooLevel);
  const storeIndex = tattooLevels.indexOf(storeTattooAcceptance);
  
  if (talentIndex === -1 || storeIndex === -1) return 0.5; // 不明なレベルの場合は中間スコア
  
  // 店舗の許容レベル以下なら満点
  if (talentIndex <= storeIndex) return 1.0;
  
  // 許容範囲を超えている場合、距離に応じてスコア減少
  const distance = talentIndex - storeIndex;
  return Math.max(0, 1 - (distance * 0.3)); // 許容範囲を1つ超えるごとに0.3下がる
}

/**
 * 髪色によるマッチングスコア計算
 */
function calculateHairColorScore(talentHairColor: string, preferredHairColors?: string[] | null): number {
  if (!preferredHairColors || preferredHairColors.length === 0) return 1.0; // 条件なしは満点
  
  // 完全一致
  if (preferredHairColors.includes(talentHairColor)) return 1.0;
  
  // 髪色の近さによるスコア
  const hairColorRanking = ["黒髪", "茶髪（暗め）", "茶髪（明るめ）", "金髪・カラー"];
  const talentIndex = hairColorRanking.indexOf(talentHairColor);
  
  if (talentIndex === -1) return 0.5; // 不明な髪色の場合は中間スコア
  
  // 最も近い好みの髪色を見つける
  let closestDistance = hairColorRanking.length;
  for (const hairColor of preferredHairColors) {
    const preferredIndex = hairColorRanking.indexOf(hairColor);
    if (preferredIndex !== -1) {
      const distance = Math.abs(talentIndex - preferredIndex);
      closestDistance = Math.min(closestDistance, distance);
    }
  }
  
  // 距離に基づいてスコアを計算
  return Math.max(0.3, 1 - (closestDistance * 0.2)); // 最低でも0.3点はつける
}

/**
 * 外見スタイルによるマッチングスコア計算
 */
function calculateLookTypeScore(talentLookType: string, preferredLookTypes?: string[] | null): number {
  if (!preferredLookTypes || preferredLookTypes.length === 0) return 1.0; // 条件なしは満点
  
  // 完全一致
  if (preferredLookTypes.includes(talentLookType)) return 1.0;
  
  // 似た系統の外見スタイルグループを定義（近い系統でグループ化）
  const lookTypeGroups = [
    ["ロリ系・素人系・素朴系・可愛い系"], // かわいい系グループ
    ["清楚系", "モデル系"], // きれい系グループ
    ["ギャル系"], // ギャル系単体グループ
    ["お姉さん系（20代後半〜30代前半）", "大人系（30代〜）"], // 大人系グループ
    ["熟女系（40代〜）"], // 熟女系単体グループ
    ["ぽっちゃり系"] // ぽっちゃり系単体グループ
  ];
  
  // タレントのスタイルが属するグループを特定
  const talentGroup = lookTypeGroups.findIndex(group => group.includes(talentLookType));
  
  if (talentGroup === -1) return 0.5; // 不明なスタイルの場合は中間スコア
  
  // 好みのスタイルが同じグループにあるかチェック
  for (const lookType of preferredLookTypes) {
    if (lookTypeGroups[talentGroup].includes(lookType)) {
      return 0.9; // 同じグループ内で異なるスタイルの場合は高めのスコア
    }
  }
  
  // 異なるグループだが、近いグループを探す
  for (const lookType of preferredLookTypes) {
    // 各グループをチェック
    for (let i = 0; i < lookTypeGroups.length; i++) {
      if (lookTypeGroups[i].includes(lookType)) {
        // グループ間の距離を計算（この例では隣接＝1、2つ離れる＝2など）
        const distance = Math.abs(talentGroup - i);
        // 近いグループほど高いスコア
        return Math.max(0.4, 1 - (distance * 0.2)); // 最低でも0.4点
      }
    }
  }
  
  return 0.3; // デフォルト（マッチしない場合）
}

/**
 * タイトル（特別経験）によるボーナススコア計算
 */
function calculateTitleBonus(talentTitles: string[], prioritizeTitles: boolean): number {
  if (!prioritizeTitles || !talentTitles || talentTitles.length === 0) return 0;
  
  const importantTitles = ["女優経験", "アイドル経験", "モデル経験", "タレント経験"];
  
  // 重要なタイトルを持っているかチェック
  for (const title of talentTitles) {
    if (importantTitles.some(imp => title.includes(imp))) {
      return 1.0; // 完全ボーナス
    }
  }
  
  return 0; // ボーナスなし
}

/**
 * 地域によるマッチングスコア計算
 */
function calculateLocationScore(talentLocation: string, storeLocation: string, talentPreferredLocations: string[]): number {
  // 完全一致
  if (talentLocation === storeLocation) return 1.0;
  
  // 希望エリアに含まれている
  if (talentPreferredLocations.includes(storeLocation)) return 0.8;
  
  // 地域グループによる近接度スコア
  const areaGroups = {
    // 関東圏
    kanto: ["東京都", "神奈川県", "埼玉県", "千葉県", "茨城県", "栃木県", "群馬県"],
    // 関西圏
    kansai: ["大阪府", "京都府", "兵庫県", "滋賀県", "奈良県", "和歌山県"],
    // 東海圏
    tokai: ["愛知県", "静岡県", "岐阜県", "三重県"],
    // 九州圏
    kyushu: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県"],
    // 東北圏
    tohoku: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
    // 北海道
    hokkaido: ["北海道"],
    // 中国・四国圏
    chugoku_shikoku: ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"],
    // 北陸・甲信越
    hokuriku_koshinetsu: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県"]
  };
  
  // 同じエリアグループ内かどうかチェック
  let talentGroup = "";
  let storeGroup = "";
  
  for (const [group, prefectures] of Object.entries(areaGroups)) {
    if (prefectures.includes(talentLocation)) {
      talentGroup = group;
    }
    if (prefectures.includes(storeLocation)) {
      storeGroup = group;
    }
  }
  
  // 同じグループ内なら0.6
  if (talentGroup && storeGroup && talentGroup === storeGroup) {
    return 0.6;
  }
  
  // 特別な近接関係（例：関東と東海など）
  const neighborGroups: Record<string, string[]> = {
    kanto: ["tokai", "hokuriku_koshinetsu"],
    kansai: ["tokai", "chugoku_shikoku"],
    tokai: ["kanto", "kansai", "hokuriku_koshinetsu"],
    kyushu: ["chugoku_shikoku"],
    tohoku: ["kanto", "hokkaido", "hokuriku_koshinetsu"],
    hokkaido: ["tohoku"],
    chugoku_shikoku: ["kansai", "kyushu"],
    hokuriku_koshinetsu: ["kanto", "tokai", "tohoku"]
  };
  
  // 隣接グループなら0.4
  if (talentGroup && storeGroup && neighborGroups[talentGroup]?.includes(storeGroup)) {
    return 0.4;
  }
  
  return 0.2; // デフォルト値（関連性が低い）
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
 * @param userPreferences ユーザーの選好データ
 */
function calculateTotalScore(
  scores: Record<string, number>,
  options?: {
    prioritizeLocation?: boolean;
    prioritizeGuarantee?: boolean;
    prioritizeAppearance?: boolean;
    prioritizeWorkConditions?: boolean;
    learningFactor?: number; // 学習係数 (0.0 〜 1.0)
    customWeights?: Partial<Record<keyof typeof WEIGHTS, number>>;
  },
  userPreferences?: {
    previousMatches?: Array<{
      storeId: number;
      interactionType: 'applied' | 'viewed' | 'kept' | 'rejected';
      timestamp: Date;
    }>;
    preferredStoreTypes?: string[];
    weightAdjustments?: Partial<Record<keyof typeof WEIGHTS, number>>;
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
      weights.AGE = 15;
      weights.BODY_TYPE = 10;
      weights.CUP_SIZE = 10;
      weights.GUARANTEE = 15;
      weights.SERVICE = 10;
      weights.TATTOO = 2;
      weights.HAIR_COLOR = 2;
      weights.APPEARANCE = 1;
    }
    
    // 給与優先
    if (options.prioritizeGuarantee) {
      weights.GUARANTEE = 35; // 給与の重みを増加
      // 他の項目を相対的に調整
      weights.AGE = 15;
      weights.BODY_TYPE = 10;
      weights.CUP_SIZE = 10;
      weights.LOCATION = 15;
      weights.SERVICE = 10;
      weights.TATTOO = 2;
      weights.HAIR_COLOR = 2;
      weights.APPEARANCE = 1;
    }
    
    // 外見優先
    if (options.prioritizeAppearance) {
      weights.APPEARANCE = 25;
      weights.HAIR_COLOR = 15;
      weights.BODY_TYPE = 20;
      weights.CUP_SIZE = 15;
      weights.AGE = 15;
      weights.LOCATION = 5;
      weights.GUARANTEE = 5;
      weights.SERVICE = 0;
    }
    
    // 勤務条件優先
    if (options.prioritizeWorkConditions) {
      weights.SERVICE = 25;
      weights.GUARANTEE = 25;
      weights.LOCATION = 20;
      weights.AGE = 10;
      weights.BODY_TYPE = 5;
      weights.CUP_SIZE = 5;
      weights.APPEARANCE = 5;
      weights.HAIR_COLOR = 2.5;
      weights.TATTOO = 2.5;
    }
    
    // カスタム重み付けがあれば上書き
    if (options.customWeights) {
      Object.assign(weights, options.customWeights);
    }
  }
  
  // ユーザーの過去の行動に基づく重み付け調整
  if (userPreferences && userPreferences.weightAdjustments) {
    const learningFactor = options?.learningFactor || 0.3; // デフォルト学習係数
    
    // ユーザー個別の重み付け調整を適用（学習係数で影響度を調整）
    for (const [key, adjustment] of Object.entries(userPreferences.weightAdjustments)) {
      const weightKey = key as keyof typeof WEIGHTS;
      const currentWeight = weights[weightKey] || 0;
      // 現在の重みに学習係数で調整した個別調整を加える
      weights[weightKey] = currentWeight + (adjustment * learningFactor);
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
  
  // タトゥー/傷の条件によるマッチング
  if (scores.TATTOO === 1.0) reasons.push("タトゥー/傷の条件に合致しています");
  else if (scores.TATTOO > 0.7) reasons.push("タトゥー/傷の条件にほぼ合致しています");
  
  // 髪色によるマッチング
  if (scores.HAIR_COLOR === 1.0) reasons.push("希望の髪色タイプです");
  else if (scores.HAIR_COLOR > 0.8) reasons.push("髪色条件に合致しています");
  
  // 外見スタイルによるマッチング
  if (scores.APPEARANCE === 1.0) reasons.push("希望の外見タイプに完全一致");
  else if (scores.APPEARANCE > 0.8) reasons.push("希望の外見タイプに合致");
  else if (scores.APPEARANCE > 0.6) reasons.push("外見タイプが近いです");
  
  // タイトル（特別経験）によるボーナス
  if (scores.TITLES === 1.0) reasons.push("芸能/モデル経験者優遇店舗");
  
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
    // 他の場所で再宣言を避けるため、letを使用
    let talentAge = today.getFullYear() - birthDate.getFullYear() - 
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
      // 型の問題を回避するために型アサーションを使用
      locationParam.forEach((loc: any) => {
        if (typeof loc === 'string') {
          // 型安全に処理するために明示的に型をキャスト
          uniqueLocations.add(loc as any);
        }
      });
      preferredLocations = Array.from(uniqueLocations) as string[];
    }
    
    // 店舗情報の取得 - フィルター条件を適用
    // 条件を配列として構築
    const conditions = [eq(store_profiles.status, 'published')];
    
    // 特定の地域でフィルタリング
    if (searchOptions?.filterByLocation) {
      conditions.push(eq(store_profiles.location, searchOptions.filterByLocation));
    }
    
    // 特定の業種でフィルタリング
    if (searchOptions?.filterByService) {
      conditions.push(eq(store_profiles.service_type, searchOptions.filterByService));
    }
    
    // 特定の保証額以上でフィルタリング
    if (searchOptions?.filterByMinGuarantee) {
      const minGuarantee = parseInt(searchOptions.filterByMinGuarantee, 10);
      if (!isNaN(minGuarantee)) {
        conditions.push(gte(store_profiles.minimum_guarantee, minGuarantee));
      }
    }
    
    // すべての条件を AND で結合
    const storeQuery = db
      .select()
      .from(store_profiles)
      .where(and(...conditions));
    
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
      
      // 年齢スコア計算 - 既に計算済みのtalentAgeを使用
      scores.AGE = calculateAgeScore(talentAge, store.requirements?.age_min, store.requirements?.age_max);
      
      // スペックスコア計算
      scores.BODY_TYPE = calculateSpecScore(
        spec, 
        store.requirements?.spec_min, 
        store.requirements?.spec_max,
        store.requirements?.cup_size_conditions
      );
      
      // 詳細な体型分類によるスコア計算
      if (store.requirements?.preferred_body_types && store.requirements.preferred_body_types.length > 0) {
        // 体型詳細分類スコアを優先
        scores.BODY_TYPE = calculateBodyTypeScore(spec, store.requirements.preferred_body_types);
      }
      
      // カップサイズスコア計算 - talentProfileからカップサイズを取得
      if (talentResult.cup_size && cupSizeValue[talentResult.cup_size]) {
        // カップサイズ特別条件があれば、そちらを優先的にチェック
        if (store.requirements?.cup_size_conditions && store.requirements.cup_size_conditions.length > 0) {
          // カップサイズ特別条件から該当するものを探す
          const matchingCondition = store.requirements.cup_size_conditions.find(
            (condition: any) => condition.cup_size === talentResult.cup_size
          );
          
          if (matchingCondition) {
            // 該当する特別条件が見つかった場合
            scores.CUP_SIZE = 1.0; // 完全一致
          } else {
            // 特別条件はあるが、該当しない場合
            scores.CUP_SIZE = 0.6; // 中間値
          }
        } else {
          // カップサイズ特別条件がない場合は、一般的な評価
          scores.CUP_SIZE = 0.8; // 店舗側に条件がなければ高めのスコア
        }
      } else {
        scores.CUP_SIZE = 0.5; // カップサイズ情報がなければ中間スコア
      }
      
      // タトゥー許容レベルスコア計算
      if (talentResult.body_mark?.has_body_mark && store.requirements?.tattoo_acceptance) {
        // 体のマークがある場合、タトゥーありとして判定
        // 詳細に応じてタトゥーレベルを判定（目立つか目立たないか）
        const talentTattooLevel = talentResult.body_mark.details?.includes("目立つ") ? "目立つ" : "目立たない";
        scores.TATTOO = calculateTattooScore(
          talentTattooLevel,
          store.requirements.tattoo_acceptance
        );
      } else {
        scores.TATTOO = 1.0; // 条件がなければ満点または体のマークがない場合
      }
      
      // 髪色スコア計算
      // プロフィールから髪色を直接取得
      let hairColor = talentResult.hair_color || "黒髪"; // 設定されていない場合はデフォルト値
      
      // 髪色の値を計算用のラベルに変換
      let estimatedHairColor;
      switch (hairColor) {
        case "黒髪":
          estimatedHairColor = "黒髪";
          break;
        case "暗めの茶髪":
          estimatedHairColor = "暗めの茶髪";
          break;
        case "明るめの茶髪":
          estimatedHairColor = "明るめの茶髪";
          break;
        case "金髪・インナーカラー・派手髪":
          estimatedHairColor = "金髪・インナーカラー・派手髪";
          break;
        default:
          // 写真や注釈から推測（フォールバック）
          if (talentResult.notes?.includes("金髪") || talentResult.notes?.includes("カラー")) {
            estimatedHairColor = "金髪・インナーカラー・派手髪";
          } else if (talentResult.notes?.includes("明るめ")) {
            estimatedHairColor = "明るめの茶髪";
          } else if (talentResult.notes?.includes("茶髪")) {
            estimatedHairColor = "暗めの茶髪";
          } else {
            estimatedHairColor = "黒髪"; // デフォルト値
          }
          break;
      }
      
      if (store.requirements?.preferred_hair_colors) {
        scores.HAIR_COLOR = calculateHairColorScore(
          estimatedHairColor,
          store.requirements.preferred_hair_colors
        );
      } else {
        scores.HAIR_COLOR = 1.0; // 条件がなければ満点
      }
      
      // 外見スタイルスコア計算
      // プロフィールから外見タイプを直接取得
      let lookType = talentResult.look_type || null;
      
      // 外見タイプが設定されていない場合は基本情報から推定
      let estimatedLookType;
      
      if (lookType) {
        // プロフィールで設定されたlook_typeを使用
        estimatedLookType = lookType;
      } else {
        // 基本情報から推定する（フォールバック処理）
        estimatedLookType = "普通系";
        const height = talentResult.height || 0;
        const weight = talentResult.weight || 0;
        
        if (talentAge < 23) {
          estimatedLookType = "ロリ系・素人系・素朴系・可愛い系";
        } else if (talentAge >= 23 && talentAge < 28) {
          if (talentResult.notes?.includes("モデル") || talentResult.notes?.includes("美人")) {
            estimatedLookType = "綺麗系・キレカワ系・モデル系・お姉さん系";
          } else if (height > 165 && weight < 50) {
            estimatedLookType = "綺麗系・キレカワ系・モデル系・お姉さん系";
          }
        } else if (talentAge >= 28 && talentAge < 35) {
          estimatedLookType = "お姉さん系（20代後半〜30代前半）";
        } else if (talentAge >= 35 && talentAge < 40) {
          estimatedLookType = "大人系（30代〜）";
        } else if (talentAge >= 40) {
          estimatedLookType = "熟女系（40代〜）";
        }
        
        // スペックから体型を判定
        if (weight > height - 90) {
          estimatedLookType = "ぽっちゃり系";
        }
      }
      
      if (store.requirements?.preferred_look_types) {
        scores.APPEARANCE = calculateLookTypeScore(
          estimatedLookType,
          store.requirements.preferred_look_types
        );
      } else {
        scores.APPEARANCE = 1.0; // 条件がなければ満点
      }
      
      // タイトル優先ボーナスの計算
      // 特別経験の有無を判定（自己紹介文から推定）
      const titles: string[] = [];
      if (talentResult.self_introduction) {
        if (talentResult.self_introduction.includes("女優")) titles.push("女優経験");
        if (talentResult.self_introduction.includes("アイドル")) titles.push("アイドル経験");
        if (talentResult.self_introduction.includes("モデル")) titles.push("モデル経験");
        if (talentResult.self_introduction.includes("タレント")) titles.push("タレント経験");
      }
      
      if (store.requirements?.prioritize_titles && titles.length > 0) {
        scores.TITLES = calculateTitleBonus(
          titles,
          store.requirements.prioritize_titles
        );
      } else {
        scores.TITLES = 0; // ボーナスなし
      }
      
      // 地域スコア計算
      scores.LOCATION = calculateLocationScore(userResult.location, store.location, preferredLocations);
      
      // 報酬スコア計算
      scores.GUARANTEE = calculateGuaranteeScore(desiredGuarantee, store.minimum_guarantee, store.maximum_guarantee);
      
      // サービスタイプスコア計算
      scores.SERVICE = calculateServiceTypeScore(serviceTypes, store.service_type);
      
      // 総合スコア計算（重み付けオプション適用）
      const scoreOptions = {
        prioritizeLocation: searchOptions?.prioritizeLocation === true,
        prioritizeGuarantee: searchOptions?.prioritizeGuarantee === true,
      };
      const totalScore = calculateTotalScore(scores, scoreOptions);
      
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