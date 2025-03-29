/**
 * 給与情報と勤務時間関連の型定義
 */

// 給与例データの型
export interface SalaryExample {
  // 基本情報
  id?: string;
  title?: string;
  conditions?: string;
  amount: number | string;
  period?: string;
  
  // 勤務時間と時給換算に関する情報
  hours?: number;
  workingHours?: number; // 別名
  hourlyRate?: number;
  
  // 処理済みの表示用フィールド
  formatted?: string;
  hourlyFormatted?: string;
}

// 勤務時間情報の型
export interface WorkingHoursInfo {
  system?: string;
  days_available?: (string | number)[];
  holidays?: string;
  start_date?: string;
  min_hours?: number;
  max_hours?: number;
  shift_pattern?: string;
}