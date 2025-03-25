import { MapPin, MapIcon, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LocationDisplayProps {
  location: string;
  address?: string;
  className?: string;
}

/**
 * 店舗の所在地表示コンポーネント
 * 所在地と住所情報を表示
 */
export function LocationDisplay({
  location,
  address,
  className = "",
}: LocationDisplayProps) {
  // 住所から緯度経度を取得する関数
  // 実際の実装では適切なAPIを使用する
  const getGoogleMapsUrl = (address: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };
  
  return (
    <Card className={`border-0 shadow-md overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-rose-600 to-pink-700 text-white">
        <h3 className="text-xl font-bold flex items-center">
          <MapPin className="mr-2 h-5 w-5 text-rose-100" />
          所在地情報
        </h3>
      </CardHeader>
      
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className="bg-rose-100 dark:bg-rose-900/30 rounded-full p-3">
            <MapIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">エリア</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{location}</p>
          </div>
        </div>
        
        {address && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 mt-1">
                <Navigation className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">住所</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">{address}</p>
                
                <a 
                  href={getGoogleMapsUrl(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <MapIcon className="h-4 w-4 mr-2" />
                  Google Mapで見る
                </a>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 px-3 py-2 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded text-sm text-rose-700 dark:text-rose-300">
          詳しい所在地は面接時にお伝えします
        </div>
      </CardContent>
    </Card>
  );
}