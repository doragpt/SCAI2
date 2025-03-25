import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type JobResponse, type ServiceType, type SpecialOffer } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Share, Heart, MapPin, Phone, Info, 
  Building, Clock, Banknote, ShieldCheck, CalendarDays
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Breadcrumb } from "@/components/breadcrumb";
import { SEO, type SEOProps } from "@/lib/seo";
import { toast } from "@/hooks/use-toast";
import { getServiceTypeLabel, formatSalary, formatDate, getErrorMessage } from "@/lib/utils";
import { QUERY_KEYS } from "@/constants/queryKeys";

// コンポーネントをインポート
import { SpecialOffersDisplay } from "@/components/store/SpecialOffersDisplay";
import { JobDetailExpanded } from "@/components/store/JobDetailExpanded";

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
        <Card className="mb-8 overflow-hidden shadow-lg border-0">
          <CardHeader className="pb-0 md:pb-0 relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            {job.top_image && (
              <div className="absolute inset-0 opacity-20 overflow-hidden h-full">
                <img 
                  src={job.top_image} 
                  alt={job.businessName} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80" />
              </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start relative z-10 py-4">
              <div>
                <div className="mb-1 text-sm font-medium text-blue-100">
                  <p>SCAI（スカイ）を見た</p>
                </div>
                <h1 className="text-3xl font-bold mb-3">{job.businessName}</h1>
                <div className="flex items-center flex-wrap gap-3 mb-4">
                  <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                    <MapPin className="h-4 w-4 mr-1 text-blue-100" />
                    <span className="text-white text-sm">{job.location}</span>
                  </div>
                  <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                    <Building className="h-4 w-4 mr-1 text-blue-100" />
                    <span className="text-white text-sm">{getServiceTypeLabel(job.serviceType as ServiceType)}</span>
                  </div>
                  {job.workingHours && (
                    <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                      <Clock className="h-4 w-4 mr-1 text-blue-100" />
                      <span className="text-white text-sm">{job.workingHours}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  <div className="inline-flex items-center px-3 py-1.5 bg-white text-blue-700 rounded-md text-sm font-medium">
                    <Banknote className="mr-1.5 h-4 w-4 text-blue-500" />
                    {formatSalary(
                      job.minimumGuarantee,
                      job.maximumGuarantee,
                      job.workingTimeHours,
                      job.averageHourlyPay
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-col gap-3">
                <Button size="lg" className="w-full bg-white text-blue-700 hover:bg-blue-50" asChild>
                  {user ? (
                    <Link href={`/jobs/${id}/apply`}>
                      <Phone className="mr-2 h-4 w-4" />
                      面接予約をする
                    </Link>
                  ) : (
                    <Link href="/auth">会員登録して面接予約</Link>
                  )}
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                    <Heart className="mr-1 h-4 w-4" />
                    <span className="text-xs">キープ</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                    <Share className="mr-1 h-4 w-4" />
                    <span className="text-xs">シェア</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-6 pt-6 relative z-10">
            {job.catchPhrase && (
              <div className="border-l-4 border-blue-500 pl-4 py-2 mb-4">
                <p className="text-lg italic text-gray-700 dark:text-gray-300">{job.catchPhrase}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {job.transportationSupport && (
                <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <ShieldCheck className="h-5 w-5 mr-2 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">交通費支給</span>
                </div>
              )}
              {job.housingSupport && (
                <div className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Building className="h-5 w-5 mr-2 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">寮完備</span>
                </div>
              )}
              {job.benefits && job.benefits.slice(0, 2).map((benefit, index) => (
                <div key={index} className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CalendarDays className="h-5 w-5 mr-2 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">{benefit}</span>
                </div>
              ))}
            </div>
            
            {job.benefits && job.benefits.length > 2 && (
              <div className="mt-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  その他の特典： 
                  {job.benefits.slice(2).map((benefit, index) => (
                    <span key={index} className="mx-1">{benefit}{index < job.benefits.slice(2).length - 1 ? '、' : ''}</span>
                  ))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 特別オファー表示 - もし存在すれば */}
        {job.specialOffers && Array.isArray(job.specialOffers) && job.specialOffers.length > 0 && (
          <SpecialOffersDisplay 
            specialOffers={job.specialOffers as SpecialOffer[]} 
            className="mb-8"
          />
        )}
        
        {/* バニラ風の拡張機能を持つ詳細コンポーネント */}
        <JobDetailExpanded 
          job={job} 
          onApply={() => {
            if (user) {
              window.location.href = `/jobs/${id}/apply`;
            } else {
              window.location.href = '/auth';
            }
          }}
          onKeep={() => {
            // キープ機能の実装
            toast({
              title: "キープしました",
              description: `${job.businessName}の求人をキープリストに追加しました`,
            });
          }}
          className="mt-6"
        />
        
        {/* スティッキーな応募ボタン */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-50 md:hidden">
          <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg" asChild>
            {user ? (
              <Link href={`/jobs/${id}/apply`}>
                <Phone className="mr-2 h-4 w-4" />
                面接予約をする
              </Link>
            ) : (
              <Link href="/auth">会員登録して面接予約</Link>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}