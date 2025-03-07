import { useQuery } from "@tanstack/react-query";
import { TalentProfile } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { StoreApplicationView } from "@/components/store-application-view";
import { Loader2, LogOut, MessageCircle, Users, BarChart } from "lucide-react";

export default function StoreDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: profiles, isLoading: profilesLoading } = useQuery<TalentProfile[]>({
    queryKey: ["/api/talent/profiles"],
  });

  if (profilesLoading) {
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
                最終更新: {new Date().toLocaleDateString()}
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
          <Tabs defaultValue="applications">
            <TabsList className="w-full">
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
                            {new Date().toLocaleDateString()}
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
    </div>
  );
}