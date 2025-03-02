import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, Heart, History, MessageCircle, User } from "lucide-react";
import { Link } from "wouter";

export default function TalentDashboard() {
  const { user, logoutMutation } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="l-mypageHeader">
        <p className="mypage-ttl">ー マイページ ー</p>
        <p className="note-txt">※cookieを削除、シークレットモードで閲覧、応募をしても履歴が残らないのでご注意ください</p>
      </div>

      <div className="container mx-auto px-4 py-8 grid grid-cols-12 gap-6">
        {/* サイドメニュー */}
        <div className="col-span-3">
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/talent/dashboard">
                マイページTOPへ
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/">
                SCAI TOPへ
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Heart className="h-4 w-4" />
              キープリスト
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <History className="h-4 w-4" />
              閲覧履歴
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <MessageCircle className="h-4 w-4" />
              応募・質問履歴
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <User className="h-4 w-4" />
              アカウント設定
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              ログアウト
            </Button>
          </nav>
        </div>

        {/* メインコンテンツ */}
        <div className="col-span-9 space-y-6">
          {/* お知らせ */}
          <Card>
            <CardHeader>
              <CardTitle>お知らせ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-medium">【重要】システムメンテナンスのお知らせ</p>
                  <p className="text-sm text-muted-foreground">2024/03/15</p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-medium">【お知らせ】新機能追加のお知らせ</p>
                  <p className="text-sm text-muted-foreground">2024/03/10</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* キープリスト */}
          <Card>
            <CardHeader>
              <CardTitle>キープリスト</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">キープした求人はありません</p>
            </CardContent>
          </Card>

          {/* 閲覧履歴 */}
          <Card>
            <CardHeader>
              <CardTitle>閲覧履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">最近閲覧した求人はありません</p>
            </CardContent>
          </Card>

          {/* 応募・質問履歴 */}
          <Card>
            <CardHeader>
              <CardTitle>応募・質問履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">まだ応募・質問していません</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
