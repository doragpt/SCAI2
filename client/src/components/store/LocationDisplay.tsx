import { MapPin, Shield } from "lucide-react";

interface LocationDisplayProps {
  address?: string;
  accessInfo?: string;
  securityMeasures?: string;
  className?: string;
}

/**
 * 店舗のアクセス・所在地・セキュリティ情報表示コンポーネント
 */
export function LocationDisplay({
  address,
  accessInfo,
  securityMeasures,
  className = "",
}: LocationDisplayProps) {
  const hasLocationInfo = !!address || !!accessInfo;
  
  if (!hasLocationInfo && !securityMeasures) {
    return null;
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* アクセス・所在地情報 */}
      {hasLocationInfo && (
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
              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
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
    </div>
  );
}