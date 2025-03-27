import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Banknote, BadgeJapaneseYen, Clock, Bus, Building, 
  Gift, CalendarClock, Plus, ShoppingBag 
} from "lucide-react";
import { BenefitType } from "@shared/schema";
import { formatSalary } from "@/lib/utils";

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
  benefits,
  className = "",
}: SalaryDisplayProps) {
  const salaryText = formatSalary(
    minimumGuarantee,
    maximumGuarantee,
    workingTimeHours,
    averageHourlyPay
  );
  
  // 待遇情報をカテゴリーごとに分類
  const categorizedBenefits = benefits ? {
    interview: benefits.filter(b => 
      ["見学だけでもOK", "体験入店OK", "店外面接OK", "面接交通費支給", "友達と面接OK", "オンライン面接OK", "写メ面接OK", "即日勤務OK", "入店特典あり"].includes(b)
    ),
    workStyle: benefits.filter(b => 
      ["自由出勤OK", "週1日〜OK", "週3日以上歓迎", "週5日以上歓迎", "土日だけOK", "1日3時間〜OK", "短期OK", "長期休暇OK", "掛け持ちOK"].includes(b)
    ),
    salary: benefits.filter(b => 
      ["日給2万円以上", "日給3万円以上", "日給4万円以上", "日給5万円以上", "日給6万円以上", "日給7万円以上"].includes(b)
    ),
    bonus: benefits.filter(b => 
      ["バック率50%以上", "バック率60%以上", "バック率70%以上", "完全日払いOK", "保証制度あり", "指名バックあり", "オプションバックあり", "ボーナスあり"].includes(b)
    ),
    facility: benefits.filter(b => 
      ["送迎あり", "駅チカ", "駐車場完備", "個室待機", "アリバイ対策OK", "寮完備", "託児所あり", "制服貸与", "食事支給"].includes(b)
    ),
    requirements: benefits.filter(b => 
      ["未経験大歓迎", "経験者優遇", "主婦・人妻歓迎", "学生さん歓迎", "20代活躍中", "30代活躍中", "40代以上歓迎", "スリム体型", "グラマー体型", "tattoo(小)OK"].includes(b)
    )
  } : null;
  
  return (
    <div className={className}>
      {/* 給与情報 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <BadgeJapaneseYen className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">参考給与例</h4>
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">日給</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {minimumGuarantee && maximumGuarantee ? `${minimumGuarantee.toLocaleString()}円〜${maximumGuarantee.toLocaleString()}円` : salaryText}
              </p>
            </div>
            
            {/* 待遇アイコン */}
            <div className="flex flex-wrap gap-2">
              {transportationSupport && (
                <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                  <Bus className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">交通費支給</span>
                </div>
              )}
              
              {housingSupport && (
                <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                  <Building className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">寮完備</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 時給表示を追加 */}
          {workingTimeHours && workingTimeHours > 0 && averageHourlyPay && averageHourlyPay > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
              <div className="flex flex-col">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">平均給与</p>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-700 dark:text-green-300">
                    {workingTimeHours}時間勤務　{averageHourlyPay.toLocaleString()}円
                  </span>
                </div>
                <div className="flex items-center mt-1 ml-5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    （時給換算：{Math.round(averageHourlyPay / workingTimeHours).toLocaleString()}円）
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 待遇情報 */}
      {categorizedBenefits && Object.values(categorizedBenefits).some(arr => arr.length > 0) && (
        <div>
          <div className="flex items-center mb-3">
            <Gift className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">待遇・福利厚生</h4>
          </div>
          
          <div className="space-y-4">
            {/* 面接・入店前 */}
            {categorizedBenefits.interview.length > 0 && (
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center mb-2">
                  <CalendarClock className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                  <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300">面接・入店前</h5>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categorizedBenefits.interview.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800"
                    >
                      <Plus className="h-3 w-3 mr-1 text-blue-500" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 働き方自由 */}
            {categorizedBenefits.workStyle.length > 0 && (
              <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/30">
                <div className="flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-1.5 text-amber-600 dark:text-amber-400" />
                  <h5 className="text-sm font-medium text-amber-700 dark:text-amber-300">働き方自由</h5>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categorizedBenefits.workStyle.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800"
                    >
                      <Plus className="h-3 w-3 mr-1 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* お給料+α */}
            {categorizedBenefits.bonus.length > 0 && (
              <div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800/30">
                <div className="flex items-center mb-2">
                  <Banknote className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400" />
                  <h5 className="text-sm font-medium text-green-700 dark:text-green-300">お給料+α</h5>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categorizedBenefits.bonus.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800"
                    >
                      <Plus className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* お店の環境 */}
            {categorizedBenefits.facility.length > 0 && (
              <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800/30">
                <div className="flex items-center mb-2">
                  <Building className="h-4 w-4 mr-1.5 text-purple-600 dark:text-purple-400" />
                  <h5 className="text-sm font-medium text-purple-700 dark:text-purple-300">お店の環境</h5>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categorizedBenefits.facility.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800"
                    >
                      <Plus className="h-3 w-3 mr-1 text-purple-500" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 採用について */}
            {categorizedBenefits.requirements.length > 0 && (
              <div className="p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-800/30">
                <div className="flex items-center mb-2">
                  <ShoppingBag className="h-4 w-4 mr-1.5 text-rose-600 dark:text-rose-400" />
                  <h5 className="text-sm font-medium text-rose-700 dark:text-rose-300">採用について</h5>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categorizedBenefits.requirements.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-rose-200 dark:border-rose-800"
                    >
                      <Plus className="h-3 w-3 mr-1 text-rose-500" />
                      <span className="text-xs font-medium text-rose-700 dark:text-rose-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* SCAI ブランディング */}
      <div className="mt-6 px-4 py-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg">
        <div className="flex items-center">
          <ShoppingBag className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">SCAI（スカイ）からの応募で特別対応あり</span>
        </div>
      </div>
    </div>
  );
}