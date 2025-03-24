import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type StoreProfile, type BlogPost } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ThumbnailImage } from "@/components/blog/thumbnail-image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { HtmlContent } from "@/components/html-content";
import {
  Building2,
  PenBox,
  FileEdit,
  Settings,
  Users,
  LineChart,
  Plus,
  LogOut,
  Loader2,
  AlertCircle,
  UserCircle,
  Phone,
  Mail,
  PhoneCall,
  User,
  Pencil,
  Eye,
  Clock,
  CheckCircle,
  MoreVertical,
  Calendar,
  ExternalLink,
  Bell,
  BarChart3,
  Newspaper,
  MapPin,
  Briefcase,
  Info,
  Banknote,
  Award,
  ChevronRight,
  LucideIcon,
  CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { JobFormDialog } from "@/components/job-form-dialog";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { StoreApplicationView } from "@/components/store-application-view";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// プロフィールのステータスラベル
const profileStatusLabels = {
  draft: "未公開",
  published: "公開中",
  closed: "募集終了"
} as const;

// ブログ投稿のステータスラベル
const blogStatusLabels = {
  draft: "下書き",
  published: "公開中",
  scheduled: "予約投稿"
} as const;

// プランのラベル
const planLabels = {
  free: "無料プラン",
  premium: "有料プラン"
} as const;

// 統計情報の型定義
interface DashboardStats {
  // 掲載情報
  storePlan: 'free' | 'premium';
  storeArea: string;
  displayRank: number;

  // アクセス状況
  todayPageViews: number;
  todayUniqueVisitors: number;
  monthlyPageViews: number;
  monthlyUniqueVisitors: number;

  // 応募者対応状況
  newInquiriesCount: number;
  pendingInquiriesCount: number;
  completedInquiriesCount: number;
  totalApplicationsCount: number;
}

// ダッシュボードカードコンポーネント
interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  value: number | string;
  description?: string;
  trend?: number;
  color?: "default" | "primary" | "success" | "warning" | "danger";
  onClick?: () => void;
}

