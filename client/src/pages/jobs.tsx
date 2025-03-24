import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Filter, MapPin, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  type JobResponse
} from "@shared/schema";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { getServiceTypeLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { QUERY_KEYS } from "@/constants/queryKeys";

// 新しいJobCardコンポーネントをインポート
import { JobCard } from "@/components/store/JobCard";

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

export default function Jobs() {
  const { user } = useAuth();
  const [location, setLocation] = useState<string>("all");
  const [serviceType, setServiceType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 12;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locationParam = params.get("location") || "all";
    const serviceTypeParam = params.get("serviceType") || "all";
    const pageParam = parseInt(params.get("page") || "1");

    setLocation(locationParam);
    setServiceType(serviceTypeParam);
    setPage(pageParam);
  }, []);

  const { data: response, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.JOBS_PUBLIC, { page, limit, location, serviceType }],
    queryFn: async () => {
      try {
        console.log('Fetching jobs data...', { page, limit, location, serviceType });
        const searchParams = new URLSearchParams();
        searchParams.append("page", page.toString());
        searchParams.append("limit", limit.toString());
        if (location !== "all") searchParams.append("location", location);
        if (serviceType !== "all") searchParams.append("serviceType", serviceType);
        
        const url = `/api${QUERY_KEYS.JOBS_PUBLIC}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
        console.log('Requesting URL:', url);
        
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error("求人情報の取得に失敗しました");
        }

        const result = await response.json();
        console.log('Jobs API Response:', result);
        
        // レスポンス形式を確認して適切に整形
        if (result && Array.isArray(result)) {
          // 配列で返ってきた場合はページネーション情報を追加
          return {
            jobs: result,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(result.length / limit),
              totalItems: result.length
            }
          };
        } else if (result && result.jobs && result.pagination) {
          // すでに正しい形式で返ってきた場合はそのまま返却
          return result;
        } else {
          console.error('Invalid API response format:', result);
          return {
            jobs: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0
            }
          };
        }
      } catch (error) {
        console.error("求人情報取得エラー:", error);
        throw error;
      }
    }
  });

  // エラー処理
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error instanceof Error 
          ? error.message 
          : "求人情報の取得に失敗しました。時間をおいて再度お試しください。"
      });
    }
  }, [error]);

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
                {type}
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
      ) : !response?.jobs?.length ? (
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
            {response.jobs.map((job: JobResponse) => (
              <JobCard key={job.id} job={job} />
            ))}
          </motion.div>

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