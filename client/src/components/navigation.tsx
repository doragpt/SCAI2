import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Menu, User, X } from "lucide-react";
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

const routes = [
  { path: "/", label: "ホーム" },
  { path: "/jobs", label: "求人情報" },
  { path: "/talent/dashboard", label: "マイページ" },
  { path: "/talent/profile", label: "プロフィール" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // 現在のパスからパンくずリストを生成
  const breadcrumbs = location.split("/").filter(Boolean);
  
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* モバイルメニュー */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>メニュー</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              {routes.map((route) => (
                <Link key={route.path} href={route.path}>
                  <Button
                    variant={location === route.path ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    {route.label}
                  </Button>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* パンくずリスト */}
        <div className="flex items-center text-sm">
          <Link href="/">
            <Button variant="link" size="sm">
              ホーム
            </Button>
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              <span className="mx-2 text-muted-foreground">/</span>
              <Link href={`/${breadcrumbs.slice(0, index + 1).join("/")}`}>
                <Button variant="link" size="sm">
                  {crumb === "talent" ? "タレント" : crumb}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="ml-auto">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>アカウント</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/talent/profile">
                  <DropdownMenuItem>プロフィール</DropdownMenuItem>
                </Link>
                <Link href="/talent/dashboard">
                  <DropdownMenuItem>マイページ</DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => logoutMutation.mutate()}
                >
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button size="sm">ログイン</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
