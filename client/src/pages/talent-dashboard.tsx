import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Bot,
  Bell,
  ChevronRight,
  Calendar,
  Briefcase,
  Loader2
} from "lucide-react";
import { Link } from "wouter";
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
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
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
      title: "SCAIマッチング",
      icon: Bot,
      href: "/talent/ai-matching",
      description: "AIによる最適なマッチング",
      color: "bg-green-500"
    },
    {
      title: "お仕事検索",
      icon: Briefcase,
      href: "/jobs",
      description: "新着求人をチェック",
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground">
            ようこそ、{user.username}さん
          </p>
        </div>
      </div>

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
        className="grid grid-cols-2 gap-4"
      >
        {quickAccessItems.map((item) => (
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
            <CardTitle className="text-lg">最近の活動</CardTitle>
            <CardDescription>申請状況や閲覧履歴をチェック</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="ghost" className="w-full justify-start gap-2">
              <Link href="/talent/mypage">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span>申請履歴</span>
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
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}