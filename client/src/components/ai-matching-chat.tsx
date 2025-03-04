import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Bot, User } from "lucide-react";
import { workTypes, prefectures, type TalentProfile } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StoreDetailModal } from "@/components/store-detail-modal";

// 希望業種の説明を追加
const WORK_TYPES_WITH_DESCRIPTION = [
  {
    id: "store-health",
    label: "店舗型ヘルス",
    description: "お店に来店されたお客様へのサービスを提供。移動の必要がなく、安定した環境で働けます。"
  },
  {
    id: "hotel-health",
    label: "ホテルヘルス",
    description: "ホテルでのサービス提供。お店で受付後、近隣のホテルへ移動してのサービスとなります。"
  },
  {
    id: "delivery-health",
    label: "デリバリーヘルス",
    description: "お客様のいるホテルや自宅へ直接訪問してサービスを提供。幅広いエリアでの勤務が可能です。"
  },
  {
    id: "esthe",
    label: "風俗エステ",
    description: "マッサージや施術を中心としたサービス。ソフトなサービス内容で、未経験の方も始めやすいです。"
  },
  {
    id: "mseikan",
    label: "M性感",
    description: "男性受け身型のサービス。特殊な技術が必要ですが、研修制度も充実しています。"
  },
  {
    id: "onakura",
    label: "オナクラ",
    description: "最もソフトなサービス内容。接客時間も短く、手だけのサービスで未経験の方に人気です。"
  }
] as const;

const GUARANTEE_OPTIONS = [
  { value: "none", label: "希望無し" },
  { value: "1", label: "保証1万" },
  { value: "2", label: "保証2万" },
  { value: "3", label: "保証3万" },
  { value: "4", label: "保証4万" },
  { value: "5", label: "保証5万" },
  { value: "6", label: "保証6万" },
  { value: "7", label: "保証7万" },
  { value: "8", label: "保証8万" },
  { value: "9", label: "保証9万" },
  { value: "10", label: "保証10万以上" },
] as const;

const TIME_OPTIONS = [
  { value: "none", label: "希望無し" },
  { value: "30", label: "30分" },
  { value: "40", label: "40分" },
  { value: "50", label: "50分" },
  { value: "60", label: "60分" },
  { value: "70", label: "70分" },
  { value: "80", label: "80分" },
  { value: "90", label: "90分" },
  { value: "100", label: "100分" },
  { value: "110", label: "110分" },
  { value: "120", label: "120分" },
] as const;

const RATE_OPTIONS = [
  { value: "none", label: "希望無し" },
  { value: "3000", label: "3,000円" },
  { value: "4000", label: "4,000円" },
  { value: "5000", label: "5,000円" },
  { value: "6000", label: "6,000円" },
  { value: "7000", label: "7,000円" },
  { value: "8000", label: "8,000円" },
  { value: "9000", label: "9,000円" },
  { value: "10000", label: "10,000円" },
  { value: "11000", label: "11,000円" },
  { value: "12000", label: "12,000円" },
  { value: "13000", label: "13,000円" },
  { value: "14000", label: "14,000円" },
  { value: "15000", label: "15,000円" },
  { value: "16000", label: "16,000円" },
  { value: "17000", label: "17,000円" },
  { value: "18000", label: "18,000円" },
  { value: "19000", label: "19,000円" },
  { value: "20000", label: "20,000円" },
  { value: "21000", label: "21,000円" },
  { value: "22000", label: "22,000円" },
  { value: "23000", label: "23,000円" },
  { value: "24000", label: "24,000円" },
  { value: "25000", label: "25,000円" },
  { value: "26000", label: "26,000円" },
  { value: "27000", label: "27,000円" },
  { value: "28000", label: "28,000円" },
  { value: "29000", label: "29,000円" },
  { value: "30000", label: "30,000円以上" },
] as const;

type WorkTypeId = typeof WORK_TYPES_WITH_DESCRIPTION[number]['id'];

interface Message {
  type: 'ai' | 'user';
  content: string;
}

interface MatchingResult {
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
}

interface WorkingConditions {
  workPeriodStart?: string;
  workPeriodEnd?: string;
  canArrivePreviousDay?: boolean;
  desiredGuarantee?: string;
  desiredTime?: string;
  desiredRate?: string;
  waitingHours?: number;
  departureLocation?: string;
  returnLocation?: string;
  preferredLocations: string[];
  ngLocations: string[];
  notes?: string;
  interviewDates?: string[];
  workTypes: WorkTypeId[];
}

