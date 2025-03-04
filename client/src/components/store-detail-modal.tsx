import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Star, Clock, BadgeCheck } from "lucide-react";

interface StoreDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: {
    id: number;
    name: string;
    location: string;
    rating: number;
    matches: string[];
    description?: string;
    workingHours?: string;
    requirements?: string[];
    benefits?: string[];
    workEnvironment?: string;
    matchingPoints?: {
      title: string;
      description: string;
    }[];
    serviceType?: string;
    rate?: {
      time: number;
      amount: number;
    };
  };
}

export function StoreDetailModal({
  isOpen,
  onClose,
  store,
}: StoreDetailModalProps) {
  // マッチング項目の表示を整形する関数
  const formatMatchLabel = (match: string) => {
    switch (match) {
      case '希望時給':
        return `店舗設定の単価 ${store.rate ? `${store.rate.time}分${store.rate.amount.toLocaleString()}円` : '要相談'}`;
      case '勤務時間帯':
        return `営業時間 ${store.workingHours || '要相談'}`;
      case '業態':
        return `業種/${store.serviceType || '要確認'}`;
      default:
        return match;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {store.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {store.location}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-6 p-4">
            {/* マッチ度 */}
            <Card className="p-4 bg-primary/5">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <h3 className="font-medium">マッチ度</h3>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-primary">
                    {store.rating * 20}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    あなたの希望条件とマッチ
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {store.matches.map((match, index) => (
                    <span
                      key={index}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                    >
                      {formatMatchLabel(match)}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* 店舗説明 */}
            {store.description && (
              <div className="space-y-2">
                <h3 className="font-medium">店舗について</h3>
                <p className="text-sm whitespace-pre-wrap">{store.description}</p>
              </div>
            )}

            {/* 営業時間 */}
            {store.workingHours && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">営業時間</h3>
                </div>
                <p className="text-sm">{store.workingHours}</p>
              </div>
            )}

            {/* 応募条件 */}
            {store.requirements && store.requirements.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">応募条件</h3>
                <ul className="text-sm space-y-1">
                  {store.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <BadgeCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 待遇・福利厚生 */}
            {store.benefits && store.benefits.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">待遇・福利厚生</h3>
                <ul className="text-sm space-y-1">
                  {store.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <BadgeCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 職場環境 */}
            {store.workEnvironment && (
              <div className="space-y-2">
                <h3 className="font-medium">職場環境</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {store.workEnvironment}
                </p>
              </div>
            )}

            {/* マッチングポイント */}
            {store.matchingPoints && store.matchingPoints.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">マッチングポイント</h3>
                <div className="space-y-4">
                  {store.matchingPoints.map((point, index) => (
                    <div key={index} className="space-y-1">
                      <h4 className="text-sm font-medium">{point.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {point.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
          <Button>この店舗に質問する</Button>
          <Button variant="secondary">この店舗で確定する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}