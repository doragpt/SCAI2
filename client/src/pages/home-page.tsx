import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { Loader2, MapPin, Banknote, Clock, Building, Star, Bell, ChevronRight, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { SEO } from "@/lib/seo";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

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

const areaGroups = [
  { label: "北海道・東北", areas: ["北海道", "青森県", "秋田県", "岩手県", "山形県", "福島県", "宮城県"] },
  { label: "関東", areas: ["東京都", "神奈川県", "千葉県", "埼玉県", "茨城県", "栃木県", "群馬県"] },
  { label: "中部", areas: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { label: "関西", areas: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { label: "中国", areas: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] },
  { label: "四国", areas: ["徳島県", "香川県", "愛媛県", "高知県"] },
  { label: "九州・沖縄", areas: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
];

const serviceTypes = [
  { id: "deriheru", label: "デリヘル" },
  { id: "hoteheru", label: "ホテヘル" },
  { id: "hakoheru", label: "箱ヘル" },
  { id: "esthe", label: "風俗エステ" },
  { id: "onakura", label: "オナクラ" },
  { id: "mseikan", label: "M性感" },
];

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: jobListings, isLoading: jobsLoading } = useQuery<StoreProfile[]>({
    queryKey: ["/api/jobs/public"],
  });

  const currentAreaGroup = areaGroups.find(group => group.label === selectedRegion);

  const filteredListings = jobListings?.filter(job => {
    const areaMatch = !selectedArea || job.location.includes(selectedArea);
    const typeMatch = selectedType === "all" || job.serviceType === selectedType;
    return areaMatch && typeMatch;
  });

  // キャンペーン情報
  const campaigns = [
    {
      title: "面接交通費支給キャンペーン",
      description: "最大10,000円まで支給！",
      color: "bg-pink-500"
    },
    {
      title: "入店祝い金キャンペーン",
      description: "今なら最大50,000円支給中",
      color: "bg-purple-500"
    }
  ];

  // 新着情報
  const news = [
    {
      date: "2025.03.07",
      title: "【重要】キャンペーン情報",
      tag: "キャンペーン"
    },
    {
      date: "2025.03.06",
      title: "【お知らせ】新機能追加のお知らせ",
      tag: "お知らせ"
    }
  ];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="SCAI - AIマッチング求人サイト"
        description="セキュアで効率的な求人マッチングプラットフォーム。AIが最適な求人をご提案します。"
      />
      <div className="min-h-screen bg-background">
        {/* ヘッダー */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              SCAI
            </h1>
            <div className="flex items-center gap-4">
              {user ? (
                <Button asChild>
                  <Link href="/talent/dashboard">マイページ</Link>
                </Button>
              ) : (
                <Button asChild variant="default">
                  <Link href="/auth">無料会員登録</Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* ヒーローセクション */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden mb-12 bg-gradient-to-r from-primary/10 to-primary/5"
          >
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative z-10 p-8 md:p-12">
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

          {/* キャンペーンセクション */}
          <motion.section
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 gap-6 mb-12"
          >
            {campaigns.map((campaign, index) => (
              <motion.div
                key={index}
                variants={item}
                whileHover={{ scale: 1.02 }}
                className="relative rounded-xl overflow-hidden shadow-lg"
              >
                <div className={`absolute inset-0 ${campaign.color} opacity-10`} />
                <div className="relative p-6">
                  <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
                  <p className="text-lg text-muted-foreground">{campaign.description}</p>
                  <Button variant="link" className="mt-4">
                    詳しく見る
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.section>

          {/* エリア検索セクション */}
          <section className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                エリアから探す
              </h3>
              <div className="flex gap-4 mt-4 md:mt-0">
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="エリアを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {areaGroups.map((group) => (
                      <SelectItem key={group.label} value={group.label}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedArea}
                  onValueChange={setSelectedArea}
                  disabled={!selectedRegion}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={selectedRegion ? "地域を選択" : "エリアを選択してください"} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentAreaGroup?.areas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* エリアマップ */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {areaGroups.map((group) => (
                <motion.div
                  key={group.label}
                  variants={item}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-all">
                    <CardHeader>
                      <CardTitle className="text-lg">{group.label}</CardTitle>
                      <CardDescription>
                        {group.areas.length}エリア
                      </CardDescription>
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

          {/* 新着情報 */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="h-6 w-6 text-primary" />
                新着情報
              </h3>
              <Button variant="ghost" size="sm">
                もっと見る
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-2 gap-6"
            >
              {news.map((item, index) => (
                <motion.div
                  key={index}
                  variants={item}
                  whileHover={{ scale: 1.01 }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{item.tag}</Badge>
                        <span className="text-sm text-muted-foreground">{item.date}</span>
                      </div>
                      <p className="font-medium">{item.title}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* 新着求人 */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6 text-primary" />
                新着求人
              </h3>
              <Button variant="ghost" size="sm">
                すべての求人を見る
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredListings?.map((job) => (
                  <motion.div
                    key={job.id}
                    variants={item}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="group hover:shadow-lg transition-all">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{job.businessName}</span>
                          <Badge variant="outline">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            {job.location}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center text-muted-foreground">
                            <Building className="h-4 w-4 mr-2" />
                            <span>{job.serviceType}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Banknote className="h-4 w-4 mr-2" />
                            <span>日給 ¥{job.minimumGuarantee?.toLocaleString()} ~ ¥{job.maximumGuarantee?.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-4">
                            {job.transportationSupport && (
                              <Badge variant="outline" className="bg-primary/10">
                                交通費支給
                              </Badge>
                            )}
                            {job.housingSupport && (
                              <Badge variant="outline" className="bg-primary/10">
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
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

interface StoreProfile {
  id: number;
  businessName: string;
  location: string;
  serviceType: string;
  minimumGuarantee?: number;
  maximumGuarantee?: number;
  transportationSupport: boolean;
  housingSupport: boolean;
}