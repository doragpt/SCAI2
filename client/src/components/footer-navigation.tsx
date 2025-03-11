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
          <Link href="/jobs">
            <a className="block">
              <Button variant="ghost" className="flex flex-col items-center py-2 h-16 w-full">
                <Search className="h-5 w-5 mb-1" />
                <span className="text-xs">お仕事検索</span>
              </Button>
            </a>
          </Link>
          <Link href="/talent/ai-matching">
            <a className="block">
              <Button variant="ghost" className="flex flex-col items-center py-2 h-16 w-full">
                <Bot className="h-5 w-5 mb-1" />
                <span className="text-xs">SCAIマッチング</span>
              </Button>
            </a>
          </Link>
          <Link href="/talent/mypage/keep-list">
            <a className="block">
              <Button variant="ghost" className="flex flex-col items-center py-2 h-16 w-full">
                <Heart className="h-5 w-5 mb-1" />
                <span className="text-xs">キープ</span>
              </Button>
            </a>
          </Link>
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