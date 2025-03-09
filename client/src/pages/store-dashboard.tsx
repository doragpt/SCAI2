import { useQuery } from "@tanstack/react-query";
import { type Job, type BlogPost } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { StoreApplicationView } from "@/components/store-application-view";
import { useLocation } from "wouter";
import {
  Loader2,
  LogOut,
  MessageCircle,
  Users,
  BarChart,
  Plus,
  FileEdit,
  AlertCircle,
  Image,
  PenBox,
  HelpCircle,
  Eye,
  Calendar,
  LineChart,
  Settings,
  Pencil,
  Clock,
  MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { JobFormDialog } from "@/components/job-form-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AccessStats } from "@/components/dashboard/access-stats";

// ブログ投稿のステータスラベル更新
const blogStatusLabels = {
  draft: "下書き",
  published: "公開中",
  scheduled: "予約投稿"
} as const;

// ブログステータスに応じたバッジのバリアント
const getBlogStatusVariant = (status: string) => {
  switch (status) {
    case "published":
      return "default";
    case "scheduled":
      return "secondary";
    default:
      return "outline";
  }
};

// 日時フォーマット関数の改善
const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), "yyyy年MM月dd日 HH:mm", { locale: ja });
};

const formatScheduledDateTime = (post: BlogPost) => {
  if (post.status === "scheduled" && post.scheduledAt) {
    return formatDateTime(post.scheduledAt);
  }
  return null;
};

// レスポンス型の定義
interface JobListingResponse {
  jobs: Job[];
}

interface BlogPostListResponse {
  posts: BlogPost[];
}

