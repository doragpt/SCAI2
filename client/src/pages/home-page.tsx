import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { StoreProfile } from "@shared/schema";
import { Loader2, MapPin, Banknote, Clock, Building } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { SEO } from "@/lib/seo";

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
          <section className="mb-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              AIが最適な求人をご提案
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              会員登録でAIマッチング機能が使えます
            </p>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>出稼ぎ希望の方</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    希望条件に合った求人をAIが提案。
                    地域や期間、給与など、あなたの希望に沿った求人をご紹介します。
                  </p>
                  {!user && (
                    <Button asChild className="w-full">
                      <Link href="/auth">AIマッチングを利用する（無料登録）</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>在籍希望の方</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    お住まいの地域で、あなたの希望に合った店舗をAIが提案。
                    面接日程の調整もスムーズに行えます。
                  </p>
                  {!user && (
                    <Button asChild className="w-full">
                      <Link href="/auth">AIマッチングを利用する（無料登録）</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">新着求人情報</h3>
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

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="業種を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全ての業種</SelectItem>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings?.map((job) => (
                  <Card key={job.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{job.businessName}</span>
                        <span className="text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          {job.location}
                        </span>
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
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              交通費支給
                            </span>
                          )}
                          {job.housingSupport && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              寮完備
                            </span>
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
                ))}
              </div>
            )}
          </section>

          <section className="text-center">
            <h3 className="text-2xl font-bold mb-6">AIマッチングの特徴</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>高精度なマッチング</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    あなたの希望条件と求人情報を分析し、最適な求人をAIが提案します。
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>スムーズな面接設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    気になった求人には、その場で面接予約が可能。日程調整も簡単です。
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>安心の身元確認</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    全ての求人情報は厳正な審査を経て掲載。安心して働ける環境をご提供します。
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}