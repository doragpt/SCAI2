import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type JobResponse, type ServiceType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Building, Calendar, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Breadcrumb } from "@/components/breadcrumb";
import { SEO, type SEOProps } from "@/lib/seo";
import { toast } from "@/hooks/use-toast";
import { getServiceTypeLabel, formatSalary, formatDate, getErrorMessage } from "@/lib/utils";
import { QUERY_KEYS } from "@/constants/queryKeys";

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [workingHours, setWorkingHours] = useState<number>(8);
  const [workingDays, setWorkingDays] = useState<number>(20);
  
  // IDが確実に存在する場合のみ処理を進めるための安全対策
  const isValidId = id ? !isNaN(parseInt(id)) : false;
  const jobId = isValidId ? id : '';

  const {
    data: job,
    isLoading,
    error
  } = useQuery({
    queryKey: [QUERY_KEYS.JOB_DETAIL(jobId)],
    enabled: Boolean(isValidId),
    queryFn: async (): Promise<JobResponse> => {
      try {
        console.log('Fetching job detail...', { id });
        const url = `/api${QUERY_KEYS.JOB_DETAIL(jobId)}`;
        console.log('Requesting URL:', url);
        
        const response = await fetch(url);
        console.log('API Response:', response);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error("求人詳細の取得に失敗しました");
        }

        const result = await response.json();
        console.log('Job Detail API Response:', result);
        return result as JobResponse;
      } catch (error) {
        console.error("求人詳細取得エラー:", error);
        throw error;
      }
    }
  });
  
  // エラー処理
  useEffect(() => {
    if (error) {
      console.error("求人詳細取得エラー:", error);
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: getErrorMessage(error)
      });
    }
  }, [error]);

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
              <Link href="/jobs">求人一覧に戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateMonthlyIncome = () => {
    // 時給方式の場合
    if (job?.workingTimeHours && job.workingTimeHours > 0 && job?.averageHourlyPay && job.averageHourlyPay > 0) {
      // 日給は時給そのもの（時間×時給ではない）
      const dailyIncome = job.averageHourlyPay;
      const monthlyIncome = dailyIncome * workingDays;
      // 時給方式の場合は最小値と最大値を同じにする
      return { monthlyMin: monthlyIncome, monthlyMax: monthlyIncome };
    }
    
    // 従来の最低保証・最高保証方式
    const dailyMin = job?.minimumGuarantee || 0;
    const dailyMax = job?.maximumGuarantee || 0;
    const monthlyMin = dailyMin * workingDays;
    const monthlyMax = dailyMax * workingDays;
    return { monthlyMin, monthlyMax };
  };

  const { monthlyMin, monthlyMax } = calculateMonthlyIncome();

  const breadcrumbItems = [
    { label: "求人一覧", href: "/jobs" },
    { label: job?.location || "", href: `/jobs?location=${encodeURIComponent(job?.location || "")}` },
    { label: job?.businessName || "" },
  ];

  const seoData: SEOProps = {
    title: `${job?.businessName || ""}の求人情報`,
    description: `${job?.location || ""}エリアの${getServiceTypeLabel((job?.serviceType || "ソープ") as ServiceType)}求人。日給${formatSalary(
      job?.minimumGuarantee, 
      job?.maximumGuarantee,
      job?.workingTimeHours,
      job?.averageHourlyPay
    )}。交通費支給、寮完備など充実した待遇をご用意。`,
    jobPosting: {
      title: `${job?.businessName || ""}スタッフ募集`,
      description: `${job?.location || ""}エリアの${getServiceTypeLabel((job?.serviceType || "ソープ") as ServiceType)}求人。未経験者歓迎、充実した待遇をご用意しています。`,
      datePosted: new Date(job?.createdAt || new Date()).toISOString(),
      employmentType: "アルバイト",
      hiringOrganization: {
        name: job?.businessName || "",
        address: {
          addressLocality: job?.location || "",
          addressRegion: "東京都",
        },
      },
      jobLocation: {
        addressLocality: job?.location || "",
        addressRegion: "東京都",
      },
      baseSalary: job?.workingTimeHours && job?.averageHourlyPay && job.workingTimeHours > 0 && job.averageHourlyPay > 0
        ? { 
            minValue: job.workingTimeHours * job.averageHourlyPay, 
            maxValue: job.workingTimeHours * job.averageHourlyPay, 
            currency: "JPY" 
          }
        : {
            minValue: job?.minimumGuarantee || 0,
            maxValue: job?.maximumGuarantee || 0,
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
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        <span className="font-medium">業種:</span>
                        <span className="ml-2">
                          {getServiceTypeLabel(job.serviceType as ServiceType)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="font-medium">営業時間:</span>
                        <span className="ml-2">{job.workingHours || "10:00 - 翌5:00"}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium">更新日:</span>
                        <span className="ml-2">{formatDate(job.updatedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requirements">
                <Card>
                  <CardContent className="p-6">
                    <div className="whitespace-pre-wrap">
                      {job.requirements || "18歳以上（高校生不可）\n経験不問\n未経験者歓迎"}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="benefits">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="whitespace-pre-wrap">
                        {Array.isArray(job.benefits) ? job.benefits.join(', ') : typeof job.benefits === 'string' ? job.benefits : ''}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
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
                    {job?.workingTimeHours && job?.averageHourlyPay && 
                     job.workingTimeHours > 0 && job.averageHourlyPay > 0
                      ? `${(job.averageHourlyPay * workingDays).toLocaleString()}円`
                      : formatSalary(monthlyMin, monthlyMax)
                    }
                  </div>
                  {job?.workingTimeHours && job?.averageHourlyPay && 
                   job.workingTimeHours > 0 && job.averageHourlyPay > 0 && (
                    <div className="text-sm text-muted-foreground mt-2">
                      1日{job.workingTimeHours}時間勤務 × {workingDays}日 = 平均 {job.averageHourlyPay.toLocaleString()}円/日
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}