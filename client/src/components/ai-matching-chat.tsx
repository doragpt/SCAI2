import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Bot, User, Loader2, ArrowLeft, Check, X } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useMatching } from "@/hooks/use-matching";
import { WORK_TYPES_WITH_DESCRIPTION, TIME_OPTIONS, RATE_OPTIONS, GUARANTEE_OPTIONS, prefectures } from "@/constants/work-types";
import { formatConditionsMessage } from "@/utils/format-conditions-message";
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";


// メッセージの型定義
interface Message {
  type: "ai" | "user";
  content: string;
}

// 勤務時間の定数を修正（10時間から24時間まで、1時間単位）
const VALID_WAITING_HOURS = Array.from({ length: 15 }, (_, i) => ({
  value: String(i + 10),
  label: `${i + 10}時間`,
}));

export const AIMatchingChat = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { profileData, isLoading: isProfileLoading } = useProfile();
  const [selectedType, setSelectedType] = useState<"出稼ぎ" | "在籍" | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [workTypes] = useState(["出稼ぎ", "在籍"]);
  const { toast } = useToast();

  // メッセージの状態を復元
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

  // 日付のフォーマット関数
  const formatDate = (dateString: string) => {
    if (!dateString) return "未入力";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Tokyo'
      }).replace(/\//g, '年').replace(/\//g, '月') + '日';
    } catch (e) {
      return "未入力";
    }
  };

  // 条件送信のハンドラー
  const handleConditionSubmit = () => {
    if (!conditions.workTypes.length) {
      toast({
        title: "エラー",
        description: "希望業種を選択してください",
        variant: "destructive",
      });
      return;
    }

    if (selectedType === "出稼ぎ") {
      if (!conditions.workPeriodStart || !conditions.workPeriodEnd) {
        toast({
          title: "エラー",
          description: "勤務期間を入力してください",
          variant: "destructive",
        });
        return;
      }

      if (!conditions.departureLocation || !conditions.returnLocation) {
        toast({
          title: "エラー",
          description: "出発地と帰宅地を選択してください",
          variant: "destructive",
        });
        return;
      }

      if (!conditions.waitingHours || conditions.waitingHours < 10) {
        toast({
          title: "エラー",
          description: "一日の総勤務時間は10時間以上を選択してください",
          variant: "destructive",
        });
        return;
      }
    }

    setShowConfirmDialog(true);
  };

  // 確認ダイアログ用のフォーマット関数
  const formatProfileValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return "未入力";
    if (typeof value === 'number' && value === 0) return "未入力";
    return String(value);
  };

  const formatMeasurement = (value: number | undefined, unit: string): string => {
    if (!value || value === 0) return "未入力";
    return `${value}${unit}`;
  };

  const handleConfirmDialogClose = () => {
    setShowConfirmDialog(false);
  };

  const handleConfirmConditions = () => {
    setShowConfirmDialog(false);
    setShowForm(false);
    setMessages(prev => [...prev, {
      type: "user",
      content: formatConditionsMessage(conditions, selectedType)
    }, {
      type: "ai",
      content: "ご希望の条件を確認させていただきました。マッチング検索を開始しますか？"
    }]);
  };


  // 年齢計算関数を追加
  const calculateAge = (birthDate: string | undefined): number | null => {
    if (!birthDate) return null;
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return null;
    }
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

      {/* 入力フォーム */}
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

              {selectedType === "出稼ぎ" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="after:content-['*'] after:text-red-500 after:ml-0.5">
                        勤務開始日
                      </Label>
                      <Input
                        type="date"
                        required
                        min={new Date(Date.now() + 86400000)
                          .toISOString()
                          .split("T")[0]}
                        onChange={(e) =>
                          setConditions({
                            ...conditions,
                            workPeriodStart: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="after:content-['*'] after:text-red-500 after:ml-0.5">
                        勤務終了日
                      </Label>
                      <Input
                        type="date"
                        required
                        min={
                          conditions.workPeriodStart ||
                          new Date(Date.now() + 86400000)
                            .toISOString()
                            .split("T")[0]
                        }
                        onChange={(e) =>
                          setConditions({
                            ...conditions,
                            workPeriodEnd: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="previous-day"
                      onCheckedChange={(checked) =>
                        setConditions({
                          ...conditions,
                          canArrivePreviousDay: checked,
                        })
                      }
                    />
                    <Label htmlFor="previous-day">前日入りの可否</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>希望保証</Label>
                    <Select
                      onValueChange={(value) =>
                        setConditions({
                          ...conditions,
                          desiredGuarantee: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="希望保証を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {GUARANTEE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>希望単価</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        onValueChange={(value) =>
                          setConditions({
                            ...conditions,
                            desiredTime: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="時間を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        onValueChange={(value) =>
                          setConditions({
                            ...conditions,
                            desiredRate: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="金額を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {RATE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="after:content-['*'] after:text-red-500 after:ml-0.5">
                      一日の総勤務時間
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      12時間以上の勤務が基本的に保証条件となります。
                    </p>
                    <Select
                      onValueChange={(value) =>
                        setConditions({
                          ...conditions,
                          waitingHours: value ? Number(value) : undefined,
                        })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="勤務時間を選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {VALID_WAITING_HOURS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="after:content-['*'] after:text-red-500 after:ml-0.5">
                        出発地
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setConditions({
                            ...conditions,
                            departureLocation: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="都道府県を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {prefectures.map((pref) => (
                            <SelectItem key={pref} value={pref}>
                              {pref}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="after:content-['*'] after:text-red-500 after:ml-0.5">
                        帰宅地
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setConditions({
                            ...conditions,
                            returnLocation: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="都道府県を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {prefectures.map((pref) => (
                            <SelectItem key={pref} value={pref}>
                              {pref}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="space-y-2">
                        <Label>面接希望日時 {i + 1}</Label>
                        <Input
                          type="datetime-local"
                          onChange={(e) => {
                            const dates = [...(conditions.interviewDates || [])];
                            dates[i] = e.target.value;
                            setConditions({
                              ...conditions,
                              interviewDates: dates,
                            });
                          }}
                        />
                      </div>
                    ))}

                    <div className="space-y-2">
                      <Label>希望単価</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          onValueChange={(value) =>
                            setConditions({
                              ...conditions,
                              desiredTime: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="時間を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(value) =>
                            setConditions({
                              ...conditions,
                              desiredRate: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="金額を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {RATE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 希望地域の選択 */}
              <div className="space-y-2">
                <Label>希望地域</Label>
                <Select
                  onValueChange={(value) =>
                    setConditions({
                      ...conditions,
                      preferredLocations: [...conditions.preferredLocations, value],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="都道府県を選択（複数選択可）" />
                  </SelectTrigger>
                  <SelectContent>
                    {prefectures.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {conditions.preferredLocations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {conditions.preferredLocations.map((loc) => (
                      <Button
                        key={loc}
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setConditions({
                            ...conditions,
                            preferredLocations: conditions.preferredLocations.filter(
                              (l) => l !== loc
                            ),
                          })
                        }
                      >
                        {loc} ×
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* NG地域の選択 */}
              <div className="space-y-2">
                <Label>NG地域</Label>
                <Select
                  onValueChange={(value) =>
                    setConditions({
                      ...conditions,
                      ngLocations: [...conditions.ngLocations, value],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="都道府県を選択（複数選択可）" />
                  </SelectTrigger>
                  <SelectContent>
                    {prefectures.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {conditions.ngLocations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {conditions.ngLocations.map((loc) => (
                      <Button
                        key={loc}
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setConditions({
                            ...conditions,
                            ngLocations: conditions.ngLocations.filter(
                              (l) => l !== loc
                            ),
                          })
                        }
                      >
                        {loc} ×
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>その他備考</Label>
                <Input
                  placeholder="その他の希望条件があればご記入ください"
                  onChange={(e) =>
                    setConditions({
                      ...conditions,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

              <Button
                className="w-full mt-6"
                onClick={handleConditionSubmit}
                disabled={
                  conditions.workTypes.length === 0 ||
                  (selectedType === "出稼ぎ" &&
                    (!conditions.workPeriodStart ||
                      !conditions.workPeriodEnd ||
                      !conditions.departureLocation ||
                      !conditions.returnLocation ||
                      !conditions.waitingHours))
                }
              >
                入力内容を確認する
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 確認ダイアログ */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>入力内容の確認</AlertDialogTitle>
            <AlertDialogDescription>
              以下の内容でマッチングを開始します
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-8">
            {/* プロフィール情報セクション */}
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="text-lg font-medium mb-4">プロフィール情報</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>氏名</Label>
                  <p className="text-sm font-medium">
                    {profileData?.lastName} {profileData?.firstName}
                  </p>
                </div>
                <div>
                  <Label>フリガナ</Label>
                  <p className="text-sm font-medium">
                    {profileData?.lastNameKana} {profileData?.firstNameKana}
                  </p>
                </div>
                <div>
                  <Label>生年月日</Label>
                  <p className="text-sm font-medium">
                    {formatDate(user?.birthDate || '')}
                  </p>
                </div>
                <div>
                  <Label>年齢</Label>
                  <p className="text-sm font-medium">
                    {calculateAge(user?.birthDate) ? `${calculateAge(user?.birthDate)}歳` : "未入力"}
                  </p>
                </div>
                <div>
                  <Label>居住地</Label>
                  <p className="text-sm font-medium">{profileData?.location}</p>
                </div>
                <div>
                  <Label>最寄り駅</Label>
                  <p className="text-sm font-medium">{profileData?.nearestStation}</p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* 身体的特徴 */}
              <h4 className="font-medium mb-2">身体的特徴</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>身長</Label>
                  <p className="text-sm font-medium">{profileData?.height}cm</p>
                </div>
                <div>
                  <Label>体重</Label>
                  <p className="text-sm font-medium">{profileData?.weight}kg</p>
                </div>
                <div>
                  <Label>スリーサイズ</Label>
                  <p className="text-sm font-medium">
                    B{profileData?.bust || '未入力'} W{profileData?.waist || '未入力'} H{profileData?.hip || '未入力'}
                  </p>
                </div>
                <div>
                  <Label>カップサイズ</Label>
                  <p className="text-sm font-medium">{profileData?.cupSize}カップ</p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* 身分証明書 */}
              <h4 className="font-medium mb-2">身分証明書</h4>
              <div className="space-y-2">
                <div>
                  <Label>提示可能な身分証明書</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profileData?.availableIds?.types?.map((id, index) => (
                      <Badge key={index} variant="outline">
                        {id}
                      </Badge>
                    ))}
                    {profileData?.availableIds?.others?.map((id, index) => (
                      <Badge key={`other-${index}`} variant="outline">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>本籍地記載の住民票</Label>
                  <Badge variant={profileData?.canProvideResidenceRecord ? "default" : "secondary"}>
                    {profileData?.canProvideResidenceRecord ? "提出可能" : "提出不可"}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              {/* 各種対応可否 */}
              <h4 className="font-medium mb-2">各種対応可否</h4>
              <div className="space-y-2">
                <div>
                  <Label>写メ日記の投稿</Label>
                  <Badge variant={profileData?.photoDiaryAllowed ? "default" : "secondary"}>
                    {profileData?.photoDiaryAllowed ? "可能" : "不可"}
                  </Badge>
                </div>
                <div>
                  <Label>自宅待機での出張</Label>
                  <Badge variant={profileData?.canHomeDelivery ? "default" : "secondary"}>
                    {profileData?.canHomeDelivery ? "可能" : "不可"}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              {/* NGオプション */}
              <h4 className="font-medium mb-2">NGオプション</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  ...(profileData?.ngOptions?.common || []),
                  ...(profileData?.ngOptions?.others || [])
                ].map((option, index) => (
                  <Badge key={index} variant="destructive">
                    {option}
                  </Badge>
                ))}
              </div>

              <Separator className="my-4" />

              {/* アレルギー */}
              {profileData?.allergies && (
                <>
                  <h4 className="font-medium mb-2">アレルギー</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ...(profileData.allergies.types || []),
                      ...(profileData.allergies.others || [])
                    ].map((allergy, index) => (
                      <Badge key={index} variant="destructive">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                  <Separator className="my-4" />
                </>
              )}

              {/* 傷・タトゥー・アトピー */}
              {profileData?.bodyMark && (profileData.bodyMark.hasBodyMark || profileData.bodyMark.others?.length > 0) && (
                <>
                  <h4 className="font-medium mb-2">傷・タトゥー・アトピー</h4>
                  <div className="space-y-2">
                    {profileData.bodyMark.others && profileData.bodyMark.others.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profileData.bodyMark.others.map((mark, index) => (
                          <Badge key={index} variant="outline">
                            {mark}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {profileData.bodyMark.details && (
                      <p className="text-sm whitespace-pre-wrap">
                        {profileData.bodyMark.details}
                      </p>
                    )}
                  </div>
                  <Separator className="my-4" />
                </>
              )}

              {/* 喫煙情報 */}
              {profileData?.smoking && (
                <>
                  <h4 className="font-medium mb-2">喫煙情報</h4>
                  <div className="space-y-2">
                    <Badge variant={profileData.smoking.enabled ? "default" : "secondary"}>
                      {profileData.smoking.enabled ? "喫煙あり" : "喫煙なし"}
                    </Badge>
                    {profileData.smoking.enabled && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          ...(profileData.smoking.types || []),
                          ...(profileData.smoking.others || [])
                        ].map((type, index) => (
                          <Badge key={index} variant="outline">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Separator className="my-4" />
                </>
              )}

              {/* エステ関連 */}
              <h4 className="font-medium mb-2">エステ関連</h4>
              <div className="space-y-2">
                <Badge variant={profileData?.hasEstheExperience ? "default" : "secondary"}>
                  {profileData?.hasEstheExperience ? `あり（${profileData?.estheExperiencePeriod}）` : "無し"}
                </Badge>
                {profileData?.estheOptions?.available && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profileData.estheOptions.available.map((option, index) => (
                      <Badge key={index} variant="outline">
                        {option}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* 顔出し設定 */}
              <h4 className="font-medium mb-2">顔出し設定</h4>
              <p className="text-sm font-medium">{profileData?.faceVisibility}</p>

              <Separator className="my-4" />

              {/* 在籍店舗情報 */}
              {(profileData?.currentStores?.length > 0 || profileData?.previousStores?.length > 0) && (
                <>
                  <h4 className="font-medium mb-2">在籍店舗情報</h4>
                  <div className="space-y-2">
                    {profileData?.currentStores?.map((store, index) => (
                      <div key={index}>
                        <p className="text-sm font-medium">
                          現在の在籍店舗: {store.storeName}（{store.stageName}）
                        </p>
                      </div>
                    ))}
                    {profileData?.previousStores?.map((store, index) => (
                      <div key={index}>
                        <p className="text-sm font-medium">
                          過去の在籍店舗: {store.storeName}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                </>
              )}

              {/* 自己PR・備考 */}
              <h4 className="font-medium mb-2">自己PR・備考</h4>
              <div className="space-y-4">
                <div>
                  <Label>自己PR</Label>
                  <p className="text-sm whitespace-pre-wrap mt-1">
                    {profileData?.selfIntroduction || "未入力"}
                  </p>
                </div>
                <div>
                  <Label>備考</Label>
                  <p className="text-sm whitespace-pre-wrap mt-1">
                    {profileData?.notes || "未入力"}
                  </p>
                </div>
              </div>
            </div>

            {/* 希望条件セクション (既存のコード) */}
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="text-lg font-medium mb-4">希望条件</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>希望する働き方</Label>
                  <p className="text-sm font-medium text-primary">{selectedType}</p>
                </div>
                <div>
                  <Label>希望業種</Label>
                  <div className="flex flex-wrap gap-2">
                    {conditions.workTypes.map((type) => (
                      <span
                        key={type}
                        className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full"
                      >
                        {WORK_TYPES_WITH_DESCRIPTION.find(t => t.id === type)?.label}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedType === "出稼ぎ" && (
                  <>
                    <div>
                      <Label>勤務期間</Label>
                      <p className="text-sm font-medium">
                        {conditions.workPeriodStart} 〜 {conditions.workPeriodEnd}
                      </p>
                    </div>
                    <div>
                      <Label>移動</Label>
                      <p className="text-sm font-medium">
                        {conditions.departureLocation} → {conditions.returnLocation}
                      </p>
                    </div>
                    <div>
                      <Label>一日の総勤務時間</Label>
                      <p className="text-sm font-medium">{conditions.waitingHours}時間</p>
                    </div>
                    <div>
                      <Label>前日入り</Label>
                      <p className="text-sm font-medium">
                        {conditions.canArrivePreviousDay ? "可能" : "不可"}
                      </p>
                    </div>
                    {conditions.desiredGuarantee && (
                      <div>
                        <Label>希望保証</Label>
                        <p className="text-sm font-medium">{conditions.desiredGuarantee}</p>
                      </div>
                    )}
                    {conditions.desiredTime && conditions.desiredRate && (
                      <div>
                        <Label>希望単価</Label>
                        <p className="text-sm font-medium">
                          {conditions.desiredTime}：{conditions.desiredRate}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {selectedType === "在籍" && conditions.interviewDates.length > 0 && (
                  <div className="col-span-2">
                    <Label>面接希望日時</Label>
                    <div className="space-y-1">
                      {conditions.interviewDates.map((date, index) => (
                        <p key={index} className="text-sm font-medium">{date}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="col-span-2">
                  <Label>希望地域</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {conditions.preferredLocations.map((loc) => (
                      <span
                        key={loc}
                        className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full"
                      >
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>NG地域</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {conditions.ngLocations.map((loc) => (
                      <span
                        key={loc}
                        className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full"
                      >
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
                {conditions.notes && (
                  <div className="col-span-2">
                    <Label>その他備考</Label>
                    <p className="text-sm whitespace-pre-wrap">{conditions.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmDialogClose}>
              修正する
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmConditions}>
              この内容で進める
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIMatchingChat;