/**
 * サンプルデータ - 給与例と勤務時間に関連するサンプル情報
 * このデータは開発とテスト用途にのみ使用され、実際のアプリケーションでは使用されません
 */

import { SalaryExample, WorkingHoursInfo } from '../types/salary';

// 給与例のサンプルデータ
export const sampleSalaryExamples: SalaryExample[] = [
  {
    id: 'example-1',
    title: '平日6時間勤務',
    amount: 55000,
    hours: 6,
    formatted: '6時間勤務 = 55,000円',
    hourlyRate: 9167,
    hourlyFormatted: '時給換算: 9,167円'
  },
  {
    id: 'example-2',
    title: '休日8時間勤務',
    amount: 80000,
    hours: 8,
    formatted: '8時間勤務 = 80,000円',
    hourlyRate: 10000,
    hourlyFormatted: '時給換算: 10,000円'
  },
  {
    id: 'example-3',
    title: '短時間4時間勤務',
    amount: 40000,
    hours: 4,
    formatted: '4時間勤務 = 40,000円',
    hourlyRate: 10000,
    hourlyFormatted: '時給換算: 10,000円'
  }
];

// 勤務時間情報のサンプルデータ
export const sampleWorkingHours: WorkingHoursInfo = {
  system: '自由出勤制',
  days_available: ['月', '火', '水', '木', '金', '土', '日'],
  holidays: '自由（週1日以上の出勤をお願いしています）',
  min_hours: 4,
  max_hours: 8,
  shift_pattern: '11:00-19:00, 19:00-翌3:00'
};