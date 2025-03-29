/**
 * 給与表示とデータ処理に関するユーティリティ関数
 */

import { SalaryExample } from '../types/salary';

/**
 * 給与例のデータを処理し、時給換算などの計算を行う
 * 
 * @param salaryExample 給与例データ
 * @returns 処理済みの給与例データ
 */
export function processSalaryExample(salaryExample: SalaryExample): SalaryExample {
  // ディープコピーを作成
  const processed = { ...salaryExample };
  
  // 数値に変換
  const amount = typeof processed.amount === 'string' 
    ? parseFloat(processed.amount.replace(/[^0-9.-]+/g, ''))
    : processed.amount || 0;
  
  // 時間情報を抽出（hours または workingHours から）
  const hours = processed.hours || processed.workingHours || 0;
  
  // 時給換算の計算
  if (amount > 0 && hours > 0) {
    // 期間に応じた時給計算
    let hourlyRate = 0;
    const period = processed.period || 'daily';
    
    switch (period.toLowerCase()) {
      case 'hourly':
        hourlyRate = amount;
        break;
      case 'daily':
        hourlyRate = amount / hours;
        break;
      case 'weekly':
        // 週の労働時間 = 1日の時間 * 週の日数(通常5日)
        hourlyRate = amount / (hours * 5);
        break;
      case 'monthly':
        // 月の労働時間 = 1日の時間 * 月の日数(通常20日)
        hourlyRate = amount / (hours * 20);
        break;
      case 'yearly':
        // 年の労働時間 = 1日の時間 * 年の日数(通常240日)
        hourlyRate = amount / (hours * 240);
        break;
      default:
        hourlyRate = amount / hours;
    }
    
    processed.hourlyRate = hourlyRate;
  }
  
  // 金額のフォーマット
  processed.formatted = formatCurrency(amount);
  
  // 時給換算のフォーマット
  if (processed.hourlyRate && processed.hourlyRate > 0) {
    processed.hourlyFormatted = formatCurrency(processed.hourlyRate) + '/時';
  }
  
  return processed;
}

/**
 * 金額を日本円形式にフォーマットする
 * 
 * @param amount 金額
 * @returns フォーマットされた金額文字列
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === 0) return '0円';
  
  // 千円以上なら千円単位で表示
  if (amount >= 1000) {
    return amount.toLocaleString('ja-JP') + '円';
  }
  
  return amount + '円';
}

/**
 * 給与情報のテキストから勤務時間と金額を抽出する
 * 例: "勤務時間6時間 平均給与55000円" → { hours: 6, amount: 55000 }
 * 
 * @param text 給与情報テキスト
 * @returns 抽出された勤務時間と金額
 */
export function extractHoursAndAmount(text: string): { hours: number; amount: number } {
  // デフォルト値
  const result = {
    hours: 0,
    amount: 0
  };
  
  // 勤務時間の抽出
  const hoursMatch = text.match(/勤務時間(\d+)時間/);
  if (hoursMatch && hoursMatch[1]) {
    result.hours = parseInt(hoursMatch[1], 10);
  }
  
  // 金額の抽出
  const amountMatch = text.match(/(平均)?(給与|日給|報酬|月給|給料)?(\d+)[,，]?(\d+)?円/);
  if (amountMatch) {
    // 3番目のキャプチャグループが金額の最初の部分
    let amountStr = amountMatch[3];
    
    // 4番目のキャプチャグループがある場合（カンマで区切られた数値の続き）
    if (amountMatch[4]) {
      amountStr += amountMatch[4];
    }
    
    result.amount = parseInt(amountStr, 10);
  }
  
  return result;
}

/**
 * 給与例の配列を処理する
 * 
 * @param examples 給与例の配列
 * @returns 処理済みの給与例配列
 */
export function processSalaryExamples(examples: SalaryExample[]): SalaryExample[] {
  if (!examples || !Array.isArray(examples)) return [];
  
  // 全ての例を処理
  return examples.map(example => processSalaryExample(example));
}

/**
 * テキスト形式の給与情報から給与例オブジェクトを生成する
 * 
 * @param text 給与情報テキスト
 * @returns 給与例オブジェクト
 */
export function createSalaryExampleFromText(text: string): SalaryExample {
  // 勤務時間と金額を抽出
  const { hours, amount } = extractHoursAndAmount(text);
  
  // 給与例オブジェクトを作成
  const example: SalaryExample = {
    title: text,
    amount,
    hours,
    period: 'daily'  // デフォルトは日給と仮定
  };
  
  // 処理を行って返却
  return processSalaryExample(example);
}