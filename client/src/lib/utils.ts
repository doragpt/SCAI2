import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type ServiceType } from "@shared/schema"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 業種の日本語表示用ユーティリティ
export function getServiceTypeLabel(serviceType: ServiceType | "all"): string {
  const serviceTypeMap: Record<ServiceType | "all", string> = {
    'deriheru': 'デリバリーヘルス',
    'hoteheru': 'ホテヘル',
    'hakoheru': '箱ヘル',
    'esthe': 'エステ',
    'onakura': 'オナクラ',
    'mseikan': 'メンズエステ',
    'all': '全ての業種'
  };
  return serviceTypeMap[serviceType] || serviceType;
}

// 給与表示のフォーマット
export function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return "応相談";
  if (!max) return `${min?.toLocaleString()}円〜`;
  if (!min) return `〜${max?.toLocaleString()}円`;
  return `${min?.toLocaleString()}円 〜 ${max?.toLocaleString()}円`;
}

// 日付フォーマットのユーティリティ
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}