import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Gift, Clock, Info, Star, Users, PartyPopper, Star as StarIcon, BookCheck } from "lucide-react";

interface CampaignDisplayProps {
  campaign: {
    id: string;
    title: string;
    description: string;
    amount?: number;
    type: string;
    conditions?: string;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    imageUrl?: string;
    tagline?: string;
    isLimited: boolean;
    targetAudience?: string[];
  };
  className?: string;
  featured?: boolean;
  onApply?: () => void; // 応募ボタンのコールバック
}

export function CampaignDisplay({ 
  campaign, 
  className = "", 
  featured = false,
  onApply
}: CampaignDisplayProps) {
  const {
    title,
    description,
    amount,
    type,
    conditions,
    startDate,
    endDate,
    isActive,
    imageUrl,
    tagline,
    isLimited,
    targetAudience
  } = campaign;

  // 現在キャンペーン中かどうか
  const isCurrentlyCampaign = isActive && startDate && endDate 
    ? new Date() >= new Date(startDate) && new Date() <= new Date(endDate)
    : isActive;

  // キャンペーンタイプに応じたアイコンの取得
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "入店祝い金":
        return <Gift className="h-5 w-5 text-rose-500" />;
      case "特別保証":
        return <StarIcon className="h-5 w-5 text-amber-500" />;
      case "友達紹介":
        return <Users className="h-5 w-5 text-green-500" />;
      case "体験入店特典":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "期間限定特典":
        return <PartyPopper className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-purple-500" />;
    }
  };

  // 対象者に応じたバッジカラーの取得
  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case "未経験":
        return "text-pink-500 border-pink-200 bg-pink-50";
      case "経験者":
        return "text-purple-500 border-purple-200 bg-purple-50";
      case "出稼ぎ":
        return "text-amber-500 border-amber-200 bg-amber-50";
      case "学生":
        return "text-blue-500 border-blue-200 bg-blue-50";
      case "主婦":
        return "text-green-500 border-green-200 bg-green-50";
      case "全員対象":
        return "text-gray-500 border-gray-200 bg-gray-50";
      default:
        return "text-gray-500 border-gray-200 bg-gray-50";
    }
  };

  return (
    <Card className={`overflow-hidden ${featured ? 'border-2 border-primary/80 shadow-md' : ''} ${className} relative`}>
      {/* 期間限定バッジ */}
      {isLimited && (
        <div className="absolute -right-8 top-5 z-10 rotate-45">
          <Badge variant="destructive" className="px-8 py-1 rounded-sm font-bold">
            期間限定
          </Badge>
        </div>
      )}
      
      {imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="object-cover w-full h-full"
          />
          {tagline && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="text-white font-bold text-lg">{tagline}</div>
            </div>
          )}
        </div>
      )}
      
      <CardHeader className={`${imageUrl ? 'pb-2' : ''}`}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <Badge variant={featured ? "default" : "outline"} className="font-medium">
            {getTypeIcon(type)}
            <span className="ml-1">{type}</span>
          </Badge>
          
          {targetAudience && targetAudience.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {targetAudience.map((audience, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className={getAudienceColor(audience)}
                >
                  {audience}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <CardTitle className="text-xl">{title}</CardTitle>
        
        {(startDate || endDate) && (
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {startDate && new Date(startDate).toLocaleDateString()}
            {startDate && endDate && " ～ "}
            {endDate && new Date(endDate).toLocaleDateString()}
          </div>
        )}
        
        <CardDescription className="mt-2 whitespace-pre-line">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {amount && (
          <div className="mb-4 text-center bg-gradient-to-r from-primary/5 to-primary/10 py-4 rounded-md">
            <div className="text-muted-foreground text-sm mb-1">特典金額</div>
            <div className="flex items-center justify-center">
              <span className="text-4xl font-bold text-primary mr-1">
                {amount.toLocaleString()}
              </span>
              <span>円</span>
            </div>
          </div>
        )}
        
        {conditions && (
          <div className="mt-3 border rounded-md p-3 bg-muted/10">
            <h4 className="font-medium text-sm mb-1 flex items-center">
              <BookCheck className="h-4 w-4 mr-1 text-primary" />
              適用条件
            </h4>
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {conditions}
            </div>
          </div>
        )}

        {onApply && (
          <div className="mt-4">
            <Button 
              className="w-full" 
              onClick={onApply}
              size="lg"
            >
              <Gift className="mr-2 h-4 w-4" />
              このキャンペーンに応募する
            </Button>
          </div>
        )}
      </CardContent>
      
      {!isCurrentlyCampaign && (
        <CardFooter className="bg-muted/30 text-sm text-muted-foreground border-t">
          <div className="flex items-center">
            <Info className="h-4 w-4 mr-1" />
            このキャンペーンは現在終了しています
          </div>
        </CardFooter>
      )}
    </Card>
  );
}