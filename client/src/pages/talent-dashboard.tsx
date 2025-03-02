import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, Heart, History, MessageCircle, UserIcon, Search, Menu } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { MobileMenu } from "@/components/mobile-menu";

export default function TalentDashboard() {
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <Button variant="ghost" size="icon" asChild>
              <Link href="/jobs">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* モバイルメニュー */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* メインコンテンツ */}
      <main className="pt-16 pb-16">
        <div className="container mx-auto px-4 py-6">
          {/* お知らせ */}
          <Card className="mb-6">
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

          {/* クイックアクセスメニュー */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Button asChild variant="outline" className="h-24 flex flex-col items-center justify-center">
              <Link href="/talent/profile/edit">
                <UserIcon className="h-6 w-6 mb-2" />
                <span>基本情報</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex flex-col items-center justify-center">
              <Link href="/talent/resume/edit">
                <MessageCircle className="h-6 w-6 mb-2" />
                <span>WEB履歴書</span>
              </Link>
            </Button>
          </div>

          {/* メインメニュー */}
          <div className="space-y-4">
            <Button asChild variant="ghost" className="w-full justify-start gap-2">
              <Link href="/talent/mypage">
                <UserIcon className="h-5 w-5" />
                <span>マイページ</span>
                <span className="ml-auto text-muted-foreground">→</span>
              </Link>
            </Button>

            <Button asChild variant="ghost" className="w-full justify-start gap-2">
              <Link href="/talent/mypage/applications">
                <MessageCircle className="h-5 w-5" />
                <span>応募履歴</span>
                <span className="ml-auto text-muted-foreground">→</span>
              </Link>
            </Button>

            <Button asChild variant="ghost" className="w-full justify-start gap-2">
              <Link href="/talent/mypage/keep-list">
                <Heart className="h-5 w-5" />
                <span>キープリスト</span>
                <span className="ml-auto text-muted-foreground">→</span>
              </Link>
            </Button>

            <Button asChild variant="ghost" className="w-full justify-start gap-2">
              <Link href="/talent/mypage/view-history">
                <History className="h-5 w-5" />
                <span>閲覧履歴</span>
                <span className="ml-auto text-muted-foreground">→</span>
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* 固定フッターナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="container mx-auto">
          <div className="grid grid-cols-4 gap-1">
            <Button variant="ghost" asChild className="flex flex-col items-center py-2 h-16">
              <Link href="/jobs">
                <Search className="h-5 w-5 mb-1" />
                <span className="text-xs">お仕事検索</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild className="flex flex-col items-center py-2 h-16">
              <Link href="/talent/mypage/keep-list">
                <Heart className="h-5 w-5 mb-1" />
                <span className="text-xs">キープ</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild className="flex flex-col items-center py-2 h-16">
              <Link href="/talent/mypage/view-history">
                <History className="h-5 w-5 mb-1" />
                <span className="text-xs">閲覧履歴</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center py-2 h-16"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="h-5 w-5 mb-1" />
              <span className="text-xs">メニュー</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}