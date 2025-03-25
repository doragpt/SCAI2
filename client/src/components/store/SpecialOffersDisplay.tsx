import { Gift, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { type SpecialOffer } from "@shared/schema";
import * as LucideIcons from "lucide-react";

interface SpecialOffersDisplayProps {
  specialOffers?: SpecialOffer[];
  className?: string;
}

/**
 * 特別オファー表示コンポーネント
 * 店舗独自の特典を視覚的にリッチに表示する
 */
export function SpecialOffersDisplay({
  specialOffers,
  className = "",
}: SpecialOffersDisplayProps) {
  // 特別オファーがない場合は何も表示しない
  if (!specialOffers || specialOffers.length === 0) {
    return null;
  }
  
  // 指定されたアイコン名からLucideアイコンコンポーネントを動的に取得
  const getIconComponent = (iconName: string) => {
    // @ts-ignore - Lucideアイコンを動的に取得
    const IconComponent = LucideIcons[iconName] || Check;
    return IconComponent;
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
        <Gift className="h-4 w-4 mr-2 text-pink-500" />
        お店からの特別オファー
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {specialOffers.sort((a, b) => a.order - b.order).map((offer) => {
          const IconComponent = getIconComponent(offer.icon);
          
          return (
            <Card 
              key={offer.id} 
              className="overflow-hidden border-transparent shadow-md hover:shadow-lg transition-shadow"
              style={{ 
                backgroundColor: offer.backgroundColor || "#f9f9f9",
                color: offer.textColor || "#333"
              }}
            >
              <CardContent className="p-0">
                <div className="flex items-start p-4">
                  <div className="mr-4 mt-1">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <div>
                    <h5 className="font-bold text-lg mb-1">{offer.title}</h5>
                    <p className="text-sm whitespace-pre-line">{offer.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}