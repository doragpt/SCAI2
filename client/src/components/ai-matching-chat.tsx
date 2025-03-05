import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Bot, User, Loader2, ArrowLeft } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useMatching } from "@/hooks/use-matching";
import { WORK_TYPES_WITH_DESCRIPTION, TIME_OPTIONS, RATE_OPTIONS, GUARANTEE_OPTIONS, prefectures } from "@/constants/work-types";
import { formatConditionsMessage } from "@/utils/format-conditions-message";

// メッセージの型定義
interface Message {
  type: "ai" | "user";
  content: string;
}

export const AIMatchingChat = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "ai",
      content: `SCAIマッチングへようこそ！
あなたの希望に合った最適な職場を見つけるお手伝いをさせていただきます。

【SCAIマッチングの特徴】
• AIが希望条件を分析し、最適な店舗をご紹介
• 豊富な求人データベースから、あなたに合った職場を探索
• 店舗からの返信状況をリアルタイムに確認可能

まずは、希望する働き方を選択してください。`
    },
  ]);

  const { profileData, isLoading: isProfileLoading } = useProfile();
  const [selectedType, setSelectedType] = useState<"出稼ぎ" | "在籍" | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [workTypes] = useState(["出稼ぎ", "在籍"]);
  const { toast } = useToast();
  const [conditions, setConditions] = useState({
    workTypes: [] as string[],
    workPeriodStart: "",
    workPeriodEnd: "",
    canArrivePreviousDay: false,
    desiredGuarantee: "",
    desiredTime: "",
    desiredRate: "",
    waitingHours: undefined as number | undefined,
    departureLocation: "",
    returnLocation: "",
    preferredLocations: [] as string[],
    ngLocations: [] as string[],
    notes: "",
    interviewDates: [] as string[],
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Loading indicator
  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }

  // 働き方選択のハンドラー
  const handleWorkTypeSelect = (type: "出稼ぎ" | "在籍") => {
    setSelectedType(type);
    setShowForm(true);
    setMessages(prev => [...prev, {
      type: "user",
      content: `${type}を選択しました`
    }, {
      type: "ai",
      content: `${type}での勤務を希望されるのですね。
では、具体的な希望条件をお聞かせください。`
    }]);
  };

  // 戻るボタンのハンドラー
  const handleBack = () => {
    setSelectedType(null);
    setShowForm(false);
    setMessages(prev => [...prev, {
      type: "user",
      content: "選択しなおします"
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-gradient-to-b from-background to-muted/20">
      <header className="bg-background p-4 border-b">
        <div className="container max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold">SCAIマッチング</span>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="container max-w-screen-2xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "ai" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`flex items-start gap-2 max-w-[80%] ${
                  message.type === "ai" ? "flex-row" : "flex-row-reverse"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === "ai"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.type === "ai" ? (
                    <Bot className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div
                  className={`rounded-lg p-4 ${
                    message.type === "ai"
                      ? "bg-card text-card-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {!selectedType && !showForm && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="container max-w-screen-2xl mx-auto">
            <div className="flex flex-col gap-4">
              <p className="text-center text-muted-foreground">
                希望する働き方を選択してください
              </p>
              <div className="flex gap-4 justify-center">
                {workTypes.map((type) => (
                  <Button
                    key={type}
                    onClick={() => handleWorkTypeSelect(type as "出稼ぎ" | "在籍")}
                    className="min-w-[120px]"
                    variant={type === "出稼ぎ" ? "default" : "secondary"}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && selectedType && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Card className="border-t sticky bottom-0 bg-background">
            <div className="p-6 space-y-6">
              <div className="flex justify-start">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>選択しなおす</span>
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="after:content-['*'] after:text-red-500 after:ml-0.5">
                  希望業種（複数選択可）
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  あなたの希望や経験に合わせて、働きやすい業種を選択してください。複数選択することで、より多くの求人をご紹介できます。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {WORK_TYPES_WITH_DESCRIPTION.map((type) => (
                    <div key={type.id} className="flex flex-col space-y-2 p-4 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={type.id}
                          checked={conditions.workTypes.includes(type.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setConditions({
                                ...conditions,
                                workTypes: [...conditions.workTypes, type.id],
                              });
                            } else {
                              setConditions({
                                ...conditions,
                                workTypes: conditions.workTypes.filter(
                                  (t) => t !== type.id
                                ),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={type.id}>{type.label}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {type.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIMatchingChat;

const WAITING_HOURS = Array.from({ length: 15 }, (_, i) => ({
  value: String(i + 10),
  label: `${i + 10}時間`,
}));

// 12時間未満のオプションを除外
const VALID_WAITING_HOURS = WAITING_HOURS.filter(
  option => parseInt(option.value) >= 12
);