import { Briefcase, Tag, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HtmlContent } from "@/components/html-content";
import { getServiceTypeLabel } from "@/lib/utils";
import { type ServiceType, type JobRequirements } from "@shared/schema";

interface JobDescriptionDisplayProps {
  serviceType: ServiceType;
  catchPhrase?: string;
  description: string;
  workingHours?: string;
  requirements?: string | JobRequirements;
  className?: string;
}

/**
 * 仕事内容表示コンポーネント
 * キャッチフレーズ、業種、仕事内容、勤務時間、応募条件などを表示
 */
export function JobDescriptionDisplay({
  serviceType,
  catchPhrase,
  description,
  workingHours,
  requirements,
  className = ""
}: JobDescriptionDisplayProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <h3 className="text-xl font-semibold flex items-center">
          <Briefcase className="mr-2 h-5 w-5 text-primary" />
          仕事内容
        </h3>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* サービスタイプ */}
        <div className="flex items-center">
          <Tag className="h-4 w-4 mr-2 text-blue-500" />
          <span className="bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-700 dark:text-blue-300 text-sm font-medium">
            {getServiceTypeLabel(serviceType)}
          </span>
        </div>
        
        {/* キャッチフレーズ */}
        {catchPhrase && (
          <div className="border-l-4 border-primary pl-4 py-2 italic text-lg">
            {catchPhrase}
          </div>
        )}
        
        {/* 仕事内容詳細 - HTMLコンテンツ */}
        <div>
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">詳細内容</h4>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <HtmlContent html={description} />
          </div>
        </div>
        
        {/* 勤務時間 */}
        {workingHours && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">勤務時間</h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="whitespace-pre-line text-gray-700 dark:text-gray-300 text-sm">
                {workingHours}
              </div>
            </div>
          </div>
        )}
        
        {/* 応募条件 */}
        {requirements && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <ListChecks className="h-4 w-4 mr-2 text-green-500" />
              応募条件
            </h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              {typeof requirements === 'string' ? (
                <div className="whitespace-pre-line text-gray-700 dark:text-gray-300 text-sm">
                  {requirements}
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 text-sm space-y-4">
                  {/* 年齢条件 */}
                  {typeof requirements === 'object' && requirements.age_min !== undefined && (
                    <div>
                      <p className="font-medium mb-1">年齢条件：</p>
                      <p>{requirements.age_min}歳以上</p>
                    </div>
                  )}
                  
                  {/* スペック条件 */}
                  {typeof requirements === 'object' && requirements.spec_min !== undefined && (
                    <div>
                      <p className="font-medium mb-1">スペック条件：</p>
                      <p>スペック値{requirements.spec_min}以上</p>
                    </div>
                  )}
                  
                  {/* その他条件 */}
                  {typeof requirements === 'object' && requirements.other_conditions && requirements.other_conditions.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">その他条件：</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {requirements.other_conditions.map((condition, index) => (
                          <li key={index}>{condition}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}