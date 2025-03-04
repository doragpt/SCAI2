import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, Heart, History, Menu, Bot } from "lucide-react";

interface FooterNavigationProps {
  onMenuClick?: () => void;
}

export function FooterNavigation({ onMenuClick }: FooterNavigationProps) {
  return (
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
            <Link href="/talent/ai-matching">
              <Bot className="h-5 w-5 mb-1" />
              <span className="text-xs">SCAIマッチング</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild className="flex flex-col items-center py-2 h-16">
            <Link href="/talent/mypage/keep-list">
              <Heart className="h-5 w-5 mb-1" />
              <span className="text-xs">キープ</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center py-2 h-16"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5 mb-1" />
            <span className="text-xs">メニュー</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}