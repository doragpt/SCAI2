import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UserIcon, Settings, MessageCircle } from "lucide-react";
import { Redirect, Link } from "wouter";
import {
  type TalentProfile,
  type Application
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyPage() {
  const { user } = useAuth();

  const { data: profile, isLoading: isLoadingProfile } = useQuery<TalentProfile>({
    queryKey: ["/api/talent/profile"],
  });

  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isLoadingProfile || isLoadingApplications) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">マイページ</h1>
          <p className="text-muted-foreground">
            アカウント設定と申請履歴の確認
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
          <TabsTrigger value="applications">申請履歴</TabsTrigger>
          <TabsTrigger value="settings">アカウント設定</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>プロフィール情報の確認と編集</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button asChild variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Link href="/talent/register">
                    <UserIcon className="h-6 w-6 mb-2" />
                    <span>基本情報編集</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Link href="/talent/register">
                    <MessageCircle className="h-6 w-6 mb-2" />
                    <span>WEB履歴書編集</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>申請履歴</CardTitle>
              <CardDescription>これまでの申請状況を確認できます</CardDescription>
            </CardHeader>
            <CardContent>
              {applications?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  申請履歴はありません
                </div>
              ) : (
                <div className="space-y-4">
                  {applications?.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Store ID: {application.storeId}</p>
                            <p className="text-sm text-muted-foreground">
                              申請日: {format(new Date(application.appliedAt), 'yyyy年MM月dd日', { locale: ja })}
                            </p>
                          </div>
                          <div className="text-sm">
                            ステータス:{" "}
                            <span className={
                              application.status === "accepted" ? "text-green-600" :
                              application.status === "rejected" ? "text-red-600" :
                              application.status === "withdrawn" ? "text-gray-600" :
                              "text-yellow-600"
                            }>
                              {
                                {
                                  pending: "審査中",
                                  accepted: "承認済み",
                                  rejected: "不採用",
                                  withdrawn: "取り下げ"
                                }[application.status]
                              }
                            </span>
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

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>アカウント設定</CardTitle>
              <CardDescription>アカウントの基本設定と通知設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  通知設定
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive">
                  退会手続き
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}