type MatchingState = 'idle' | 'searching' | 'listing' | 'picked';

export const AIMatchingChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      content: 'SCAIマッチングへようこそ！\nここではあなたの希望にそって最適な提案をします。\nまずは出稼ぎをお探しか、在籍をお探しかをお聞かせください！'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [conditions, setConditions] = useState<WorkingConditions>({
    preferredLocations: [],
    ngLocations: [],
    workTypes: [],
  });
  const [showForm, setShowForm] = useState(false);
  const [showConfirmationButtons, setShowConfirmationButtons] = useState(false);
  const [showMatchingOptions, setShowMatchingOptions] = useState(false);
  const [matchingState, setMatchingState] = useState<MatchingState>('idle');
  const [matchingResults, setMatchingResults] = useState<MatchingResult[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedStore, setSelectedStore] = useState<MatchingResult | null>(null);
  const [showStoreDetail, setShowStoreDetail] = useState(false);

  // ウェブ履歴書データの取得
  const { data: profileData } = useQuery<TalentProfile>({
    queryKey: ["/api/talent/profile"],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
      setSelectedType(null);
      setConditions({
        preferredLocations: [],
        ngLocations: [],
        workTypes: [],
      });
      setMessages([messages[0]]);
    }
  };

  const handleWorkTypeSelect = async (type: string) => {
    try {
      setIsLoading(true);
      setSelectedType(type);

      setMessages(prev => [...prev, {
        type: 'user',
        content: type === '出稼ぎ' ? '出稼ぎを希望します' : '在籍を希望します'
      }]);

      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: `${type}のお探しを希望ですね！\nそれではあなたの希望条件を教えてください！`
        }]);
        setIsLoading(false);
        setShowForm(true);
      }, 1000);
    } catch (error) {
      console.error('Error in handleWorkTypeSelect:', error);
      setIsLoading(false);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'すみません、エラーが発生しました。もう一度お試しください。'
      }]);
    }
  };

  const handleConditionSubmit = () => {
    try {
      // バリデーションチェック
      if (conditions.workTypes.length === 0) {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: '希望業種を1つ以上選択してください。'
        }]);
        return;
      }

      if (selectedType === '出稼ぎ') {
        if (!conditions.workPeriodStart || !conditions.workPeriodEnd) {
          setMessages(prev => [...prev, {
            type: 'ai',
            content: '出稼ぎの場合は勤務期間（開始日・終了日）を入力してください。'
          }]);
          return;
        }

        if (!conditions.departureLocation || !conditions.returnLocation) {
          setMessages(prev => [...prev, {
            type: 'ai',
            content: '出発地と帰宅地を入力してください。'
          }]);
          return;
        }

        // 日付のバリデーション
        const startDate = new Date(conditions.workPeriodStart);
        const endDate = new Date(conditions.workPeriodEnd);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        if (startDate < tomorrow) {
          setMessages(prev => [...prev, {
            type: 'ai',
            content: '勤務開始日は明日以降の日付を選択してください。'
          }]);
          return;
        }

        if (endDate <= startDate) {
          setMessages(prev => [...prev, {
            type: 'ai',
            content: '勤務終了日は開始日より後の日付を選択してください。'
          }]);
          return;
        }
      }

      if (selectedType === '在籍' && conditions.preferredLocations.length === 0) {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: '在籍の場合は希望地域を1つ以上選択してください。'
        }]);
        return;
      }

      setMessages(prev => [...prev, {
        type: 'user',
        content: '入力内容を確認する'
      }]);

      setShowConfirmDialog(true);
    } catch (error) {
      console.error('Error in handleConditionSubmit:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'すみません、エラーが発生しました。もう一度お試しください。'
      }]);
    }
  };

  const handleStartMatching = () => {
    try {
      setMessages(prev => [...prev, {
        type: 'user',
        content: 'マッチングを開始する'
      }]);
      setShowConfirmationButtons(false);
      setShowMatchingOptions(true);
    } catch (error) {
      console.error('Error in handleStartMatching:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'すみません、エラーが発生しました。もう一度お試しください。'
      }]);
    }
  };

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

