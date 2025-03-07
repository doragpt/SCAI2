import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Loader2,
  LogOut,
  Heart,
  History,
  MessageCircle,
  UserIcon,
  Search,
  Menu,
  Bot,
  Bell,
  ChevronRight,
  Calendar,
  Briefcase
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { MobileMenu } from "@/components/mobile-menu";
import { motion } from "framer-motion";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

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

  const notices = [
    {
      id: 1,
      title: "【重要】システムメンテナンスのお知らせ",
      date: "2024/03/15",
      type: "important",
      content: "定期メンテナンスを実施いたします。",
    },
    {
      id: 2,
      title: "【お知らせ】新機能追加のお知らせ",
      date: "2024/03/10",
      type: "info",
      content: "AIマッチング機能が追加されました。",
    }
  ];

  const quickAccessItems = [
    {
      title: "基本情報",
      icon: UserIcon,
      href: "/talent/profile/edit",
      description: "プロフィール情報の編集",
      color: "bg-blue-500"
    },
    {
      title: "WEB履歴書",
      icon: MessageCircle,
      href: "/talent/resume/edit",
      description: "詳細な経歴情報の編集",
      color: "bg-purple-500"
    },
    {
      title: "SCAIマッチング",
      icon: Bot,
      href: "/talent/ai-matching",
      description: "AIによる最適なマッチング",
      color: "bg-green-500"
    },
    {
      title: "お仕事検索",
      icon: Search,
      href: "/jobs",
      description: "新着求人をチェック",
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 固定ヘッダー */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 bg-white border-b z-50"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              マイページ
            </h1>
            {user && (
              <span className="text-sm text-muted-foreground">
                ようこそ、{user.username}さん
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* モバイルメニュー */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* メインコンテンツ */}
      <main className="pt-20 pb-20">
        <div className="container mx-auto px-4 space-y-8">
          {/* お知らせセクション */}
          <motion.section
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                お知らせ
              </h2>
              <Button variant="ghost" size="sm" className="text-primary">
                すべて見る
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            {notices.map((notice) => (
              <motion.div key={notice.id} variants={item}>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Card className="cursor-pointer transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className={`font-medium ${notice.type === 'important' ? 'text-red-600' : 'text-primary'}`}>
                              {notice.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(notice.date), 'yyyy年MM月dd日', { locale: ja })}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">{notice.title}</h4>
                      <p className="text-sm text-muted-foreground">{notice.content}</p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </motion.div>
            ))}
          </motion.section>

          {/* クイックアクセスメニュー */}
          <motion.section
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {quickAccessItems.map((item, index) => (
              <motion.div
                key={item.href}
                variants={item}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-32 flex flex-col items-center justify-center gap-2 relative overflow-hidden group"
                >
                  <Link href={item.href}>
                    <div className={`absolute inset-0 opacity-10 ${item.color}`} />
                    <item.icon className={`h-6 w-6 ${item.color} text-white rounded-full p-1`} />
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </Link>
                </Button>
              </motion.div>
            ))}
          </motion.section>

          {/* メインメニュー */}
          <motion.section
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">クイックメニュー</CardTitle>
                <CardDescription>よく使う機能にすぐアクセス</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="ghost" className="w-full justify-start gap-2">
                  <Link href="/talent/mypage">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span>スケジュール管理</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-2">
                  <Link href="/talent/mypage/applications">
                    <Briefcase className="h-5 w-5 text-purple-500" />
                    <span>応募履歴</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-2">
                  <Link href="/talent/mypage/keep-list">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span>キープリスト</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-2">
                  <Link href="/talent/mypage/view-history">
                    <History className="h-5 w-5 text-green-500" />
                    <span>閲覧履歴</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </main>

      {/* フッターナビゲーション */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t"
      >
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
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="h-5 w-5 mb-1" />
              <span className="text-xs">メニュー</span>
            </Button>
          </div>
        </div>
      </motion.nav>
    </div>
  );
}