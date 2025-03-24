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
  ExternalLink,
  Bell,
  BarChart3,
  Newspaper,
  Award,
  Link,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { JobFormDialog } from "@/components/job-form-dialog";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

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

export default function StoreDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // 店舗プロフィール情報の取得
  const { data: profile, isLoading: profileLoading } = useQuery<StoreProfile>({
    queryKey: [QUERY_KEYS.STORE_PROFILE],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/store/profile");
        console.log('店舗プロフィールAPI応答:', response);
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

  if (profileLoading || statsLoading) {
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
      {/* ヘッダー */}
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
                    {profileStatusLabels[profile?.status as keyof typeof profileStatusLabels || "draft"]}
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
        {/* メイン */}
        <div className="space-y-8">
          {/* 公開設定 */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>公開設定</CardTitle>
                  <CardDescription>
                    店舗情報の公開状態を管理します
                  </CardDescription>
                </div>
                <Button onClick={() => setShowProfileForm(true)}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  編集する
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <div>
                  <h3 className="font-medium">店舗情報公開設定</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.status === "published" ? "現在求人情報を公開中です" : "求人情報は非公開になっています"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={profile?.status === "published"}
                    onCheckedChange={(checked) => {
                      updateStatusMutation.mutate(checked ? "published" : "draft");
                    }}
                    disabled={isUpdatingStatus || updateStatusMutation.isPending}
                  />
                  {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 基本情報 */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-primary" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 店舗画像とプロフィール */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* プロフィールアイコン/TOP画像 */}
                {profile?.top_image ? (
                  <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border shadow-sm">
                    <ThumbnailImage
                      src={profile.top_image}
                      alt={profile.business_name || "店舗画像"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center bg-muted rounded-lg">
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                
                {/* 店舗名と基本情報 */}
                <div className="flex-grow">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold">{profile?.business_name}</h2>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{profile?.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      <span>{profile?.service_type}</span>
                    </div>
                  </div>
                  
                  {profile?.catch_phrase && (
                    <div className="p-3 bg-muted/50 rounded-md border italic">
                      "{profile.catch_phrase}"
                    </div>
                  )}
                </div>
              </div>

              {/* 仕事内容 */}
              <div>
                <h3 className="text-md font-medium mb-3">仕事内容</h3>
                <div className="prose prose-sm max-w-none border rounded-md p-4">
                  {profile?.description ? (
                    <HtmlContent html={profile.description} />
                  ) : (
                    <p className="text-muted-foreground italic text-center py-4">
                      仕事内容が未設定です
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 給与・待遇 */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Banknote className="h-5 w-5 mr-2 text-primary" />
                給与・待遇
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 給与情報 */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
                    <h4 className="text-sm text-muted-foreground mb-1">日給</h4>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {profile?.minimum_guarantee && profile?.maximum_guarantee 
                        ? `${profile.minimum_guarantee.toLocaleString()}円〜${profile.maximum_guarantee.toLocaleString()}円`
                        : profile?.minimum_guarantee 
                          ? `${profile.minimum_guarantee.toLocaleString()}円〜`
                          : profile?.maximum_guarantee 
                            ? `〜${profile.maximum_guarantee.toLocaleString()}円` 
                            : "要相談"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-1">勤務時間</h4>
                    <p className="font-medium">
                      {profile?.working_hours || "未設定"}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-1">平均時給</h4>
                    <p className="font-medium">
                      {(profile?.working_time_hours && profile?.minimum_guarantee) 
                        ? `約${Math.round(profile.minimum_guarantee / profile.working_time_hours).toLocaleString()}円〜` 
                        : "未設定"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-1">平均勤務時間</h4>
                    <p className="font-medium">
                      {profile?.working_time_hours ? `${profile.working_time_hours}時間` : "未設定"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 待遇 */}
              <div>
                <h3 className="text-md font-medium mb-3">待遇</h3>
                <div className="flex flex-wrap gap-2">
                  {profile?.transportation_support && (
                    <Badge variant="secondary" className="px-3 py-1">
                      <Car className="h-3 w-3 mr-1" />
                      交通費サポート
                    </Badge>
                  )}
                  
                  {profile?.housing_support && (
                    <Badge variant="secondary" className="px-3 py-1">
                      <Home className="h-3 w-3 mr-1" />
                      寮完備
                    </Badge>
                  )}
                  
                  {profile?.benefits && profile.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {benefit}
                    </Badge>
                  ))}
                  
                  {!profile?.transportation_support && !profile?.housing_support && 
                    (!profile?.benefits || profile.benefits.length === 0) && (
                    <p className="text-muted-foreground italic">
                      待遇情報が未設定です
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 応募資格 */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                応募資格
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-md font-medium mb-3">基本応募条件</h3>
                <div className="p-4 bg-muted/30 rounded-lg">
                  {profile?.requirements ? (
                    <p className="whitespace-pre-line">{profile.requirements}</p>
                  ) : (
                    <p className="text-muted-foreground italic text-center">
                      基本応募条件が未設定です
                    </p>
                  )}
                </div>
              </div>
              
              {profile?.application_requirements && (
                <div>
                  <h3 className="text-md font-medium mb-3">詳細応募資格</h3>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="whitespace-pre-line">{profile.application_requirements}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* アクセス情報 */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                アクセス情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile?.address && (
                <div>
                  <h3 className="text-md font-medium mb-3">住所</h3>
                  <p>{profile.address}</p>
                </div>
              )}
              
              {profile?.access_info && (
                <div>
                  <h3 className="text-md font-medium mb-3">アクセス方法</h3>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="whitespace-pre-line">{profile.access_info}</p>
                  </div>
                </div>
              )}
              
              {!profile?.address && !profile?.access_info && (
                <p className="text-muted-foreground italic text-center">
                  アクセス情報が未設定です
                </p>
              )}
            </CardContent>
          </Card>

          {/* 安全対策 */}
          {profile?.security_measures && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  安全対策
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="whitespace-pre-line">{profile.security_measures}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 連絡先 */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                連絡先
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile?.recruiter_name && (
                <div>
                  <h3 className="text-md font-medium mb-3">担当者名</h3>
                  <p>{profile.recruiter_name}</p>
                </div>
              )}
              
              {profile?.phone_numbers && profile.phone_numbers.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-3">電話番号</h3>
                  <ul className="space-y-1">
                    {profile.phone_numbers.map((phone, index) => (
                      <li key={index} className="flex items-center">
                        <PhoneCall className="h-4 w-4 mr-2 text-primary/60" />
                        <span>{phone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {profile?.email_addresses && profile.email_addresses.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-3">メールアドレス</h3>
                  <ul className="space-y-1">
                    {profile.email_addresses.map((email, index) => (
                      <li key={index} className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-primary/60" />
                        <span>{email}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {profile?.pc_website_url && (
                <div>
                  <h3 className="text-md font-medium mb-3">ウェブサイト</h3>
                  <p className="flex items-center">
                    <Link className="h-4 w-4 mr-2 text-primary/60" />
                    <a 
                      href={profile.pc_website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profile.pc_website_url}
                    </a>
                  </p>
                </div>
              )}
              
              {!profile?.recruiter_name && 
               (!profile?.phone_numbers || profile.phone_numbers.length === 0) && 
               (!profile?.email_addresses || profile.email_addresses.length === 0) && 
               !profile?.pc_website_url && (
                <p className="text-muted-foreground italic text-center">
                  連絡先情報が未設定です
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* ブログ記事 */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Newspaper className="h-5 w-5 mr-2 text-primary" />
                    ブログ記事
                  </CardTitle>
                  <CardDescription>
                    店舗ブログの管理と投稿を行います
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/store/blog')}
                    className="text-sm"
                  >
                    <FileEdit className="h-4 w-4 mr-2" />
                    詳細管理
                  </Button>
                  <Button 
                    onClick={() => setLocation('/store/blog/new')}
                    className="text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新規作成
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BlogPostsList userId={user?.id} />
            </CardContent>
          </Card>
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

// ブログ投稿一覧コンポーネント
function BlogPostsList({ userId }: { userId?: number }) {
  const [, setLocation] = useLocation();
  const MAX_POSTS_TO_SHOW = 5;

  // ブログ記事の取得
  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.BLOG_POSTS_STORE],
    queryFn: async () => {
      if (!userId) return { posts: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
      
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", MAX_POSTS_TO_SHOW.toString());
      
      try {
        const data = await apiRequest("GET", `${QUERY_KEYS.BLOG_POSTS_STORE}?${params.toString()}`);
        console.log("Blog posts fetch result:", data);
        return data;
      } catch (error) {
        console.error("ブログ記事の取得に失敗しました:", error);
        throw new Error("ブログ記事の取得に失敗しました");
      }
    },
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    retry: 2,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

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
                <CheckCircle className="h-3 w-3 mr-1" />公開中
               </Badge>;
      case "scheduled":
        return <Badge variant="outline" className="border-amber-500 text-amber-500">
                <Clock className="h-3 w-3 mr-1" />予約投稿
               </Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-200">
                <Pencil className="h-3 w-3 mr-1" />下書き
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
        <p className="text-muted-foreground">
          ブログ記事の読み込みに失敗しました
        </p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </div>
    );
  }

  if (!data || !data.posts || data.posts.length === 0) {
    return (
      <div className="py-8 text-center border rounded-md">
        <Newspaper className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">
          まだブログ記事がありません
        </p>
        <Button onClick={() => setLocation('/store/blog/new')}>
          <Plus className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
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