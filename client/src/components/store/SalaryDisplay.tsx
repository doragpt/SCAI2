import { formatSalary } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Award, CreditCard } from "lucide-react";

interface SalaryDisplayProps {
  minimumGuarantee?: number | null;
  maximumGuarantee?: number | null;
  workingTimeHours?: number | null;
  averageHourlyPay?: number | null;
  transportationSupport?: boolean;
  housingSupport?: boolean;
  benefits?: string[];
  className?: string;
}

/**
 * 給与情報表示コンポーネント
 * 給与と福利厚生をまとめて表示する
 */
export function SalaryDisplay({
  minimumGuarantee,
  maximumGuarantee,
  workingTimeHours,
  averageHourlyPay,
  transportationSupport,
  housingSupport,
  benefits,
  className = "",
}: SalaryDisplayProps) {
  // 時給計算
  const hourlyRate = 
    workingTimeHours && workingTimeHours > 0 && averageHourlyPay && averageHourlyPay > 0
      ? Math.round(averageHourlyPay / workingTimeHours)
      : null;

  const hasAnyBenefit = 
    (benefits && benefits.length > 0) || 
    transportationSupport || 
    housingSupport;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 給与情報セクション */}
      <div>
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <CreditCard className="h-4 w-4 mr-2 text-green-600" />
          給与情報
        </h4>
        
        <div className="rounded-lg border border-green-100 overflow-hidden">
          {/* 給与表示 - シンプルかつ詳細に */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5">
            <div className="text-sm text-gray-600 mb-1">給与</div>
            <div className="text-2xl font-bold text-green-700">
              {formatSalary(
                minimumGuarantee,
                maximumGuarantee,
                workingTimeHours,
                averageHourlyPay
              )}
            </div>
            
            {/* 時給換算と勤務時間の詳細 */}
            {workingTimeHours && workingTimeHours > 0 && hourlyRate && (
              <div className="flex flex-col mt-3 gap-1 text-sm">
                <div className="flex justify-between bg-white py-2 px-3 rounded-md border border-green-200">
                  <span className="font-medium">勤務時間</span>
                  <span className="font-bold">{workingTimeHours}時間</span>
                </div>
                
                <div className="flex justify-between bg-white py-2 px-3 rounded-md border border-green-200">
                  <span className="font-medium">時給換算</span>
                  <span className="font-bold">{hourlyRate.toLocaleString()}円</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 福利厚生・サポート */}
      <div>
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <Award className="h-4 w-4 mr-2 text-blue-500" />
          福利厚生・サポート
        </h4>
        
        {hasAnyBenefit ? (
          <div className="space-y-3">
            {/* 交通・住居サポート */}
            {(transportationSupport || housingSupport) && (
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                {transportationSupport && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 py-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-blue-500">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    交通費サポート
                  </Badge>
                )}
                
                {housingSupport && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 py-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-purple-500">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    寮完備
                  </Badge>
                )}
              </div>
            )}
            
            {/* その他の福利厚生 */}
            {benefits && benefits.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md border border-blue-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 flex-shrink-0">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span className="text-blue-800 dark:text-blue-200">{benefit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-3 bg-gray-50 rounded-md border">
            <span className="text-sm text-gray-500 italic">福利厚生情報が未設定です</span>
          </div>
        )}
      </div>
    </div>
  );
}