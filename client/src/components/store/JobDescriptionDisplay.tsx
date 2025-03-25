import { ServiceType } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Briefcase, Clock, CircleAlert, InfoIcon } from "lucide-react";
import { HtmlContent } from "@/components/html-content";

interface JobDescriptionDisplayProps {
  serviceType: ServiceType;
  catchPhrase?: string;
  description: string;
  workingHours?: string;
  requirements?: any;
  className?: string;
}

/**
 * 求人の仕事内容表示コンポーネント
 * 仕事内容、勤務時間、応募条件などを表示
 */
export function JobDescriptionDisplay({
  serviceType,
  catchPhrase,
  description,
  workingHours,
  requirements,
  className = "",
}: JobDescriptionDisplayProps) {
  return (
    <Card className={`border-0 shadow-md overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-rose-600 to-pink-700 text-white">
        <h3 className="text-xl font-bold flex items-center">
          <Briefcase className="mr-2 h-5 w-5 text-rose-100" />
          仕事内容
        </h3>
      </CardHeader>
      
      <CardContent className="p-5 space-y-8">
        {/* 仕事内容 */}
        <div>
          <div className="mb-5">
            <div className="rounded-lg overflow-hidden">
              {/* HTMLコンテンツを安全に表示 */}
              <div className="prose prose-blue max-w-none dark:prose-invert">
                <HtmlContent html={description} />
              </div>
            </div>
          </div>
        </div>
        
        {/* 勤務時間 */}
        {workingHours && (
          <div>
            <div className="flex items-center mb-3">
              <Clock className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">勤務時間</h4>
            </div>
            
            <div className="flex items-start p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/30">
              <Clock className="h-5 w-5 mr-3 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">シフト</p>
                <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                  {workingHours}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 応募条件・採用情報 */}
        {requirements && (
          <div>
            <div className="flex items-center mb-3">
              <CircleAlert className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">応募条件・採用情報</h4>
            </div>
            
            <div className="flex items-start p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800/30">
              <InfoIcon className="h-5 w-5 mr-3 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-3 w-full">
                {requirements.cup_size_conditions && requirements.cup_size_conditions.length > 0 && (
                  <div>
                    <p className="font-medium text-purple-700 dark:text-purple-300 mb-1">カップサイズ条件</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {requirements.cup_size_conditions.map((condition: any, index: number) => (
                        <div 
                          key={index}
                          className="px-3 py-2 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-800 text-sm"
                        >
                          {condition.cup_size && `${condition.cup_size}カップ`}
                          {condition.spec_min !== undefined && ` (${condition.spec_min}以上)`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <div className={`flex items-center p-3 rounded-lg ${
                    requirements.accepts_temporary_workers 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    <span className="text-sm">
                      {requirements.accepts_temporary_workers 
                        ? '✓ 短期・一時的な勤務OK' 
                        : '× 短期・一時的な勤務不可'}
                    </span>
                  </div>
                  
                  <div className={`flex items-center p-3 rounded-lg ${
                    requirements.requires_arrival_day_before 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    <span className="text-sm">
                      {requirements.requires_arrival_day_before 
                        ? '✓ 前日入りが必要' 
                        : '× 前日入り不要'}
                    </span>
                  </div>
                  
                  <div className={`flex items-center p-3 rounded-lg ${
                    requirements.prioritize_titles 
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' 
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    <span className="text-sm">
                      {requirements.prioritize_titles 
                        ? '✓ 特別経験がある人を優先' 
                        : '× 特別経験は不問'}
                    </span>
                  </div>
                </div>
                
                {/* その他の条件 */}
                {requirements.other_conditions && requirements.other_conditions.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-purple-700 dark:text-purple-300 mb-2">その他の条件</p>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                      {requirements.other_conditions.map((condition: string, index: number) => (
                        <li key={index}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-4 px-3 py-2 bg-rose-100/50 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-800/30 rounded text-sm text-rose-800 dark:text-rose-200">
                  SCAI（スカイ）からのご応募は優先的にご案内しています
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}