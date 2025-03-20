import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 給与表示のフォーマット
export function formatSalary(min?: number | null, max?: number | null): string {
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