import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type JobResponse, type ServiceType } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Breadcrumb } from "@/components/breadcrumb";
import { SEO, type SEOProps } from "@/lib/seo";
import { toast } from "@/hooks/use-toast";
import { getServiceTypeLabel, formatSalary, formatDate, getErrorMessage } from "@/lib/utils";
import { QUERY_KEYS } from "@/constants/queryKeys";

// 新しく作成したコンポーネントをインポート
import { SalaryDisplay } from "@/components/store/SalaryDisplay";
import { JobDescriptionDisplay } from "@/components/store/JobDescriptionDisplay";
import { LocationDisplay } from "@/components/store/LocationDisplay";
import { ContactDisplay } from "@/components/store/ContactDisplay";

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
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
        
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error("求人詳細の取得に失敗しました");
        }

        const result = await response.json();
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

  // 月収シミュレーション計算
  const calculateMonthlyIncome = () => {
    if (job?.workingTimeHours && job.workingTimeHours > 0 && job?.averageHourlyPay && job.averageHourlyPay > 0) {
      const dailyIncome = job.averageHourlyPay;
      const monthlyIncome = dailyIncome * workingDays;
      return monthlyIncome;
    } else if (job?.minimumGuarantee || job?.maximumGuarantee) {
      // 最低保証と最高保証の平均値を計算
      const minGuarantee = job.minimumGuarantee || 0;
      const maxGuarantee = job.maximumGuarantee || minGuarantee;
      const avgGuarantee = (minGuarantee + maxGuarantee) / 2;
      return avgGuarantee * workingDays;
    }
    
    return 0;
  };

  const monthlyIncome = calculateMonthlyIncome();

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
            minValue: job.averageHourlyPay, 
            maxValue: job.averageHourlyPay, 
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

        {/* ヘッダー部分 - 店舗名、場所、ボタン */}
        <Card className="mb-8 overflow-hidden">
          <CardHeader className="pb-0 md:pb-0 relative">
            {job.top_image && (
              <div className="absolute inset-0 opacity-10 overflow-hidden h-full">
                <img 
                  src={job.top_image} 
                  alt={job.businessName} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
              </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start relative z-10">
              <div>
                <h1 className="text-3xl font-bold mb-2">{job.businessName}</h1>
                <div className="text-muted-foreground">
                  <span>{job.location}</span> - <span>{getServiceTypeLabel(job.serviceType as ServiceType)}</span>
                </div>
                
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {formatSalary(
                      job.minimumGuarantee,
                      job.maximumGuarantee,
                      job.workingTimeHours,
                      job.averageHourlyPay
                    )}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <Button size="lg" asChild>
                  {user ? (
                    <Link href={`/jobs/${id}/apply`}>面接予約をする</Link>
                  ) : (
                    <Link href="/auth">会員登録して面接予約</Link>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-6 pt-4 relative z-10">
            {job.catchPhrase && (
              <p className="text-lg italic text-muted-foreground">{job.catchPhrase}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-4">
              {job.transportationSupport && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                  交通費支給
                </span>
              )}
              {job.housingSupport && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100">
                  寮完備
                </span>
              )}
              {job.benefits && job.benefits.slice(0, 3).map((benefit, index) => (
                <span key={index} className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                  {benefit}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
          {/* 左側のメインコンテンツ - 仕事内容と応募条件 */}
          <div className="md:col-span-2 space-y-8">
            {/* 仕事内容コンポーネント */}
            <JobDescriptionDisplay
              businessName={job.businessName}
              location={job.location}
              serviceType={job.serviceType as ServiceType}
              catchPhrase={job.catchPhrase}
              description={job.description}
              workingHours={job.workingHours}
              requirements={job.requirements}
            />
            
            {/* アクセス・所在地情報 */}
            <LocationDisplay
              address={job.address}
              accessInfo={job.access_info}
              securityMeasures={job.security_measures}
            />
            
            {/* 連絡先情報 */}
            <ContactDisplay
              recruiterName={job.recruiter_name}
              phoneNumbers={job.phone_numbers}
              emailAddresses={job.email_addresses}
              pcWebsiteUrl={job.pc_website_url}
              mobileWebsiteUrl={job.mobile_website_url}
            />
          </div>

          {/* 右側のサイドバー - 給与情報と月収計算 */}
          <div className="space-y-8">
            {/* 給与情報コンポーネント */}
            <SalaryDisplay
              minimumGuarantee={job.minimumGuarantee}
              maximumGuarantee={job.maximumGuarantee}
              workingTimeHours={job.workingTimeHours}
              averageHourlyPay={job.averageHourlyPay}
              transportationSupport={job.transportationSupport}
              housingSupport={job.housingSupport}
              benefits={job.benefits}
            />
            
            {/* 月収シミュレーター */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">月収シミュレーション</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="workingDays" className="text-sm">月の勤務日数:</label>
                  <Input
                    id="workingDays"
                    type="number"
                    min={1}
                    max={31}
                    value={workingDays}
                    onChange={(e) => setWorkingDays(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm">日</span>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">1ヶ月の想定収入</div>
                  <div className="text-2xl font-bold text-green-700">
                    {monthlyIncome > 0 
                      ? `${monthlyIncome.toLocaleString()}円`
                      : "収入情報がありません"}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    ※実際の収入は経験や勤務状況により異なります
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 italic">
                  <p>詳しい給与条件や待遇については、面接時にお気軽にお問い合わせください。</p>
                </div>
              </CardContent>
            </Card>
            
            {/* 更新日情報 */}
            <div className="text-xs text-muted-foreground text-right">
              最終更新日: {formatDate(job.updatedAt)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}