返信があるまでしばらくお待ちください。店舗への連絡は24時間以内に完了し、店舗からの返信があり次第すぐにお知らせいたします。`
      }]);
      setShowMatchingOptions(false);
      setMatchingState('searching');

      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: 'ただいまマッチング処理を行っています...\n条件に合う店舗を見つけ次第、順次連絡を取らせていただきます。'
        }]);
      }, 3000);
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
        content: `ピックアップマッチングを開始します！\n
あなたの希望条件に合う店舗を探して、以下の手順で進めていきます：

1. AIがあなたの条件に合う店舗をリストアップ
2. おすすめ順に店舗を表示（条件マッチ度が高い順）
3. 気になる店舗を選択
4. 選択した店舗へ条件確認

まずは条件に合う店舗を探していきますので、少々お待ちください。`
      }]);
      setShowMatchingOptions(false);
      setMatchingState('listing');

      setTimeout(() => {
        const mockResults: MatchingResult[] = Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          name: `店舗${i + 1}`,
          location: '東京都',
          rating: 4.5,
          matches: ['店舗設定の単価 60分15,000円', '営業時間 12:00～翌5:00', '業種/デリバリーヘルス'],
          description: '当店は20代の若い女性が活躍中の人気店です。未経験の方も経験者の方も大歓迎！',
          workingHours: '12:00～翌5:00（応相談）',
          requirements: [
            '18歳以上（高校生不可）',
            '未経験者歓迎',
            '経験者優遇'
          ],
          benefits: [
            '日払い可能',
            '寮完備',
            '送迎あり',
            '衣装貸与',
            '託児所完備'
          ],
          workEnvironment: '20代の女性スタッフが多く、アットホームな雰囲気です。\nスタッフ同士の交流も活発で、楽しく働ける環境です。',
          matchingPoints: [
            {
              title: '希望給与にマッチ',
              description: 'あなたの希望する時給と近い設定です。'
            },
            {
              title: '希望エリアで働ける',
              description: '希望されているエリアでの勤務が可能です。'
            },
            {
              title: '未経験でも安心',
              description: '研修制度が充実しており、未経験の方でも安心してスタートできます。'
            }
          ],
          serviceType: 'デリバリーヘルス',
          rate: {
            time: 60,
            amount: 15000
          }
        }));

        setMatchingResults(mockResults);
        setMessages(prev => [...prev, {
          type: 'ai',
          content: `条件に合う店舗が${mockResults.length}件見つかりました！\n
まずは条件マッチ度の高い順に10件をご紹介します。
各店舗の詳細を確認して、気になる店舗を選んでください。
すべての店舗を確認したい場合は「次の10件を見る」ボタンで表示できます。\n
気になる店舗が見つかりましたら「詳細を見る」ボタンから店舗の詳細情報を確認できます。`
        }]);
      }, 2000);
    } catch (error) {
      console.error('Error in handlePickupMatching:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'すみません、エラーが発生しました。もう一度お試しください。'
      }]);
    }
  };

  const formatConditionsMessage = (conditions: WorkingConditions, selectedType: string | null): string => {
    if (selectedType === '出稼ぎ') {
      return `【入力内容確認】\n
◆ 希望業種：${conditions.workTypes.map(type =>
        WORK_TYPES_WITH_DESCRIPTION.find(t => t.id === type)?.label
      ).join('、')}
◆ 勤務期間：${conditions.workPeriodStart ? `${conditions.workPeriodStart}～${conditions.workPeriodEnd}` : '未設定'}
◆ 前日入り：${conditions.canArrivePreviousDay ? '可能' : '不可'}
◆ 希望保証：${conditions.desiredGuarantee === 'none' ? '希望無し' : GUARANTEE_OPTIONS.find(opt => opt.value === conditions.desiredGuarantee)?.label}
◆ 希望単価：${conditions.desiredTime === 'none' ? '希望無し' : `${TIME_OPTIONS.find(opt => opt.value === conditions.desiredTime)?.label} ${RATE_OPTIONS.find(opt => opt.value === conditions.desiredRate)?.label}`}
◆ 待機時間：${conditions.waitingHours || '未設定'}時間
◆ 出発地：${conditions.departureLocation || '未設定'}
◆ 帰宅地：${conditions.returnLocation || '未設定'}
◆ 希望地域：${conditions.preferredLocations.length > 0 ? conditions.preferredLocations.join('、') : '全国'}
◆ NG地域：${conditions.ngLocations.length > 0 ? conditions.ngLocations.join('、') : 'NG無し'}
◆ その他備考：${conditions.notes || '未設定'}`;
    } else {
      return `【入力内容確認】\n
