import { Briefcase, MapPin, Clock } from "lucide-react";
import { HtmlContent } from "@/components/html-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServiceTypeLabel } from "@/lib/utils";
import { type ServiceType } from "@shared/schema";

interface JobDescriptionProps {
  businessName: string;
  location: string;
  serviceType: ServiceType;
  catchPhrase?: string;
  description: string;
  workingHours?: string;
  requirements?: any; // string またはオブジェクト
  className?: string;
}

/**
 * 仕事内容表示コンポーネント
 * 店舗紹介、業種、場所、キャッチフレーズ、詳細な仕事内容を表示
 */
export function JobDescriptionDisplay({
  businessName,
  location,
  serviceType,
  catchPhrase,
  description,
  workingHours,
  requirements,
  className = "",
}: JobDescriptionProps) {
  // requirementsがオブジェクトかどうかを確認し、適切にフォーマット
  const formatRequirements = () => {
    if (!requirements) return null;
    
    if (typeof requirements === 'string') {
      return <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{requirements}</div>;
    }
    
    // オブジェクトの場合は構造化された情報をフォーマットして表示
    try {
      const reqObj = typeof requirements === 'string' ? JSON.parse(requirements) : requirements;
      
      return (
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          {reqObj.age_min && (
            <div>
              <span className="font-medium">年齢条件：</span> {reqObj.age_min}歳以上
              {reqObj.age_max && `〜${reqObj.age_max}歳以下`}
            </div>
          )}
          
          {reqObj.spec_min && (
            <div>
              <span className="font-medium">体型条件：</span> スペック {reqObj.spec_min} 以上
              {reqObj.spec_max && `〜${reqObj.spec_max} 以下`}
            </div>
          )}
          
          {reqObj.cup_size_conditions && Array.isArray(reqObj.cup_size_conditions) && reqObj.cup_size_conditions.length > 0 && (
            <div>
              <span className="font-medium">カップサイズ条件：</span>
              <ul className="list-disc list-inside pl-2 mt-1">
                {reqObj.cup_size_conditions.map((condition: any, index: number) => (
                  <li key={index}>
                    {condition.cup_size}カップ: スペック{condition.spec_min}以上
                    {condition.spec_max && `〜${condition.spec_max}以下`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {reqObj.tattoo_acceptance && (
            <div>
              <span className="font-medium">タトゥー許容レベル：</span> {reqObj.tattoo_acceptance}
            </div>
          )}
          
          {reqObj.preferred_hair_colors && reqObj.preferred_hair_colors.length > 0 && (
            <div>
              <span className="font-medium">希望髪色：</span> {reqObj.preferred_hair_colors.join('、')}
            </div>
          )}
          
          {reqObj.preferred_look_types && reqObj.preferred_look_types.length > 0 && (
            <div>
              <span className="font-medium">希望見た目タイプ：</span> {reqObj.preferred_look_types.join('、')}
            </div>
          )}
          
          {reqObj.accepts_temporary_workers !== undefined && (
            <div>
              <span className="font-medium">出稼ぎ：</span> {reqObj.accepts_temporary_workers ? '可' : '不可'}
              {reqObj.requires_arrival_day_before && ' (前日入りが必要)'}
            </div>
          )}
          
          {reqObj.other_conditions && (
            <div>
              <span className="font-medium">その他条件：</span> {reqObj.other_conditions}
            </div>
          )}
        </div>
      );
    } catch (e) {
      // パースエラーや想定外の構造の場合はJSON文字列として表示
      return (
        <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
          {JSON.stringify(requirements, null, 2)}
        </div>
      );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 店舗基本情報 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">
            {businessName}
          </CardTitle>
          
          <div className="flex flex-wrap gap-3 mt-2">
            <div className="flex items-center gap-1 text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
              <Briefcase className="h-3.5 w-3.5" />
              {getServiceTypeLabel(serviceType)}
            </div>
            
            <div className="flex items-center gap-1 text-sm text-rose-700 bg-rose-50 px-2 py-1 rounded-md">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </div>
            
            {workingHours && (
              <div className="flex items-center gap-1 text-sm text-green-700 bg-green-50 px-2 py-1 rounded-md">
                <Clock className="h-3.5 w-3.5" />
                {workingHours}
              </div>
            )}
          </div>
          
          {catchPhrase && (
            <div className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
              {catchPhrase}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {/* 仕事内容の詳細 */}
          <div>
            <h3 className="text-lg font-medium mb-3">仕事内容</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <HtmlContent html={description} />
            </div>
          </div>
          
          {/* 応募資格・条件 */}
          {requirements && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">応募資格・条件</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
                {formatRequirements()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}