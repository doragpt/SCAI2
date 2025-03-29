/**
 * 給与情報の計算と表示を行うユーティリティ関数
 */

/**
 * 時給を計算する関数
 * @param amount 給与総額
 * @param hours 勤務時間
 * @returns 時給（整数に丸めた値）
 */
export function calculateHourlyRate(amount: number | string, hours: number | string): number {
  // 数値型に変換
  const numAmount = typeof amount === 'string' ? parseInt(amount.replace(/,/g, ''), 10) : amount;
  const numHours = typeof hours === 'string' ? parseInt(hours, 10) : hours;
  
  // 値のバリデーション
  if (isNaN(numAmount) || isNaN(numHours) || numHours <= 0 || numAmount <= 0) {
    return 0;
  }
  
  // 時給計算
  return Math.round(numAmount / numHours);
}

/**
 * フォーマットされた時給を含む給与情報テキストを生成する
 * @param amount 給与総額
 * @param hours 勤務時間
 * @returns フォーマットされた給与情報テキスト
 */
export function formatSalaryExampleWithHourlyRate(amount: number | string, hours: number | string): string {
  // 数値型に変換
  const numAmount = typeof amount === 'string' ? parseInt(amount.replace(/,/g, ''), 10) : amount;
  const numHours = typeof hours === 'string' ? parseInt(hours, 10) : hours;
  
  // 値のバリデーション
  if (isNaN(numAmount) || isNaN(numHours) || numHours <= 0 || numAmount <= 0) {
    return `${amount}円`;
  }
  
  // 時給計算
  const hourlyRate = calculateHourlyRate(numAmount, numHours);
  
  // 時給を含むテキストを生成
  return `${numAmount.toLocaleString()}円（${numHours}時間勤務 / 時給換算: ${hourlyRate.toLocaleString()}円）`;
}

/**
 * 給与例テキストから勤務時間と給与額を抽出する
 * 「勤務時間6時間　平均給与55000円」形式を想定
 * 
 * @param text 給与例テキスト
 * @returns {hours: number, amount: number} 抽出した時間と金額
 */
export function extractHoursAndAmountFromText(text: string): { hours: number, amount: number } {
  const hoursMatch = text.match(/勤務時間(\d+)時間/);
  const amountMatch = text.match(/平均給与(\d+)円/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const amount = amountMatch ? parseInt(amountMatch[1], 10) : 0;
  
  return { hours, amount };
}

/**
 * 給与例データを変換してフォーマットする
 * 単純な文字列や構造化されていないデータから必要な情報を抽出
 * 
 * @param example 給与例データ (文字列またはオブジェクト)
 * @returns 処理済みの給与例オブジェクト
 */
export function processSalaryExample(example: any): any {
  // すでに構造化されたデータの場合
  if (example && typeof example === 'object' && !Array.isArray(example)) {
    // 勤務時間と金額が直接含まれている場合は時給を計算
    if ((example.hours || example.workingHours) && example.amount) {
      const hours = example.hours || example.workingHours;
      const hourlyRate = calculateHourlyRate(example.amount, hours);
      
      return {
        ...example,
        hourlyRate,
        formatted: `${hours}時間勤務 = ${typeof example.amount === 'number' ? example.amount.toLocaleString() : example.amount}円`,
        hourlyFormatted: `時給換算: ${hourlyRate.toLocaleString()}円`
      };
    }
    
    // タイトルや説明から時間と金額を抽出
    if (example.title && typeof example.title === 'string') {
      const { hours, amount } = extractHoursAndAmountFromText(example.title);
      if (hours > 0 && amount > 0) {
        const hourlyRate = calculateHourlyRate(amount, hours);
        return {
          ...example,
          hours,
          amount,
          hourlyRate,
          formatted: `${hours}時間勤務 = ${amount.toLocaleString()}円`,
          hourlyFormatted: `時給換算: ${hourlyRate.toLocaleString()}円`
        };
      }
    }
    
    // それ以外の場合は元のデータを返す
    return example;
  }
  
  // 文字列の場合、フォーマットを解析
  if (typeof example === 'string') {
    const { hours, amount } = extractHoursAndAmountFromText(example);
    if (hours > 0 && amount > 0) {
      const hourlyRate = calculateHourlyRate(amount, hours);
      return {
        title: example,
        hours,
        amount,
        hourlyRate,
        formatted: `${hours}時間勤務 = ${amount.toLocaleString()}円`,
        hourlyFormatted: `時給換算: ${hourlyRate.toLocaleString()}円`
      };
    }
    
    // 解析できなかった場合
    return {
      title: example,
      formatted: example
    };
  }
  
  // その他の場合
  return {
    title: String(example),
    formatted: String(example)
  };
}