export default function StoreDashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedTab, setSelectedTab] = useState("jobs");
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // 求人情報の取得
  const { data: jobListings, isLoading: jobsLoading } = useQuery<JobListingResponse>({
    queryKey: [QUERY_KEYS.JOBS_STORE],
    queryFn: () => apiRequest("GET", "/api/jobs/store"),
    enabled: !!user?.id && user?.role === "store",
  });

  // ブログ投稿の取得
  const { data: blogListings, isLoading: blogsLoading } = useQuery<BlogPostListResponse>({
    queryKey: [QUERY_KEYS.BLOG_POSTS_STORE],
    queryFn: () => apiRequest("GET", "/api/blog/posts/store"),
    enabled: !!user?.id && user?.role === "store",
  });

  if (jobsLoading || blogsLoading) {
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
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{user?.displayName || user?.username}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                最終更新: {format(new Date(), "yyyy年MM月dd日 HH:mm", { locale: ja })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setLocation('/store/settings')}>
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
          {/* 左サイドバー - 重要な統計情報 */}
          <div className="col-span-3 space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LineChart className="h-5 w-5 text-primary" />
                  アクセス状況
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AccessStats storeId={user?.id ?? 0} />
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  スケジュール
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/5 transition-colors">
                    <span className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      予約面接
                    </span>
                    <Badge variant="outline" className="bg-primary/5">0件</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/5 transition-colors">
                    <span className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      未対応応募
                    </span>
                    <Badge variant="outline" className="bg-primary/5">0件</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/5 transition-colors">
                    <span className="text-sm flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      未読メッセージ
                    </span>
                    <Badge variant="outline" className="bg-primary/5">0件</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* メインコンテンツ */}
          <div className="col-span-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
              <TabsList className="grid grid-cols-5 h-auto">
                <TabsTrigger value="jobs" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileEdit className="h-4 w-4 mr-2" />
                  求人管理
                </TabsTrigger>
                <TabsTrigger value="applications" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  応募一覧
                </TabsTrigger>
                <TabsTrigger value="blog" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Pencil className="h-4 w-4 mr-2" />
                  ブログ管理
                </TabsTrigger>
                <TabsTrigger value="freeSpace" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <PenBox className="h-4 w-4 mr-2" />
                  フリースペース
                </TabsTrigger>
                <TabsTrigger value="qa" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Q&A管理
                </TabsTrigger>
              </TabsList>

              {/* 求人管理タブ */}
              <TabsContent value="jobs">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>求人一覧</CardTitle>
                      <CardDescription>
                        掲載中の求人情報を管理できます
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowJobForm(true)} className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      新規作成
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!jobListings?.jobs?.length ? (
                      <div className="text-center py-8">
                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-6 w-6" />
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
                          <Card key={job.id} className="hover:shadow-sm transition-all duration-200 group">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold group-hover:text-primary transition-colors">{job.title}</h3>
                                    <Badge variant={
                                      job.status === "published" ? "default" :
                                        job.status === "draft" ? "secondary" : "destructive"
                                    } className="shadow-sm">
                                      {jobStatusLabels[job.status]}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{job.location}</span>
                                    <span>•</span>
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {job.createdAt ? format(new Date(job.createdAt), "yyyy年MM月dd日", { locale: ja }) : "-"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" className="hover:bg-primary/5">
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
                                    className="hover:bg-primary/5"
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
                                  <span className="font-semibold text-primary">-</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">閲覧数: </span>
                                  <span className="font-semibold text-primary">-</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">面接設定: </span>
                                  <span className="font-semibold text-primary">-</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">採用数: </span>
                                  <span className="font-semibold text-primary">-</span>
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
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <StoreApplicationView />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ブログ管理タブ */}
              <TabsContent value="blog">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>ブログ記事一覧</CardTitle>
                      <CardDescription>
                        ブログの投稿・管理ができます
                      </CardDescription>
                    </div>
                    <Button onClick={() => setLocation('/store/blog/new')} className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      新規作成
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!blogListings?.posts?.length ? (
                      <div className="text-center py-8">
                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-6 w-6" />
                        </div>
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
                          <Card key={post.id} className="hover:shadow-sm transition-all duration-200 group">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold group-hover:text-primary transition-colors">{post.title}</h3>
                                    <Badge variant={getBlogStatusVariant(post.status)} className="shadow-sm">
                                      {blogStatusLabels[post.status]}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>
                                      {post.publishedAt
                                        ? formatDateTime(post.publishedAt)
                                        : "未公開"}
                                    </span>
                                    {post.status === "scheduled" && (
                                      <>
                                        <Clock className="h-4 w-4" />
                                        <span>
                                          {formatScheduledDateTime(post)}に公開予定
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => setLocation(`/blog/${post.id}`)} className="hover:bg-primary/5">
                                    <Eye className="h-4 w-4 mr-2" />
                                    プレビュー
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLocation(`/store/blog/edit/${post.id}`)}
                                    className="hover:bg-primary/5"
                                  >
                                    <FileEdit className="h-4 w-4 mr-2" />
                                    編集
                                  </Button>
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
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>フリースペース編集</CardTitle>
                    <CardDescription>
                      店舗紹介や特徴を自由に編集できます
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full hover:bg-primary/5">
                        <PenBox className="h-4 w-4 mr-2" />
                        フリースペースを編集
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Q&A管理タブ */}
              <TabsContent value="qa">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>Q&A管理</CardTitle>
                    <CardDescription>
                      よくある質問と回答を管理できます
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full hover:bg-primary/5">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Q&Aを編集
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 右サイドバー - クイックアクション */}
          <div className="col-span-3 space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Image className="h-5 w-5 text-primary" />
                  画像管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full hover:bg-primary/5">
                    <Image className="h-4 w-4 mr-2" />
                    画像を管理
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">店舗情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-accent/5">
                    <p className="font-medium text-sm text-muted-foreground">店舗名</p>
                    <p className="mt-1">{user?.displayName || user?.username || "未設定"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/5">
                    <p className="font-medium text-sm text-muted-foreground">所在地</p>
                    <p className="mt-1">{user?.location || "未設定"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/5">
                    <p className="font-medium text-sm text-muted-foreground">連絡先</p>
                    <p className="mt-1">{user?.phone || "未設定"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">お知らせ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-primary/5 border-l-4 border-primary">
                    <p className="font-medium">システムメンテナンスのお知らせ</p>
                    <p className="text-sm text-muted-foreground mt-1">2024/03/15</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border-l-4 border-primary">
                    <p className="font-medium">新機能追加のお知らせ</p>
                    <p className="text-sm text-muted-foreground mt-1">2024/03/10</p>
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