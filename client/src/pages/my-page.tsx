import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Bell,
  ChevronRight,
  Calendar,
  Briefcase,
  Loader2,
  Heart,
  Clock,
  Settings,
  UserCircle,
  FileText
} from "lucide-react";
import { Link, useLocation } from "wouter"; 
import { type TalentProfileData } from "@shared/schema";
import { type Application } from "@/types/application";
import { Button } from "@/components/ui/button";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function MyPage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation(); 

  const { data: profile, isLoading: isLoadingProfile } = useQuery<TalentProfileData>({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    enabled: !!user && user.role === "talent",
  });

  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: [QUERY_KEYS.APPLICATIONS_TALENT],
    enabled: !!user && user.role === "talent",
  });

  if (!user) {
    setLocation("/auth"); 
    return null;
  }

  if (isLoadingProfile || isLoadingApplications) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const quickAccessItems = [
    {
      title: "プロフィール確認",
      icon: FileText,
      href: "/talent/profile/view",
      description: "登録情報の確認",
      color: "bg-purple-500"
    },
    {
      title: "ウェブ履歴書編集",
      icon: UserCircle,
      href: "/talent/register",
      description: "登録情報の更新",
      color: "bg-blue-500"
    },
    {
      title: "SCAIマッチング",
      icon: Bot,
      href: "/talent/ai-matching",
      description: "AIによるマッチング",
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
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            マイページ
          </h1>
          <p className="text-muted-foreground mt-1">
            ようこそ、{user.username}さん
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          設定
        </Button>
      </motion.div>

      {/* クイックアクセス */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {quickAccessItems.map((item) => (
          <motion.div
            key={item.href}
            variants={itemVariants}
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

      {/* お知らせと申請履歴 */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* お知らせ */}
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
          </div>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {!applications || applications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    お知らせはありません
                  </CardContent>
                </Card>
              ) : (
                applications.map((application) => (
                  <motion.div key={application.id} variants={itemVariants}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">申請 #{application.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(application.created_at), 'yyyy年MM月dd日', { locale: ja })}
                            </p>
                            {application.businessName && (
                              <p className="text-sm mt-1">{application.businessName}</p>
                            )}
                          </div>
                          <Badge
                            variant={
                              application.status === "accepted" ? "default" :
                              application.status === "rejected" ? "destructive" :
                              "secondary"
                            }
                          >
                            {
                              {
                                pending: "審査中",
                                accepted: "承認済み",
                                rejected: "不採用",
                                withdrawn: "取り下げ"
                              }[application.status]
                            }
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </motion.section>

        {/* 申請履歴 */}
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              申請履歴
            </h2>
            <Button variant="ghost" size="sm" className="text-primary">
              すべて見る
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {!applications || applications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    申請履歴はありません
                  </CardContent>
                </Card>
              ) : (
                applications.map((application) => (
                  <motion.div key={application.id} variants={itemVariants}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">申請 #{application.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(application.created_at), 'yyyy年MM月dd日', { locale: ja })}
                            </p>
                            {application.businessName && (
                              <p className="text-sm mt-1">{application.businessName}</p>
                            )}
                          </div>
                          <Badge
                            variant={
                              application.status === "accepted" ? "default" :
                              application.status === "rejected" ? "destructive" :
                              "secondary"
                            }
                          >
                            {
                              {
                                pending: "審査中",
                                accepted: "承認済み",
                                rejected: "不採用",
                                withdrawn: "取り下げ"
                              }[application.status]
                            }
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </motion.section>
      </div>
    </div>
  );
}