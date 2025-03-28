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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HtmlContent } from "@/components/html-content";
import { MatchedJobCard } from "@/components/matched-job-card";
import { MatchedJobDetailDialog } from "@/components/matched-job-detail-dialog";
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
import {
  Bot,
  User,
  Loader2,
  ArrowLeft,
  Check,
  X,
  FileCheck,
  FileText,
  Heart,
  Settings,
  Clock,
  Building2,
  Briefcase,
  Store,
  MapPin,
  Globe,
  XCircle,
  CreditCard as IdCard,
  CheckCircle,
  AlertTriangle as Warning,
  CheckSquare as PatchCheck,
  Cigarette as Smoke,
  Droplets as Droplet,
  Eye,
  Building as BuildingStore,
  PenSquare as PencilSquare,
  Calendar,
  Car,
  DollarSign as CurrencyDollar,
  Share2
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useMatching, startMatching, type MatchedJob } from "@/hooks/use-matching";
import { WORK_TYPES_WITH_DESCRIPTION, TIME_OPTIONS, RATE_OPTIONS, GUARANTEE_OPTIONS, prefectures } from "@/constants/work-types";
import { formatConditionsMessage } from "@/utils/format-conditions-message";
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { TalentProfileData } from "@shared/schema";

interface Message {
  type: "ai" | "user";
  content: string;
}

const VALID_WAITING_HOURS = Array.from({ length: 15 }, (_, i) => ({
  value: String(i + 10),
  label: `${i + 10}時間`,
}));

type MatchingMethod = "auto" | "pickup" | null;


