import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type SpecialOffer } from "@shared/schema";
import { Crown, Gift, Star, Sparkles, TagIcon, Award, Gem, Heart, CircleDollarSign, Rocket } from "lucide-react";

// アイコンマッピング
const iconMap: Record<string, React.ElementType> = {
  Crown,
  Gift,
  Star,
  Sparkles,
  TagIcon,
  Award,
  Gem,
  Heart,
  CircleDollarSign,
  Rocket,
};

interface SpecialOffersDisplayProps {
  specialOffers: SpecialOffer[];
  className?: string;
}

/**
 * 特別オファー表示コンポーネント
 * 店舗からの特別キャンペーンやオファーを表示する
 */
export function SpecialOffersDisplay({
  specialOffers,
  className = "",
}: SpecialOffersDisplayProps) {
  if (!specialOffers || specialOffers.length === 0) {
    return null;
  }

  // 表示順にソート
  const sortedOffers = [...specialOffers].sort((a, b) => a.order - b.order);
  
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-yellow-500" />
        <h3 className="text-xl font-semibold">特別オファー</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedOffers.map((offer) => {
          // アイコンを取得、ない場合はデフォルトでStar
          const IconComponent = offer.icon && iconMap[offer.icon] ? iconMap[offer.icon] : Star;
          
          return (
            <Card 
              key={offer.id}
              className="overflow-hidden border-2"
              style={{ 
                borderColor: offer.backgroundColor || '#f59e0b',
                background: `linear-gradient(to right, ${offer.backgroundColor}15, transparent)`
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <IconComponent 
                    className="mr-2 h-5 w-5"
                    style={{ color: offer.backgroundColor || '#f59e0b' }}
                  />
                  <span style={{ color: offer.textColor || 'inherit' }}>{offer.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm whitespace-pre-line">
                  {offer.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}