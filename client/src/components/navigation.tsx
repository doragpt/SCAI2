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
  Bot,
  Building2,
  Users,
  MessageSquare,
  Bell
} from "lucide-react";
import { useState, useEffect } from "react";
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
  { path: "/store/dashboard", label: "ダッシュボード", icon: Building2 },
  { path: "/store/talent-list", label: "タレント一覧", icon: Users },
  { path: "/store/messages", label: "メッセージ", icon: MessageSquare },
  { path: "/store/notifications", label: "お知らせ", icon: Bell },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userRoutes = user?.role === 'store' ? storeRoutes : talentRoutes;

  const getBreadcrumbLabel = (crumb: string) => {
    const labels: Record<string, string> = {
      'jobs': '求人情報',
      'mypage': 'マイページ',
      'keep-list': 'キープリスト',
      'view-history': '閲覧履歴',
      'ai-matching': 'AIマッチング',
      'dashboard': 'ダッシュボード',
      'talent-list': 'タレント一覧',
      'messages': 'メッセージ',
      'notifications': 'お知らせ',
      'store': '店舗',
      'talent': 'タレント'
    };
    return labels[crumb] || crumb;
  };

  const getDisplayBreadcrumbs = (path: string) => {
    return path.split("/")
      .filter(Boolean)
      .map(segment => ({
        label: getBreadcrumbLabel(segment),
        path: `/${path.split("/").slice(0, path.split("/").indexOf(segment) + 1).join("/")}`
      }));
  };

  const breadcrumbs = getDisplayBreadcrumbs(location);

  if (!mounted) return null;

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
          <SheetTrigger asChild>
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
                    className="w-full justify-start cursor-pointer"
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
                    className="w-full justify-start cursor-pointer"
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

        {/* パンくずリスト */}
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
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>アカウント</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={user.role === 'store' ? "/store/dashboard" : "/talent/mypage"}>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setIsDropdownOpen(false)}>
                    <UserCircle className="h-4 w-4 mr-2" />
                    {user.role === 'store' ? 'ダッシュボード' : 'マイページ'}
                  </DropdownMenuItem>
                </Link>
                <Link href={user.role === 'store' ? "/store/settings" : "/talent/settings"}>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setIsDropdownOpen(false)}>
                    <Settings className="h-4 w-4 mr-2" />
                    設定
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