const DashboardCard = ({ 
  icon: Icon, 
  title, 
  value, 
  description, 
  trend, 
  color = "default",
  onClick
}: DashboardCardProps) => {
  const colorStyles = {
    default: "bg-card",
    primary: "bg-primary/10 border-primary/20",
    success: "bg-green-500/10 border-green-500/20",
    warning: "bg-yellow-500/10 border-yellow-500/20",
    danger: "bg-red-500/10 border-red-500/20",
  };

  const iconStyles = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 ease-in-out border overflow-hidden", 
        colorStyles[color],
        onClick && "cursor-pointer hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={cn(
            "p-2 rounded-full", 
            color === "primary" ? "bg-primary/20" : 
            color === "success" ? "bg-green-500/20" :
            color === "warning" ? "bg-yellow-500/20" :
            color === "danger" ? "bg-red-500/20" : 
            "bg-muted"
          )}>
            <Icon className={cn("h-5 w-5", iconStyles[color])} />
          </div>
        </div>
        {trend !== undefined && (
          <div className={cn(
            "text-xs font-medium mt-2",
            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
          )}>
            {trend > 0 ? "+" : ""}{trend}% {trend >= 0 ? "増加" : "減少"}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function StoreDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState("profile");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // 店舗プロフィール情報の取得
  const { data: profile, isLoading: profileLoading } = useQuery<StoreProfile>({
    queryKey: [QUERY_KEYS.STORE_PROFILE],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/store/profile");
        console.log('店舗プロフィールAPI応答:', response);
        // レスポンスはすでにJSON解析済みなので直接返す
        return response as StoreProfile;
      } catch (error) {
        console.error('店舗プロフィール取得エラー:', error);
        throw error;
      }
    },
    enabled: !!user?.id && user?.role === "store",
    retry: 2,
    retryDelay: 1000,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // ダッシュボードの統計情報を取得
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: [QUERY_KEYS.STORE_STATS],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", QUERY_KEYS.STORE_STATS);
        console.log('API Response from /store/stats:', response);
        return response as DashboardStats;
      } catch (error) {
        console.error('統計情報取得エラー:', error);
        throw error;
      }
    },
    staleTime: 300000, // 5分
    enabled: !!user?.id && user?.role === "store",
    retry: 2,
    retryDelay: 1000,
  });
  
  // 公開ステータス変更処理
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: "draft" | "published") => {
      setIsUpdatingStatus(true);
      // 現在のプロフィールデータを使って必要なフィールドだけ更新
      const updateData = {
        catch_phrase: profile?.catch_phrase || "",
        description: profile?.description || "",
        benefits: profile?.benefits || [],
        minimum_guarantee: profile?.minimum_guarantee || 0,
        maximum_guarantee: profile?.maximum_guarantee || 0,
        working_time_hours: profile?.working_time_hours || 0,
        average_hourly_pay: profile?.average_hourly_pay || 0,
        status: newStatus
      };
      
      return await apiRequest("PATCH", "/api/store/profile", updateData);
    },
    onSuccess: () => {
      // キャッシュを更新してUIを再描画
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STORE_PROFILE] });
      
      toast({
        title: profile?.status === "published" ? "店舗情報を非公開にしました" : "店舗情報を公開しました",
        description: profile?.status === "published" 
          ? "求職者には表示されなくなりました"
          : "求職者に店舗情報が表示されるようになりました",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "ステータスの変更に失敗しました",
        description: error.message || "もう一度お試しください",
      });
    },
    onSettled: () => {
      setIsUpdatingStatus(false);
    }
  });

  if (statsLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* モダンなヘッダー */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  {user?.display_name}
                  <Badge variant={profile?.status === "published" ? "default" : "secondary"} className="ml-2">
                    {profileStatusLabels[profile?.status || "draft"]}
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "yyyy年MM月dd日 HH:mm", { locale: ja })} 更新
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => window.open('/store/settings', '_blank')}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* ダッシュボードサマリー */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DashboardCard 
            icon={Users} 
            title="新規問い合わせ" 
            value={stats?.newInquiriesCount || 0} 
            color="primary"
            onClick={() => setSelectedTab("applications")}
          />
          <DashboardCard 
            icon={BarChart3} 
            title="本日のアクセス" 
            value={stats?.todayPageViews || 0} 
            description={`ユニークユーザー: ${stats?.todayUniqueVisitors || 0}`}
            trend={5}
            color="success"
          />
          <DashboardCard 
            icon={Newspaper} 
            title="ブログ投稿数" 
            value={5} 
            description={"最終投稿: 本日"}
            onClick={() => setSelectedTab("blog")}
          />
          <DashboardCard 
            icon={Calendar} 
            title="予約投稿" 
            value={1} 
            description={"次回: 3/25 00:20"}
            color="warning"
          />
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* メインコンテンツ */}
          <div className="col-span-12 lg:col-span-8">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
              <TabsList className="grid grid-cols-4 h-auto p-1 bg-muted/80 backdrop-blur-sm rounded-xl">
                <TabsTrigger value="profile" className="py-2 rounded-lg">
                  <Building2 className="h-4 w-4 mr-2" />
                  店舗情報
                </TabsTrigger>
                <TabsTrigger value="applications" className="py-2 rounded-lg">
                  <Users className="h-4 w-4 mr-2" />
                  応募一覧
                </TabsTrigger>
                <TabsTrigger value="blog" className="py-2 rounded-lg">
                  <Pencil className="h-4 w-4 mr-2" />
                  ブログ管理
                </TabsTrigger>
                <TabsTrigger value="freeSpace" className="py-2 rounded-lg">
                  <PenBox className="h-4 w-4 mr-2" />
                  フリースペース
                </TabsTrigger>
              </TabsList>

              {/* 店舗情報タブ */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>店舗プロフィール</CardTitle>
                      <CardDescription>
                        店舗の基本情報を管理できます
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowProfileForm(true)}>
                      <FileEdit className="h-4 w-4 mr-2" />
                      編集する
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!profile ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          店舗情報が未設定です
                        </p>
                        <Button variant="outline" className="mt-4" onClick={() => setShowProfileForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          店舗情報を設定する
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* ヘッダー部分 */}
                        <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-lg border border-primary/10">
                          <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* プロフィールアイコン/TOP画像 */}
                            {profile.top_image ? (
                              <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-lg overflow-hidden border-2 border-primary/20 shadow-md">
                                <ThumbnailImage
                                  src={profile.top_image}
                                  alt={profile.business_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="bg-primary/10 rounded-full p-6 flex-shrink-0">
                                <Building2 className="h-12 w-12 text-primary" />
                              </div>
                            )}
                            
                            {/* 基本情報 */}
                            <div className="flex-grow space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-2xl font-bold">{profile.business_name}</h2>
                                <Badge variant={profile.status === "published" ? "default" : "secondary"} className="ml-0 md:ml-3">
                                  {profileStatusLabels[profile.status]}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1 text-primary/70" />
                                  <span>{profile.location}</span>
                                </div>
                                <div className="flex items-center">
                                  <Briefcase className="h-4 w-4 mr-1 text-primary/70" />
                                  <span>{profile.service_type}</span>
                                </div>
                              </div>
                              {/* キャッチコピー */}
                              <div className="mt-3 bg-background p-4 rounded-md border font-medium italic text-lg">
                                "{profile.catch_phrase}"
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 給与・待遇セクション（統合版） */}
                        <div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
                          <h3 className="text-lg font-semibold flex items-center mb-4">
                            <Banknote className="h-5 w-5 mr-2 text-green-500" />
                            給与とサポート
                          </h3>
                          
                          <div className="space-y-6">
                            {/* 給与情報 */}
                            <div>
                              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                                給与情報
                              </h4>
                              
                              <div className="grid md:grid-cols-2 gap-4">
                                {/* 勤務時間に対しての平均日給 */}
                                {profile?.working_time_hours && profile?.average_hourly_pay && 
                                profile.working_time_hours > 0 && profile.average_hourly_pay > 0 ? (
                                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 p-5 rounded-lg border border-green-200 shadow-sm">
                                    <div className="text-sm text-muted-foreground mb-1">勤務時間に対しての平均日給</div>
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">
                                      {profile.working_time_hours}時間勤務で{profile.average_hourly_pay.toLocaleString()}円
                                    </div>
                                    <div className="flex items-center mt-3 bg-white/70 dark:bg-black/10 px-3 py-2 rounded-md border border-green-200">
                                      <span className="text-sm font-medium text-green-800 dark:text-green-400">時給換算:</span>
                                      <span className="ml-2 text-lg font-bold text-green-700 dark:text-green-300">{Math.round(profile.average_hourly_pay / profile.working_time_hours).toLocaleString()}円</span>
                                    </div>
                                  </div>
                                ) : null}
                                
                                {/* 日給 */}
                                {(profile.minimum_guarantee || profile.maximum_guarantee) && (
                                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 p-5 rounded-lg border border-amber-200 shadow-sm flex flex-col">
                                    <div className="text-sm text-muted-foreground">日給</div>
                                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1 flex-grow flex items-center">
                                      {profile.minimum_guarantee ? `${profile.minimum_guarantee.toLocaleString()}円` : ""}
                                      {profile.minimum_guarantee && profile.maximum_guarantee ? <span className="mx-2 text-amber-500">〜</span> : ""}
                                      {profile.maximum_guarantee ? `${profile.maximum_guarantee.toLocaleString()}円` : ""}
                                    </div>
                                    {profile.minimum_guarantee && profile.maximum_guarantee && (
                                      <div className="mt-3 text-xs text-amber-700 dark:text-amber-400 bg-white/70 dark:bg-black/10 px-3 py-2 rounded-md border border-amber-200">
                                        経験やスキルに応じて給与は異なります
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* 福利厚生・サポート */}
                            <div>
                              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                <Award className="h-4 w-4 mr-2 text-blue-500" />
                                福利厚生・サポート
                              </h4>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {/* 交通・住居サポート */}
                                <div className="flex flex-wrap gap-2 col-span-2 md:col-span-3 lg:col-span-4">
                                  {profile.transportation_support && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 py-1.5">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-blue-500">
                                        <rect x="1" y="3" width="15" height="13"></rect>
                                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                                      </svg>
                                      交通費サポート
                                    </Badge>
                                  )}
                                  
                                  {profile.housing_support && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 py-1.5">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-purple-500">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                      </svg>
                                      寮完備
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* その他の福利厚生 */}
                                {profile.benefits?.map((benefit) => (
                                  <div key={benefit} className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md border border-blue-100">
                                    <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <span className="text-blue-800 dark:text-blue-200">{benefit}</span>
                                  </div>
                                ))}
                              </div>
                              
                              {(!profile.benefits || profile.benefits.length === 0) && 
                               !profile.transportation_support && 
                               !profile.housing_support && (
                                <div className="text-center py-2 bg-gray-50 rounded-md border">
                                  <span className="text-sm text-gray-500 italic">福利厚生情報が未設定です</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        


                        {/* オンライン情報セクション (メッセージアプリ・ウェブサイト) */}
                        <div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
                          <h3 className="text-lg font-semibold flex items-center mb-4">
                            <ExternalLink className="h-5 w-5 mr-2 text-cyan-500" />
                            オンラインサービス
                          </h3>
                          
                          <div className="grid gap-5">
                            {/* メッセージアプリ情報 */}
                            {(profile.sns_id || profile.sns_url || profile.sns_text) && (
                              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                <h4 className="font-medium text-green-800 mb-3 flex items-center">
                                  <span className="bg-white p-1.5 rounded-full mr-2 border border-green-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                  </span>
                                  メッセージアプリ
                                </h4>
                                <div className="ml-2 space-y-3">
                                  {profile.sns_id && (
                                    <div className="flex items-center">
                                      <span className="bg-white rounded-md px-2 py-1 text-xs text-green-700 font-medium border border-green-200">ID</span>
                                      <span className="ml-2 text-sm font-medium">{profile.sns_id}</span>
                                    </div>
                                  )}
                                  {profile.sns_url && (
                                    <a 
                                      href={profile.sns_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1.5 bg-white rounded-md text-green-600 text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                      </svg>
                                      <span>友だち追加</span>
                                    </a>
                                  )}
                                  {profile.sns_text && (
                                    <div className="text-sm mt-2 bg-white p-3 rounded-md border border-green-200">
                                      {profile.sns_text}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* ウェブサイト情報 */}
                            {(profile.pc_website_url || profile.mobile_website_url) && (
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                                  <span className="bg-white p-1.5 rounded-full mr-2 border border-blue-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line x1="2" y1="12" x2="22" y2="12"></line>
                                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                    </svg>
                                  </span>
                                  オフィシャルサイト
                                </h4>
                                <div className="flex flex-col md:flex-row gap-3 mt-3">
                                  {profile.pc_website_url && (
                                    <a 
                                      href={profile.pc_website_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 bg-white rounded-md text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                        <line x1="8" y1="21" x2="16" y2="21"></line>
                                        <line x1="12" y1="17" x2="12" y2="21"></line>
                                      </svg>
                                      <span>PC公式サイト</span>
                                    </a>
                                  )}
                                  {profile.mobile_website_url && (
                                    <a 
                                      href={profile.mobile_website_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 bg-white rounded-md text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                        <line x1="12" y1="18" x2="12" y2="18"></line>
                                      </svg>
                                      <span>スマホ公式サイト</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 仕事内容セクション - 最も重要な情報を最初に表示 */}
                        <div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
                          <h3 className="text-lg font-semibold flex items-center mb-4">
                            <Briefcase className="h-5 w-5 mr-2 text-primary" />
                            <span>仕事内容</span>
                          </h3>
                          
                          <div className="bg-primary/5 p-5 rounded-lg border border-primary/20">
                            <div className="prose prose-sm max-w-none">
                              <HtmlContent html={profile.description || "仕事内容の詳細が設定されていません"} />
                            </div>
                          </div>
                        </div>
                        
                        {/* 応募要件セクション (統合) */}
                        <div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
                          <h3 className="text-lg font-semibold flex items-center mb-4">
                            <CheckCircle className="h-5 w-5 mr-2 text-yellow-500" />
                            <span>応募資格・条件</span>
                          </h3>
                          
                          <div className="space-y-4">
                            {profile.requirements && (
                              <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
                                <h4 className="font-medium text-yellow-700 mb-2 text-sm">基本応募条件</h4>
                                <p className="text-sm whitespace-pre-line">{profile.requirements}</p>
                              </div>
                            )}
                            
                            {profile.application_requirements && (
                              <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
                                <h4 className="font-medium text-yellow-700 mb-2 text-sm">詳細応募資格</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-line">{profile.application_requirements}</p>
                              </div>
                            )}
                            
                            {(!profile.requirements && !profile.application_requirements) && (
                              <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 text-center">
                                <p className="text-sm text-gray-500 italic">応募資格・条件が設定されていません</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 給与・待遇・勤務時間 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {/* 給与・待遇情報 */}
                          <div className="bg-card rounded-lg border shadow-sm p-6">
                            <h3 className="text-lg font-semibold flex items-center mb-4">
                              <Banknote className="h-5 w-5 mr-2 text-emerald-500" />
                              <span>給与・待遇</span>
                            </h3>
                            
                            <div className="space-y-4">
                              {/* 給与情報 */}
                              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                                <h4 className="font-medium text-emerald-700 mb-3 text-sm flex items-center">
                                  <div className="p-1 bg-white rounded-full mr-2 border border-emerald-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                                      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                      <line x1="2" y1="10" x2="22" y2="10"></line>
                                    </svg>
                                  </div>
                                  給与
                                </h4>
                                
                                {/* 勤務時間に対しての平均日給 */}
                                {profile.working_time_hours && profile.average_hourly_pay ? (
                                  <div className="mb-4 border-b border-emerald-100 pb-3">
                                    <div className="font-medium text-sm text-emerald-800 mb-1">勤務時間に対しての平均日給</div>
                                    <div className="font-bold text-lg text-emerald-800">
                                      {profile.working_time_hours}時間勤務で{profile.average_hourly_pay.toLocaleString()}円
                                    </div>
                                    
                                    <div className="mt-2 pt-2 border-t border-emerald-100/50">
                                      <div className="font-medium text-sm text-emerald-800 mb-1">時給換算:</div>
                                      <div className="font-bold">
                                        {Math.round(profile.average_hourly_pay / profile.working_time_hours).toLocaleString()}円
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                                
                                {/* 日給 */}
                                <div className="mt-3">
                                  <div className="font-medium text-sm text-emerald-800 mb-1">日給</div>
                                  {(profile.minimum_guarantee || profile.maximum_guarantee) ? (
                                    <div className="font-bold text-lg text-emerald-800">
                                      {profile.minimum_guarantee && profile.maximum_guarantee 
                                        ? `${profile.minimum_guarantee.toLocaleString()}円〜${profile.maximum_guarantee.toLocaleString()}円` 
                                        : profile.minimum_guarantee 
                                          ? `${profile.minimum_guarantee.toLocaleString()}円〜` 
                                          : `〜${profile.maximum_guarantee?.toLocaleString()}円`}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500 italic">未設定</span>
                                  )}
                                  <div className="text-xs text-gray-500 mt-1">
                                    経験やスキルに応じて給与は異なります
                                  </div>
                                </div>
                              </div>
                              
                              {/* 福利厚生・サポート */}
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                <h4 className="font-medium text-blue-700 mb-3 text-sm flex items-center">
                                  <div className="p-1 bg-white rounded-full mr-2 border border-blue-200">
                                    <Award className="w-4 h-4 text-blue-600" />
                                  </div>
                                  福利厚生・サポート
                                </h4>
                                <div>
                                  {/* カテゴリー別に福利厚生を表示 */}
                                  <div className="flex flex-col gap-3">
                                    {/* 交通・住居サポート */}
                                    <div className="flex flex-wrap gap-2">
                                      <Badge variant={profile.transportation_support ? "default" : "outline"} 
                                             className={profile.transportation_support 
                                                      ? "bg-blue-500 hover:bg-blue-600" 
                                                      : "text-gray-400 bg-gray-100"}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                          <rect x="1" y="3" width="15" height="13"></rect>
                                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                          <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                          <circle cx="18.5" cy="18.5" r="2.5"></circle>
                                        </svg>
                                        交通費サポート
                                      </Badge>
                                      <Badge variant={profile.housing_support ? "default" : "outline"} 
                                             className={profile.housing_support 
                                                      ? "bg-indigo-500 hover:bg-indigo-600" 
                                                      : "text-gray-400 bg-gray-100"}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                        </svg>
                                        寮完備
                                      </Badge>
                                    </div>
                                    
                                    {/* その他の福利厚生 */}
                                    {profile.benefits && profile.benefits.length > 0 && (
                                      <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-100">
                                        {profile.benefits.map((benefit, idx) => (
                                          <Badge key={idx} variant="outline" className="bg-white text-blue-700 border-blue-200">
                                            {benefit}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* 福利厚生が全く設定されていない場合 */}
                                  {(!profile.benefits || profile.benefits.length === 0) && 
                                   !profile.transportation_support && 
                                   !profile.housing_support && (
                                    <div className="text-center py-2">
                                      <span className="text-sm text-gray-500 italic">特典情報が未設定です</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* 勤務時間・アクセス */}
                          <div className="bg-card rounded-lg border shadow-sm p-6">
                            <h3 className="text-lg font-semibold flex items-center mb-4">
                              <Clock className="h-5 w-5 mr-2 text-orange-500" />
                              <span>勤務時間・アクセス</span>
                            </h3>
                            
                            <div className="space-y-4">
                              {/* 勤務時間 */}
                              <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                                <h4 className="font-medium text-orange-700 mb-3 text-sm flex items-center">
                                  <div className="p-1 bg-white rounded-full mr-2 border border-orange-200">
                                    <Clock className="w-4 h-4 text-orange-600" />
                                  </div>
                                  勤務時間・シフト
                                </h4>
                                <p className="text-sm whitespace-pre-line">
                                  {profile.working_hours || <span className="text-gray-500 italic">勤務時間が未設定です</span>}
                                </p>
                              </div>
                              
                              {/* アクセス情報 */}
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                <h4 className="font-medium text-blue-700 mb-3 text-sm flex items-center">
                                  <div className="p-1 bg-white rounded-full mr-2 border border-blue-200">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                  </div>
                                  所在地・アクセス
                                </h4>
                                
                                {profile.address && (
                                  <div className="flex items-start mb-3 pb-3 border-b border-blue-100">
                                    <div className="bg-white p-1.5 rounded-full border border-blue-200 mr-2">
                                      <MapPin className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div>
                                      <div className="text-xs text-blue-700 font-medium">所在地</div>
                                      <div className="font-medium">{profile.address}</div>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="text-sm">
                                  {profile.access_info ? (
                                    <p className="whitespace-pre-line">{profile.access_info}</p>
                                  ) : (
                                    <p className="text-gray-500 italic">アクセス情報が登録されていません</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 安全対策と連絡先情報 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {/* 安全対策 */}
                          <div className="bg-card rounded-lg border shadow-sm p-6">
                            <h3 className="text-lg font-semibold flex items-center mb-4">
                              <AlertCircle className="h-5 w-5 mr-2 text-green-500" />
                              <span>安全対策</span>
                            </h3>
                            <div className="bg-green-50 border border-green-100 rounded-md p-4">
                              {profile.security_measures ? (
                                <div className="text-sm whitespace-pre-line">
                                  <div className="flex items-center mb-3">
                                    <div className="bg-white p-1.5 rounded-full border border-green-200 mr-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                      </svg>
                                    </div>
                                    <span className="font-medium text-green-800">安心・安全への取り組み</span>
                                  </div>
                                  <p className="text-gray-700">{profile.security_measures}</p>
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <div className="bg-white p-2 rounded-full border border-green-200 inline-flex mx-auto mb-3">
                                    <AlertCircle className="h-6 w-6 text-green-500" />
                                  </div>
                                  <p className="text-gray-500 italic">安全対策情報が登録されていません</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* 店舗連絡先情報 */}
                          <div className="bg-card rounded-lg border shadow-sm p-6">
                            <h3 className="text-lg font-semibold flex items-center mb-4">
                              <UserCircle className="h-5 w-5 mr-2 text-purple-500" />
                              <span>お問い合わせ</span>
                            </h3>
                            
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
                              {/* 担当者情報 */}
                              {profile.recruiter_name ? (
                                <div className="flex items-start mb-4 pb-4 border-b border-purple-100">
                                  <div className="bg-white p-2 rounded-full border border-purple-200 mr-3">
                                    <User className="h-5 w-5 text-purple-500" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-purple-700 font-medium">採用担当者</div>
                                    <div className="font-medium text-base">{profile.recruiter_name}</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start mb-4 pb-4 border-b border-purple-100 opacity-70">
                                  <div className="bg-white p-2 rounded-full border border-purple-200 mr-3">
                                    <User className="h-5 w-5 text-purple-500" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-purple-700 font-medium">採用担当者</div>
                                    <div className="font-medium text-base text-gray-500 italic">未設定</div>
                                  </div>
                                </div>
                              )}
                              
                              {/* 連絡先情報 */}
                              <div className="space-y-4">
                                {profile.phone_numbers && profile.phone_numbers.length > 0 ? (
                                  <div>
                                    <div className="text-xs text-purple-700 font-medium mb-2">電話でのお問い合わせ</div>
                                    <div className="space-y-2">
                                      {profile.phone_numbers.map((phone, idx) => (
                                        <div key={idx} className="flex items-center">
                                          <div className="bg-white p-1.5 rounded-full border border-purple-200 mr-2">
                                            <Phone className="h-4 w-4 text-purple-500" />
                                          </div>
                                          <a href={`tel:${phone.replace(/-/g, '')}`} className="font-medium text-purple-800 hover:text-purple-600 transition-colors">
                                            {phone}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="opacity-70">
                                    <div className="text-xs text-purple-700 font-medium mb-2">電話でのお問い合わせ</div>
                                    <div className="flex items-center">
                                      <div className="bg-white p-1.5 rounded-full border border-purple-200 mr-2">
                                        <Phone className="h-4 w-4 text-purple-500" />
                                      </div>
                                      <span className="font-medium text-gray-500 italic">電話番号未設定</span>
                                    </div>
                                  </div>
                                )}
                                
                                {profile.email_addresses && profile.email_addresses.length > 0 ? (
                                  <div>
                                    <div className="text-xs text-purple-700 font-medium mb-2">メールでのお問い合わせ</div>
                                    <div className="space-y-2">
                                      {profile.email_addresses.map((email, idx) => (
                                        <div key={idx} className="flex items-center">
                                          <div className="bg-white p-1.5 rounded-full border border-purple-200 mr-2">
                                            <Mail className="h-4 w-4 text-purple-500" />
                                          </div>
                                          <a href={`mailto:${email}`} className="font-medium text-purple-800 hover:text-purple-600 transition-colors">
                                            {email}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="opacity-70">
                                    <div className="text-xs text-purple-700 font-medium mb-2">メールでのお問い合わせ</div>
                                    <div className="flex items-center">
                                      <div className="bg-white p-1.5 rounded-full border border-purple-200 mr-2">
                                        <Mail className="h-4 w-4 text-purple-500" />
                                      </div>
                                      <span className="font-medium text-gray-500 italic">メールアドレス未設定</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 編集ボタン */}
                        <div className="flex justify-end">
                          <Button onClick={() => setShowProfileForm(true)} className="w-full md:w-auto">
                            <FileEdit className="h-4 w-4 mr-2" />
                            プロフィールを編集する
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 応募一覧タブ */}
              <TabsContent value="applications">
                <Card>
                  <CardContent className="p-6">
                    <StoreApplicationView />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ブログ管理タブ */}
              <TabsContent value="blog">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>ブログ記事一覧</CardTitle>
                      <CardDescription>
                        ブログの投稿・管理ができます
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setLocation('/store/blog')}>
                        <FileEdit className="h-4 w-4 mr-2" />
                        詳細管理
                      </Button>
                      <Button onClick={() => setLocation('/store/blog/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        新規作成
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <BlogPostsList userId={user?.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* フリースペースタブ */}
              <TabsContent value="freeSpace">
                <Card>
                  <CardHeader>
                    <CardTitle>フリースペース編集</CardTitle>
                    <CardDescription>
                      店舗紹介や特徴を自由に編集できます
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full">
                        <PenBox className="h-4 w-4 mr-2" />
                        フリースペースを編集
                      </Button>
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
                              // 確認メッセージを表示
                              if (confirm(checked 
                                ? "店舗情報を公開しますか？公開すると求職者に表示されます。" 
                                : "店舗情報を非公開にしますか？非公開にすると求職者に表示されなくなります。")) {
                                updateStatusMutation.mutate(checked ? "published" : "draft");
                              }
                            }}
                            disabled={isUpdatingStatus || !profile}
                          />
                          {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
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
  const MAX_TITLE_LENGTH = 30;
  const MAX_POSTS_TO_SHOW = 5;

  // ブログ記事の取得
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.BLOG_POSTS_STORE],
    queryFn: async () => {
      if (!userId) return { posts: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
      
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", MAX_POSTS_TO_SHOW.toString());
      
      try {
        // apiRequestを直接使用し、JSONを返すように修正
        const data = await apiRequest("GET", `${QUERY_KEYS.BLOG_POSTS_STORE}?${params.toString()}`);
        console.log("Blog posts fetch result:", data);
        return data;
      } catch (error) {
        console.error("ブログ記事の取得に失敗しました:", error);
        throw new Error("ブログ記事の取得に失敗しました");
      }
    },
    enabled: !!userId,
    staleTime: 0, // キャッシュを無効化し、常に最新データを取得する
    gcTime: 0, // v5ではcacheTimeの代わりにgcTimeを使用する
    retry: 2,
    refetchOnMount: 'always', // コンポーネントがマウントされるたびに再取得
    refetchOnWindowFocus: true, // ウィンドウにフォーカスが戻ったときに再取得
  });

  // タイトルを適切な長さにトリミングする
  const trimTitle = (title: string) => {
    if (title.length <= MAX_TITLE_LENGTH) return title;
    return `${title.substring(0, MAX_TITLE_LENGTH)}...`;
  };

  // 日付のフォーマット - ブログ記事のステータスを考慮
  const formatDate = (post: BlogPost) => {
    // 公開記事の場合
    if (post.status === 'published') {
      // published_atがある場合はそれを表示、なければ作成日時を表示
      if (post.published_at) {
        const pubDate = typeof post.published_at === 'string' ? new Date(post.published_at) : post.published_at;
        return format(pubDate, "yyyy/MM/dd HH:mm", { locale: ja });
      } else if (post.created_at) {
        const createDate = typeof post.created_at === 'string' ? new Date(post.created_at) : post.created_at;
        return format(createDate, "yyyy/MM/dd HH:mm", { locale: ja }) + " (作成日時)";
      }
    }
    
    // 予約投稿の場合は予定日時を表示
    else if (post.status === 'scheduled' && post.scheduled_at) {
      const schedDate = typeof post.scheduled_at === 'string' ? new Date(post.scheduled_at) : post.scheduled_at;
      return format(schedDate, "yyyy/MM/dd HH:mm", { locale: ja }) + " (予定)";
    }
    
    // それ以外の場合は作成日時を表示
    else if (post.created_at) {
      const createDate = typeof post.created_at === 'string' ? new Date(post.created_at) : post.created_at;
      return format(createDate, "yyyy/MM/dd HH:mm", { locale: ja });
    }
    
    // どの日時情報もない場合
    return "-";
  };

  // ステータスに応じたバッジの表示
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="default" className="bg-green-500/90 hover:bg-green-500/80">
                <CheckCircle className="h-3 w-3 mr-1" />{blogStatusLabels.published}
               </Badge>;
      case "scheduled":
        return <Badge variant="outline" className="border-amber-500 text-amber-500">
                <Clock className="h-3 w-3 mr-1" />{blogStatusLabels.scheduled}
               </Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-200">
                <Pencil className="h-3 w-3 mr-1" />{blogStatusLabels.draft}
               </Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">ブログ記事を読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
        <p className="text-muted-foreground">ブログ記事の取得中にエラーが発生しました</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          再読み込み
        </Button>
      </div>
    );
  }

  if (!data?.posts || data.posts.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/30 p-8">
        <div className="bg-muted/40 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
          <Newspaper className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">まだブログ記事がありません</h3>
        <p className="text-muted-foreground mb-6">
          ブログ記事を作成して、お店の魅力をアピールしましょう。
        </p>
        <Button
          onClick={() => setLocation('/store/blog/new')}
          className="bg-primary/90 hover:bg-primary shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          記事を作成する
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {data.posts.map((post: BlogPost) => (
          <div key={post.id} className="flex items-center gap-3 p-3 bg-card hover:bg-muted/10 rounded-lg border transition-colors group">
            <div className="flex-shrink-0">
              {post.thumbnail ? (
                <div className="w-16 h-16 overflow-hidden rounded-md shadow-sm">
                  <ThumbnailImage
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                  <Newspaper className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getStatusBadge(post.status)}
                <span className="text-xs text-muted-foreground">{formatDate(post)}</span>
              </div>
              <h3 className="font-medium truncate">{post.title}</h3>
              <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                {post.content?.replace(/<[^>]*>/g, '').substring(0, 50)}...
              </div>
            </div>
            
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={() => window.open(`/blog/${post.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={() => setLocation(`/store/blog/edit/${post.id}`)}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          合計 {data.pagination?.totalItems || 0} 記事
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/store/blog')}
          className="gap-1"
        >
          すべての記事を表示
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}