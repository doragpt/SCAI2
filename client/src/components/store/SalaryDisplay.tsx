import { BanknoteIcon, Briefcase, Bus, HomeIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatSalary } from "@/lib/utils";
import { type BenefitType } from "@shared/schema";

interface SalaryDisplayProps {
  minimumGuarantee?: number | null;
  maximumGuarantee?: number | null;
  workingTimeHours?: number | null;
  averageHourlyPay?: number | null;
  transportationSupport?: boolean;
  housingSupport?: boolean;
  benefits?: BenefitType[];
  className?: string;
}

/**
 * 給与・待遇情報表示コンポーネント
 */
export function SalaryDisplay({
  minimumGuarantee,
  maximumGuarantee,
  workingTimeHours,
  averageHourlyPay,
  transportationSupport,
  housingSupport,
  benefits = [],
  className = "",
}: SalaryDisplayProps) {
  // 給与情報があるかチェック
  const hasSalaryInfo = 
    (minimumGuarantee != null && minimumGuarantee > 0) || 
    (maximumGuarantee != null && maximumGuarantee > 0) ||
    (workingTimeHours != null && workingTimeHours > 0 && averageHourlyPay != null && averageHourlyPay > 0);
  
  // 特典情報があるかチェック
  const hasBenefits = 
    transportationSupport || 
    housingSupport || 
    (benefits && benefits.length > 0);
  
  // いずれの情報もなければ表示しない
  if (!hasSalaryInfo && !hasBenefits) {
    return null;
  }
  
  // 給与フォーマット
  const formattedSalary = formatSalary(
    minimumGuarantee,
    maximumGuarantee,
    workingTimeHours,
    averageHourlyPay
  );

  // 給与情報詳細
  const salaryDetails = [];
  
  // 保証額がある場合
  if ((minimumGuarantee != null && minimumGuarantee > 0) || (maximumGuarantee != null && maximumGuarantee > 0)) {
    const min = minimumGuarantee || 0;
    const max = maximumGuarantee || min;
    
    if (min === max) {
      salaryDetails.push(`日給保証額: ${min.toLocaleString()}円`);
    } else {
      salaryDetails.push(`日給保証額: ${min.toLocaleString()}〜${max.toLocaleString()}円`);
    }
  }
  
  // 時給情報がある場合
  if (workingTimeHours != null && workingTimeHours > 0 && averageHourlyPay != null && averageHourlyPay > 0) {
    salaryDetails.push(`1時間あたり: ${averageHourlyPay.toLocaleString()}円`);
    salaryDetails.push(`勤務時間: ${workingTimeHours}時間`);
  }
  
  // 特典の選定（カテゴリーに分類）
  const salaryBenefits = benefits?.filter(b => b.startsWith('日給') || b.includes('バック率'));
  const otherBenefits = benefits?.filter(b => !b.startsWith('日給') && !b.includes('バック率'));
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <h3 className="text-xl font-semibold flex items-center">
          <BanknoteIcon className="mr-2 h-5 w-5 text-primary" />
          給与・待遇情報
        </h3>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 給与情報 */}
        {hasSalaryInfo && (
          <div>
            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">給与</div>
              <div className="text-2xl font-bold text-primary">{formattedSalary}</div>
            </div>
            
            {salaryDetails.length > 0 && (
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1 pl-1">
                {salaryDetails.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {/* 給与関連特典 */}
        {salaryBenefits && salaryBenefits.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">給与特典</div>
            <div className="flex flex-wrap gap-2">
              {salaryBenefits.map((benefit, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-full border border-green-100 dark:border-green-800">
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* その他の特典 */}
        <div className="space-y-3">
          {transportationSupport && (
            <div className="flex items-center text-sm">
              <Bus className="h-4 w-4 mr-2 text-blue-500" />
              <span>交通費支給あり</span>
            </div>
          )}
          
          {housingSupport && (
            <div className="flex items-center text-sm">
              <HomeIcon className="h-4 w-4 mr-2 text-purple-500" />
              <span>寮完備</span>
            </div>
          )}
          
          {otherBenefits && otherBenefits.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">その他の特典</div>
              <div className="flex flex-wrap gap-2">
                {otherBenefits.map((benefit, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full border border-gray-100 dark:border-gray-700">
                    <Briefcase className="inline-block h-3 w-3 mr-1" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}