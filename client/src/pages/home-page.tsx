import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { type JobResponse, type ServiceType, serviceTypes } from "@shared/schema";
import {
  Loader2,
  MapPin,
  Banknote,
  Star,
  ChevronRight,
  Building2,
  Check,
  AlertCircle,
} from "lucide-react";
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
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useToast } from "@/hooks/use-toast";

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

// 給与表示のフォーマット
const formatSalary = (min?: number | null, max?: number | null): string => {
  if (!min && !max) return "応相談";
  if (!max) return `${min?.toLocaleString()}円〜`;
  if (!min) return `〜${max?.toLocaleString()}円`;
  return `${min.toLocaleString()}円〜${max?.toLocaleString()}円`;
};

// JobCardコンポーネント
const JobCard = ({ job }: { job: JobResponse }) => {
  return (
    <motion.div
      variants={item}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="group hover:shadow-lg transition-all h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg line-clamp-2">
                {job.businessName}
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {job.location}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/5">
              {job.displayServiceType}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center text-primary font-semibold">
              <Banknote className="h-5 w-5 mr-2" />
              <span>日給 {formatSalary(job.minimumGuarantee, job.maximumGuarantee)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.selectedBenefits.includes("交通費支給") && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  交通費支給
                </Badge>
              )}
              {job.selectedBenefits.includes("寮完備") && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Building2 className="h-3.5 w-3.5 mr-1" />
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
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedType, setSelectedType] = useState<string>("all");
  const { toast } = useToast();

  const { data: jobListings = [], isLoading: jobsLoading, error } = useQuery<JobResponse[]>({
    queryKey: [QUERY_KEYS.JOBS_PUBLIC],
    queryFn: async () => {
      try {
        const response = await fetch("/api/jobs");
        if (!response.ok) {
          throw new Error("求人情報の取得に失敗しました");
        }
        const data = await response.json();
        return data.jobs;
      } catch (error) {
        console.error("求人情報取得エラー:", error);
        toast({
          variant: "destructive",
          title: "エラーが発生しました",
          description: error instanceof Error ? error.message : "求人情報の取得に失敗しました"
        });
        return [];
      }
    }
  });

  if (authLoading || jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  const filteredListings = jobListings.filter(job => {
    if (!job) return false;
    return selectedType === "all" || job.serviceType === selectedType;
  }).slice(0, 6);

  return (
    <>
      <SEO
        title="SCAI - 高収入求人マッチングサイト"
        description="AIが最適な求人をご提案。高収入・好条件の求人が見つかる求人マッチングサイト"
      />
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Star className="h-6 w-6 text-primary" />
                  新着求人
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  最新の高収入求人をチェック
                </p>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
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

            {error ? (
              <Card className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">データの取得に失敗しました</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : "エラーが発生しました"}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  再読み込み
                </Button>
              </Card>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  条件に合う求人が見つかりませんでした
                </p>
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredListings.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </motion.div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}