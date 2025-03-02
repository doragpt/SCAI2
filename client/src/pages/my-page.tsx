import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Settings, Camera, FileText, Calendar, UserIcon, Heart, Clock, Menu, Search } from "lucide-react";
import { Redirect } from "wouter";
import {
  type TalentProfile,
  type Application,
  type ViewHistory,
  type KeepList
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card } from "@/components/ui/card";


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
      {/* 固定ヘッダー */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">マイページ</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="pt-16 pb-16">
        <div className="container mx-auto px-4 py-6">
          {/* クイックアクセスメニュー */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Button asChild variant="outline" className="h-24 flex flex-col items-center justify-center">
              <a href="/talent/profile/edit">
                <UserIcon className="h-6 w-6 mb-2" />
                <span>基本情報</span>
              </a>
            </Button>
            <Button asChild variant="outline" className="h-24 flex flex-col items-center justify-center">
              <a href="/talent/resume/edit">
                <FileText className="h-6 w-6 mb-2" />
                <span>WEB履歴書</span>
              </a>
            </Button>
          </div>

          {/* メインメニュー -  Here we integrate the original application, keeplist and view history sections */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">各種履歴</h2>
            <div className="space-y-4">
              {/* Applications */}
              <h3 className="text-lg font-medium">応募履歴</h3>
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

              {/* KeepList */}
              <h3 className="text-lg font-medium mt-6">キープリスト</h3>
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

              {/* ViewHistory */}
              <h3 className="text-lg font-medium mt-6">閲覧履歴</h3>
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
          </div>
        </div>
      </main>

      {/* 固定フッターナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="container mx-auto">
          <div className="grid grid-cols-4 gap-1">
            <Button variant="ghost" className="flex flex-col items-center py-2 h-16">
              <Search className="h-5 w-5 mb-1" />
              <span className="text-xs">お仕事検索</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center py-2 h-16">
              <Heart className="h-5 w-5 mb-1" />
              <span className="text-xs">キープ</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center py-2 h-16">
              <Clock className="h-5 w-5 mb-1" />
              <span className="text-xs">閲覧履歴</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center py-2 h-16">
              <Menu className="h-5 w-5 mb-1" />
              <span className="text-xs">メニュー</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}