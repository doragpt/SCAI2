import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type StoreProfile } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
  Pencil
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

// プロフィールのステータスラベル
const profileStatusLabels = {
  draft: "未公開",
  published: "公開中"
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

export default function StoreDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState("profile");

  // 店舗プロフィール情報の取得
  const { data: profile, isLoading: profileLoading } = useQuery<StoreProfile>({
    queryKey: [QUERY_KEYS.STORE_PROFILE],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/store/profile");
      if (!response.ok) {
        throw new Error("店舗情報の取得に失敗しました");
      }
      return response.json();
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
      const response = await apiRequest("GET", QUERY_KEYS.STORE_STATS);
      if (!response.ok) {
        throw new Error("統計情報の取得に失敗しました");
      }
      return response.json();
    },
    staleTime: 300000, // 5分
    enabled: !!user?.id && user?.role === "store",
    retry: 2,
    retryDelay: 1000,
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
      {/* ヘッダー */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{user?.display_name}</h1>
              <p className="text-sm text-muted-foreground">
                最終更新: {format(new Date(), "yyyy年MM月dd日 HH:mm", { locale: ja })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => window.open('/store/settings', '_blank')}>
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span className="ml-2">ログアウト</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* メインコンテンツ */}
          <div className="col-span-12 lg:col-span-8">
            {/* 応募者対応状況カード */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  応募者対応状況
                </CardTitle>
                <CardDescription>
                  問い合わせと対応状況
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      {stats?.newInquiriesCount || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      新規問い合わせ
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-sm font-medium">対応待ち</div>
                      <div className="text-2xl font-semibold text-yellow-600">
                        {stats?.pendingInquiriesCount || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">対応済み</div>
                      <div className="text-2xl font-semibold text-green-600">
                        {stats?.completedInquiriesCount || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-4 h-auto">
                <TabsTrigger value="profile" className="py-2">
                  <Building2 className="h-4 w-4 mr-2" />
                  店舗情報
                </TabsTrigger>
                <TabsTrigger value="applications" className="py-2">
                  <Users className="h-4 w-4 mr-2" />
                  応募一覧
                </TabsTrigger>
                <TabsTrigger value="blog" className="py-2">
                  <Pencil className="h-4 w-4 mr-2" />
                  ブログ管理
                </TabsTrigger>
                <TabsTrigger value="freeSpace" className="py-2">
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
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">基本情報</h3>
                          <div className="grid gap-4">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">店舗名</span>
                              <span className="font-medium">{profile.business_name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">所在地</span>
                              <span className="font-medium">{profile.location}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">業種</span>
                              <span className="font-medium">{profile.service_type}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">公開状態</span>
                              <Badge variant={profile.status === "published" ? "default" : "secondary"}>
                                {profileStatusLabels[profile.status]}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">キャッチコピー</h3>
                          <p className="whitespace-pre-wrap">{profile.catch_phrase}</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">店舗紹介</h3>
                          <p className="whitespace-pre-wrap">{profile.description}</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">給与</h3>
                          <div className="text-xl font-bold">
                            {profile.minimum_guarantee ? `${profile.minimum_guarantee.toLocaleString()}円` : ""}
                            {profile.maximum_guarantee ? ` ～ ${profile.maximum_guarantee.toLocaleString()}円` : ""}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">待遇・福利厚生</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {profile.benefits?.map((benefit) => (
                              <div key={benefit} className="flex items-center gap-2 text-sm">
                                <span>・{benefit}</span>
                              </div>
                            ))}
                          </div>
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
                    <Button onClick={() => setLocation('/store/blog/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      新規作成
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        まだブログ記事がありません
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setLocation('/store/blog/new')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        記事を作成する
                      </Button>
                    </div>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  店舗情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">店舗名</p>
                    <p className="text-sm text-muted-foreground">{user?.display_name || "未設定"}</p>
                  </div>
                  <div>
                    <p className="font-medium">所在地</p>
                    <p className="text-sm text-muted-foreground">{profile?.location || "未設定"}</p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => window.open('/store/settings', '_blank')}>
                    <Settings className="h-4 w-4 mr-2" />
                    店舗情報を編集
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* アクセス状況 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  アクセス状況
                </CardTitle>
                <CardDescription>
                  店舗ページへのアクセス数
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">本日のアクセス</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {stats?.todayPageViews || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">総アクセス</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {stats?.todayUniqueVisitors || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">ユニーク</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">今月のアクセス</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {stats?.monthlyPageViews || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">総アクセス</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {stats?.monthlyUniqueVisitors || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">ユニーク</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 掲載状況 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  掲載状況
                </CardTitle>
                <CardDescription>
                  現在の掲載プランと表示状況
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Badge variant={stats?.storePlan === 'premium' ? 'default' : 'secondary'}>
                      {planLabels[stats?.storePlan || 'free']}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">掲載エリア</span>
                      <span className="font-medium">{stats?.storeArea || '未設定'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">表示順位</span>
                      <span className="font-medium">{stats?.displayRank || '-'}位</span>
                    </div>
                  </div>
                </div>
              </CardContent>
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