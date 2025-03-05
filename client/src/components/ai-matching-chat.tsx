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
import { Loader2, Bot, User, CheckIcon, MapPin, Star, Building2, ArrowLeft, Check, X } from "lucide-react";
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
  const [showMatchingOptions, setShowMatchingOptions] = useState(false);
  const [matchingState, setMatchingState] = useState<"searching" | "listing" | "done">("done");
  const [showStoreDetail, setShowStoreDetail] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [workTypes, setWorkTypes] = useState(["出稼ぎ", "在籍"]);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [checkedStores, setCheckedStores] = useState<Store[]>([]);
  const [showProfileCheck, setShowProfileCheck] = useState(false);
  const { profileData, isLoading: isProfileLoading } = useProfile();
  const { startMatching, matchingResults, setCurrentPage, currentPage, setMatchingResults } = useMatching();
  const [location] = useLocation();
  const { toast } = useToast();
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
    setShowMatchingOptions(false);
  };

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

      if (!conditions.waitingHours) {
        toast({
          title: "エラー",
          description: "一日の総勤務時間は必須項目です。12時間以上の勤務時間を選択してください",
          variant: "destructive",
        });
        return;
      }

      if (parseInt(conditions.waitingHours.toString()) < 12) {
        toast({
          title: "エラー",
          description: "一日の総勤務時間は12時間以上を選択してください",
          variant: "destructive",
        });
        return;
      }
    }

    setShowForm(false);
    setShowProfileCheck(true);
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
    setShowMatchingOptions(true);
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

  const handleConfirmEdit = () => {
    setShowConfirmDialog(false);
    setShowMatchingOptions(false);
    setShowForm(true);
    setMessages(prev => [...prev, {
      type: 'user',
      content: '入力内容を修正します'
    }]);
    scrollToBottom();
  };

  // フォーマット関数
  const formatProfileValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return "未入力";
    if (typeof value === 'number' && value === 0) return "未入力";
    return String(value);
  };

  // 測定値のフォーマット
  const formatMeasurement = (value: number | undefined | null, unit: string): string => {
    if (!value || value === 0) return "未入力";
    return `${value}${unit}`;
  };

  // スリーサイズのフォーマット
  const formatThreeSizes = (bust?: number | null, waist?: number | null, hip?: number | null): string => {
    if (!bust || !waist || !hip || bust === 0 || waist === 0 || hip === 0) return "未入力";
    return `B${bust} W${waist} H${hip}`;
  };

  // プロフィール表示データを構築
  const getDisplayData = () => {
    if (!profileData) {
      return null;
    }

    return {
      name: `${formatProfileValue(profileData.lastName)} ${formatProfileValue(profileData.firstName)}`,
      nameKana: `${formatProfileValue(profileData.lastNameKana)} ${formatProfileValue(profileData.firstNameKana)}`,
      birthDate: formatProfileValue(profileData.birthDate),
      age: profileData.age ? `${profileData.age}歳` : "未入力",
      phoneNumber: formatProfileValue(profileData.phoneNumber),
      email: formatProfileValue(profileData.email),
      location: formatProfileValue(profileData.location),
      nearestStation: formatProfileValue(profileData.nearestStation),
      measurements: {
        height: formatMeasurement(profileData.height, "cm"),
        weight: formatMeasurement(profileData.weight, "kg"),
        threeSizes: formatThreeSizes(profileData.bust, profileData.waist, profileData.hip),
        cupSize: profileData.cupSize ? `${profileData.cupSize}カップ` : "未入力",
      },
      // その他のプロフィールデータは既存のままで良い
      ...profileData
    };
  };

  const displayData = getDisplayData();

  // プロフィール確認ダイアログのレンダリング
  const renderProfileConfirmation = () => {
    if (isProfileLoading || !displayData) {
      return (
        <AlertDialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
          <AlertDialogContent>
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">読み込み中...</span>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <AlertDialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>プロフィール確認</AlertDialogTitle>
            <AlertDialogDescription>
              以下の内容で選択した店舗に応募します
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6">
            {/* 基本情報 */}
            <div>
              <h4 className="font-medium mb-4">基本情報</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "氏名", value: displayData?.name },
                  { label: "フリガナ", value: displayData?.nameKana },
                  { label: "生年月日", value: displayData?.birthDate },
                  { label: "年齢", value: displayData?.age },
                  { label: "電話番号", value: displayData?.phoneNumber },
                  { label: "メールアドレス", value: displayData?.email },
                  { label: "居住地", value: displayData?.location },
                  { label: "最寄り駅", value: displayData?.nearestStation }
                ].map((item) => (
                  <div key={item.label}>
                    <Label>{item.label}</Label>
                    <p className="text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 身体的特徴 */}
            <div>
              <h4 className="font-medium mb-4">身体的特徴</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "身長", value: displayData?.measurements?.height },
                  { label: "体重", value: displayData?.measurements?.weight },
                  { label: "スリーサイズ", value: displayData?.measurements?.threeSizes },
                  { label: "カップサイズ", value: displayData?.measurements?.cupSize }
                ].map((item) => (
                  <div key={item.label}>
                    <Label>{item.label}</Label>
                    <p className="text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* その他の情報も同様に... */}
             {/* 各種対応可否 */}
                  <div>
                    <h4 className="font-medium mb-4">各種対応可否</h4>
                    <div className="space-y-2">
                      {[
                        { label: "住民票の提出", value: displayData?.canProvideResidenceRecord },
                        { label: "写メ日記の投稿", value: displayData?.canPhotoDiary },
                        { label: "自宅待機での出張", value: displayData?.canHomeDelivery }
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          {item.value ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* NGオプション */}
                  <div>
                    <h4 className="font-medium mb-4">NGオプション</h4>
                    <div className="flex flex-wrap gap-2">
                      {displayData?.ngOptions?.common?.map((option) => (
                        <div
                          key={option}
                          className="inline-flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm"
                        >
                          <X className="mr-1 h-3 w-3" />
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* アレルギー */}
                  {displayData?.allergies?.types?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-4">アレルギー</h4>
                      <div className="flex flex-wrap gap-2">
                        {displayData.allergies.types.map((allergy) => (
                          <div
                            key={allergy}
                            className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm"
                          >
                            {allergy}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 喫煙 */}
                  <div>
                    <h4 className="font-medium mb-4">喫煙</h4>
                    <div className="flex flex-wrap gap-2">
                      {displayData?.smoking?.types?.map((type) => (
                        <div
                          key={type}
                          className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm"
                        >
                          {type}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* エステオプション */}
                  {displayData?.estheOptions && (
                    <div>
                      <h4 className="font-medium mb-4">エステメニュー</h4>
                      <div className="space-y-4">
                        <div>
                          <Label>対応可能なメニュー</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {displayData.estheOptions.available?.map((option) => (
                              <div
                                key={option}
                                className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm"
                              >
                                <Check className="mr-1 h-3 w-3 text-green-500" />
                                {option}
                              </div>
                            ))}
                          </div>
                        </div>
                        {displayData.estheOptions.ngOptions?.length > 0 && (
                          <div>
                            <Label>NGのメニュー</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {displayData.estheOptions.ngOptions.map((option) => (
                                <div
                                  key={option}
                                  className="inline-flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm"
                                >
                                  <X className="mr-1 h-3 w-3" />
                                  {option}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* エステ経験 */}
                  {displayData?.hasEstheExperience && (
                    <div>
                      <h4 className="font-medium mb-4">エステ経験</h4>
                      <p className="text-sm">あり（{displayData.estheExperiencePeriod}）</p>
                    </div>
                  )}

                  {/* 顔出し設定 */}
                  <div>
                    <h4 className="font-medium mb-4">顔出し設定</h4>
                    <p className="text-sm">{displayData?.faceVisibility}</p>
                  </div>

                  {/* 在籍店舗情報 */}
                  {(displayData?.currentStores?.length > 0 || displayData?.previousStores?.length > 0) && (
                    <div>
                      <h4 className="font-medium mb-4">在籍店舗情報</h4>
                      {displayData?.currentStores?.length > 0 && (
                        <div className="mb-4">
                          <Label>現在の在籍店舗</Label>
                          <div className="space-y-1 mt-2">
                            {displayData.currentStores.map((store) => (
                              <p key={store.storeName} className="text-sm">
                                {store.storeName}（{store.stageName}）
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      {displayData?.previousStores?.length > 0 && (
                        <div>
                          <Label>過去の在籍店舗</Label>
                          <div className="space-y-1 mt-2">
                            {displayData.previousStores.map((store) => (
                              <p key={store.storeName} className="text-sm">
                                {store.storeName}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 自己PR */}
                  {displayData?.selfIntroduction && (
                    <div>
                      <h4 className="font-medium mb-4">自己PR</h4>
                      <p className="text-sm whitespace-pre-wrap">{displayData.selfIntroduction}</p>
                    </div>
                  )}

                  {/* その他備考 */}
                  {displayData?.notes && (
                    <div>
                      <h4 className="font-medium mb-4">その他備考</h4>
                      <p className="text-sm whitespace-pre-wrap">{displayData.notes}</p>
                    </div>
                  )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRecheck}>
              確認しなおす
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSelection}>
              この内容で確定する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  // ...残りのコンポーネントの内容は既存のまま...
};

const WAITING_HOURS = Array.from({ length: 15 }, (_, i) => ({
  value: String(i + 10),
  label: `${i + 10}時間`,
}));

// 12時間未満のオプションを除外
const VALID_WAITING_HOURS = WAITING_HOURS.filter(
  option => parseInt(option.value) >= 12
);