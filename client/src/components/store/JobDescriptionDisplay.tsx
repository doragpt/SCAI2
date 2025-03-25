import { 
  Briefcase, Tag, ListChecks, Clock, Calendar, 
  UserCheck, Sparkles, CalendarDays, Building, 
  User, Mail, Heart, ShieldCheck, UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <Card className={`border-0 shadow-md overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <h3 className="text-xl font-bold flex items-center">
          <Briefcase className="mr-2 h-5 w-5 text-blue-100" />
          仕事内容
        </h3>
      </CardHeader>
      
      <CardContent className="p-5 space-y-8">
        {/* サービスタイプ */}
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800/30">
            <Building className="h-4 w-4 mr-2 text-blue-500" />
            {getServiceTypeLabel(serviceType)}
          </div>
          
          {workingHours && (
            <div className="inline-flex items-center px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-100 dark:border-purple-800/30">
              <Clock className="h-4 w-4 mr-2 text-purple-500" />
              {workingHours}
            </div>
          )}
        </div>
        
        {/* キャッチフレーズ */}
        {catchPhrase && (
          <div className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-r-md">
            <div className="flex items-center mb-1">
              <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">キャッチコピー</p>
            </div>
            <p className="text-lg text-gray-800 dark:text-gray-200">{catchPhrase}</p>
          </div>
        )}
        
        {/* 仕事内容詳細 - HTMLコンテンツ */}
        <div>
          <div className="flex items-center mb-3">
            <ShieldCheck className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">詳細内容</h4>
          </div>
          <div className="prose prose-blue max-w-none dark:prose-invert p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
            <HtmlContent html={description} />
          </div>
        </div>
        
        {/* 勤務時間 */}
        {workingHours && (
          <div>
            <div className="flex items-center mb-3">
              <CalendarDays className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">勤務時間</h4>
            </div>
            <div className="flex p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800/30">
              <Calendar className="h-5 w-5 mr-3 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                {workingHours}
              </div>
            </div>
          </div>
        )}
        
        {/* 応募条件 */}
        {requirements && (
          <div>
            <div className="flex items-center mb-3">
              <UserCheck className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">応募条件</h4>
            </div>
            
            {typeof requirements === 'string' ? (
              <div className="flex p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800/30">
                <ListChecks className="h-5 w-5 mr-3 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                  {requirements}
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {/* 年齢条件 */}
                {typeof requirements === 'object' && requirements.age_min !== undefined && (
                  <div className="flex items-start p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800/30">
                    <User className="h-5 w-5 mr-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">年齢条件</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{requirements.age_min}歳以上</p>
                    </div>
                  </div>
                )}
                
                {/* その他条件 - 1列レイアウト */}
                {typeof requirements === 'object' && requirements.other_conditions && requirements.other_conditions.length > 0 && (
                  <div className="flex items-start p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800/30 sm:col-span-2">
                    <ListChecks className="h-5 w-5 mr-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">その他条件</p>
                      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-2">
                        {requirements.other_conditions.map((condition, index) => (
                          <li key={index} className="flex items-center">
                            <UserPlus className="h-4 w-4 mr-2 text-green-500" />
                            <span>{condition}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* 詳細条件の案内 */}
                {typeof requirements === 'object' && requirements.spec_min !== undefined && (
                  <div className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 sm:col-span-2">
                    <Mail className="h-5 w-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">詳細お問い合わせ</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        詳細な応募条件については、お電話またはメールにてお気軽にお問い合わせください。
                        <br />面接時に詳しくご説明いたします。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* SCAI（スカイ）ブランディング */}
        <div className="flex items-center justify-center py-2">
          <div className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Heart className="h-3 w-3 mr-1 text-blue-500" />
            <span>SCAI（スカイ）でマッチング</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}