◆ 希望業種：${conditions.workTypes.map(type =>
        WORK_TYPES_WITH_DESCRIPTION.find(t => t.id === type)?.label
      ).join('、')}
◆ 面接希望日時：${conditions.interviewDates?.filter(Boolean).map(date =>
        new Date(date).toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      ).join('\n') || '未設定'}
◆ 希望単価：${conditions.desiredTime === 'none' ? '希望無し' : `${TIME_OPTIONS.find(opt => opt.value === conditions.desiredTime)?.label} ${RATE_OPTIONS.find(opt => opt.value === conditions.desiredRate)?.label}`}
◆ 希望地域：${conditions.preferredLocations.length > 0 ? conditions.preferredLocations.join('、') : '未設定'}`;
    }
  };

  const renderMatchingResults = () => {
    if (matchingState !== 'listing' || matchingResults.length === 0) {
      return null;
    }

    const currentResults = matchingResults.slice(currentPage * 10, (currentPage + 1) * 10);

    return (
      <div className="space-y-4">
        {currentResults.map((result) => (
          <Card key={result.id} className="p-4 hover:bg-accent/5 transition-colors">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <div>
                  <h4 className="font-medium">{result.name}</h4>
                  <p className="text-sm text-muted-foreground">{result.location}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.matches.map((match, i) => (
                    <span
                      key={i}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                    >
                      {match}
                    </span>
                  ))}
                </div>
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
          </Card>
        ))}

        {currentPage * 10 + 10 < matchingResults.length && (
          <Button
            className="w-full mt-4"
            variant="outline"
            onClick={() => {
              setCurrentPage(prev => prev + 1);
              setMessages(prev => [...prev, {
                type: 'ai',
                content: '次の10件を表示するね！'
              }]);
            }}
          >
            次の10件を見る
          </Button>
        )}
      </div>
    );
  };

  const handleShowStoreDetail = (store: MatchingResult) => {
    setSelectedStore(store);
    setShowStoreDetail(true);
  };


  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
        <div className="container flex h-14 max-w-screen-2xl items-center">
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
                message.type === 'ai' ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                className={`flex items-start gap-2 max-w-[80%] ${
                  message.type === 'ai' ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'ai'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.type === 'ai' ? (
                    <Bot className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div
                  className={`rounded-lg p-4 ${
                    message.type === 'ai'
                      ? 'bg-card text-card-foreground'
                      : 'bg-primary text-primary-foreground'
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
                    variant={type === '出稼ぎ' ? 'default' : 'secondary'}
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
                                workTypes: [...conditions.workTypes, type.id]
                              });
                            } else {
                              setConditions({
                                ...conditions,
                                workTypes: conditions.workTypes.filter(t => t !== type.id)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={type.id}>{type.label}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">{type.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedType === '出稼ぎ' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="after:content-['*'] after:text-red-500 after:ml-0.5">
                        勤務開始日
                      </Label>
                      <Input
                        type="date"
                        required
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                        onChange={(e) => setConditions({
                          ...conditions,
                          workPeriodStart: e.target.value
                        })}
                      />
                    </div>
                    <div className="spacey-2">
                      <Label className="after:content-['*'] after:text-red-500 after:ml-0.5">
                        勤務終了日
                      </Label>
                      <Input
                        type="date"
                        required
                        min={conditions.workPeriodStart || new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                        onChange={(e) => setConditions({
                          ...conditions,
                          workPeriodEnd: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="previous-day"
                      onCheckedChange={(checked) => setConditions({
                        ...conditions,
                        canArrivePreviousDay: checked
                      })}
                    />
                    <Label htmlFor="previous-day">前日入りの可否</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>希望保証</Label>
                    <Select
                      onValueChange={(value) => setConditions({
                        ...conditions,
                        desiredGuarantee: value
                      })}
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
                        onValueChange={(value) => setConditions({
                          ...conditions,
                          desiredTime: value
                        })}
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
                        onValueChange={(value) => setConditions({
                          ...conditions,
                          desiredRate: value
                        })}
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
                    <Label>待機時間（時間）</Label>
                    <Input
                      type="number"
                      placeholder="12時間以上が保証条件となる場合が多いです"
                      onChange={(e) => setConditions({
                        ...conditions,
                        waitingHours: e.target.value ? Number(e.target.value) : undefined
                      })}
                    />
                  </div>

                  {/* Added Departure and Return Location Selects */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="after:content-['*'] after:text-red-500 after:ml-0.5">
                        出発地
                      </Label>
                      <Select
                        onValueChange={(value) => setConditions({
                          ...conditions,
                          departureLocation: value
                        })}
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
                      </Label>                      <Select
                        onValueChange={(value) => setConditions({
                          ...conditions,
                          returnLocation: value
                        })}
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
                      onValueChange={(value) => setConditions({
                        ...conditions,
                        preferredLocations: [...conditions.preferredLocations, value]
                      })}
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
                            onClick={() => setConditions({
                              ...conditions,
                              preferredLocations: conditions.preferredLocations.filter(l => l !== loc)
                            })}
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
                      onValueChange={(value) => setConditions({
                        ...conditions,
                        ngLocations: [...conditions.ngLocations, value]
                      })}
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
                            onClick={() => setConditions({
                              ...conditions,
                              ngLocations: conditions.ngLocations.filter(l => l !== loc)
                            })}
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
                      onChange={(e) => setConditions({
                        ...conditions,
                        notes: e.target.value
                      })}
                    />
                  </div>

                  <Button                    className="w-full mt-6"
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
                              interviewDates: dates
                            });
                          }}
                        />
                      </div>
                    ))}

                    <div className="space-y-2">
                      <Label>希望単価</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          onValueChange={(value) => setConditions({
                            ...conditions,
                            desiredTime: value
                          })}
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
                          onValueChange={(value) => setConditions({
                            ...conditions,
                            desiredRate: value
                          })}
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
                      <Label className={selectedType === '在籍' ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ""}>
                        希望地域
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        {selectedType === '在籍'
                          ? '在籍での勤務を希望する地域を選択してください。通勤のしやすさなども考慮してお選びください。'
                          : '出稼ぎでの勤務を希望する地域を選択してください。交通費や宿泊費のサポートがある地域もあります。'}
                      </p>
                      <Select
                        onValueChange={(value) => setConditions({
                          ...conditions,
                          preferredLocations: [...conditions.preferredLocations, value]
                        })}
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
                              onClick={() => setConditions({
                                ...conditions,
                                preferredLocations: conditions.preferredLocations.filter(l => l !== loc)
                              })}
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
                      disabled={conditions.workTypes.length === 0 || (selectedType === '在籍' && conditions.preferredLocations.length === 0)}
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

      {/* マッチング方法選択画面 */}
      {showMatchingOptions && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Card className="border-t sticky bottom-0 bg-background">
            <div className="p-6">
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
                          自動でマッチング
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          AIが自動で店舗とのマッチングを行います
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">おすすめのケース</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• できるだけ早く働きたい</li>
                          <li>• 希望条件が明確</li>
                          <li>• 店舗選びを任せたい</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">処理の流れ</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>1. AIが条件に合う店舗を検索</li>
                          <li>2. 店舗へ自動で連絡</li>
                          <li>3. 返信を待機（最大24時間）</li>
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
      {matchingState === 'searching' && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Card className="border-t sticky bottom-0 bg-background">
            <div className="p-6">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 animate-pulse bg-primary/5 rounded-full" />
                </div>
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-medium">マッチング処理を実行中...</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      AIがあなたの希望条件に合う店舗を探しています。
                      <br />
                      条件に合う店舗が見つかり次第、自動で連絡を取らせていただきます。
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 店舗への連絡は24時間以内に完了</li>
                      <li>• 返信があり次第すぐにお知らせ</li>
                      <li>• 複数の店舗から返信がある場合もあり</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ピックアップマッチングの結果表示を改善 */}
      {matchingState === 'listing' && matchingResults.length > 0 && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Card className="border-t sticky bottom-0 bg-background">
            <div className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">おすすめの店舗一覧</h3>
                <p className="text-sm text-muted-foreground">
                  あなたの条件に合う店舗を条件マッチ度が高い順に表示しています。
                  <br />
                  気になる店舗は「詳細を見る」から詳しい情報を確認できます。
                </p>
              </div>
              <div className="space-y-4">
                {matchingResults
                  .slice(currentPage * 10, (currentPage + 1) * 10)
                  .map((result) => (
                    <Card key={result.id} className="p-4 hover:bg-accent/5 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2 flex-1">
                          <div>
                            <h4 className="font-medium">{result.name}</h4>
                            <p className="text-sm text-muted-foreground">{result.location}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {result.matches.map((match, i) => (
                              <span
                                key={i}
                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                              >
                                {match}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0" onClick={() => handleShowStoreDetail(result)}>
                          詳細を見る
                        </Button>
                      </div>
                    </Card>
                  ))}

                {currentPage * 10 + 10 < matchingResults.length && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      setCurrentPage(prev => prev + 1);
                      setMessages(prev => [...prev, {
                        type: 'ai',
                        content: '次の10件の店舗を表示します！\n気になる店舗を見つけたら「詳細を見る」から詳しい情報を確認できます。'
                      }]);
                    }}
                  >
                    次の10件を見る（残り{matchingResults.length - ((currentPage + 1) * 10)}件）
                  </Button>
                )}
              </div>
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
              問題がなければ「マッチングを開始する」を選択してください。
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
                      {profileData?.availableIds?.types?.join('、')}
                      {profileData?.availableIds?.others?.length > 0 &&
                        `、${profileData.availableIds.others.join('、')}`}
                    </p>
                    <p className="text-sm mt-1">
                      本籍地記載の住民票: {profileData?.canProvideResidenceRecord ? '提供可能' : '提供不可'}
                    </p>
                  </div>

                  {/* パネル設定 */}
                  <div>
                    <Label>顔出し設定</Label>
                    <p className="text-sm">{profileData?.faceVisibility}</p>
                  </div>
                  <div>
                    <Label>写メ日記</Label>
                    <p className="text-sm">{profileData?.canPhotoDiary ? '投稿可能' : '投稿不可'}</p>
                  </div>
                  <div>
                    <Label>自宅派遣</Label>
                    <p className="text-sm">{profileData?.canHomeDelivery ? '対応可能' : '対応不可'}</p>
                  </div>

                  {/* NGオプション */}
                  {profileData?.ngOptions && (profileData.ngOptions.common.length > 0 || profileData.ngOptions.others.length > 0) && (
                    <div className="col-span-2">
                      <Label>NGオプション</Label>
                      <p className="text-sm">
                        {profileData.ngOptions.common?.join('、')}
                        {profileData.ngOptions.others?.length > 0 &&
                          `、${profileData.ngOptions.others.join('、')}`}
                      </p>
                    </div>
                  )}

                  {/* アレルギー */}
                  {profileData?.allergies?.hasAllergy && (
                    <div className="col-span-2">
                      <Label>アレルギー</Label>
                      <p className="text-sm">
                        {profileData.allergies.types?.join('、')}
                        {profileData.allergies.others?.length > 0 &&
                          `、${profileData.allergies.others.join('、')}`}
                      </p>
                    </div>
                  )}

                  {/* 喫煙 */}
                  {profileData?.smoking?.enabled && (
                    <div className="col-span-2">
                      <Label>喫煙</Label>
                      <p className="text-sm">
                        {profileData.smoking.types?.join('、')}
                        {profileData.smoking.others?.length > 0 &&
                          `、${profileData.smoking.others.join('、')}`}
                      </p>
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
                    <>
                      <div className="col-span-2">
                        <Label>エステ経験</Label>
                        <p className="text-sm">あり（{profileData.estheExperiencePeriod}）</p>
                      </div>
                      {profileData.estheOptions && (
                        <div className="col-span-2">
                          <Label>対応可能なオプション</Label>
                          <p className="text-sm">
                            {profileData.estheOptions.available?.join('、')}
                            {profileData.estheOptions.ngOptions?.length > 0 && (
                              <>
                                <br />
                                <span className="text-destructive">NG: {profileData.estheOptions.ngOptions.join('、')}</span>
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    </>
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
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setShowForm(true);
              }}
            >
              修正する
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                handleStartMatching();
              }}
            >
              マッチングを開始する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {selectedStore && (
        <StoreDetailModal
          isOpen={showStoreDetail}
          onClose={() => setShowStoreDetail(false)}
          store={selectedStore}
        />
      )}
    </div>
  );
};