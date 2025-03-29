import React from 'react';
import { SalaryExample } from '@types/salary';
import { processSalaryExample } from '@utils/salaryUtils';

interface SalaryExampleDisplayProps {
  example: SalaryExample;
  accentColor?: string;
  mainColor?: string;
}

/**
 * 給与例情報を表示するコンポーネント
 * 勤務時間と金額から自動的に時給計算して表示
 */
export default function SalaryExampleDisplay({
  example,
  accentColor = '#FF6B6B',
  mainColor = '#4A4A4A'
}: SalaryExampleDisplayProps) {
  // 給与データの処理
  const processedExample = React.useMemo(() => {
    return processSalaryExample(example);
  }, [example]);

  // 表示用のフォーマット済みデータ
  const {
    title,
    formatted,
    conditions,
    hourlyFormatted,
    period
  } = processedExample;

  // 期間表示のマッピング
  const periodDisplay = React.useMemo(() => {
    if (!period) return '';
    const periodMap: Record<string, string> = {
      hourly: '時給',
      daily: '日給',
      weekly: '週給',
      monthly: '月給',
      yearly: '年収'
    };
    return periodMap[period.toLowerCase()] || '';
  }, [period]);

  return (
    <div className="salary-example bg-white p-4 rounded-lg border shadow-sm">
      {/* 給与タイトル */}
      {title && (
        <h4 className="text-lg font-bold mb-2" style={{ color: mainColor }}>
          {title}
        </h4>
      )}

      {/* 給与額 */}
      <div className="flex items-baseline mb-2">
        <span className="text-sm mr-2">{periodDisplay}</span>
        <span className="text-2xl font-bold" style={{ color: accentColor }}>
          {formatted}
        </span>
      </div>

      {/* 時給換算 */}
      {hourlyFormatted && (
        <div className="text-sm bg-gray-50 p-2 rounded mb-2">
          <span className="font-medium">時給換算: </span>
          <span className="font-bold" style={{ color: accentColor }}>
            {hourlyFormatted}
          </span>
        </div>
      )}

      {/* 条件 */}
      {conditions && (
        <div className="text-sm text-gray-600 mt-2">
          <p>{conditions}</p>
        </div>
      )}
    </div>
  );
}