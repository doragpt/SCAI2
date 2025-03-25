import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// UI コンポーネント
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  Calendar,
  BarChart3,
  FileEdit,
  Settings,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  BellOff,
  CheckCircle2,
  Briefcase,
  BadgeCheck,
  AlertCircle,
  MessageSquare,
  Loader2,
  Scale,
  User,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { JobFormDialog } from "@/components/job-form-dialog";

// ユーティリティ/タイプ
import { useAuth } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { StoreProfile, CupSize, JobStatus, cupSizes, BlogPost } from "@shared/schema";

// カップサイズ条件の型定義
interface CupSizeCondition {
  cup_size: CupSize;
  spec_min: number;
}

// プロフィールステータスラベル
const profileStatusLabels: Record<string, string> = {
  draft: "非公開",
  published: "公開中",
  closed: "募集終了"
};

// プランラベル
const planLabels: Record<string, string> = {
  free: "フリープラン",
  premium: "プレミアムプラン"
};

export default function StoreDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // タブの状態
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // 店舗情報編集ダイアログの表示状態
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  // プロフィール取得クエリ
  const { data: profile, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.STORE_PROFILE, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await apiRequest(`/api/store/profile/${user.id}`);
      return response;
    },
    enabled: !!user?.id,
  });
  
  // ダッシュボード統計データ (モックデータ)
  const [stats, setStats] = useState({
    storePlan: "free",
    storeArea: "東京都",
    displayRank: 12,
    todayPageViews: 157,
    todayUniqueVisitors: 76,
    monthlyPageViews: 3261,
    monthlyUniqueVisitors: 1450,
    newInquiriesCount: 2,
    pendingInquiriesCount: 3,
    completedInquiriesCount: 5,
    totalApplicationsCount: 8
  });
  
  useEffect(() => {
    // TODO: 実際の統計データを取得する
    // モックデータを使用
  }, [user?.id]);
  
  // 募集条件フォームの参照
  const ageMinRef = useRef<HTMLInputElement>(null);
  const ageMaxRef = useRef<HTMLInputElement>(null);
  const specMinRef = useRef<HTMLInputElement>(null);
  const specMaxRef = useRef<HTMLInputElement>(null);
  const acceptsTempWorkersRef = useRef<HTMLButtonElement>(null);
  const requiresArrivalDayBeforeRef = useRef<HTMLButtonElement>(null);
  const minGuaranteeRef = useRef<HTMLInputElement>(null);
  const maxGuaranteeRef = useRef<HTMLInputElement>(null);
  
  // カップサイズ条件の状態管理
  const [showCupSizeConditions, setShowCupSizeConditions] = useState<boolean>(false);
  const [newCupSizeCondition, setNewCupSizeCondition] = useState<CupSizeCondition>({
    cup_size: "D",
    spec_min: 80
  });
  
  // カップサイズ条件のスイッチ変更ハンドラー
  useEffect(() => {
    if (showCupSizeConditions && (!profile?.requirements?.cup_size_conditions || profile.requirements.cup_size_conditions.length === 0)) {
      // カップサイズ条件を表示するときにデフォルト条件がなければ初期値を設定
      handleAddCupSizeCondition();
    }
  }, [showCupSizeConditions, profile]);
  
  // 募集条件保存ミューテーション
  const saveRequirementsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("ユーザーIDが不明です");
      
      // フォーム参照から値を取得
      const requirements = {
        accepts_temporary_workers: acceptsTempWorkersRef.current?.dataset.state === "checked",
        requires_arrival_day_before: requiresArrivalDayBeforeRef.current?.dataset.state === "checked",
        other_conditions: [],
        spec_min: specMinRef.current?.value ? parseInt(specMinRef.current.value) : undefined,
        age_min: ageMinRef.current?.value ? parseInt(ageMinRef.current.value) : undefined,
        age_max: ageMaxRef.current?.value ? parseInt(ageMaxRef.current.value) : undefined,
        spec_max: specMaxRef.current?.value ? parseInt(specMaxRef.current.value) : undefined,
        cup_size_conditions: showCupSizeConditions ? profile?.requirements?.cup_size_conditions || [] : []
      };
      
      const updatedData = {
        ...profile,
        requirements,
        minimum_guarantee: minGuaranteeRef.current?.value ? parseInt(minGuaranteeRef.current.value) : null,
        maximum_guarantee: maxGuaranteeRef.current?.value ? parseInt(maxGuaranteeRef.current.value) : null,
      };
      
      const response = await apiRequest(`/api/store/profile/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(updatedData)
      });
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "採用条件を保存しました",
        description: "応募者を探す際に活用されます",
      });
      
      // キャッシュを更新
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STORE_PROFILE, user?.id],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "保存に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // ステータス更新ミューテーション
  const updateStatusMutation = useMutation({
    mutationFn: async (status: JobStatus) => {
      if (!user?.id || !profile) throw new Error("プロフィール情報がありません");
      
      const updatedData = {
        ...profile,
        status,
      };
      
      const response = await apiRequest(`/api/store/profile/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(updatedData)
      });
      
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: data.status === "published" ? "プロフィールを公開しました" : "プロフィールを非公開にしました",
        description: data.status === "published" ? "求職者があなたの店舗を見つけられるようになりました" : "求職者の検索結果に表示されなくなりました",
      });
      
      // キャッシュを更新
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STORE_PROFILE, user?.id],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "更新に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // カップサイズ条件を追加
  const handleAddCupSizeCondition = () => {
    if (!profile) return;
    
    // 既存のcup_size_conditionsを取得または空の配列を作成
    const currentConditions = profile.requirements?.cup_size_conditions || [];
    
    // 新しい条件を追加
    const updatedConditions = [
      ...currentConditions,
      { ...newCupSizeCondition }
    ];
    
    // プロフィールを更新
    queryClient.setQueryData(
      [QUERY_KEYS.STORE_PROFILE, user?.id],
      {
        ...profile,
        requirements: {
          ...profile.requirements,
          cup_size_conditions: updatedConditions
        }
      }
    );
    
    // 入力フォームをリセット
    setNewCupSizeCondition({
      cup_size: "D",
      spec_min: 80
    });
  };
  
  // カップサイズ条件を削除
  const handleRemoveCupSizeCondition = (index: number) => {
    if (!profile) return;
    
    const currentConditions = profile.requirements?.cup_size_conditions || [];
    const updatedConditions = [...currentConditions];
    updatedConditions.splice(index, 1);
    
    // プロフィールを更新
    queryClient.setQueryData(
      [QUERY_KEYS.STORE_PROFILE, user?.id],
      {
        ...profile,
        requirements: {
          ...profile.requirements,
          cup_size_conditions: updatedConditions
        }
      }
    );
  };
  
  const isSavingRequirements = saveRequirementsMutation.isPending;
  const isUpdatingStatus = updateStatusMutation.isPending;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-screen-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">店舗ダッシュボード</h1>
      
      <div className="mb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* メインコンテンツ */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 w-full justify-start">
                <TabsTrigger value="dashboard" className="flex items-center gap-2 px-4 py-2.5">
                  <BarChart3 className="h-4 w-4" />
                  <span>ダッシュボード</span>
                </TabsTrigger>
                <TabsTrigger value="applications" className="flex items-center gap-2 px-4 py-2.5">
                  <Users className="h-4 w-4" />
                  <span>応募者管理</span>
                  <Badge className="ml-1 bg-primary">{stats?.pendingInquiriesCount || 0}</Badge>
                </TabsTrigger>
                <TabsTrigger value="requirements" className="flex items-center gap-2 px-4 py-2.5">
                  <BadgeCheck className="h-4 w-4" />
                  <span>採用条件</span>
                </TabsTrigger>
              </TabsList>
              
              {/* ダッシュボードタブ */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* 対応が必要な応募者 */}
                <Card>
                  <CardHeader className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-b">
                    <CardTitle className="text-base flex items-center gap-2 font-medium">
                      <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      応募者対応状況
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="flex flex-col space-y-1 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">新規応募</span>
                          <div className="p-1 bg-yellow-100 dark:bg-yellow-800/30 rounded-full">
                            <AlertCircle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{stats?.newInquiriesCount || 0}</span>
                        <span className="text-xs text-yellow-600 dark:text-yellow-500">24時間以内</span>
                      </div>
                      <div className="flex flex-col space-y-1 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">対応待ち</span>
                          <div className="p-1 bg-amber-100 dark:bg-amber-800/30 rounded-full">
                            <MessageSquare className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-amber-800 dark:text-amber-300">{stats?.pendingInquiriesCount || 0}</span>
                        <span className="text-xs text-amber-600 dark:text-amber-500">対応が必要</span>
                      </div>
                      <div className="flex flex-col space-y-1 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-900/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">対応済み</span>
                          <div className="p-1 bg-green-100 dark:bg-green-800/30 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-green-800 dark:text-green-300">{stats?.completedInquiriesCount || 0}</span>
                        <span className="text-xs text-green-600 dark:text-green-500">今月</span>
                      </div>
                    </div>
                    
                    <Button onClick={() => setActiveTab("applications")} className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      応募者管理画面へ
                    </Button>
                  </CardContent>
                </Card>
                
                {/* 最近のブログ投稿 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-6">
                    <CardTitle className="text-base font-medium">最近のブログ投稿</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => window.open('/store/blog', '_blank')}>
                      すべて見る
                    </Button>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <BlogPostsList userId={user?.id} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* 応募管理タブ */}
              <TabsContent value="applications" className="space-y-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">応募者管理</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-10">
                      <div className="inline-flex p-3 rounded-full bg-muted mb-4">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">近日公開予定</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        応募者管理機能は現在開発中です。近日中に公開予定ですので、今しばらくお待ちください。
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab("dashboard")}>
                        ダッシュボードに戻る
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* 採用条件タブ */}
              <TabsContent value="requirements" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">採用条件設定</h3>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          店舗側設定
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ここで設定した採用条件は、応募者とのマッチングや検索に活用されます。
                        条件を詳しく設定すると、よりマッチする人材を見つけやすくなります。
                      </p>
                      
                      {/* 年齢条件 */}
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-3 flex items-center">
                          <User className="h-5 w-5 mr-2 text-blue-500" />
                          年齢条件
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">最低年齢</label>
                            <div className="flex items-center">
                              <input 
                                type="number" 
                                ref={ageMinRef}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                                placeholder="例: 20（半角数字）" 
                                defaultValue={profile?.requirements?.age_min || ""}
                              />
                              <span className="ml-2 text-sm">歳</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">最高年齢（空欄=制限なし）</label>
                            <div className="flex items-center">
                              <input 
                                type="number" 
                                ref={ageMaxRef}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                                placeholder="例: 35（半角数字、空欄=制限なし）" 
                                defaultValue={profile?.requirements?.age_max || ""}
                              />
                              <span className="ml-2 text-sm">歳</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* スペック条件 */}
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-3 flex items-center">
                          <Scale className="h-5 w-5 mr-2 text-purple-500" />
                          スペック条件 <span className="text-xs text-muted-foreground ml-2">（身長-体重）</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">最低スペック値（空欄=制限なし）</label>
                            <div className="flex items-center">
                              <input 
                                type="number" 
                                ref={specMinRef}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                                placeholder="例: 85（半角数字、空欄=制限なし）" 
                                defaultValue={profile?.requirements?.spec_min || ""}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">最高スペック値（空欄=制限なし）</label>
                            <div className="flex items-center">
                              <input 
                                type="number" 
                                ref={specMaxRef}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                                placeholder="例: 95（半角数字、空欄=制限なし）" 
                                defaultValue={profile?.requirements?.spec_max || ""}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* カップサイズ特別条件 */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-start space-x-2">
                            <Switch 
                              id="cup-size-conditions-toggle"
                              checked={showCupSizeConditions}
                              onCheckedChange={setShowCupSizeConditions}
                            />
                            <div>
                              <label htmlFor="cup-size-conditions-toggle" className="text-sm font-medium cursor-pointer">
                                カップサイズ特別条件
                              </label>
                              <p className="text-xs text-muted-foreground">
                                特定のカップサイズ以上の場合、通常より低いスペック値でも可とする条件
                              </p>
                            </div>
                          </div>
                          
                          {showCupSizeConditions && (
                            <div className="bg-muted/40 rounded-md p-4 border mt-2">
                              <div className="text-sm mb-3">
                                例: Eカップ以上なら最低スペック80からでも可能など
                              </div>
                              
                              {/* カップサイズ条件リスト */}
                              <div className="space-y-2 mb-3">
                                {profile?.requirements?.cup_size_conditions?.map((condition, index) => (
                                  <div key={index} className="flex items-center p-2 bg-background rounded border">
                                    <div className="font-medium">{condition.cup_size}カップ以上</div>
                                    <div className="mx-2">→</div>
                                    <div>最低スペック: <span className="font-medium">{condition.spec_min}</span></div>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="ml-auto h-8 w-8" 
                                      onClick={() => handleRemoveCupSizeCondition(index)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              
                              {/* 新規条件入力フォーム */}
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 p-3 bg-background/80 rounded-md border">
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">カップサイズ</label>
                                    <div className="flex items-center">
                                      <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={newCupSizeCondition.cup_size}
                                        onChange={(e) => setNewCupSizeCondition({
                                          ...newCupSizeCondition,
                                          cup_size: e.target.value as CupSize
                                        })}
                                      >
                                        {cupSizes.map((size) => (
                                          <option key={size} value={size}>{size}カップ</option>
                                        ))}
                                      </select>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      指定カップサイズ以上が対象
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">最低スペック値</label>
                                    <div className="flex items-center">
                                      <input
                                        type="number"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        placeholder="例: 80（半角数字）"
                                        value={newCupSizeCondition.spec_min}
                                        onChange={(e) => setNewCupSizeCondition({
                                          ...newCupSizeCondition,
                                          spec_min: parseInt(e.target.value) || 0
                                        })}
                                      />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      ※半角数字で入力してください
                                    </p>
                                  </div>
                                </div>
                                
                                {/* 追加ボタン */}
                                <Button 
                                  type="button" 
                                  onClick={handleAddCupSizeCondition}
                                  className="w-full"
                                  size="sm"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  カップサイズ条件を追加
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 出稼ぎ関連設定 */}
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-3 flex items-center">
                          <Briefcase className="h-5 w-5 mr-2 text-violet-500" />
                          出稼ぎ関連設定
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-start space-x-2">
                            <Switch 
                              id="accepts-temp-workers"
                              ref={acceptsTempWorkersRef}
                              defaultChecked={profile?.requirements?.accepts_temporary_workers !== false}
                            />
                            <div>
                              <label htmlFor="accepts-temp-workers" className="text-sm font-medium cursor-pointer">
                                出稼ぎ受け入れ
                              </label>
                              <p className="text-xs text-muted-foreground">
                                出稼ぎ希望の応募者を受け入れる場合はオンにしてください
                              </p>
                            </div>
                          </div>
                          
                          {/* 出稼ぎ関連の保証額設定 */}
                          <div className="pl-8 space-y-4 border-l-2 border-dashed border-muted-foreground/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-1 block">最低保証額（円/日）</label>
                                <div className="flex items-center">
                                  <input 
                                    type="number" 
                                    ref={minGuaranteeRef}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                                    placeholder="例: 20000" 
                                    defaultValue={profile?.minimum_guarantee || ""}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1 block">最高保証額（円/日）</label>
                                <div className="flex items-center">
                                  <input 
                                    type="number" 
                                    ref={maxGuaranteeRef}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                                    placeholder="例: 35000" 
                                    defaultValue={profile?.maximum_guarantee || ""}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* 勤務時間と平均時給の項目は削除されました */}
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <Switch 
                              id="arrival-day-before"
                              ref={requiresArrivalDayBeforeRef}
                              defaultChecked={profile?.requirements?.requires_arrival_day_before === true}
                            />
                            <div>
                              <label htmlFor="arrival-day-before" className="text-sm font-medium cursor-pointer">
                                前日入り必須
                              </label>
                              <p className="text-xs text-muted-foreground">
                                勤務開始日の前日に到着が必要な場合はオンにしてください
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* その他条件セクションは削除されました */}

                      {/* 保存ボタン */}
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => saveRequirementsMutation.mutate()}
                          disabled={isSavingRequirements}
                        >
                          {isSavingRequirements ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {isSavingRequirements ? '保存中...' : '採用条件を保存'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* サイドバー */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* 店舗プロフィール */}
            <Card className="border border-primary/20 overflow-hidden">
              <div className="bg-primary/5 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user?.display_name || "未設定"}</h3>
                    <p className="text-xs text-muted-foreground">{profile?.location || "未設定"}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 pt-5">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                      <div className="text-lg font-semibold text-primary">{stats?.totalApplicationsCount || 0}</div>
                      <div className="text-xs text-muted-foreground mt-1">応募総数</div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                      <div className="text-lg font-semibold text-primary">{stats?.monthlyPageViews || 0}</div>
                      <div className="text-xs text-muted-foreground mt-1">月間アクセス</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-primary/30 text-primary hover:bg-primary/5" 
                    onClick={() => window.open('/store/settings', '_blank')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    プロフィール設定
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* アクセス状況 */}
            <Card className="overflow-hidden border-none shadow-sm">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-b">
                <CardTitle className="text-base flex items-center gap-2 font-medium">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  アクセス分析
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">今日のアクセス</h3>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        +12% <span className="text-muted-foreground ml-1">前日比</span>
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1 bg-muted/20 rounded-lg p-3">
                        <span className="text-2xl font-bold text-foreground">
                          {stats?.todayPageViews || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">総アクセス数</span>
                      </div>
                      <div className="flex flex-col space-y-1 bg-muted/20 rounded-lg p-3">
                        <span className="text-2xl font-bold text-foreground">
                          {stats?.todayUniqueVisitors || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">ユニークユーザー</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">今月の統計</h3>
                      <span className="text-xs text-muted-foreground">全期間</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1 bg-muted/20 rounded-lg p-3">
                        <span className="text-2xl font-bold text-foreground">
                          {stats?.monthlyPageViews || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">月間アクセス</span>
                      </div>
                      <div className="flex flex-col space-y-1 bg-muted/20 rounded-lg p-3">
                        <span className="text-2xl font-bold text-foreground">
                          {stats?.monthlyUniqueVisitors || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">ユニークユーザー</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 掲載状況 */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 border-b pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center gap-2 font-medium">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                      <ExternalLink className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    掲載情報
                  </CardTitle>
                  <Badge 
                    variant={stats?.storePlan === 'premium' ? 'default' : 'secondary'} 
                    className={stats?.storePlan === 'premium' ? 'bg-purple-500' : ''}
                  >
                    {planLabels[stats?.storePlan || 'free']}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5 pb-5">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">掲載エリア</span>
                      <span className="font-medium text-sm">{stats?.storeArea || '未設定'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">表示順位</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{stats?.displayRank || '-'}位</span>
                        {stats?.displayRank && stats.displayRank <= 3 && (
                          <Badge variant="default" className="bg-amber-500">上位表示</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium">公開ステータス</span>
                      <div className="flex items-center gap-3">
                        <Badge variant={profile?.status === "published" ? "default" : "secondary"} className={profile?.status === "published" ? "bg-green-500" : ""}>
                          {profileStatusLabels[profile?.status || "draft"]}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* 公開/非公開切り替えスイッチ */}
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">店舗情報公開設定</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {profile?.status === "published" 
                              ? "現在、応募者に店舗情報が公開されています" 
                              : "現在、応募者に店舗情報が公開されていません"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={profile?.status === "published"}
                            onCheckedChange={(checked) => {
                              const newStatus = checked ? "published" : "draft";
                              const confirmMessage = checked 
                                ? "店舗情報を公開しますか？公開すると求職者に表示されます。" 
                                : "店舗情報を非公開にしますか？非公開にすると求職者に表示されなくなります。";
                              
                              // 確認ダイアログを表示して処理
                              if (window.confirm(confirmMessage)) {
                                console.log(`スイッチ変更: ${profile?.status} → ${newStatus}`);
                                updateStatusMutation.mutate(newStatus);
                              }
                            }}
                            disabled={isUpdatingStatus || !profile}
                          />
                          {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 p-4 flex justify-center">
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowProfileForm(true)}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  プラン情報を編集
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* 店舗情報編集ダイアログ */}
      <JobFormDialog
        open={showProfileForm}
        onOpenChange={setShowProfileForm}
        initialData={profile}
      />
    </div>
  );
}

// ブログ記事一覧コンポーネント
function BlogPostsList({ userId }: { userId?: number }) {
  const [, setLocation] = useLocation();
  const MAX_POSTS = 3;
  
  const { data: blogPosts, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.BLOG_POSTS, userId],
    queryFn: async () => {
      if (!userId) return { posts: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0 } };
      const response = await apiRequest(`/api/store/blog?page=1&limit=${MAX_POSTS}`);
      return response;
    },
    enabled: !!userId,
  });
  
  const formatDate = (post: BlogPost) => {
    if (post.status === 'scheduled' && post.scheduled_at) {
      return `${format(new Date(post.scheduled_at), 'yyyy/MM/dd HH:mm')} 公開予定`;
    }
    return post.published_at 
      ? format(new Date(post.published_at), 'yyyy/MM/dd', { locale: ja })
      : format(new Date(post.created_at), 'yyyy/MM/dd', { locale: ja });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 border rounded-md animate-pulse">
            <div className="w-14 h-14 bg-muted rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!blogPosts?.posts?.length) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex p-3 rounded-full bg-muted mb-4">
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">ブログ記事がありません</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          ブログを書いて集客力をアップしましょう。定期的な更新が求人の魅力を高めます。
        </p>
        <Button onClick={() => setLocation('/store/blog/new')}>
          <Plus className="h-4 w-4 mr-2" />
          ブログを書く
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {blogPosts.posts.map((post: BlogPost) => (
        <div 
          key={post.id} 
          className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/20 transition-colors cursor-pointer"
          onClick={() => setLocation(`/store/blog/edit/${post.id}`)}
        >
          {post.thumbnail ? (
            <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0">
              <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded bg-muted/30 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-medium text-sm line-clamp-2">{post.title}</h3>
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="mr-2 text-[10px] px-1">
                {post.status === 'published' ? '公開中' : post.status === 'scheduled' ? '予約投稿' : '下書き'}
              </Badge>
              <time>{formatDate(post)}</time>
            </div>
          </div>
        </div>
      ))}
      
      <Button 
        variant="outline" 
        className="w-full mt-4" 
        onClick={() => setLocation('/store/blog')}
      >
        すべての記事を見る
      </Button>
    </div>
  );
}