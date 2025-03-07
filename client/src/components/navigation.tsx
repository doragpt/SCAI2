import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Menu, 
  User, 
  X, 
  Briefcase, 
  UserCircle, 
  History,
  Heart,
  Settings,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ナビゲーションの構造を定義
const commonRoutes = [
  { path: "/", label: "ホーム", icon: Home },
  { path: "/jobs", label: "求人情報", icon: Briefcase },
];

const talentRoutes = [
  { path: "/talent/dashboard", label: "ダッシュボード", icon: UserCircle },
  { path: "/talent/mypage", label: "マイページ", icon: Settings },
  { path: "/talent/mypage/keep-list", label: "キープリスト", icon: Heart },
  { path: "/talent/mypage/view-history", label: "閲覧履歴", icon: History },
  { path: "/talent/ai-matching", label: "AIマッチング", icon: UserCircle },
];

const storeRoutes = [
  { path: "/store/dashboard", label: "店舗ダッシュボード", icon: Briefcase },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // ユーザーの種類に基づいてルートを選択
  const userRoutes = user?.role === 'store' ? storeRoutes : talentRoutes;

  // 現在のパスからパンくずリストを生成
  const breadcrumbs = location.split("/").filter(Boolean);

  // パンくずリストのラベルを日本語化
  const getBreadcrumbLabel = (crumb: string) => {
    const labels: Record<string, string> = {
      'talent': 'タレント',
      'store': '店舗',
      'jobs': '求人',
      'mypage': 'マイページ',
      'dashboard': 'ダッシュボード',
      'ai-matching': 'AIマッチング',
      'keep-list': 'キープリスト',
      'view-history': '閲覧履歴',
    };
    return labels[crumb] || crumb;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* デスクトップナビゲーション */}
        <div className="mr-4 hidden md:flex items-center space-x-4">
          {commonRoutes.map((route) => (
            <Link key={route.path} href={route.path}>
              <a className="flex items-center">
                <Button variant={location === route.path ? "default" : "ghost"} size="sm">
                  <route.icon className="h-4 w-4 mr-2" />
                  {route.label}
                </Button>
              </a>
            </Link>
          ))}

          {user && userRoutes.map((route) => (
            <Link key={route.path} href={route.path}>
              <a className="flex items-center">
                <Button variant={location === route.path ? "default" : "ghost"} size="sm">
                  <route.icon className="h-4 w-4 mr-2" />
                  {route.label}
                </Button>
              </a>
            </Link>
          ))}
        </div>

        {/* モバイルメニュー */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger className="md:hidden">
            <Button variant="ghost" size="sm">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>メニュー</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              {commonRoutes.map((route) => (
                <Link key={route.path} href={route.path}>
                  <a className="block">
                    <Button
                      variant={location === route.path ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setIsOpen(false)}
                    >
                      <route.icon className="h-4 w-4 mr-2" />
                      {route.label}
                    </Button>
                  </a>
                </Link>
              ))}

              {user && userRoutes.map((route) => (
                <Link key={route.path} href={route.path}>
                  <a className="block">
                    <Button
                      variant={location === route.path ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setIsOpen(false)}
                    >
                      <route.icon className="h-4 w-4 mr-2" />
                      {route.label}
                    </Button>
                  </a>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* パンくずリスト（モバイルでは非表示） */}
        <div className="hidden md:flex items-center text-sm">
          <Link href="/">
            <a>
              <Button variant="link" size="sm">
                ホーム
              </Button>
            </a>
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              <span className="mx-2 text-muted-foreground">/</span>
              <Link href={`/${breadcrumbs.slice(0, index + 1).join("/")}`}>
                <a>
                  <Button variant="link" size="sm">
                    {getBreadcrumbLabel(crumb)}
                  </Button>
                </a>
              </Link>
            </div>
          ))}
        </div>

        {/* ユーザーメニュー */}
        <div className="ml-auto">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="sm">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.role === 'store' ? '店舗アカウント' : 'タレントアカウント'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={user.role === 'store' ? "/store/dashboard" : "/talent/dashboard"}>
                  <a>
                    <DropdownMenuItem>
                      <UserCircle className="h-4 w-4 mr-2" />
                      ダッシュボード
                    </DropdownMenuItem>
                  </a>
                </Link>
                <Link href={user.role === 'store' ? "/store/dashboard" : "/talent/mypage"}>
                  <a>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      {user.role === 'store' ? '店舗設定' : 'マイページ'}
                    </DropdownMenuItem>
                  </a>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <a>
                <Button size="sm">ログイン</Button>
              </a>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}