import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Settings, Camera, FileText, Calendar } from "lucide-react";
import { Redirect } from "wouter";
import {
  TalentProfile,
  Application,
  ViewHistory,
  KeepList,
  type User
} from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function MyPage() {
  const { user } = useAuth();

  const { data: profile, isLoading: isLoadingProfile } = useQuery<TalentProfile>({
    queryKey: ["/api/talent/profile"],
  });

  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: keepList, isLoading: isLoadingKeepList } = useQuery<KeepList[]>({
    queryKey: ["/api/keep-list"],
  });

  const { data: viewHistory, isLoading: isLoadingViewHistory } = useQuery<ViewHistory[]>({
    queryKey: ["/api/view-history"],
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isLoadingProfile || isLoadingApplications || isLoadingKeepList || isLoadingViewHistory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダーセクション */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden">
                {profile?.photoUrls?.[0] ? (
                  <img
                    src={profile.photoUrls[0]}
                    alt="プロフィール写真"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
                asChild
              >
                <a href="/talent/profile/edit">
                  <Settings className="h-4 w-4 mr-1" />
                  編集
                </a>
              </Button>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">{user.displayName}</h1>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/talent/profile/edit">
                      <FileText className="h-4 w-4 mr-1" />
                      基本情報編集
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/talent/resume/edit">
                      <Calendar className="h-4 w-4 mr-1" />
                      WEB履歴書
                    </a>
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p>身長: {profile?.height}cm</p>
                  <p>体重: {profile?.weight}kg</p>
                  <p>スリーサイズ: B{profile?.bust} W{profile?.waist} H{profile?.hip}</p>
                </div>
                <div className="space-y-1">
                  <p>カップ: {profile?.cupSize}カップ</p>
                  <p>体型: {profile?.bodyType}</p>
                  <p>在住: {user.location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="applications">応募履歴</TabsTrigger>
            <TabsTrigger value="keepList">キープリスト</TabsTrigger>
            <TabsTrigger value="viewHistory">閲覧履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">応募履歴</h2>
              {applications?.length === 0 ? (
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">応募履歴はありません</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {applications?.map((application) => (
                    <Card key={application.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Store ID: {application.storeId}</p>
                          <p className="text-sm text-muted-foreground">
                            応募日: {format(new Date(application.appliedAt), 'yyyy年MM月dd日', { locale: ja })}
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
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="keepList">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">キープリスト</h2>
              {keepList?.length === 0 ? (
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">キープリストは空です</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {keepList?.map((item) => (
                    <Card key={item.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Store ID: {item.storeId}</p>
                          <p className="text-sm text-muted-foreground">
                            追加日: {format(new Date(item.addedAt), 'yyyy年MM月dd日', { locale: ja })}
                          </p>
                        </div>
                      </div>
                      {item.note && (
                        <p className="mt-2 text-sm">{item.note}</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="viewHistory">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">閲覧履歴</h2>
              {viewHistory?.length === 0 ? (
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">閲覧履歴はありません</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {viewHistory?.map((item) => (
                    <Card key={item.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Store ID: {item.storeId}</p>
                          <p className="text-sm text-muted-foreground">
                            閲覧日時: {format(new Date(item.viewedAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}