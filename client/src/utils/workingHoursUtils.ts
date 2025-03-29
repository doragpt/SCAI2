/**
 * 営業時間・勤務時間に関するユーティリティ関数
 */

/**
 * 営業時間のテキストを整形する関数
 * 「10:00-22:00」や「10時〜22時」などの様々な形式に対応
 * 
 * @param businessHours 営業時間テキスト
 * @returns 整形された営業時間テキスト
 */
export function formatBusinessHours(businessHours: string | null | undefined): string {
  if (!businessHours) return '応相談';
  
  // 一般的な形式を検出
  if (/\d{1,2}[:：]\d{2}[-〜～~]\d{1,2}[:：]\d{2}/.test(businessHours)) {
    return businessHours;
  }
  
  // 「10時-22時」のような形式を「10:00-22:00」に変換
  businessHours = businessHours.replace(/(\d{1,2})時/g, '$1:00');
  
  // 区切り文字を統一
  businessHours = businessHours.replace(/[〜～~]/g, '-');
  
  return businessHours;
}

/**
 * 勤務時間の情報を解析・整形する関数
 * 
 * @param workingHours 勤務時間情報
 * @param workingTimeHours 一日の勤務時間テキスト
 * @returns 整形された勤務時間情報
 */
export function parseWorkingHours(
  workingHours: any, 
  workingTimeHours?: string | null
): { 
  formattedHours: string, 
  isFlexible: boolean, 
  hoursRange: string 
} {
  // デフォルト値
  let formattedHours = workingTimeHours || '応相談';
  let isFlexible = true;
  let hoursRange = '';
  
  // テキスト形式の場合
  if (typeof workingHours === 'string') {
    return {
      formattedHours,
      isFlexible,
      hoursRange: workingHours
    };
  }
  
  // オブジェクト形式の場合
  if (workingHours && typeof workingHours === 'object') {
    // 具体的な時間範囲がある場合
    if (workingHours.start_time && workingHours.end_time) {
      hoursRange = `${workingHours.start_time}～${workingHours.end_time}`;
      isFlexible = false;
    }
    
    // シフトパターンがある場合
    if (workingHours.shift_pattern) {
      hoursRange = workingHours.shift_pattern;
    }
    
    // 最小・最大時間がある場合
    if (workingHours.min_hours && workingHours.max_hours) {
      formattedHours = `${workingHours.min_hours}～${workingHours.max_hours}時間`;
    }
  }
  
  return { formattedHours, isFlexible, hoursRange };
}

/**
 * 勤務可能曜日の配列を整形する関数
 * 
 * @param daysAvailable 勤務可能曜日の配列（様々な形式に対応）
 * @returns 整形された曜日配列 [0, 1, 2, 3, 4, 5, 6] または ['月', '火', '水', '木', '金', '土', '日']
 */
export function normalizeDaysAvailable(daysAvailable: any): (string | number)[] {
  if (!daysAvailable) return ['月', '火', '水', '木', '金', '土', '日'];
  
  // すでに配列の場合
  if (Array.isArray(daysAvailable)) {
    return daysAvailable;
  }
  
  // カンマ区切りのテキストの場合
  if (typeof daysAvailable === 'string') {
    return daysAvailable.split(/[,、]/);
  }
  
  // その他の場合はデフォルト値を返す
  return ['月', '火', '水', '木', '金', '土', '日'];
}