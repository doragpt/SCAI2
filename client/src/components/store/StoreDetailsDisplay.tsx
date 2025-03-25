import { Store, MapPin, Shield, Info, Map, Train, Bus, PersonStanding } from "lucide-react";
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
    <Card className={`border-0 shadow-md overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <h3 className="text-xl font-bold flex items-center">
          <Store className="mr-2 h-5 w-5 text-purple-100" />
          店舗詳細情報
        </h3>
      </CardHeader>
      
      <CardContent className="p-5 space-y-8">
        {/* アクセス・所在地情報 */}
        {(address || accessInfo) && (
          <div>
            <div className="flex items-center mb-3">
              <MapPin className="h-5 w-5 mr-2 text-rose-600 dark:text-rose-400" />
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">アクセス・所在地</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* 所在地 */}
              {address && (
                <div className="flex items-start p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-800/30">
                  <Map className="h-5 w-5 mr-3 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">所在地</p>
                    <p className="text-gray-900 dark:text-gray-100">{address}</p>
                  </div>
                </div>
              )}
              
              {/* アクセス方法 */}
              {accessInfo && (
                <div className="flex items-start p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/30 md:col-span-2">
                  <Train className="h-5 w-5 mr-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">アクセス方法</p>
                    <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                      {accessInfo}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* セキュリティ対策 */}
        {securityMeasures && (
          <div>
            <div className="flex items-center mb-3">
              <Shield className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">安全対策</h4>
            </div>
            
            <div className="flex items-start p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
              <Shield className="h-5 w-5 mr-3 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-indigo-700 dark:text-indigo-300 mb-1">店舗のセキュリティ・安全面</p>
                <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                  {securityMeasures}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 応募条件 */}
        {applicationRequirements && (
          <div>
            <div className="flex items-center mb-3">
              <PersonStanding className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">応募条件</h4>
            </div>
            
            <div className="flex items-start p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30">
              <Info className="h-5 w-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">採用について</p>
                <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                  {applicationRequirements}
                </div>
                
                <div className="mt-3 px-3 py-2 bg-blue-100/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded text-sm text-blue-800 dark:text-blue-200">
                  SCAI（スカイ）からの応募で特別対応あり
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}