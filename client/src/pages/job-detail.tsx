import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StoreProfile } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Banknote, Clock, Building, Calendar, Phone } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Breadcrumb } from "@/components/breadcrumb";
import { SEO } from "@/lib/seo";

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [workingHours, setWorkingHours] = useState<number>(8);
  const [workingDays, setWorkingDays] = useState<number>(20);

  const { data: job, isLoading } = useQuery<StoreProfile>({
    queryKey: ["/api/jobs", id],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">求人情報が見つかりませんでした。</p>
            <Button asChild className="mt-4">
              <Link href="/">トップページに戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateMonthlyIncome = () => {
    const dailyMin = job.minimumGuarantee || 0;
    const dailyMax = job.maximumGuarantee || 0;
    const monthlyMin = dailyMin * workingDays;
    const monthlyMax = dailyMax * workingDays;
    return { monthlyMin, monthlyMax };
  };

  const { monthlyMin, monthlyMax } = calculateMonthlyIncome();

  const breadcrumbItems = [
    { label: "トップ", href: "/" },
    { label: job.location, href: `/?area=${encodeURIComponent(job.location)}` },
    { label: job.businessName },
  ];

  const seoData = {
    title: `${job.businessName}の求人情報`,
    description: `${job.location}エリアの${job.serviceType}求人。日給${job.minimumGuarantee?.toLocaleString()}円～${job.maximumGuarantee?.toLocaleString()}円。交通費支給、寮完備など充実した待遇をご用意。`,
    jobPosting: {
      title: `${job.businessName}スタッフ募集`,
      description: `${job.location}エリアの${job.serviceType}求人。未経験者歓迎、充実した待遇をご用意しています。`,
      datePosted: new Date().toISOString(),
      employmentType: "アルバイト",
      hiringOrganization: {
        name: job.businessName,
        address: {
          addressLocality: job.location,
          addressRegion: "東京都",
        },
      },
      jobLocation: {
        addressLocality: job.location,
        addressRegion: "東京都",
      },
      baseSalary: {
        minValue: job.minimumGuarantee || 0,
        maxValue: job.maximumGuarantee || 0,
        currency: "JPY",
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO {...seoData} />
      <main className="container mx-auto px-4 py-8">
        <Breadcrumb items={breadcrumbItems} />

        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{job.businessName}</CardTitle>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{job.location}</span>
                </div>
              </div>
              <Button asChild>
                {user ? (
                  <Link href={`/jobs/${id}/apply`}>面接予約をする</Link>
                ) : (
                  <Link href="/auth">会員登録して面接予約</Link>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">店舗情報</TabsTrigger>
                <TabsTrigger value="requirements">応募資格</TabsTrigger>
                <TabsTrigger value="benefits">待遇</TabsTrigger>
                <TabsTrigger value="interviews">スタッフインタビュー</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        <span className="font-medium">業種:</span>
                        <span className="ml-2">{job.serviceType}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="font-medium">営業時間:</span>
                        <span className="ml-2">10:00 - 翌5:00</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium">休日:</span>
                        <span className="ml-2">自由出勤制</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        <span className="font-medium">応募連絡先:</span>
                        <span className="ml-2">090-XXXX-XXXX</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requirements">
                <Card>
                  <CardContent className="p-6">
                    <ul className="list-disc list-inside space-y-2">
                      <li>18歳以上（高校生不可）</li>
                      <li>経験不問</li>
                      <li>未経験者歓迎</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="benefits">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      {job.transportationSupport && (
                        <div className="flex items-center">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs mr-2">
                            交通費支給
                          </span>
                          <span>全額支給</span>
                        </div>
                      )}
                      {job.housingSupport && (
                        <div className="flex items-center">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs mr-2">
                            寮完備
                          </span>
                          <span>即日入居可能</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interviews">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-8">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-medium mb-2">Aさん（24歳）の体験談</h4>
                        <p className="text-muted-foreground">
                          未経験でしたが、スタッフさんが丁寧に教えてくれて安心して働き始められました。
                          待機室も完全個室で、プライバシーが守られているので快適に過ごせています。
                        </p>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-medium mb-2">Bさん（22歳）の体験談</h4>
                        <p className="text-muted-foreground">
                          リピーターのお客様が多く、安定した収入が得られます。
                          自由出勤制なので、自分のペースで働けるのも魅力です。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>給与シミュレーション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>1日の勤務時間</Label>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={workingHours}
                    onChange={(e) => setWorkingHours(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>月の勤務日数</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={workingDays}
                    onChange={(e) => setWorkingDays(parseInt(e.target.value))}
                  />
                </div>
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">月収シミュレーション</div>
                  <div className="text-2xl font-bold">
                    ¥{monthlyMin.toLocaleString()} ~ ¥{monthlyMax.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}