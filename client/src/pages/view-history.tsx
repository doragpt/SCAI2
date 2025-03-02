import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Menu } from "lucide-react";
import { Redirect, Link } from "wouter";
import { type ViewHistory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { FooterNavigation } from "@/components/footer-navigation";
import { MobileMenu } from "@/components/mobile-menu";
import { useState } from "react";

export default function ViewHistoryPage() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: viewHistory, isLoading } = useQuery<ViewHistory[]>({
    queryKey: ["/api/view-history"],
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isLoading) {
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
          <h1 className="text-xl font-bold">閲覧履歴</h1>
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
      </main>

      {/* フッターナビゲーション */}
      <FooterNavigation onMenuClick={() => setIsMenuOpen(true)} />
    </div>
  );
}
