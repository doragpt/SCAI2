import { MapPinned, Lock, Building } from "lucide-react";

interface StoreDetailsDisplayProps {
  address?: string;
  accessInfo?: string;
  securityMeasures?: string;
  applicationRequirements?: string;
  className?: string;
}

/**
 * 店舗詳細情報表示コンポーネント
 * 住所、アクセス情報、セキュリティ対策、応募資格などの情報を表示
 */
export function StoreDetailsDisplay({
  address,
  accessInfo,
  securityMeasures,
  applicationRequirements,
  className = "",
}: StoreDetailsDisplayProps) {
  const hasDetails = 
    !!address || 
    !!accessInfo || 
    !!securityMeasures || 
    !!applicationRequirements;
    
  if (!hasDetails) {
    return null;
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
        <Building className="h-4 w-4 mr-2 text-gray-500" />
        店舗詳細情報
      </h4>
      
      <div className="space-y-4">
        {/* 住所情報 */}
        {address && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPinned className="h-4 w-4 text-red-500" />
              <h5 className="font-medium text-gray-900 dark:text-gray-100">住所</h5>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-6 whitespace-pre-line">
              {address}
            </p>
          </div>
        )}
        
        {/* アクセス情報 */}
        {accessInfo && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M10 5a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2.001L11 20a1 1 0 0 1-2 0v-4a1 1 0 0 1 1-1h2a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.001L10 5Z" />
              </svg>
              <h5 className="font-medium text-gray-900 dark:text-gray-100">アクセス情報</h5>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-6 whitespace-pre-line">
              {accessInfo}
            </p>
          </div>
        )}
        
        {/* セキュリティ対策 */}
        {securityMeasures && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-green-500" />
              <h5 className="font-medium text-gray-900 dark:text-gray-100">セキュリティ対策</h5>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-6 whitespace-pre-line">
              {securityMeasures}
            </p>
          </div>
        )}
        
        {/* 応募資格 */}
        {applicationRequirements && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                <path d="M8 14c0-2.21 3.582-4 8-4s8 1.79 8 4M4 18c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                <path d="M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
              </svg>
              <h5 className="font-medium text-gray-900 dark:text-gray-100">応募資格</h5>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-6 whitespace-pre-line">
              {applicationRequirements}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}