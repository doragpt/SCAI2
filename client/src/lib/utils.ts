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

// 給与表示のフォーマット
export function formatSalary(
  min?: number | null, 
  max?: number | null, 
  workingTimeHours?: number | null,
  averageHourlyPay?: number | null
): string {
  // 給与表示のロジックを統一

  // 1. 時給換算情報がある場合のフォーマット
  if (workingTimeHours && workingTimeHours > 0 && averageHourlyPay && averageHourlyPay > 0) {
    // 時給を計算
    const hourlyRate = Math.round(averageHourlyPay / workingTimeHours);
    
    // 最低・最高保証もある場合は、両方の情報を表示
    if ((min && min > 0) || (max && max > 0)) {
      const guaranteeText = formatGuaranteeRange(min, max);
      return `${guaranteeText}（${workingTimeHours}時間勤務 / 時給換算${hourlyRate.toLocaleString()}円）`;
    }
    
    // 時給換算のみの場合
    return `${workingTimeHours}時間勤務で${averageHourlyPay.toLocaleString()}円（時給換算${hourlyRate.toLocaleString()}円）`;
  }
  
  // 2. 従来の最低保証・最高保証のみの場合
  return formatGuaranteeRange(min, max);
}

// 最低保証・最高保証の範囲を整形する補助関数
function formatGuaranteeRange(min?: number | null, max?: number | null): string {
  if (min === null && max === null) return "応相談";
  if (min === 0 && max === 0) return "応相談";
  if (max === null || max === 0) return `${min?.toLocaleString()}円〜`;
  if (min === null || min === 0) return `〜${max?.toLocaleString()}円`;
  return `${min?.toLocaleString()}円 〜 ${max?.toLocaleString()}円`;
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