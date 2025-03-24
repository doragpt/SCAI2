import { Store } from "@shared/types/store";
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
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { HtmlContent } from "@/components/html-content";

interface StoreDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store & {
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
  const [question, setQuestion] = useState("");
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const { toast } = useToast();

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

  const handleQuestionSubmit = () => {
    if (!question.trim()) {
      toast({
        title: "質問内容を入力してください",
        variant: "destructive",
      });
      return;
    }
    setShowQuestionDialog(true);
  };

  const handleConfirmQuestion = async () => {
    try {
      // TODO: 質問送信のAPI実装
      toast({
        title: "質問を送信しました",
        description: "店舗からの返信をお待ちください",
      });
      setQuestion("");
      setShowQuestionDialog(false);
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "しばらく時間をおいて再度お試しください",
        variant: "destructive",
      });
    }
  };

  return (
    <>
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
                  <div className="text-sm">
                    <HtmlContent html={store.description} />
                  </div>
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
                  <div className="text-sm">
                    <HtmlContent html={store.workEnvironment} />
                  </div>
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
                        <div className="text-sm text-muted-foreground">
                          <HtmlContent html={point.description} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 質問フォーム */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">この店舗への質問</Label>
                  <Textarea
                    id="question"
                    placeholder="質問を入力してください（例：面接日時の調整について相談したいです）"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    質問は店舗側に直接送信されます。なるべく具体的に記入してください。
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              閉じる
            </Button>
            <Button onClick={handleQuestionSubmit}>この店舗に質問する</Button>
            <Button variant="secondary">この店舗で確定する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>質問を送信しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              以下の内容で質問を送信します：
              <br />
              <span className="mt-2 block whitespace-pre-wrap text-foreground">{question}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmQuestion}>
              送信する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}