import { useLocation, Link } from "wouter";
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
  LogOut,
  Bot
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
  { path: "/talent/mypage", label: "マイページ", icon: UserCircle },
  { path: "/talent/mypage/keep-list", label: "キープリスト", icon: Heart },
  { path: "/talent/mypage/view-history", label: "閲覧履歴", icon: History },
  { path: "/talent/ai-matching", label: "AIマッチング", icon: Bot },
];

const storeRoutes = [
  { path: "/store/dashboard", label: "店舗ダッシュボード", icon: Briefcase },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ユーザーの種類に基づいてルートを選択
  const userRoutes = user?.role === 'store' ? storeRoutes : talentRoutes;

  // パンくずリストのラベルを日本語化
  const getBreadcrumbLabel = (crumb: string) => {
    const labels: Record<string, string> = {
      'jobs': '求人情報',
      'mypage': 'マイページ',
      'keep-list': 'キープリスト',
      'view-history': '閲覧履歴',
      'ai-matching': 'AIマッチング',
      'store': '店舗',
    };
    return labels[crumb] || crumb;
  };

  // パスセグメントから表示用のパンくずを生成
  const getDisplayBreadcrumbs = (path: string) => {
    return path.split("/")
      .filter(Boolean)
      .filter(segment => segment !== "talent") // talentセグメントを除外
      .map(segment => ({
        label: getBreadcrumbLabel(segment),
        path: `/${path.split("/").slice(0, path.split("/").indexOf(segment) + 1).join("/")}`
      }));
  };

  const breadcrumbs = getDisplayBreadcrumbs(location);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* デスクトップナビゲーション */}
        <div className="mr-4 hidden md:flex items-center space-x-4">
          {commonRoutes.map((route) => (
            <Link key={route.path} href={route.path}>
              <Button
                variant={location === route.path ? "default" : "ghost"}
                size="sm"
                className="cursor-pointer"
              >
                <route.icon className="h-4 w-4 mr-2" />
                {route.label}
              </Button>
            </Link>
          ))}

          {user && userRoutes.map((route) => (
            <Link key={route.path} href={route.path}>
              <Button
                variant={location === route.path ? "default" : "ghost"}
                size="sm"
                className="cursor-pointer"
              >
                <route.icon className="h-4 w-4 mr-2" />
                {route.label}
              </Button>
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
                  <Button
                    variant={location === route.path ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <route.icon className="h-4 w-4 mr-2" />
                    {route.label}
                  </Button>
                </Link>
              ))}

              {user && userRoutes.map((route) => (
                <Link key={route.path} href={route.path}>
                  <Button
                    variant={location === route.path ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <route.icon className="h-4 w-4 mr-2" />
                    {route.label}
                  </Button>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* パンくずリスト（モバイルでは非表示） */}
        <div className="hidden md:flex items-center text-sm">
          <Link href="/">
            <Button variant="link" size="sm" className="cursor-pointer">
              ホーム
            </Button>
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              <span className="mx-2 text-muted-foreground">/</span>
              <Link href={crumb.path}>
                <Button variant="link" size="sm" className="cursor-pointer">
                  {crumb.label}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* ユーザーメニュー */}
        <div className="ml-auto">
          {user ? (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="sm" className="cursor-pointer">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.role === 'store' ? '店舗アカウント' : 'アカウント'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={user.role === 'store' ? "/store/dashboard" : "/talent/mypage"}>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setIsDropdownOpen(false)}>
                    <UserCircle className="h-4 w-4 mr-2" />
                    マイページ
                  </DropdownMenuItem>
                </Link>
                <Link href={user.role === 'store' ? "/store/settings" : "/talent/mypage"}>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setIsDropdownOpen(false)}>
                    <Settings className="h-4 w-4 mr-2" />
                    アカウント設定
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logoutMutation.mutate();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button size="sm" className="cursor-pointer">
                ログイン
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}