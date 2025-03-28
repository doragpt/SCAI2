import { SpecialOffer } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SparklesIcon, Star, Lightbulb, Gift, BadgePercent, Clock, Heart } from "lucide-react";
import React, { ReactNode } from "react";

// アイコンマッピング
const iconMap: Record<string, ReactNode> = {
  "star": <Star className="h-6 w-6" />,
  "sparkles": <SparklesIcon className="h-6 w-6" />,
  "lightbulb": <Lightbulb className="h-6 w-6" />,
  "gift": <Gift className="h-6 w-6" />,
  "badge-percent": <BadgePercent className="h-6 w-6" />,
  "clock": <Clock className="h-6 w-6" />,
  "heart": <Heart className="h-6 w-6" />,
};

interface SpecialOffersDisplayProps {
  specialOffers: string | SpecialOffer[];
  className?: string;
}

/**
 * 特別オファー情報表示コンポーネント
 */
export function SpecialOffersDisplay({
  specialOffers,
  className = "",
}: SpecialOffersDisplayProps) {
  // 配列形式に変換して処理
  const offersArray = React.useMemo(() => {
    try {
      // 文字列形式の場合はパース
      if (typeof specialOffers === 'string') {
        return JSON.parse(specialOffers) || [];
      }
      // 配列の場合はそのまま
      return Array.isArray(specialOffers) ? specialOffers : [];
    } catch (e) {
      console.error("Invalid special_offers format in display component:", e);
      return [];
    }
  }, [specialOffers]);

  if (!offersArray || offersArray.length === 0) {
    return null;
  }
  
  // オファーを順番に並べ替え
  const sortedOffers = [...offersArray].sort((a, b) => a.order - b.order);
  
  return (
    <Card className={`border-0 shadow-md overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <h3 className="text-xl font-bold flex items-center">
          <SparklesIcon className="mr-2 h-5 w-5 text-amber-100" />
          特別オファー
        </h3>
      </CardHeader>
      
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedOffers.map((offer) => (
            <div 
              key={offer.id}
              className="p-4 rounded-lg border flex items-start gap-4"
              style={{
                backgroundColor: `${offer.backgroundColor}15`, // 透明度を下げた背景色
                borderColor: `${offer.backgroundColor}40`,
                color: offer.textColor
              }}
            >
              <div 
                className="p-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: offer.backgroundColor }}
              >
                {iconMap[offer.icon] || <SparklesIcon className="h-6 w-6" />}
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">{offer.title}</h4>
                <p className="text-sm opacity-90">{offer.description}</p>
                
                <div className="mt-3 px-3 py-1.5 bg-white/30 dark:bg-gray-800/30 rounded-lg text-xs inline-flex items-center">
                  <Heart className="h-3 w-3 mr-1" style={{ color: offer.backgroundColor }} />
                  <span>SCAI（スカイ）限定特典</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            これらの特別オファーは「SCAI（スカイ）を見た」とお伝えいただくとご利用いただけます
          </p>
        </div>
      </CardContent>
    </Card>
  );
}