export const AIMatchingChat = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { profileData, isLoading: isProfileLoading, refetch: refetchProfile } = useProfile();
  const [selectedType, setSelectedType] = useState<"出稼ぎ" | "在籍" | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [workTypes] = useState(["出稼ぎ", "在籍"]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
  const [matchingMethod, setMatchingMethod] = useState<MatchingMethod>(null);
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [matchedJobs, setMatchedJobs] = useState<MatchedJob[]>([]);
  const [showMatchedJobsGrid, setShowMatchedJobsGrid] = useState(false);
  const [selectedMatchedJob, setSelectedMatchedJob] = useState<MatchedJob | null>(null);


  // プロフィールデータの変更を監視
  useEffect(() => {
    console.log('Current profile data in AIMatchingChat:', profileData);
  }, [profileData]);

  // コンポーネントマウント時にプロフィールデータを再取得
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await refetchProfile();
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }

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

  const handleBack = () => {
    setSelectedType(null);
    setShowForm(false);
    setMessages(prev => [...prev, {
      type: "user",
      content: "選択しなおします"
    }]);
  };

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

  // handleConfirmConditionsの実装を修正
  const handleConfirmConditions = async () => {
    try {
      setIsLoading(true);
      setShowConfirmDialog(false);
      setShowForm(false);

      // プロフィールデータを再取得
      await refetchProfile();

      // プロフィールデータをログ出力
      console.log('Profile data before confirmation:', profileData);

      if (!profileData) {
        console.error('Profile data is null or undefined');
        toast({
          title: "エラー",
          description: "プロフィール情報が取得できません",
          variant: "destructive",
        });
        return;
      }

      // 条件の確認メッセージを追加
      setMessages(prev => [...prev, {
        type: "user",
        content: formatConditionsMessage(conditions, selectedType)
      }, {
        type: "ai",
        content: "入力してくれてありがとう！今現在のあなたのプロフィールを確認するね！"
      }, {
        type: "ai",
        content: `【現在のプロフィール】
• お名前: ${profileData.last_name || '未入力'} ${profileData.first_name || '未入力'}
• フリガナ: ${profileData.last_name_kana || '未入力'} ${profileData.first_name_kana || '未入力'}
• 生年月日: ${profileData && profileData.birth_date ? format(new Date(profileData.birth_date), 'yyyy年MM月dd日', { locale: ja }) : (user && user.birth_date ? format(new Date(user.birth_date), 'yyyy年MM月dd日', { locale: ja }) : '未入力')}
• 在住地: ${profileData.location || '未入力'}
• 最寄り駅: ${profileData.nearest_station || '未入力'}
• 身長: ${profileData.height ? `${profileData.height}cm` : '未入力'}
• 体重: ${profileData.weight ? `${profileData.weight}kg` : '未入力'}
• カップサイズ: ${profileData.cup_size || '未入力'}
• スリーサイズ: ${
          profileData.bust && profileData.waist && profileData.hip
            ? `B${profileData.bust} W${profileData.waist} H${profileData.hip}`
            : '未入力'
        }
• 身分証: ${profileData.available_ids?.types?.length ? profileData.available_ids.types.join('、') : '未入力'}${
          profileData.available_ids?.others?.length ? `、${profileData.available_ids.others.join('、')}` : ''
        }
• 本籍地記載の住民票: ${profileData.can_provide_residence_record ? '提出可' : '提出不可'}
• 顔出し設定: ${profileData.face_visibility || '未設定'}
• エステ経験: ${profileData.has_esthe_experience ? `あり（${profileData.esthe_experience_period || '期間未入力'}）` : 'なし'}
• 喫煙: ${profileData.smoking?.enabled ? '喫煙あり' : '喫煙なし'}${
          profileData.smoking?.types?.length ? ` (${profileData.smoking.types.join('、')})` : ''
        }
• タトゥー・傷: ${profileData.body_mark?.has_body_mark ? 'あり' : 'なし'}${
          profileData.body_mark?.others?.length ? ` (${profileData.body_mark.others.join('、')})` : ''
        }
• 自己紹介: ${profileData.self_introduction ? profileData.self_introduction.substring(0, 50) + (profileData.self_introduction.length > 50 ? '...' : '') : '未入力'}
• 備考: ${profileData.notes ? profileData.notes.substring(0, 50) + (profileData.notes.length > 50 ? '...' : '') : '未入力'}

記入したものの情報に間違いはないか確認してね！
間違いが無ければマッチングをはじめるよ！`
      }]);

    } catch (error) {
      console.error("確認処理エラー:", error);
      toast({
        title: "エラー",
        description: "プロフィール情報の取得中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // マッチング方法選択ハンドラー
  const handleMatchingMethodSelect = async (method: MatchingMethod) => {
    try {
      setIsLoading(true);
      setMatchingMethod(method);
      setMessages(prev => [...prev, {
        type: "user",
        content: method === "auto" ? "自動で確認する" : "ピックアップして確認する"
      }]);

      if (method === "auto") {
        setMessages(prev => [...prev, {
          type: "ai",
          content: "マッチングには時間がかかるから少しだけ時間をもらうね！"
        }, {
          type: "ai",
          content: "マッチング中だよ...もう少し待っててね"
        }]);

        try {
          const results = await startMatching(conditions);
          handleMatchingResults(results);
        } catch (error) {
          console.error('Auto matching error:', error);
          setMessages(prev => [...prev, {
            type: "ai",
            content: `申し訳ありません。マッチング処理中にエラーが発生しました。
少し時間をおいて再度お試しいただくか、別のマッチング方法を選択してください。
エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]);
        }
      } else {
        setMessages(prev => [...prev, {
          type: "ai",
          content: "では合いそうな店舗をリストアップするね！"
        }]);

        try {
          const results = await startMatching(conditions);
          displayPickupResults(results);
        } catch (error) {
          console.error('Pickup matching error:', error);
          setMessages(prev => [...prev, {
            type: "ai",
            content: `申し訳ありません。店舗情報の取得中にエラーが発生しました。
少し時間をおいて再度お試しいただくか、別のマッチング方法を選択してください。
エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]);
        }
      }
    } catch (error) {
      console.error('Matching method selection error:', error);
      toast({
        title: "エラー",
        description: "マッチング処理中にエラーが発生しました。しばらくしてから再度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ピックアップ結果の表示
  const displayPickupResults = (results: MatchedJob[]) => {
    if (results.length === 0) {
      setMessages(prev => [...prev, {
        type: "ai",
        content: `
申し訳ございません。
現在の条件に合う店舗が見つかりませんでした。

条件を変更して再度検索してみませんか？
例えば：
• 希望エリアを広げてみる
• 給与条件を調整してみる
• 業種の選択を増やしてみる

条件を変更しますか？`
      }]);
      return;
    }

    const initialDisplay = results.slice(0, Math.min(10, results.length));
    const messageContent = results.length > 10
      ? `お待たせ！あなたに合いそうな店舗は${results.length}件見つかったよ！\nまずは10件、リストアップするね！`
      : `お待たせ！あなたに合いそうな店舗は${results.length}件見つかったよ！\n全ての店舗をリストアップするね！`;

    setMessages(prev => [...prev, {
      type: "ai",
      content: `${messageContent}

【候補店舗】
${initialDisplay.map((result, index) => `
${index + 1}. ${result.businessName}
  • 勤務地: ${result.location}
  • 待遇: ${result.minimumGuarantee}円～${result.maximumGuarantee}円
  • サポート: ${[
        result.transportationSupport ? '交通費あり' : null,
        result.housingSupport ? '宿泊費あり' : null
      ].filter(Boolean).join('、') || 'なし'}
  • 勤務時間: ${result.workingHours}
  • ${result.description || ''}
`).join('\n')}

どうかな？気になる店舗はあった？
確認したい店舗があったらチェックしてね！
（複数選択可能です）`
    }]);
  };

  // マッチング結果の表示（自動マッチング用）
  const handleMatchingResults = (results: MatchedJob[]) => {
    // マッチング結果を状態に保存
    setMatchedJobs(results);
    
    if (results.length > 0) {
      setMessages(prev => [...prev, {
        type: "ai",
        content: `マッチングには時間がかかるから少しだけ時間をもらうね！`
      }, {
        type: "ai",
        content: "マッチング中だよ...もう少し待っててね"
      }, {
        type: "ai",
        content: `お待たせ！あなたに合いそうな店舗は${results.length}件見つかったよ！

相性の良い順に並べたよ！視覚的に確認しやすくするため、マッチングカードを表示するね。
カードをクリックすると詳細を確認できるよ！`
      }]);
      
      // カードビューを表示
      setShowMatchedJobsGrid(true);
      
      // 上位3件のマッチング理由を表示
      setTimeout(() => {
        const topMatches = results.slice(0, 3);
        
        setMessages(prev => [...prev, {
          type: "ai",
          content: `特に相性が良いと思われる店舗の詳細情報をピックアップしました：

${topMatches.map((result, index) => `
【${index + 1}】${result.businessName} (マッチ度: ${Math.round(result.matchScore * 100)}%)
${result.matches?.map(match => `✓ ${match}`).join('\n') || 'マッチポイントの詳細情報がありません'}`).join('\n\n')}

カードをクリックすると詳細情報や応募方法を確認できます。
どの店舗に興味がありますか？`
        }]);
      }, 1500);
    } else {
      setMessages(prev => [...prev, {
        type: "ai",
        content: `申し訳ございません。
現在の条件に合う店舗が見つかりませんでした。

条件を変更して再度検索してみませんか？
例えば：
• 希望エリアを広げてみる
• 給与条件を調整してみる
• 業種の選択を増やしてみる

お役に立てず申し訳ありません。プロフィール情報をさらに充実させると、
より良いマッチング結果が得られる可能性があります。`
      }]);
    }
  };
  
  // 詳細表示ハンドラー
  const handleViewJobDetails = (job: MatchedJob) => {
    setSelectedMatchedJob(job);
  };
  
  // 応募ハンドラー
  const handleApply = (job: MatchedJob) => {
    // 応募処理
    window.location.href = `/jobs/${job.id}/apply`;
  };
  
  // キープハンドラー
  const handleKeep = (job: MatchedJob) => {
    toast({
      title: "キープしました",
      description: `${job.businessName}をキープリストに追加しました。`,
    });
  };

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
          
          {/* マッチング結果グリッド */}
          {showMatchedJobsGrid && matchedJobs.length > 0 && (
            <div className="w-full my-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchedJobs.map((job, index) => (
                  <MatchedJobCard 
                    key={job.id}
                    job={job}
                    index={index}
                    onViewDetails={handleViewJobDetails}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* 求人詳細ダイアログ */}
      {selectedMatchedJob && (
        <MatchedJobDetailDialog
          job={selectedMatchedJob}
          isOpen={!!selectedMatchedJob}
          onClose={() => setSelectedMatchedJob(null)}
          onApply={handleApply}
          onKeep={handleKeep}
        />
      )}

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
      )}      {/* マッチング方法選択部分 */}      
      {!showForm && matchingMethod === null && messages.length > 0 && messages[messages.length - 1].type === "ai" && messages[messages.length - 1].content.includes("間違いが無ければマッチングをはじめるよ！") && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="container max-w-screen-2xl mx-auto">
            <div className="flex flex-col gap-4">
              <p className="text-center text-muted-foreground">
                マッチング方法を選択してください
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => handleMatchingMethodSelect("auto")}
                  className="min-w-[200px]"
                >
                  自動で確認する
                </Button>
                <Button
                  onClick={() => handleMatchingMethodSelect("pickup")}
                  className="min-w-[200px]"
                  variant="secondary"
                >
                  ピックアップして確認する
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 確認ダイアログ */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-2xl">
              <FileCheck className="h-6 w-6 text-primary" />
              入力内容の確認
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              以下の内容でAIマッチングを開始します。内容をご確認ください。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ScrollArea className="h-[70vh] pr-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="p-6 space-y-6">
                {/* 基本情報 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    基本情報
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>氏名</Label>
                      <p className="text-sm font-medium">
                        {profileData?.last_name} {profileData?.first_name}
                      </p>
                    </div>
                    <div>
                      <Label>フリガナ</Label>
                      <p className="text-sm font-medium">
                        {profileData?.last_name_kana} {profileData?.first_name_kana}
                      </p>
                    </div>
                    <div>
                      <Label>生年月日</Label>
                      <p className="text-sm font-medium">
                        {formatDate(user?.birth_date || '')}
                      </p>
                    </div>
                    <div>
                      <Label>年齢</Label>
                      <p className="text-sm font-medium">
                        {calculateAge(user?.birth_date) ? `${calculateAge(user?.birth_date)}歳` : "未入力"}
                      </p>
                    </div>
                    <div>
                      <Label>居住地</Label>
                      <p className="text-sm font-medium">{profileData?.location}</p>
                    </div>
                    <div>
                      <Label>最寄り駅</Label>
                      <p className="text-sm font-medium">{profileData?.nearest_station}</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* 身体的特徴 */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-medium text-primary">
                    <Heart className="h-4 w-4" />
                    身体的特徴
                  </h4>
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
                      <p className="text-sm font-medium">{profileData?.cup_size}カップ</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* 身分証明書 */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-medium text-primary">
                    <IdCard className="h-4 w-4" />
                    身分証明書
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <Label>提示可能な身分証明書</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {profileData?.available_ids?.types?.map((id, index) => (
                          <Badge key={index} variant="outline">
                            {id}
                          </Badge>
                        ))}
                        {profileData?.available_ids?.others?.map((id, index) => (
                          <Badge key={`other-${index}`} variant="outline">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>本籍地記載の住民票</Label>
                      <Badge variant={profileData?.can_provide_residence_record ? "default" : "secondary"}>
                        {profileData?.can_provide_residence_record ? "提出可能" : "提出不可"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* 各種対応可否 */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-medium text-primary">
                    <CheckCircle className="h-4 w-4" />
                    各種対応可否
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <Label>写メ日記の投稿</Label>
                      <Badge variant={profileData?.can_photo_diary ? "default" : "secondary"}>
                        {profileData?.can_photo_diary ? "可能" : "不可"}
                      </Badge>
                    </div>
                    <div>
                      <Label>自宅待機での出張</Label>
                      <Badge variant={profileData?.can_home_delivery ? "default" : "secondary"}>
                        {profileData?.can_home_delivery ? "可能" : "不可"}
                      </Badge>
                    </div>
                    <div>
                      <Label>性病検査表提出</Label>
                      <Badge variant={profileData?.can_provide_std_test ? "default" : "secondary"}>
                        {profileData?.can_provide_std_test ? "可能" : "不可"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* NGオプション */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-medium text-primary">
                    <XCircle className="h-4 w-4" />
                    NGオプション
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {
                      [
                        ...(profileData?.ng_options?.common || []),
                        ...(profileData?.ng_options?.others || [])
                      ].map((option, index) => (
                        <Badge key={index} variant="destructive">
                          {option}
                        </Badge>
                      ))}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* アレルギー */}
                {profileData?.allergies && (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 font-medium text-primary">
                      <Warning className="h-4 w-4" />
                      アレルギー
                    </h4>
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
                  </div>
                )}

                <Separator className="my-6" />

                {/* タトゥー・傷の情報 */}
                {profileData?.body_mark && (profileData.body_mark.has_body_mark || profileData.body_mark.others?.length > 0) && (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 font-medium text-primary">
                      <PatchCheck className="h-4 w-4" />
                      タトゥー・傷の情報
                    </h4>
                    <div className="space-y-2">
                      {profileData.body_mark.others && profileData.body_mark.others.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {profileData.body_mark.others.map((mark, index) => (
                            <Badge key={index} variant="outline">
                              {mark}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {profileData.body_mark.details && (
                        <p className="text-sm whitespace-pre-wrap">
                          {profileData.body_mark.details}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Separator className="my-6" />

                {/* 喫煙情報 */}
                {profileData?.smoking && (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 font-medium text-primary">
                      <Smoke className="h-4 w-4" />
                      喫煙情報
                    </h4>
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
                  </div>
                )}

                <Separator className="my-6" />

                {/* エステ関連 */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-medium text-primary">
                    <Droplet className="h-4 w-4" />
                    エステ関連
                  </h4>
                  <div className="space-y-2">
                    <Badge variant={profileData?.has_esthe_experience ? "default" : "secondary"}>
                      {profileData?.has_esthe_experience ? `あり（${profileData?.esthe_experience_period}）` : "無し"}
                    </Badge>
                    {profileData?.esthe_options?.available && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.esthe_options.available.map((option, index) => (
                          <Badge key={index} variant="outline">
                            {option}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* 顔出し設定 */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-medium text-primary">
                    <Eye className="h-4 w-4" />
                    顔出し設定
                  </h4>
                  <p className="text-sm font-medium">{profileData?.face_visibility}</p>
                </div>

                <Separator className="my-6" />

                {/* 在籍店舗情報 */}
                {(profileData && ((Array.isArray(profileData.current_stores) && profileData.current_stores.length > 0) || 
                  (Array.isArray(profileData.previous_stores) && profileData.previous_stores.length > 0))) && (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 font-medium text-primary">
                      <BuildingStore className="h-4 w-4" />
                      在籍店舗情報
                    </h4>
                    <div className="space-y-2">
                      {profileData?.current_stores?.map((store, index) => (
                        <div key={index}>
                          <p className="text-sm font-medium">
                            現在の在籍店舗: {store.store_name}（{store.stage_name}）
                          </p>
                        </div>
                      ))}
                      {profileData?.previous_stores?.map((store, index) => (
                        <div key={index}>
                          <p className="text-sm font-medium">
                            過去の在籍店舗: {store.store_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="my-6" />

                {/* 自己PR・備考 */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-medium text-primary">
                    <PencilSquare className="h-4 w-4" />
                    自己PR・備考
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <Label>自己PR</Label>
                      <p className="text-sm whitespace-pre-wrap mt-1">
                        {profileData?.self_introduction || "未入力"}
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
              </div>
            </motion.div>

            {/* 希望条件セクション */}
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <div className="border-b bg-muted/50 p-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Settings className="h-5 w-5 text-primary" />
                  希望条件
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* 希望する働き方 */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      希望する働き方
                    </Label>
                    <HoverCard>
                      <HoverCardTrigger>
                        <div className="flex items-center gap-2 text-sm font-medium text-primary px-3 py-2 rounded-md bg-primary/10">
                          <Building2 className="h-4 w-4" />
                          {selectedType}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent>
                        {selectedType === "出稼ぎ" ? "他エリアでの短期・長期勤務" : "地元エリアでの勤務"}
                      </HoverCardContent>
                    </HoverCard>
                  </div>

                  {/* 希望業種 */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      希望業種
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {conditions.workTypes.map((type) => (
                        <TooltipProvider key={type}>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                                <Store className="h-3.5 w-3.5" />
                                {WORK_TYPES_WITH_DESCRIPTION.find(t => t.id === type)?.label}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {WORK_TYPES_WITH_DESCRIPTION.find(t => t.id === type)?.description}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>

                  {selectedType === "出稼ぎ" && (
                    <>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          勤務期間
                        </Label>
                        <p className="text-sm font-medium">
                          {formatDate(conditions.workPeriodStart)} 〜 {formatDate(conditions.workPeriodEnd)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          移動
                        </Label>
                        <p className="text-sm font-medium">
                          {conditions.departureLocation} → {conditions.returnLocation}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          一日の総勤務時間
                        </Label>
                        <p className="text-sm font-medium">{conditions.waitingHours}時間</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-muted-foreground" />
                          前日入り
                        </Label>
                        <p className="text-sm font-medium">
                          {conditions.canArrivePreviousDay ? "可能" : "不可"}
                        </p>
                      </div>
                      {conditions.desiredGuarantee && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
                            希望保証
                          </Label>
                          <p className="text-sm font-medium">{conditions.desiredGuarantee}</p>
                        </div>
                      )}
                      {conditions.desiredTime && conditions.desiredRate && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
                            希望単価
                          </Label>
                          <p className="text-sm font-medium">
                            {conditions.desiredTime}：{conditions.desiredRate}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {selectedType === "在籍" && conditions.interviewDates.length > 0 && (
                    <div className="col-span-2 space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        面接希望日時
                      </Label>
                      <div className="space-y-1">
                        {conditions.interviewDates.map((date, index) => (
                          <p key={index} className="text-sm font-medium">{formatDate(date)}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 希望地域 */}
                  <div className="col-span-2 space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      希望地域
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {conditions.preferredLocations.length > 0 ? (
                        conditions.preferredLocations.map((loc) => (
                          <motion.span
                            key={loc}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            {loc}
                          </motion.span>
                        ))
                      ) : (
                        <motion.span
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          全国
                        </motion.span>
                      )}
                    </div>
                  </div>

                  {/* NG地域 */}
                  <div className="col-span-2 space-y-2">
                    <Label className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      NG地域
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {conditions.ngLocations.length > 0 ? (
                        conditions.ngLocations.map((loc) => (
                          <motion.span
                            key={loc}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-1 text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-full"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            {loc}
                          </motion.span>
                        ))
                      ) : (
                        <motion.span
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-full"
                        >
                          <Check className="h-3.5 w-3.5" />
                          NGなし
                        </motion.span>
                      )}
                    </div>
                  </div>
                  {conditions.notes && (
                    <div className="col-span-2 space-y-2">
                      <Label className="flex items-center gap-2">
                        <PencilSquare className="h-4 w-4 text-muted-foreground" />
                        その他備考
                      </Label>
                      <p className="text-sm whitespace-pre-wrap">{conditions.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="gap-2"
              onClick={handleConfirmDialogClose}
            >
              <ArrowLeft className="h-4 w-4" />
              修正する
            </AlertDialogCancel>
            <AlertDialogAction
              className="gap-2"
              onClick={handleConfirmConditions}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              この内容で進める
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIMatchingChat;