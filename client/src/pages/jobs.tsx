import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { Link } from "wouter";
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
import { 
  prefectures, 
  serviceTypes, 
  type JobsSearchResponse, 
  type ServiceType, 
  type Job
} from "@shared/schema";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { getServiceTypeLabel, formatSalary, formatDate } from "@/lib/utils";
import { QUERY_KEYS, searchJobsQuery } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

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

// 求人カードコンポーネント
const JobCard = ({ job }: { job: Job }) => {
  return (
    <motion.div variants={item}>
      <Link href={`/jobs/${job.id}`}>
        <Card className="h-full hover:shadow-lg transition-all cursor-pointer group">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg line-clamp-2">
                  {job.businessName}
                </CardTitle>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Search className="h-4 w-4 mr-1" />
                  {job.location}
                </div>
              </div>
              <Badge variant="outline" className="bg-primary/5">
                {getServiceTypeLabel(job.serviceType as ServiceType)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center text-primary font-semibold">
                日給 {formatSalary(job.minimumGuarantee, job.maximumGuarantee)}
              </div>
              <div className="flex flex-wrap gap-2">
                {job.transportationSupport && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    交通費支給
                  </Badge>
                )}
                {job.housingSupport && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    寮完備
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {formatDate(job.createdAt)}
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
  const [location, setLocation] = useState<string>("all");
  const [serviceType, setServiceType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 12; // 1ページあたりの表示件数

  // URLパラメータからフィルター状態を復元
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locationParam = params.get("location") || "all";
    const serviceTypeParam = params.get("serviceType") || "all";
    const pageParam = params.get("page");

    setLocation(locationParam);
    setServiceType(serviceTypeParam);
    if (pageParam) setPage(parseInt(pageParam));
  }, []);

  // フィルター変更時にURLを更新
  useEffect(() => {
    const params = new URLSearchParams();
    if (location !== "all") params.set("location", location);
    if (serviceType !== "all") params.set("serviceType", serviceType);
    if (page > 1) params.set("page", page.toString());

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [location, serviceType, page]);

  const {
    data: response,
    isLoading,
    error
  } = useQuery({
    queryKey: [QUERY_KEYS.JOBS_SEARCH, { location, serviceType, page, limit }],
    queryFn: () => searchJobsQuery({ location, serviceType, page, limit }),
    onError: (error) => {
      console.error("求人情報取得エラー:", error);
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: "求人情報の取得に失敗しました。時間をおいて再度お試しください。"
      });
    }
  });

  // フィルター変更時にページをリセット
  useEffect(() => {
    setPage(1);
  }, [location, serviceType]);

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">お仕事検索</h1>
          <p className="text-muted-foreground">
            あなたに合った求人を見つけましょう
          </p>
        </div>
      </motion.div>

      {/* フィルター */}
      <div className="grid grid-cols-2 gap-4">
        <Select value={location} onValueChange={setLocation}>
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

        <Select value={serviceType} onValueChange={setServiceType}>
          <SelectTrigger>
            <SelectValue placeholder="業種を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全ての業種</SelectItem>
            {serviceTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {getServiceTypeLabel(type as ServiceType)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 求人一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
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
    </div>
  );
}