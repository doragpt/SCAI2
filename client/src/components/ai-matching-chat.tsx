import { MatchingStatusDialog } from "@/components/matching-status-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Loader2, Bot, User, CheckIcon, MapPin, Star, Building2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { StoreDetailModal } from "@/components/store-detail-modal";
import ProfileCheckDialog from "@/components/profile-check-dialog";
import { useProfile } from "@/hooks/use-profile";
import { useMatching } from "@/hooks/use-matching";
import { WORK_TYPES_WITH_DESCRIPTION, TIME_OPTIONS, RATE_OPTIONS, GUARANTEE_OPTIONS, prefectures } from "@/constants/work-types";
import { formatConditionsMessage } from "@/utils/format-conditions-message";

// 型定義
interface Message {
  type: "ai" | "user";
  content: string;
}

interface Store {
  id: number;
  name: string;
  location: string;
  rating: number;
  matches: string[];
  checked?: boolean;
  status?: 'pending' | 'accepted' | 'rejected';
  responseTime?: string;
}

// コンポーネント
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
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<"出稼ぎ" | "在籍" | null>(null);
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showMatchingOptions, setShowMatchingOptions] = useState(false); // 初期値をfalseに変更
  const [matchingState, setMatchingState] = useState<"searching" | "listing" | "done">("done");
  const [showStoreDetail, setShowStoreDetail] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [workTypes, setWorkTypes] = useState(["出稼ぎ", "在籍"]);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [checkedStores, setCheckedStores] = useState<Store[]>([]);
  const [showProfileCheck, setShowProfileCheck] = useState(false);
  const { profileData, updateProfile } = useProfile();
  const { startMatching, matchingResults, setCurrentPage, currentPage, setMatchingResults } = useMatching();
  const [location] = useLocation();
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleWorkTypeSelect = (type: string) => {
    setSelectedType(type);
    setShowForm(true);
    setShowMatchingOptions(false);
  };

  const handleBack = () => {
    setSelectedType(null);
    setShowForm(false);
    setShowMatchingOptions(false); // マッチング方法の選択を非表示に
  };

  const handleConditionSubmit = () => {
    setShowForm(false);
    setShowProfileCheck(true); // プロフィールチェックを先に表示
  };

  const handleStartMatching = () => {
    setIsLoading(true);
    startMatching(conditions);
    setIsLoading(false);
  };

  const handleStoreCheck = (result: Store) => {
    setCheckedStores((prev) => {
      const isChecked = prev.some((item) => item.id === result.id);
      if (isChecked) {
        return prev.filter((item) => item.id !== result.id);
      } else {
        return [...prev, result];
      }
    });
  };

  const handleShowStoreDetail = (store: Store) => {
    setSelectedStore(store);
    setShowStoreDetail(true);
  };

  const handleRecheck = () => {
    setShowSummaryDialog(false);
  };

  const handleConfirmSelection = () => {
    setShowSummaryDialog(false);
    // Handle store selection logic here
  };

  const [showMatchingStatus, setShowMatchingStatus] = useState(false);
  const [matchingStores, setMatchingStores] = useState<Store[]>([]);

  const handleAutoMatching = () => {
    try {
      setMessages(prev => [...prev, {
        type: 'user',
        content: '自動で確認する'
      }, {
        type: 'ai',
        content: `自動マッチングを開始します！
あなたの希望条件に合う店舗を探して、以下の手順で進めていきます：

1. AIがあなたの条件に最適な店舗を検索
2. 条件に合う店舗へ自動で連絡
3. 店舗からの返信を待機
4. 受け入れ可能な店舗が見つかり次第ご連絡

返信があるまでしばらくお待ちください。店舗への連絡は順次完了し、店舗からの返信があり次第すぐにお知らせいたします。`
      }]);
      setShowMatchingOptions(false);
      setMatchingState('searching');

      // モックデータの生成 - 実際の実装では店舗検索APIを使用
      const mockStores: Store[] = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `店舗${i + 1}`,
        location: '東京都',
        matches: ['条件1', '条件2'],
        rating: 4.5,
        status: 'pending'
      }));
      setMatchingStores(mockStores);

      // 店舗の状態を徐々に更新するシミュレーション
      setTimeout(() => {
        setMatchingStores(prev => prev.map(store =>
          store.id === 1 ? {
            ...store,
            status: 'accepted',
            responseTime: new Date().toLocaleString('ja-JP')
          } : store
        ));
        setMessages(prev => [...prev, {
          type: 'ai',
          content: '店舗1から受け入れ可能との返信がありました！\n詳細は「マッチング状況を確認」から確認できます。'
        }]);
      }, 5000);

      // 別の店舗の応答シミュレーション
      setTimeout(() => {
        setMatchingStores(prev => prev.map(store =>
          store.id === 2 ? {
            ...store,
            status: 'rejected',
            responseTime: new Date().toLocaleString('ja-JP')
          } : store
        ));
      }, 8000);
    } catch (error) {
      console.error('Error in handleAutoMatching:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'すみません、エラーが発生しました。もう一度お試しください。'
      }]);
    }
  };

  const handlePickupMatching = () => {
    try {
      setMessages(prev => [...prev, {
        type: 'user',
        content: 'ピックアップしてから確認する'
      }, {
        type: 'ai',
        content: 'では合いそうな店舗をリストアップするね！'
      }]);

      // 店舗検索のシミュレーション
      setTimeout(() => {
        const mockResults = Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          name: `店舗${i + 1}`,
          location: '東京都',
          rating: Math.random(),
          matches: ['希望時給', '勤務時間帯', '業態'],
          checked: false
        }));

        setMatchingResults(mockResults);
        setMessages(prev => [...prev, {
          type: 'ai',
          content: `お待たせ！あなたに合いそうな店舗は${mockResults.length}件程あったよ！\nまずは10件、リストアップするね！`
        }]);

        setMatchingState('listing');
        setShowMatchingOptions(false);
      }, 2000);
    } catch (error) {
      console.error('Error in handlePickupMatching:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'すみません、エラーが発生しました。もう一度お試しください。'
      }]);
    }
  };

  const handleProfileCheckConfirm = () => {
    setShowProfileCheck(false);
    setShowConfirmDialog(true);
  };

  const handleShowSummary = () => {
    setShowSummaryDialog(true);
  };

  const handleConfirmConditions = () => {
    setShowConfirmDialog(false);
    setShowMatchingOptions(true); // 条件確認後にマッチング方法の選択画面を表示
    setMessages(prev => [...prev, {
      type: 'ai',
      content: `それでは、マッチング方法を選んでください！

【自動でマッチング】
AIが自動で店舗とのマッチングを行います。

【ピックアップしてから確認】
条件に合う店舗をリストアップして、ご自身で選んでいただけます。`
    }]);
  };


  const renderMatchingResults = () => {
    if (matchingState !== 'listing' || matchingResults.length === 0) {
      return null;
    }

    const currentResults = matchingResults.slice(currentPage * 10, (currentPage + 1) * 10);
    const checkedCount = matchingResults.filter(store => store.checked).length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">おすすめの店舗一覧</h3>
            <p className="text-sm text-muted-foreground">
              条件マッチ度が高い順に表示しています
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">選択中の店舗</p>
            <p className="text-2xl font-bold text-primary">{checkedCount}件</p>
          </div>
        </div>

        <div className="space-y-4">
          {currentResults.map((result) => (
            <Card
              key={result.id}
              className={cn(
                "p-4 transition-colors",
                result.checked ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent/5"
              )}
            >
              <div className="flex gap-4">
                <div className="flex items-start pt-1">
                  <Checkbox
                    checked={result.checked || false}
                    onCheckedChange={() => handleStoreCheck(result)}
                    id={`store-${result.id}`}
                    className="h-5 w-5"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <Label
                      htmlFor={`store-${result.id}`}
                      className="text-lg font-medium cursor-pointer hover:text-primary"
                    >
                      {result.name}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{result.location}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {result.matches.map((match, i) => (
                      <span
                        key={i}
                        className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full"
                      >
                        {match}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        マッチ度 {result.rating * 20}%
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleShowStoreDetail(result)}
                    >
                      詳細を見る
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {checkedCount > 0 && (
            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">選択中の店舗: {checkedCount}件</h4>
                  <p className="text-sm text-muted-foreground">
                    条件確認を行う店舗を選択してください
                  </p>
                </div>
                <Button
                  className="shrink-0"
                  onClick={handleShowSummary}
                >
                  選択した店舗で確認する
                </Button>
              </div>
            </div>
          )}

          {currentPage * 10 + 10 < matchingResults.length && (
            <Button
              variant="outline"
              onClick={() => {
                setCurrentPage(prev => prev + 1);
                setMessages(prev => [...prev, {
                  type: 'ai',
                  content: `次の10件の店舗を表示します！\n現在${checkedCount}件の店舗を選択中です。気になる店舗を見つけたら「詳細を見る」から詳しい情報を確認できます。`
                }]);
              }}
            >
              次の10件を見る（残り{matchingResults.length - ((currentPage + 1) * 10)}件）
            </Button>
          )}
        </div>
      </div>
    );
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

      {!selectedType && !isLoading && (
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
                    onClick={() => handleWorkTypeSelect(type)}
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
                    <div className="spacey-2">
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
                    <Label>一日の総勤務時間</Label>
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
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="勤務時間を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {WAITING_HOURS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Added Departure and Return Location Selects */}
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

                  <div className="space-y-2">
                    <Label>希望地域</Label>
                    <Select
                      onValueChange={(value) =>
                        setConditions({
                          ...conditions,
                          preferredLocations: [
                            ...conditions.preferredLocations,
                            value,
                          ],
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
                      !conditions.workPeriodStart ||
                      !conditions.workPeriodEnd ||
                      !conditions.departureLocation ||
                      !conditions.returnLocation
                    }
                  >
                    入力内容を確認する
                  </Button>
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

                    <div className="space-y-2">
                      <Label className={selectedType === "在籍" ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ""}>
                        希望地域
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        {selectedType === "在籍"
                          ? "在籍での勤務を希望する地域を選択してください。通勤のしやすさなども考慮してお選びください。"
                          : "出稼ぎでの勤務を希望する地域を選択してください。交通費や宿泊費のサポートがある地域もあります。"}
                      </p>
                      <Select
                        onValueChange={(value) =>
                          setConditions({
                            ...conditions,
                            preferredLocations: [
                              ...conditions.preferredLocations,
                              value,
                            ],
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
                                    (l) => l !==loc
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

                    <Button
                      className="w-full mt-6"
                      onClick={handleConditionSubmit}
                      disabled={
                        conditions.workTypes.length === 0 ||
                        (selectedType === "在籍" && conditions.preferredLocations.length === 0)
                      }
                    >
                      入力内容を確認する
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {showMatchingOptions && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Card className="border-t sticky bottom-0 bg-background"><div className="p-6">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">マッチング方法の選択</h3>
                  <p className="text-sm text-muted-foreground">
                    あなたの希望に合った店舗を探す方法を選択してください
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card
                    className="p-6 hover:bg-accent cursor-pointer transition-colors relative overflow-hidden group"
                    onClick={handleAutoMatching}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-lg font-medium flex items-center gap-2">
                          <Bot className="h-5 w-5 text-primary" />
                          自動でマッチング                        </h4>
                        <p className="text-sm text-muted-foreground">
                          AIが自動で店舗とのマッチングを行います
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">おすすめのケース</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• できるだけ早く働きたい</li>
                          <li>• 複数の店舗から選びたい</li>
                          <li>• 自分で店舗を探す時間がない</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">処理の流れ</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>1. AIが条件に合う店舗を検索</li>
                          <li>2. 店舗へ自動で連絡</li>
                          <li>3. 返信を待機</li>
                          <li>4. 受け入れ可能な店舗から連絡</li>
                        </ul>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                  </Card>

                  <Card
                    className="p-6 hover:bg-accent cursor-pointer transition-colors relative overflow-hidden group"
                    onClick={handlePickupMatching}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-lg font-medium flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          ピックアップしてから確認
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          条件に合う店舗から自分で選択できます
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">おすすめのケース</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• じっくり店舗を選びたい</li>
                          <li>• 複数の店舗を比較したい</li>
                          <li>• 詳細な情報を確認したい</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">処理の流れ</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>1. AIが店舗をリストアップ</li>
                          <li>2. マッチ度順に表示</li>
                          <li>3. 気になる店舗を選択</li>
                          <li>4. 店舗へ確認を実施</li>
                        </ul>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                  </Card>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 自動マッチング中の表示画面を改善 */}
      {matchingState === "searching" && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Card className="border-t sticky bottom-0 bg-background">
            <div className="p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 animate-pulse bg-primary/5 rounded-full" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-medium">マッチング処理中...</h3>
                  <p className="text-sm text-muted-foreground">
                    条件に合う店舗を探しています
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1 text-left">
                    <p>自動マッチングの進行状況：</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>• 適切な店舗の検索</li>
                      <li>• 店舗への連絡と条件確認</li>
                      <li>• 複数の店舗から返信がある場合もあり</li>
                    </ul>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleShowMatchingStatus}
                  >
                    マッチング状況を確認
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ピックアップマッチングの結果表示を改善 */}
      {matchingState === "listing" && matchingResults.length > 0 && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Card className="border-t sticky bottom-0 bg-background">
            <div className="p-6 space-y-6">
              {renderMatchingResults()}
            </div>
          </Card>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">処理中...</p>
          </div>
        </div>
      )}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>入力内容の確認</DialogTitle>
            <DialogDescription>
              入力された条件とウェブ履歴書の情報を確認してください。
              問題がなければ「この内容で進める」を選択してください。
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-6 p-4">
              {/* ウェブ履歴書セクション */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="text-lg font-medium">ウェブ履歴書の情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* 基本情報 */}
                  <div>
                    <Label>お名前</Label>
                    <p className="text-sm">{profileData?.lastName} {profileData?.firstName}</p>
                  </div>
                  <div>
                    <Label>フリガナ</Label>
                    <p className="text-sm">{profileData?.lastNameKana} {profileData?.firstNameKana}</p>
                  </div>
                  <div>
                    <Label>居住地</Label>
                    <p className="text-sm">{profileData?.location}</p>
                  </div>
                  <div>
                    <Label>最寄り駅</Label>
                    <p className="text-sm">{profileData?.nearestStation}</p>
                  </div>

                  {/* 身体的特徴 */}
                  <div>
                    <Label>身長</Label>
                    <p className="text-sm">{profileData?.height}cm</p>
                  </div>
                  <div>
                    <Label>体重</Label>
                    <p className="text-sm">{profileData?.weight}kg</p>
                  </div>
                  <div>
                    <Label>スリーサイズ</Label>
                    <p className="text-sm">B{profileData?.bust} W{profileData?.waist} H{profileData?.hip}</p>
                  </div>
                  <div>
                    <Label>カップサイズ</Label>
                    <p className="text-sm">{profileData?.cupSize}カップ</p>
                  </div>

                  {/* 身分証明書 */}
                  <div className="col-span-2">
                    <Label>身分証明書</Label>
                    <p className="text-sm">
                      {profileData?.availableIds?.types?.join("、")}
                      {profileData?.availableIds?.others?.length > 0 &&
                        `、${profileData.availableIds.others.join("、")}`}
                    </p>
                    <p className="text-sm mt-1">
                      本籍地記載の住民票: {profileData?.canProvideResidenceRecord ? "提供可能" : "提供不可"}
                    </p>
                  </div>

                  {/* パネル設定 */}
                  <div>
                    <Label>顔出し設定</Label>
                    <p className="text-sm">{profileData?.faceVisibility}</p>
                  </div>
                  <div>
                    <Label>写メ日記</Label>
                    <p className="text-sm">{profileData?.canPhotoDiary ? "投稿可能" : "投稿不可"}</p>
                  </div>
                  <div>
                    <Label>自宅派遣</Label>
                    <p className="text-sm">{profileData?.canHomeDelivery ? "対応可能" : "対応不可"}</p>
                  </div>

                  {/* NGオプション */}
                  {profileData?.ngOptions && (profileData.ngOptions.common?.length > 0 || profileData.ngOptions.others?.length > 0) && (
                    <div className="col-span-2">
                      <Label>NGオプション</Label>
                      <p className="text-sm">
                        {profileData.ngOptions.common?.join("、")}
                        {profileData.ngOptions.others?.length > 0 &&
                          `、${profileData.ngOptions.others.join("、")}`}
                      </p>
                    </div>
                  )}

                  {/* アレルギー */}
                  {profileData?.allergies?.types && profileData.allergies.types.length > 0 && (
                    <div className="col-span-2">
                      <Label>アレルギー</Label>
                      <p className="text-sm">
                        {profileData.allergies.types.join("、")}
                        {profileData.allergies.others?.length > 0 &&
                          `、${profileData.allergies.others.join("、")}`}
                      </p>
                    </div>
                  )}

                  {/* 喫煙 */}
                  {profileData?.smoking?.types && profileData.smoking.types.length > 0 && (
                    <div className="col-span-2">
                      <Label>喫煙</Label>
                      <p className="text-sm">
                        {profileData.smoking.types.join("、")}
                        {profileData.smoking.others?.length > 0 &&
                          `、${profileData.smoking.others.join("、")}`}
                      </p>
                    </div>
                  )}

                  {/* エステオプション */}
                  {profileData?.estheOptions && (
                    <div className="col-span-2">
                      <div className="space-y-2">
                        <Label>対応可能なエステメニュー</Label>
                        <p className="text-sm">
                          {profileData.estheOptions.available?.join("、")}
                        </p>
                      </div>
                      {profileData.estheOptions.ngOptions?.length > 0 && (
                        <div className="space-y-2 mt-2">
                          <Label>NGのエステメニュー</Label>
                          <p className="text-sm">
                            {profileData.estheOptions.ngOptions.join("、")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SNSアカウント */}
                  {profileData?.hasSnsAccount && profileData?.snsUrls && profileData.snsUrls.length > 0 && (
                    <div className="col-span-2">
                      <Label>SNSアカウント</Label>
                      <div className="text-sm space-y-1">
                        {profileData.snsUrls.map((url, index) => (
                          <p key={index}>{url}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* エステ経験 */}
                  {profileData?.hasEstheExperience && (
                    <div className="col-span-2">
                      <Label>エステ経験</Label>
                      <p className="text-sm">あり（{profileData.estheExperiencePeriod}）</p>
                    </div>
                  )}

                  {/* 在籍店舗情報 */}
                  {profileData?.currentStores && profileData.currentStores.length > 0 && (
                    <div className="col-span-2">
                      <Label>現在の在籍店舗</Label>
                      <div className="text-sm space-y-1">
                        {profileData.currentStores.map((store, index) => (
                          <p key={index}>{store.storeName}（{store.stageName}）</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {profileData?.previousStores && profileData.previousStores.length > 0 && (
                    <div className="col-span-2">
                      <Label>過去の在籍店舗</Label>
                      <div className="text-sm space-y-1">
                        {profileData.previousStores.map((store, index) => (
                          <p key={index}>{store.storeName}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 自己PR */}
                  {profileData?.selfIntroduction && (
                    <div className="col-span-2">
                      <Label>自己PR</Label>
                      <p className="text-sm whitespace-pre-wrap">{profileData.selfIntroduction}</p>
                    </div>
                  )}

                  {/* その他備考 */}
                  {profileData?.notes && (
                    <div className="col-span-2">
                      <Label>その他備考</Label>
                      <p className="text-sm whitespace-pre-wrap">{profileData.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 入力条件セクション */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">希望条件</h3>
                <div className="whitespace-pre-line bg-muted/50 p-4 rounded-lg">
                  {formatConditionsMessage(conditions, selectedType)}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              修正する
            </Button>
            <Button onClick={handleConfirmConditions}>
              この内容で進める
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selectedStore && (
        <StoreDetailModal
          isOpen={showStoreDetail}
          onClose={() => setShowStoreDetail(false)}
          store={selectedStore}
        />
      )}
      <AlertDialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckIcon className="h-5 w-5 text-primary" />
              選択した店舗の確認
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-6">
                <div>
                  <p className="font-medium text-foreground">
                    以下の店舗に条件確認を行います：
                  </p>
                  <div className="mt-4 grid gap-3">
                    {checkedStores.map(store => (
                      <div key={store.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <CheckIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium">{store.name}</p>
                          <p className="text-sm text-muted-foreground">{store.location}</p>
                          <div className="flex flex-wrap gap-2">
                            {store.matches.map((match, index) => (
                              <span
                                key={index}
                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                              >
                                {match}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <p className="font-medium">確認のプロセス：</p>
                  <ol className="text-sm space-y-2 list-decimal list-inside">
                    <li>選択した店舗に条件確認の連絡を送信</li>
                    <li>店舗からの返信を待機（通常24時間以内）</li>
                    <li>返信があり次第、マッチング状況に反映</li>
                    <li>受け入れ可能な店舗から詳細な条件を確認可能</li>
                  </ol>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => setShowSummaryDialog(false)} className="border-none">
              キャンセル
            </AlertDialogCancel>
            <Button variant="outline" onClick={handleRecheck}>
              店舗を選びなおす
            </Button>
            <AlertDialogAction onClick={handleConfirmSelection}>
              この内容で確認する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ProfileCheckDialog
        isOpen={showProfileCheck}
        onClose={() => setShowProfileCheck(false)}
        onConfirm={handleProfileCheckConfirm}
        profileData={profileData}
      />
      {/* マッチング状況確認ダイアログの追加 */}
      <MatchingStatusDialog
        isOpen={showMatchingStatus}
        onClose={() => setShowMatchingStatus(false)}
        stores={matchingStores}
      />
    </div>
  );
};

const WAITING_HOURS = [
  { value: undefined, label: '選択しない' },
  { value: 10, label: '10時間' },
  { value: 11, label: '11時間' },
  { value: 12, label: '12時間' },
  { value: 13, label: '13時間' },
  { value: 14, label: '14時間' },
  { value: 15, label: '15時間' },
  { value: 16, label: '16時間' },
  { value: 17, label: '17時間' },
  { value: 18, label: '18時間' },
  { value: 19, label: '19時間' },
  { value: 20, label: '20時間' },
  { value: 21, label: '21時間' },
  { value: 22, label: '22時間' },
  { value: 23, label: '23時間' },
  { value: 24, label: '24時間' },
];