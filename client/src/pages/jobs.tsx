import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Search } from "lucide-react";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { prefectures, serviceTypes, type Job } from "@shared/schema";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

// Animation variants
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

// APIレスポンスの型定義
interface JobsResponse {
  jobs: Job[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

// 給与表示のフォーマット関数
const formatSalary = (min?: number | null, max?: number | null) => {
  if (!min && !max) return "応相談";
  if (!max) return `${min?.toLocaleString()}円〜`;
  if (!min) return `〜${max?.toLocaleString()}円`;
  return `${min?.toLocaleString()}円 〜 ${max?.toLocaleString()}円`;
};

// 求人カードコンポーネント
const JobCard = ({ job }: { job: Job }) => {
  return (
    <motion.div variants={item}>
      <Link href={`/jobs/${job.id}`}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">{job.businessName}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">業種</p>
                <p className="text-sm text-muted-foreground">
                  {job.serviceType === "deriheru" ? "デリバリーヘルス" :
                   job.serviceType === "hoteheru" ? "ホテヘル" :
                   job.serviceType === "esthe" ? "エステ" : job.serviceType}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">給与</p>
                <p className="text-sm text-muted-foreground">
                  {formatSalary(job.minimumGuarantee, job.maximumGuarantee)}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                {job.transportationSupport && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                    交通費支給
                  </span>
                )}
                {job.housingSupport && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                    寮完備
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default function Jobs() {
  const { user } = useAuth();
  const [location, setLocation] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 12; // 1ページあたりの表示件数

  // URLパラメータからフィルター状態を復元
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locationParam = params.get("location");
    const serviceTypeParam = params.get("serviceType");
    const pageParam = params.get("page");

    if (locationParam) setLocation(locationParam);
    if (serviceTypeParam) setServiceType(serviceTypeParam);
    if (pageParam) setPage(parseInt(pageParam));
  }, []);

  // フィルター変更時にURLを更新
  useEffect(() => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (serviceType) params.set("serviceType", serviceType);
    if (page > 1) params.set("page", page.toString());

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [location, serviceType, page]);

  const {
    data: response,
    isLoading,
    error
  } = useQuery<JobsResponse>({
    queryKey: ["/api/jobs/search", { location, serviceType, page, limit }],
  });

  // エラー発生時にトースト表示
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: "求人情報の取得に失敗しました。時間をおいて再度お試しください。"
      });
    }
  }, [error]);

  // フィルター変更時にページをリセット
  useEffect(() => {
    setPage(1);
  }, [location, serviceType]);

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/talent/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">お仕事検索</h1>
          <div className="w-10" /> {/* スペーサー */}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-20">
        {/* フィルター */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Select value={location || "all"} onValueChange={setLocation}>
            <SelectTrigger>
              <SelectValue placeholder="エリアを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全てのエリア</SelectItem>
              {prefectures.map((pref) => (
                <SelectItem key={pref} value={pref}>
                  {pref}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={serviceType || "all"} onValueChange={setServiceType}>
            <SelectTrigger>
              <SelectValue placeholder="業種を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ての業種</SelectItem>
              {serviceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "deriheru" ? "デリバリーヘルス" :
                   type === "hoteheru" ? "ホテヘル" :
                   type === "esthe" ? "エステ" : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 求人一覧 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !response?.jobs.length ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              条件に合う求人が見つかりませんでした
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {response.pagination.totalItems}件の求人が見つかりました
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {response.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </motion.div>

            {/* ページネーション */}
            {response.pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={response.pagination.currentPage}
                  totalPages={response.pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}