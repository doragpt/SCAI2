import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  UserIcon, 
  MessageCircle, 
  Heart, 
  History,
  Search,
  Menu,
  X
} from "lucide-react";
import { useEffect } from "react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed inset-0 z-50">
        <div className="bg-white h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">メニュー</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <Card className="hover:bg-accent/50 transition-colors">
              <Link href="/talent/profile/edit" onClick={onClose}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    <span>基本情報</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </div>
              </Link>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors">
              <Link href="/talent/resume/edit" onClick={onClose}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    <span>WEB履歴書</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </div>
              </Link>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors">
              <Link href="/talent/mypage/applications" onClick={onClose}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    <span>応募履歴</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </div>
              </Link>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors">
              <Link href="/talent/mypage/keep-list" onClick={onClose}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    <span>キープリスト</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </div>
              </Link>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors">
              <Link href="/talent/mypage/view-history" onClick={onClose}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    <span>閲覧履歴</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </div>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}