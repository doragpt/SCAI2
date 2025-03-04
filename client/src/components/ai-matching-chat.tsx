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

      if (selectedType === '出稼ぎ' && (!conditions.workPeriodStart || !conditions.workPeriodEnd)) {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: '出稼ぎの場合は勤務期間（開始日・終了日）を入力してください。'
        }]);
        return;
      }

      if (selectedType === '在籍' && conditions.preferredLocations.length === 0) {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: '在籍の場合は希望地域を1つ以上選択してください。'
        }]);
        return;
      }

      // 日付のバリデーション
      if (selectedType === '出稼ぎ') {
        const startDate = new Date(conditions.workPeriodStart!);
        const endDate = new Date(conditions.workPeriodEnd!);
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

      setMessages(prev => [...prev, {
        type: 'user',
        content: '入力内容を確認する'
      }]);

      // 確認ダイアログを表示
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
        content: 'マッチングには時間がかかるから少しだけ時間をもらうね！\n\nAIがあなたの条件に合う店舗を探して、直接連絡を取らせていただきます。返信があり次第お知らせしますので、少々お待ちください。'
      }]);
      setShowMatchingOptions(false);
      setMatchingState('searching');

      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: 'マッチング中だよ...もう少し待っててね'
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
        content: 'では合いそうな店舗をリストアップするね！\n\nあなたの条件に合う店舗を探して、おすすめ順に表示します。気になる店舗を選んでいただけるので、じっくりと検討できますよ。'
      }]);
      setShowMatchingOptions(false);
      setMatchingState('listing');

      setTimeout(() => {
        const mockResults: MatchingResult[] = Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          name: `店舗${i + 1}`,
          location: '東京都',
          rating: 4.5,
          matches: ['希望時給', '勤務時間帯', '業態']
        }));

        setMatchingResults(mockResults);
        setMessages(prev => [...prev, {
          type: 'ai',
          content: `お待たせ！あなたに合いそうな店舗は${mockResults.length}件程あったよ！\n\nまずは10件、リストアップするね！`
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
◆ 希望地域：${conditions.preferredLocations.length > 0 ? conditions.preferredLocations.join('、') : '未設定'}
◆ NG地域：${conditions.ngLocations.length > 0 ? conditions.ngLocations.join('、') : '未設定'}
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
          <Card key={result.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{result.name}</h3>
                <p className="text-sm text-muted-foreground">{result.location}</p>
                <div className="flex gap-2 mt-2">
                  {result.matches.map((match, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {match}
                    </span>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm">
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

  const renderProfileSection = () => {
    if (!profileData) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">ウェブ履歴書の情報</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>お名前</Label>
            <p className="text-sm">{profileData?.lastName} {profileData?.firstName}</p>
          </div>
          <div>
            <Label>年齢</Label>
            <p className="text-sm">{profileData?.age}歳</p>
          </div>
          <div>
            <Label>居住地</Label>
            <p className="text-sm">{profileData?.location}</p>
          </div>
          <div>
            <Label>最寄り駅</Label>
            <p className="text-sm">{profileData?.nearestStation}</p>
          </div>
        </div>
      </div>
    );
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
                    <div className="space-y-2">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>出発地</Label>
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
                      <Label>帰宅地</Label>
                      <Select
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

                  <Button
                    className="w-full mt-6"
                    onClick={handleConditionSubmit}
                    disabled={
                      conditions.workTypes.length === 0 || 
                      !conditions.workPeriodStart || 
                      !conditions.workPeriodEnd
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

      {showMatchingOptions && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Card className="border-t sticky bottom-0 bg-background">
            <div className="p-6">
              <div className="flex flex-col gap-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">マッチング方法の選択</h3>
                  <p className="text-sm text-muted-foreground">
                    希望に合わせて最適なマッチング方法をお選びください
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 hover:bg-accent cursor-pointer" onClick={handleAutoMatching}>
                    <div className="space-y-3">
                      <h4 className="font-medium">自動でマッチング</h4>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• AIが条件に合う店舗に直接連絡</li>
                        <li>• できるだけ早く働きたい方におすすめ</li>
                        <li>• 面接や採用までの時間を短縮</li>
                        <li>• 希望条件に合う店舗から順次連絡</li>
                      </ul>
                    </div>
                  </Card>
                  <Card className="p-4 hover:bg-accent cursor-pointer" onClick={handlePickupMatching}>
                    <div className="space-y-3">
                      <h4 className="font-medium">ピックアップしてから確認</h4>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• AIが条件に合う店舗を一覧表示</li>
                        <li>• じっくり店舗を選びたい方におすすめ</li>
                        <li>• 店舗の詳細情報を確認可能</li>
                        <li>• 気になる店舗を選んで連絡</li>
                      </ul>
                    </div>
                  </Card>
                </div>
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

                  {/* スリーサイズ情報 */}
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
                    <p className="text-sm">{profileData?.cupSize}</p>
                  </div>

                  {/* 身分証明書 */}
                  <div className="col-span-2">
                    <Label>身分証明書</Label>
                    <p className="text-sm">
                      {profileData?.availableIds?.types?.join('、')}
                      {profileData?.availableIds?.others?.length > 0 && 
                        `、${profileData.availableIds.others.join('、')}`}
                    </p>
                  </div>

                  {/* パネル設定 */}
                  <div>
                    <Label>顔出し設定</Label>
                    <p className="text-sm">{profileData?.faceVisibility}</p>
                  </div>
                  <div>
                    <Label>写メ日記</Label>
                    <p className="text-sm">{profileData?.canPhotoDiary ? '対応可能' : '対応不可'}</p>
                  </div>

                  {/* NGオプション */}
                  {profileData?.ngOptions && (
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
    </div>
  );
};