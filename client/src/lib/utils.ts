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
  // 時給換算形式が設定されている場合、そちらを優先表示
  if (workingTimeHours && workingTimeHours > 0 && averageHourlyPay && averageHourlyPay > 0) {
    const totalPay = workingTimeHours * averageHourlyPay;
    return `${workingTimeHours}時間勤務で平均給与${totalPay.toLocaleString()}円`;
  }
  
  // 従来の最低給与・最高給与表示
  if (min === null && max === null) return "応相談";
  if (max === null) return `${min?.toLocaleString()}円〜`;
  if (min === null) return `〜${max?.toLocaleString()}円`;
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