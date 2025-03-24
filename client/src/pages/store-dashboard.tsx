import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type StoreProfile, type BlogPost } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ThumbnailImage } from "@/components/blog/thumbnail-image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { HtmlContent } from "@/components/html-content";
import { type LucideIcon } from "lucide-react";
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
  MessageCircle,
  PhoneCall,
  User,
  Pencil,
  Eye,
  Clock,
  CheckCircle,
  Banknote,
  Home,
  Car,
  Shield,
  MapPin,
  Briefcase,
  Map,
  MoreVertical,
  Calendar,
  ExternalLink,
  Bell,
  BarChart3,
  Newspaper,
  Info,
  Award,
  ChevronRight,
  CreditCard,
  Globe,
  Smartphone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { JobFormDialog } from "@/components/job-form-dialog";
import { JobDescriptionDisplay } from "@/components/store/JobDescriptionDisplay";
import { SalaryDisplay } from "@/components/store/SalaryDisplay";
import { LocationDisplay } from "@/components/store/LocationDisplay";
import { ContactDisplay } from "@/components/store/ContactDisplay";
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
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>店舗プロフィール</CardTitle>
                      <CardDescription>
                        店舗の基本情報を管理できます
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      {profile && (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={profile.status === "published"}
                            disabled={isUpdatingStatus}
                            onCheckedChange={(checked) => 
                              updateStatusMutation.mutate(checked ? "published" : "draft")
                            }
                          />
                          <span className="text-sm font-medium">
                            {profile?.status === "published" ? "公開中" : "非公開"}
                          </span>
                        </div>
                      )}
                      <Button onClick={() => setShowProfileForm(true)} variant="outline" size="sm">
                        <FileEdit className="h-4 w-4 mr-2" />
                        編集
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {!profile ? (
                      <div className="text-center py-10">
                        <div className="bg-muted p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <Building2 className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">店舗情報が未設定です</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          店舗情報を設定して、求職者に魅力的な情報を提供しましょう。
                        </p>
                        <Button onClick={() => setShowProfileForm(true)} size="lg">
                          <Plus className="h-4 w-4 mr-2" />
                          店舗情報を設定する
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {/* 店舗基本情報 */}
                        <div className="py-6 px-1">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* 左側: 店舗画像 */}
                            <div>
                              {profile.top_image ? (
                                <div className="aspect-square rounded-lg overflow-hidden border">
                                  <ThumbnailImage
                                    src={profile.top_image}
                                    alt={profile.business_name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-square flex items-center justify-center bg-muted rounded-lg border">
                                  <Building2 className="h-16 w-16 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            
                            {/* 中央と右側: プロフィール情報 */}
                            <div className="md:col-span-2 space-y-6">
                              {/* 店舗名とステータス */}
                              <div>
                                <div className="flex items-center gap-3 mb-3">
                                  <h2 className="text-2xl font-bold">{profile.business_name}</h2>
                                  <Badge variant="outline" className="mt-0.5">
                                    {profile.service_type}
                                  </Badge>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1.5" />
                                    <span>{profile.location}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* キャッチコピー */}
                              {profile.catch_phrase && (
                                <div className="bg-muted p-4 rounded-md border">
                                  <p className="italic text-base">
                                    「{profile.catch_phrase}」
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* 重要事項: 日給・勤務時間・待遇 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 px-1">
                          {/* 日給 */}
                          <div>
                            <h3 className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                              <Banknote className="h-4 w-4 mr-1.5 text-green-500" />
                              日給
                            </h3>
                            <div className="text-lg font-bold">
                              {/* 最低・最高給与の表示 */}
                              {profile.minimum_guarantee && profile.maximum_guarantee 
                                ? `${profile.minimum_guarantee.toLocaleString()}円〜${profile.maximum_guarantee.toLocaleString()}円`
                                : profile.minimum_guarantee 
                                  ? `${profile.minimum_guarantee.toLocaleString()}円〜`
                                  : profile.maximum_guarantee 
                                    ? `〜${profile.maximum_guarantee.toLocaleString()}円` 
                                    : "要相談"}
                            </div>
                            
                            {/* 時給換算の表示 - 入力フォームに合わせた形式 */}
                            {(profile.working_time_hours && profile.average_hourly_pay) && (
                              <div className="mt-2 py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm">
                                {profile.working_time_hours}時間勤務で平均給与{profile.average_hourly_pay.toLocaleString()}円
                              </div>
                            )}
                            {/* 従来の時給換算表示（時間と平均給与入力がない場合のフォールバック） */}
                            {(!profile.average_hourly_pay && profile.working_time_hours && profile.minimum_guarantee) && (
                              <div className="text-xs text-muted-foreground mt-1">
                                時給換算: 約{Math.round(profile.minimum_guarantee / profile.working_time_hours).toLocaleString()}円
                              </div>
                            )}
                          </div>
                          
                          {/* 勤務時間 */}
                          <div>
                            <h3 className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                              <Clock className="h-4 w-4 mr-1.5 text-blue-500" />
                              勤務時間
                            </h3>
                            <div className="text-base">
                              {profile.working_hours || <span className="text-muted-foreground italic">未設定</span>}
                            </div>
                          </div>
                          
                          {/* 待遇 */}
                          <div>
                            <h3 className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                              <Award className="h-4 w-4 mr-1.5 text-purple-500" />
                              待遇
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                              {profile.transportation_support && (
                                <Badge variant="secondary" className="font-normal">
                                  <Car className="h-3 w-3 mr-1" />交通費サポート
                                </Badge>
                              )}
                              {profile.housing_support && (
                                <Badge variant="secondary" className="font-normal">
                                  <Home className="h-3 w-3 mr-1" />寮完備
                                </Badge>
                              )}
                              {profile.benefits && profile.benefits.length > 0 && profile.benefits.map((benefit, index) => (
                                <Badge key={index} variant="secondary" className="font-normal">
                                  {benefit}
                                </Badge>
                              ))}
                              {!profile.transportation_support && !profile.housing_support && (!profile.benefits || profile.benefits.length === 0) && (
                                <span className="text-sm text-muted-foreground italic">未設定</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* 仕事内容 */}
                        <div className="py-6 px-1">
                          <h3 className="text-base font-medium mb-4 flex items-center">
                            <Briefcase className="h-4 w-4 mr-1.5 text-primary" />
                            仕事内容
                          </h3>
                          
                          <div className="prose prose-sm max-w-none">
                            <HtmlContent html={profile.description} />
                          </div>
                        </div>
                        
                        {/* 応募資格・条件 */}
                        {(profile.requirements || profile.application_requirements) && (
                          <div className="py-6 px-1">
                            <h3 className="text-base font-medium mb-4 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1.5 text-amber-500" />
                              応募資格・条件
                            </h3>
                            
                            <div className="space-y-4">
                              {profile.requirements && (
                                <div className="px-4 py-3 bg-muted rounded-md">
                                  <h4 className="text-sm font-medium mb-1.5">基本応募条件</h4>
                                  <p className="text-sm whitespace-pre-line">{profile.requirements}</p>
                                </div>
                              )}
                              
                              {profile.application_requirements && (
                                <div className="px-4 py-3 bg-muted rounded-md">
                                  <h4 className="text-sm font-medium mb-1.5">詳細応募資格</h4>
                                  <p className="text-sm whitespace-pre-line">{profile.application_requirements}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* アクセス・所在地 */}
                        {(profile.address || profile.access_info) && (
                          <div className="py-6 px-1">
                            <h3 className="text-base font-medium mb-4 flex items-center">
                              <MapPin className="h-4 w-4 mr-1.5 text-blue-500" />
                              アクセス・所在地
                            </h3>
                            
                            <div className="space-y-4">
                              {profile.address && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                  <div className="text-sm font-medium min-w-24">所在地</div>
                                  <div>{profile.address}</div>
                                </div>
                              )}
                              
                              {profile.access_info && (
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                                  <div className="text-sm font-medium min-w-24">アクセス方法</div>
                                  <div className="text-sm whitespace-pre-line">{profile.access_info}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* セキュリティ対策 */}
                        {profile.security_measures && (
                          <div className="py-6 px-1">
                            <h3 className="text-base font-medium mb-4 flex items-center">
                              <Shield className="h-4 w-4 mr-1.5 text-green-500" />
                              セキュリティ対策
                            </h3>
                            
                            <div className="px-4 py-3 bg-muted rounded-md">
                              <p className="text-sm whitespace-pre-line">{profile.security_measures}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* 連絡先情報 */}
                        {(profile.recruiter_name || (profile.phone_numbers && profile.phone_numbers.length > 0) || 
                          (profile.email_addresses && profile.email_addresses.length > 0) || 
                          profile.pc_website_url || profile.mobile_website_url) && (
                          <div className="py-6 px-1">
                            <h3 className="text-base font-medium mb-4 flex items-center">
                              <Phone className="h-4 w-4 mr-1.5 text-rose-500" />
                              連絡先情報
                            </h3>
                            
                            <div className="space-y-3">
                              {/* 採用担当者 */}
                              {profile.recruiter_name && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                  <div className="text-sm font-medium min-w-24">採用担当者</div>
                                  <div>{profile.recruiter_name}</div>
                                </div>
                              )}
                              
                              {/* 電話番号 */}
                              {profile.phone_numbers && profile.phone_numbers.length > 0 && (
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                                  <div className="text-sm font-medium min-w-24">電話番号</div>
                                  <div className="space-y-1">
                                    {profile.phone_numbers.map((phone, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-green-500" />
                                        <a href={`tel:${phone.replace(/[-\s]/g, '')}`} className="hover:underline">
                                          {phone}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* メールアドレス */}
                              {profile.email_addresses && profile.email_addresses.length > 0 && (
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                                  <div className="text-sm font-medium min-w-24">メールアドレス</div>
                                  <div className="space-y-1">
                                    {profile.email_addresses.map((email, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                                        <a href={`mailto:${email}`} className="hover:underline">
                                          {email}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Webサイト */}
                              {(profile.pc_website_url || profile.mobile_website_url) && (
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                                  <div className="text-sm font-medium min-w-24">Webサイト</div>
                                  <div className="space-y-1">
                                    {profile.pc_website_url && (
                                      <div className="flex items-center gap-2">
                                        <Globe className="h-3.5 w-3.5 text-indigo-500" />
                                        <a href={profile.pc_website_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                          公式サイト
                                        </a>
                                      </div>
                                    )}
                                    {profile.mobile_website_url && (
                                      <div className="flex items-center gap-2">
                                        <Smartphone className="h-3.5 w-3.5 text-purple-500" />
                                        <a href={profile.mobile_website_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                          モバイルサイト
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* 編集ボタン */}
                        <div className="py-6 px-1 flex justify-center">
                          <Button onClick={() => setShowProfileForm(true)} size="lg">
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