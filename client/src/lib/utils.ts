import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type ServiceType, serviceTypeLabels } from "@shared/schema"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 業種の日本語表示用ユーティリティ
export function getServiceTypeLabel(serviceType: ServiceType | "all"): string {
  if (serviceType === "all") return "全ての業種";
  return serviceTypeLabels[serviceType] || serviceType;
}

/**
 * 給与情報を計算・フォーマットする関数
 * 
 * @param min 最低給与
 * @param max 最高給与
 * @param workingTimeHours 勤務時間（時間）
 * @param averageHourlyPay 平均時給
 */
export function formatSalary(
  min?: number | null, 
  max?: number | null, 
  workingTimeHours?: number | null,
  averageHourlyPay?: number | null
): string {
  // 給与表示のロジックを統一
  const hasHourlyInfo = workingTimeHours && workingTimeHours > 0 && averageHourlyPay && averageHourlyPay > 0;
  const hasGuaranteeInfo = (min && min > 0) || (max && max > 0);

  // 完全な給与情報がある場合（時給換算可能 + 給与情報あり）
  if (hasHourlyInfo && hasGuaranteeInfo) {
    const hourlyRate = averageHourlyPay;
    const guaranteeText = formatGuaranteeRange(min, max);
    return `参考給与例 ${workingTimeHours}時間${averageHourlyPay.toLocaleString()}円（時給換算：${hourlyRate.toLocaleString()}円）`;
  }
  
  // 時給換算情報のみの場合
  if (hasHourlyInfo) {
    const hourlyRate = averageHourlyPay;
    return `参考給与例 ${workingTimeHours}時間${averageHourlyPay.toLocaleString()}円（時給換算：${hourlyRate.toLocaleString()}円）`;
  }
  
  // 給与情報のみの場合
  if (hasGuaranteeInfo) {
    return `参考給与例 ${formatGuaranteeRange(min, max)}`;
  }
  
  // どちらの情報もない場合
  return "参考給与例 応相談";
}

/**
 * 最低給与・最高給与の範囲を整形する関数
 * 
 * @param min 最低給与
 * @param max 最高給与
 */
function formatGuaranteeRange(min?: number | null, max?: number | null): string {
  if (!min && !max) return "応相談";
  if ((min === 0 || min === null) && (max === 0 || max === null)) return "応相談";
  
  if (!max || max === 0) {
    return `${min?.toLocaleString()}円〜`;
  }
  
  if (!min || min === 0) {
    return `〜${max.toLocaleString()}円`;
  }
  
  return `${min.toLocaleString()}円〜${max.toLocaleString()}円`;
}

// 日付フォーマットのユーティリティ
export function formatDate(date: Date | string | null): string {
  if (!date) return "未設定";
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// エラーメッセージの日本語化
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "予期せぬエラーが発生しました";
}