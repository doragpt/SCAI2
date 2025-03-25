import { Store, MapPin, Shield, Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface StoreDetailsDisplayProps {
  address?: string;
  accessInfo?: string;
  securityMeasures?: string;
  applicationRequirements?: string;
  className?: string;
}

/**
 * 店舗の詳細情報表示コンポーネント
 * 住所、アクセス情報、セキュリティ、応募条件などを表示
 */
export function StoreDetailsDisplay({
  address,
  accessInfo,
  securityMeasures,
  applicationRequirements,
  className = "",
}: StoreDetailsDisplayProps) {
  const hasInfo = !!address || !!accessInfo || !!securityMeasures || !!applicationRequirements;
  
  if (!hasInfo) {
    return null;
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <h3 className="text-xl font-semibold flex items-center">
          <Store className="mr-2 h-5 w-5 text-primary" />
          店舗詳細情報
        </h3>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* アクセス・所在地情報 */}
        {(address || accessInfo) && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-rose-500" />
              アクセス・所在地
            </h4>
            
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* 所在地 */}
              {address && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">所在地</div>
                  <div className="text-gray-900 dark:text-gray-100">{address}</div>
                </div>
              )}
              
              {/* アクセス方法 */}
              {accessInfo && (
                <div className={`p-4 ${address ? 'border-t border-gray-200 dark:border-gray-800' : ''}`}>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">アクセス方法</div>
                  <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line text-sm">
                    {accessInfo}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* セキュリティ対策 */}
        {securityMeasures && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-indigo-500" />
              安全対策
            </h4>
            
            <div className="p-4 rounded-lg border border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30">
              <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line text-sm">
                {securityMeasures}
              </div>
            </div>
          </div>
        )}
        
        {/* 応募条件 */}
        {applicationRequirements && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2 text-blue-500" />
              応募条件
            </h4>
            
            <div className="p-4 rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
              <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line text-sm">
                {applicationRequirements}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}