import React from 'react';
import { SalaryExample } from '@/types/salary';
import { calculateHourlyRate } from '@/utils/salaryUtils';

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
  accentColor = '#41a0ff',
  mainColor = '#ff6b81'
}: SalaryExampleDisplayProps) {
  // 必要なデータがあるかチェック
  const hasHourlyRate = example.hourlyRate && example.hourlyRate > 0;
  const hasHours = example.hours || example.workingHours;
  const hasAmount = typeof example.amount === 'number' || (typeof example.amount === 'string' && example.amount);
  
  // 時給を計算（まだ計算されていない場合）
  const hourlyRate = hasHourlyRate 
    ? example.hourlyRate 
    : (hasHours && hasAmount 
      ? calculateHourlyRate(example.amount, example.hours || example.workingHours || 0) 
      : 0);
  
  // 金額を整形
  const formattedAmount = typeof example.amount === 'number' 
    ? example.amount.toLocaleString() 
    : example.amount;
    
  // 勤務時間と時給換算の表示テキスト
  const workingHoursText = hasHours 
    ? `${example.hours || example.workingHours}時間勤務` 
    : '';
    
  const hourlyRateText = hourlyRate > 0 
    ? `時給換算: ${hourlyRate.toLocaleString()}円` 
    : '';
  
  return (
    <div className="bg-white p-3 rounded-lg border shadow-sm">
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">{example.title || '給与例'}</p>
            <p className="text-sm text-gray-500">{example.conditions || ''}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: mainColor }}>
              {formattedAmount}円
            </p>
            {example.period && <p className="text-xs text-gray-500">{example.period}</p>}
          </div>
        </div>
        
        {/* 勤務時間と時給換算情報 */}
        {(workingHoursText || hourlyRateText) && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {workingHoursText || example.formatted || ''}
              </p>
              <p className="text-sm font-medium text-green-600">
                {hourlyRateText || example.hourlyFormatted || ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}