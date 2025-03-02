import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Menu } from "lucide-react";
import { Redirect, Link } from "wouter";
import { type KeepList } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { FooterNavigation } from "@/components/footer-navigation";
import { MobileMenu } from "@/components/mobile-menu";
import { useState } from "react";

export default function KeepListPage() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: keepList, isLoading } = useQuery<KeepList[]>({
    queryKey: ["/api/keep-list"],
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
          <h1 className="text-xl font-bold">キープリスト</h1>
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
      </main>

      {/* フッターナビゲーション */}
      <FooterNavigation onMenuClick={() => setIsMenuOpen(true)} />
    </div>
  );
}
