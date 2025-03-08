import { useQuery } from "@tanstack/react-query";
import { TalentProfile } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { StoreApplicationView } from "@/components/store-application-view";
import { 
  Loader2, 
  LogOut, 
  MessageCircle, 
  Users, 
  BarChart,
  Plus,
  FileEdit,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { QUERY_KEYS } from "@/lib/queryClient";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { JobFormDialog } from "@/components/job-form-dialog";

// 求人ステータスのラベル
const jobStatusLabels = {
  draft: "下書き",
  published: "公開中",
  closed: "締切"
} as const;

export default function StoreDashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedTab, setSelectedTab] = useState("jobs");
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // 求人情報の取得
  const { data: jobListings, isLoading: jobsLoading } = useQuery({
    queryKey: [QUERY_KEYS.JOBS_STORE],
    queryFn: async () => {
      const response = await fetch("/api/jobs/store");
      if (!response.ok) {
        throw new Error("求人情報の取得に失敗しました");
      }
      return response.json();
    },
    enabled: user?.role === "store"
  });

  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{user?.displayName}</h1>
              <p className="text-sm text-muted-foreground">
                最終更新: {format(new Date(), "yyyy年MM月dd日 HH:mm", { locale: ja })}
              </p>
            </div>
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
      </header>

      <div className="container mx-auto px-4 py-8 grid grid-cols-12 gap-6">
        {/* 左サイドバー */}
        <div className="col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>アクセス状況</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>本日のアクセス</span>
                  <span className="font-bold">123</span>
                </div>
                <div className="flex justify-between">
                  <span>今月のアクセス</span>
                  <span className="font-bold">1,234</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>お知らせ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-medium">システムメンテナンスのお知らせ</p>
                  <p className="text-sm text-muted-foreground">2024/03/15</p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-medium">新機能追加のお知らせ</p>
                  <p className="text-sm text-muted-foreground">2024/03/10</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* メインコンテンツ */}
        <div className="col-span-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="w-full">
              <TabsTrigger value="jobs" className="flex-1">
                <FileEdit className="h-4 w-4 mr-2" />
                求人管理
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex-1">
                <Users className="h-4 w-4 mr-2" />
                応募一覧
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                メッセージ
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1">
                <BarChart className="h-4 w-4 mr-2" />
                分析
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
                  {jobListings?.jobs?.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        求人情報がありません
                      </p>
                      <Button variant="outline" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        求人を作成する
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {jobListings?.jobs?.map((job: any) => (
                        <Card key={job.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold mb-2">{job.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{job.location}</span>
                                  <span>•</span>
                                  <span>
                                    {format(new Date(job.createdAt), "yyyy年MM月dd日", { locale: ja })}
                                  </span>
                                </div>
                              </div>
                              <Badge variant={
                                job.status === "published" ? "default" :
                                job.status === "draft" ? "secondary" : "destructive"
                              }>
                                {jobStatusLabels[job.status as keyof typeof jobStatusLabels]}
                              </Badge>
                            </div>
                            <Separator className="my-4" />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">応募数: </span>
                                  <span className="font-semibold">
                                    {job.applicationCount || 0}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">閲覧数: </span>
                                  <span className="font-semibold">
                                    {job.viewCount || 0}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
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

            <TabsContent value="applications">
              <Card>
                <CardContent className="p-6">
                  <StoreApplicationView />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-b pb-4 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">ユーザー{i}</p>
                            <p className="text-sm text-muted-foreground">
                              仕事内容について質問があります...
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(), "yyyy年MM月dd日", { locale: ja })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">応募総数</p>
                          <p className="text-2xl font-bold">156</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">面接設定数</p>
                          <p className="text-2xl font-bold">42</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">採用数</p>
                          <p className="text-2xl font-bold">28</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 右サイドバー */}
        <div className="col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>店舗情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="font-medium">店舗名</p>
                  <p className="text-sm text-muted-foreground">{user?.displayName}</p>
                </div>
                <div>
                  <p className="font-medium">所在地</p>
                  <p className="text-sm text-muted-foreground">{user?.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  求人情報を編集
                </Button>
                <Button className="w-full" variant="outline">
                  プロフィールを更新
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 求人フォームダイアログ */}
      <JobFormDialog
        open={showJobForm}
        onOpenChange={setShowJobForm}
        jobId={selectedJobId}
        initialData={selectedJobId ? jobListings?.jobs?.find(j => j.id === selectedJobId) : undefined}
      />
    </div>
  );
}