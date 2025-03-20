import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { type JobResponse } from "@shared/schema";
import {
  Loader2,
  MapPin,
  Banknote,
  Star,
  ChevronRight,
  Building2,
  Check,
  AlertCircle,
  BookOpen,
  Wallet,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { SEO } from "@/lib/seo";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BlockQuote } from "@/components/ui/blockquote";
import { useToast } from "@/hooks/use-toast";
import { QUERY_KEYS } from "@/constants/queryKeys";

// アニメーション設定
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

// カスタムアイコンコンポーネント
const IconWrapper = ({ type, className }: { type: string; className?: string }) => {
  const IconComponent = {
    BookOpen,
    Wallet,
    HelpCircle,
  }[type];

  return IconComponent ? <IconComponent className={className} /> : null;
};

// 給与表示のフォーマッター
const formatSalary = (min?: number | null, max?: number | null): string => {
  if (!min && !max) return "応相談";
  if (!max) return `${min?.toLocaleString()}円〜`;
  if (!min) return `〜${max?.toLocaleString()}円`;
  return `${min?.toLocaleString()}円 〜 ${max?.toLocaleString()}円`;
};

// お仕事ガイド
const workGuides = [
  {
    title: "はじめての方へ",
    description: "お仕事の流れや準備するものなど、初めての方向けの詳しい説明です",
    icon: "BookOpen",
  },
  {
    title: "お給料について",
    description: "給与システムや報酬の受け取り方について詳しく解説",
    icon: "Wallet",
  },
  {
    title: "よくある質問",
    description: "求人に関するよくある疑問にお答えします",
    icon: "HelpCircle",
  },
];

const testimonials = [
  {
    name: "Aさん (26歳)",
    role: "エステ",
    content: "未経験でも丁寧に教えていただき、今では安定した収入を得られています。",
  },
  {
    name: "Bさん (31歳)",
    role: "セラピスト",
    content: "子育て中でも柔軟なシフトで働けて助かっています。",
  },
];

// JobCardコンポーネント
const JobCard = ({ job }: { job: JobResponse }) => {
  return (
    <motion.div
      variants={item}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="group hover:shadow-lg transition-all h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg line-clamp-2">
                {job.businessName}
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {job.location}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center text-primary font-semibold">
              <Banknote className="h-5 w-5 mr-2" />
              <span>日給 {formatSalary(job.minimumGuarantee, job.maximumGuarantee)}</span>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
              asChild
            >
              <Link href={`/jobs/${job.id}`}>
                詳細を見る
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data, isLoading: jobsLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.JOBS_PUBLIC],
    queryFn: async () => {
      try {
        const response = await fetch("/api/jobs");

        if (!response.ok) {
          throw new Error("求人情報の取得に失敗しました");
        }

        return response.json();
      } catch (error) {
        console.error("求人情報取得エラー:", error);
        throw error;
      }
    }
  });

  const jobListings = data?.jobs || [];
  const filteredListings = jobListings.slice(0, 6);

  if (authLoading || jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="SCAI - 高収入求人マッチングサイト"
        description="AIが最適な求人をご提案。高収入・好条件の求人が見つかる求人マッチングサイト"
      />
      <div className="min-h-screen bg-background">
        {/* ヒーローセクション */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-12 bg-gradient-to-r from-primary/10 to-primary/5 p-8 md:p-12"
        >
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AIが最適な求人をご提案
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              あなたに合った求人を、最新のAI技術でマッチング。
              高収入・好条件の求人を簡単検索。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="text-lg">
                <Link href="/auth">
                  無料会員登録してAIマッチングを試す
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg">
                <Link href="/jobs">
                  求人を探す
                </Link>
              </Button>
            </div>
          </div>
        </motion.section>

        <main className="container mx-auto px-4 py-8 space-y-16">
          {/* お仕事ガイド */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <IconWrapper type="BookOpen" className="h-6 w-6 text-primary" />
                お仕事ガイド
              </h2>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-3 gap-6"
            >
              {workGuides.map((guide, index) => (
                <motion.div
                  key={index}
                  variants={item}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-all h-full">
                    <CardHeader>
                      <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                        <IconWrapper type={guide.icon} className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>{guide.title}</CardTitle>
                      <CardDescription>{guide.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* 体験談セクション */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                お仕事体験談
              </h2>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-2 gap-8"
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={item}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {testimonial.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{testimonial.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                      <BlockQuote className="mt-4 text-muted-foreground">
                        {testimonial.content}
                      </BlockQuote>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* エリアから探す */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                エリアから探す
              </h2>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-4 gap-6"
            >
              {areaGroups.map((group) => (
                <motion.div
                  key={group.label}
                  variants={item}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{group.label}</span>
                        <Badge variant="outline">
                          {areaStats[group.label]}件
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {group.areas.slice(0, 3).map((area) => (
                          <Badge key={area} variant="outline">
                            {area}
                          </Badge>
                        ))}
                        {group.areas.length > 3 && (
                          <Badge variant="outline">+{group.areas.length - 3}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* 新着求人 */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Star className="h-6 w-6 text-primary" />
                  新着求人
                </h2>
                <p className="text-muted-foreground mt-1">
                  最新の高収入求人をチェック
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/jobs">
                  すべての求人を見る
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">求人情報を読み込み中...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <Card className="max-w-md mx-auto">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                      <p className="text-destructive font-medium">データの取得に失敗しました</p>
                      <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : "エラーが発生しました"}
                      </p>
                      <Button onClick={() => refetch()} className="w-full">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        再読み込み
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : !filteredListings.length ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  条件に合う求人が見つかりませんでした
                </p>
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredListings.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </motion.div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}