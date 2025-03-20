import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Banknote } from "lucide-react";
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
  type JobResponse,
} from "@shared/schema";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { formatSalary, formatDate } from "@/lib/utils";

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

const JobCard = ({ job }: { job: JobResponse }) => {
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
                  <MapPin className="h-4 w-4 mr-1" />
                  {job.location}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center text-primary font-semibold">
                <Banknote className="h-5 w-5 mr-2" />
                日給 {formatSalary(job.minimumGuarantee, job.maximumGuarantee)}
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
  const [page, setPage] = useState(1);
  const limit = 12;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locationParam = params.get("location") || "all";
    const pageParam = parseInt(params.get("page") || "1");

    setLocation(locationParam);
    setPage(pageParam);
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ["jobs", { page, limit, location }],
    queryFn: async () => {
      try {
        const url = new URL("/api/jobs/public", window.location.origin);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("limit", limit.toString());
        if (location !== "all") url.searchParams.append("location", location);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("求人情報の取得に失敗しました");
        }

        return response.json();
      } catch (error) {
        throw error;
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error.message
      });
    }
  });

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-1 gap-4">
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
      </div>

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
