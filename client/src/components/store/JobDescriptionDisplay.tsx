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
  requirements?: string;
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
                <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                  {requirements}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}