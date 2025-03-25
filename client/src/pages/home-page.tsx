import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { type JobResponse, type ServiceType, serviceTypes } from "@shared/schema";
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
  Search,
  Bus,
  Home,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect } from "react";
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

const areaGroups = [
  { label: "北海道・東北", areas: ["北海道", "青森県", "秋田県", "岩手県", "山形県", "福島県", "宮城県"] },
  { label: "関東", areas: ["東京都", "神奈川県", "千葉県", "埼玉県", "茨城県", "栃木県", "群馬県"] },
  { label: "中部", areas: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { label: "関西", areas: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { label: "中国", areas: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] },
  { label: "四国", areas: ["徳島県", "香川県", "愛媛県", "高知県"] },
  { label: "九州・沖縄", areas: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
];

// エリア統計の型定義
type AreaStats = {
  [key: string]: number;
};

const areaStats: AreaStats = {
  "北海道・東北": 234,
  "関東": 567,
  "中部": 345,
  "関西": 456,
  "中国": 123,
  "四国": 89,
  "九州・沖縄": 234,
};

// 共通のユーティリティ関数を使用
import { formatSalary } from "@/lib/utils";
import { HtmlContent } from "@/components/html-content";

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

// JobCardコンポーネントの修正
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
            <HoverCard>
              <HoverCardTrigger>
                <Badge variant="outline" className="bg-primary/5">
                  {job.serviceType}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm">
                  {job.serviceType}に関する求人です
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center text-primary font-semibold">
              <Banknote className="h-5 w-5 mr-2" />
              <span>日給 {formatSalary(
                job.minimumGuarantee, 
                job.maximumGuarantee,
                job.workingTimeHours,
                job.averageHourlyPay
              )}</span>
            </div>
            {job.catchPhrase && (
              <div className="text-sm">
                <HtmlContent 
                  html={job.catchPhrase} 
                  className="prose prose-sm max-w-none line-clamp-2" 
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {job.transportationSupport && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  交通費支給
                </Badge>
              )}
              {job.housingSupport && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  寮完備
                </Badge>
              )}
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

// キャンペーン情報
const campaigns = [
  {
    title: "入店祝い金キャンペーン",
    description: "今月中にご応募の方に最大20万円の入店祝い金をプレゼント！",
    icon: "🎁",
    color: "from-pink-500 to-rose-500",
    textColor: "text-white",
    badge: "3月限定",
  },
  {
    title: "出稼ぎキャンペーン",
    description: "他県からの出稼ぎの方に交通費と宿泊費を全額支給します！",
    icon: "✈️",
    color: "from-blue-500 to-cyan-500",
    textColor: "text-white",
    badge: "好評実施中",
  },
  {
    title: "友達紹介ボーナス",
    description: "お友達を紹介して一緒に働くと、紹介者に特別ボーナス！",
    icon: "👯‍♀️",
    color: "from-violet-500 to-purple-500",
    textColor: "text-white",
    badge: "永久実施",
  }
];

// 特集セクション
const features = [
  {
    title: "高収入特集",
    description: "日給5万円以上の高収入求人をピックアップ",
    image: "https://scoutai1.s3.ap-southeast-2.amazonaws.com/1742784033792-1742784033791-481ec640addd0a7f41975927ea001228_600.jpg",
    link: "/jobs?minSalary=50000"
  },
  {
    title: "未経験歓迎特集",
    description: "業界未経験でも安心して働ける優良店特集",
    image: "https://scoutai1.s3.ap-southeast-2.amazonaws.com/1742786349768-1742786349766-business_man_macho.png",
    link: "/jobs?beginner=true"
  },
  {
    title: "交通費支給特集",
    description: "通勤にかかる費用をサポートする求人特集",
    image: "https://scoutai1.s3.ap-southeast-2.amazonaws.com/1742786349768-1742786349766-business_man_macho.png",
    link: "/jobs?transportationSupport=true"
  }
];

// よくある質問
const faqs = [
  {
    question: "未経験でも大丈夫ですか？",
    answer: "はい、ほとんどの求人は未経験歓迎です。研修制度が充実しているので安心してご応募いただけます。"
  },
  {
    question: "身バレの心配はありますか？",
    answer: "各店舗は身バレ対策に配慮しています。写真加工や顔出しNG、勤務地選びなどでリスクを最小限に抑えられます。"
  },
  {
    question: "稼げるか不安です",
    answer: "初心者でも稼げるよう、多くの店舗では最低保証制度を設けています。経験を積むにつれて収入も上がっていきます。"
  }
];

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedType, setSelectedType] = useState<ServiceType | "all">("all");
  const { toast } = useToast();

  const { data, isLoading: jobsLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.JOBS_PUBLIC],
    queryFn: async () => {
      try {
        console.log('Fetching jobs data...'); // デバッグログ追加
        const response = await fetch(`/api${QUERY_KEYS.JOBS_PUBLIC}`);
        console.log('API Response:', response); // デバッグログ追加

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText); // デバッグログ追加
          throw new Error("求人情報の取得に失敗しました");
        }

        const result = await response.json();
        console.log('Jobs API Response:', result);
        return result;
      } catch (error) {
        console.error("求人情報取得エラー:", error);
        throw error;
      }
    }
  });

  const jobListings = data?.jobs || [];

  const filteredListings = jobListings.filter((job: JobResponse) => {
    if (!job) return false;
    return selectedType === "all" || job.serviceType === selectedType;
  }).slice(0, 6);

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

        {/* クイック検索エリア */}
        <div className="container mx-auto px-4 relative z-10 -mt-8">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Search className="h-5 w-5 mr-2 text-primary" />
              希望条件から求人を探す
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <motion.div variants={item}>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/jobs?experience=beginner">
                    <Star className="h-4 w-4 mr-2 text-primary" />
                    未経験歓迎
                  </Link>
                </Button>
              </motion.div>
              <motion.div variants={item}>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/jobs?transportationSupport=true">
                    <Bus className="h-4 w-4 mr-2 text-primary" />
                    交通費支給
                  </Link>
                </Button>
              </motion.div>
              <motion.div variants={item}>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/jobs?housingSupport=true">
                    <Home className="h-4 w-4 mr-2 text-primary" />
                    寮完備
                  </Link>
                </Button>
              </motion.div>
              <motion.div variants={item}>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/jobs?minSalary=50000">
                    <Banknote className="h-4 w-4 mr-2 text-primary" />
                    日給5万円以上
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

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

          {/* 特集コンテンツ */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6 text-primary" />
                特集コンテンツ
              </h2>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-3 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={item}
                  whileHover={{ scale: 1.03 }}
                  className="h-full"
                >
                  <Link href={feature.link} className="block h-full">
                    <Card className="overflow-hidden h-full hover:shadow-xl transition-all cursor-pointer bg-gradient-to-b from-background to-background/60 border-2 border-background/80">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={feature.image}
                          alt={feature.title}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                        <div className="flex justify-end mt-2">
                          <Button variant="ghost" size="sm" className="text-primary">
                            特集を見る <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ServiceType | "all")}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="業種を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全ての業種</SelectItem>
                          {serviceTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>業種を選んで絞り込み</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/jobs">
                    すべての求人を見る
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
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
                {filteredListings.map((job: JobResponse) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </motion.div>
            )}
          </section>

          {/* よくある質問 */}
          <section className="bg-muted/30 p-8 rounded-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                よくある質問
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="overflow-hidden border-0 shadow-sm">
                  <Accordion type="single" collapsible>
                    <AccordionItem value={`faq-${index}`} className="border-0">
                      <AccordionTrigger className="p-4 text-base font-medium hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-0 text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              ))}
            </div>
          </section>

          {/* CTAセクション */}
          <section className="bg-primary/10 p-12 rounded-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute left-0 bottom-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="max-w-3xl mx-auto text-center relative z-10">
              <h2 className="text-3xl font-bold mb-6">お仕事を探すなら、SCAIで今すぐ始めよう</h2>
              <p className="text-lg text-muted-foreground mb-8">
                あなたの条件に合った高収入求人が見つかります。<br />
                無料会員登録をしてAIマッチングを体験してみましょう。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link href="/auth">無料会員登録</Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                  <Link href="/jobs">求人を見る</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}