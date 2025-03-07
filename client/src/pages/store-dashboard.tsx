import { useQuery } from "@tanstack/react-query";
import { TalentProfile, Job, RecruitmentCriteria } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { StoreApplicationView } from "@/components/store-application-view";
import {
  Loader2, LogOut, MessageCircle, Users, BarChart,
  PlusCircle, Settings2, Building2, Clock, CreditCard,
  Users2, ChevronRight, TrendingUp, BookOpen
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { JobPostingDialog } from "@/components/job-posting-dialog";

const StatCard = ({ title, value, icon: Icon, description }: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function StoreDashboard() {
  const { user, logoutMutation } = useAuth();
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);

  const { data: profiles, isLoading: profilesLoading } = useQuery<TalentProfile[]>({
    queryKey: ["/api/talent/profiles"],
  });

  const { data: jobListings, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  if (profilesLoading || jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeJobsCount = jobListings?.filter(job => job.status === 'active').length || 0;
  const totalApplications = 156; // TODO: Replace with actual data
  const interviewsScheduled = 42; // TODO: Replace with actual data
  const hiringRate = "18%"; // TODO: Calculate from actual data

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
              <CardTitle>概要</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  className="w-full flex items-center justify-between"
                  variant="outline"
                  onClick={() => setIsJobDialogOpen(true)}
                >
                  <div className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    <span>新規求人作成</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">有効な求人</span>
                    <span className="font-bold text-primary">{activeJobsCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">本日の応募</span>
                    <span className="font-bold">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">未読メッセージ</span>
                    <span className="font-bold text-primary">12</span>
                  </div>
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
                  <p className="font-medium">新機能のお知らせ</p>
                  <p className="text-sm text-muted-foreground">
                    AIマッチング機能がリリースされました
                  </p>
                  <p className="text-sm text-muted-foreground">2024/03/15</p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-medium">メンテナンスのお知らせ</p>
                  <p className="text-sm text-muted-foreground">
                    3/20に定期メンテナンスを実施します
                  </p>
                  <p className="text-sm text-muted-foreground">2024/03/10</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* メインコンテンツ */}
        <div className="col-span-9">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              title="有効求人数"
              value={activeJobsCount}
              icon={Building2}
              description="現在掲載中の求人"
            />
            <StatCard
              title="総応募数"
              value={totalApplications}
              icon={Users2}
              description="累計応募件数"
            />
            <StatCard
              title="面接設定数"
              value={interviewsScheduled}
              icon={Clock}
              description="予定された面接"
            />
            <StatCard
              title="採用率"
              value={hiringRate}
              icon={TrendingUp}
              description="応募から採用までの比率"
            />
          </div>

          <Tabs defaultValue="applications" className="space-y-4">
            <TabsList className="grid grid-cols-4 gap-4">
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                応募一覧
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                メッセージ
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                分析
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                設定
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
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="border-b pb-4 last:border-0"
                      >
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
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>応募傾向</CardTitle>
                          <CardDescription>
                            過去30日間の応募状況
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="h-[200px] flex items-center justify-center">
                            {/* TODO: Add chart component */}
                            <p className="text-muted-foreground">グラフを表示予定</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>応募者属性</CardTitle>
                          <CardDescription>
                            応募者の年齢層分布
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="h-[200px] flex items-center justify-center">
                            {/* TODO: Add chart component */}
                            <p className="text-muted-foreground">グラフを表示予定</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">店舗情報設定</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">基本情報</h4>
                            <Button variant="outline" className="w-full">
                              編集する
                            </Button>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">採用基準設定</h4>
                            <Button variant="outline" className="w-full">
                              編集する
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
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
      <JobPostingDialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen} />
    </div>
  );
}