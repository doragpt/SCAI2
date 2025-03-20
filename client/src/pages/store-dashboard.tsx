import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Job, type JobListingResponse, type BlogPost, type BlogPostListResponse } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  PenBox,
  FileEdit,
  Eye,
  Settings,
  Users,
  BarChart,
  Plus,
  Clock,
  Calendar,
  LineChart,
  MessageCircle,
  LogOut,
  Loader2,
  HelpCircle,
  Trash,
  MoreVertical,
  AlertCircle,
  Pencil // 追加
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


// 求人ステータスのラベル
const jobStatusLabels = {
  draft: "下書き",
  published: "公開中",
  closed: "締切"
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

export default function StoreDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("jobs");

  // 統計情報を取得
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [QUERY_KEYS.STORE_STATS], // クエリキーを修正
    queryFn: () => apiRequest("GET", QUERY_KEYS.STORE_STATS), // クエリキーを修正
    staleTime: 300000, // 5分
  });

  // 求人情報の取得
  const { data: jobListings, isLoading: jobsLoading } = useQuery<JobListingResponse>({
    queryKey: [QUERY_KEYS.JOBS_STORE],
    queryFn: () => apiRequest("GET", "/api/jobs/store"),
    enabled: !!user?.id && user?.role === "store",
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error("Store jobs fetch error:", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "求人情報の取得に失敗しました",
      });
    },
  });


  // ブログ投稿の取得
  const { data: blogListings, isLoading: blogsLoading } = useQuery<BlogPostListResponse>({
    queryKey: [QUERY_KEYS.BLOG_POSTS],
    queryFn: () => apiRequest("GET", "/api/blog/posts"),
    enabled: !!user?.id && user?.role === "store",
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error("Blog posts fetch error:", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "ブログ記事の取得に失敗しました",
      });
    },
  });

  // 記事の削除Mutation
  const deleteMutation = useMutation({
    mutationFn: (postId: number) =>
      apiRequest("DELETE", `/api/blog/posts/${postId}`),
    onSuccess: () => {
      toast({
        title: "記事を削除しました",
      });
      // ブログ一覧を更新
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "記事の削除に失敗しました",
      });
    },
  });

  // 記事のステータス更新Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ postId, status }: { postId: number; status: string }) =>
      apiRequest("PATCH", `/api/blog/posts/${postId}/status`, { status }),
    onSuccess: () => {
      toast({
        title: "記事のステータスを更新しました",
      });
      // ブログ一覧を更新
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "ステータスの更新に失敗しました",
      });
    },
  });

  if (statsLoading || jobsLoading || blogsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <h1 className="text-2xl font-bold">{user?.displayName || user?.username}</h1>
              <p className="text-sm text-muted-foreground">
                最終更新: {format(new Date(), "yyyy年MM月dd日 HH:mm", { locale: ja })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setLocation('/store/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                店舗設定
              </Button>
              <Button
                variant="outline"
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

      <div className="container mx-auto px-4 py-8">
        {/* ダッシュボード概要 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">新規応募</p>
                  <p className="text-2xl font-bold">{stats?.newApplications || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">今日のPV</p>
                  <p className="text-2xl font-bold">{stats?.todayPageViews || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">未対応メッセージ</p>
                  <p className="text-2xl font-bold">{stats?.unreadMessages || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* メインコンテンツ */}
          <div className="col-span-12 lg:col-span-8">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-4 h-auto">
                <TabsTrigger value="jobs" className="py-2">
                  <FileEdit className="h-4 w-4 mr-2" />
                  求人管理
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
                <TabsTrigger value="qa" className="py-2">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Q&A管理
                </TabsTrigger>
              </TabsList>

              {/* 求人管理タブ */}
              <TabsContent value="jobs">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>求人一覧</CardTitle>
                      <CardDescription>
                        掲載中の求人情報を管理できます
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowJobForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      新規作成
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!jobListings?.jobs?.length ? (
                      <div className="text-center py-8">
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <FileEdit className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-muted-foreground">
                          求人情報がありません
                        </p>
                        <Button variant="outline" className="mt-4" onClick={() => setShowJobForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          求人を作成する
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {jobListings.jobs.map((job) => (
                          <Card key={job.id} className="hover:bg-accent/5 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{job.title}</h3>
                                    <Badge variant={
                                      job.status === "published" ? "default" :
                                        job.status === "draft" ? "secondary" : "destructive"
                                    }>
                                      {jobStatusLabels[job.status]}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {job.createdAt ? format(new Date(job.createdAt), "yyyy年MM月dd日", { locale: ja }) : "-"}
                                    </span>
                                    <span>•</span>
                                    <Clock className="h-4 w-4" />
                                    <span>最終更新: {format(new Date(job.updatedAt), "HH:mm", { locale: ja })}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => window.open(`/jobs/${job.id}`, '_blank')}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    プレビュー
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedJobId(job.id);
                                      setShowJobForm(true);
                                    }}
                                  >
                                    <FileEdit className="h-4 w-4 mr-2" />
                                    編集
                                  </Button>
                                </div>
                              </div>
                              <Separator className="my-4" />
                              <div className="grid grid-cols-4 gap-4">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">応募数: </span>
                                  <span className="font-semibold">{job.applicationCount || 0}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">閲覧数: </span>
                                  <span className="font-semibold">{job.viewCount || 0}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">面接設定: </span>
                                  <span className="font-semibold">{job.interviewCount || 0}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">採用数: </span>
                                  <span className="font-semibold">{job.hiredCount || 0}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
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
                    {!blogListings?.posts?.length ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          ブログ記事がありません
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
                    ) : (
                      <div className="space-y-4">
                        {blogListings.posts.map((post) => (
                          <Card key={post.id} className="hover:bg-accent/5 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{post.title}</h3>
                                    <Badge variant={
                                      post.status === "published" ? "default" :
                                        post.status === "scheduled" ? "secondary" : "outline"
                                    }>
                                      {blogStatusLabels[post.status]}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>
                                      {post.publishedAt
                                        ? format(new Date(post.publishedAt), "yyyy年MM月dd日 HH:mm", { locale: ja })
                                        : "未公開"}
                                    </span>
                                    {post.status === "scheduled" && (
                                      <>
                                        <Clock className="h-4 w-4" />
                                        <span>
                                          {format(new Date(post.scheduledAt!), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                                          に公開予定
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => setLocation(`/blog/${post.id}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    プレビュー
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLocation(`/store/blog/edit/${post.id}`)}
                                  >
                                    <FileEdit className="h-4 w-4 mr-2" />
                                    編集
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {post.status !== "published" && (
                                        <DropdownMenuItem
                                          onClick={() => updateStatusMutation.mutate({ postId: post.id, status: "published" })}
                                        >
                                          公開する
                                        </DropdownMenuItem>
                                      )}
                                      {post.status === "published" && (
                                        <DropdownMenuItem
                                          onClick={() => updateStatusMutation.mutate({ postId: post.id, status: "draft" })}
                                        >
                                          非公開にする
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem
                                            onSelect={(e) => e.preventDefault()}
                                            className="text-destructive"
                                          >
                                            <Trash className="h-4 w-4 mr-2" />
                                            削除
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>記事の削除</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              この記事を削除してもよろしいですか？
                                              この操作は取り消せません。
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => deleteMutation.mutate(post.id)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              削除する
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
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

              {/* Q&A管理タブ */}
              <TabsContent value="qa">
                <Card>
                  <CardHeader>
                    <CardTitle>Q&A管理</CardTitle>
                    <CardDescription>
                      よくある質問と回答を管理できます
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Q&Aを編集
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
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  店舗プロフィール
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={stats?.storePlan === 'premium' ? 'default' : 'secondary'}>
                      {planLabels[stats?.storePlan || 'free']}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/store/settings')}>
                      <PenBox className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">店舗名</p>
                    <p className="font-medium">{user?.displayName || user?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">所在地</p>
                    <p className="font-medium">{user?.location || "未設定"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">掲載エリア</p>
                    <p className="font-medium">{stats?.storeArea || "未設定"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* アクセス状況 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  アクセス状況
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">今日のアクセス</p>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-2xl font-bold">{stats?.todayPageViews || 0}</p>
                        <p className="text-xs text-muted-foreground">ページビュー</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats?.todayUniqueVisitors || 0}</p>
                        <p className="text-xs text-muted-foreground">ユニークユーザー</p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">今月のアクセス</p>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-2xl font-bold">{stats?.monthlyPageViews || 0}</p>
                        <p className="text-xs text-muted-foreground">ページビュー</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats?.monthlyUniqueVisitors || 0}</p>
                        <p className="text-xs text-muted-foreground">ユニークユーザー</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 求人フォームダイアログ */}
      <JobFormDialog
        open={showJobForm}
        onOpenChange={setShowJobForm}
        jobId={selectedJobId}
        initialData={selectedJobId ? jobListings?.jobs.find(j => j.id === selectedJobId) : undefined}
      />
    </div>
  );
}