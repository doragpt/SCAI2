import { type JobResponse, type ServiceType } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Banknote, Clock } from "lucide-react";
import { HtmlContent } from "@/components/html-content";
import { formatDate, formatSalary, getServiceTypeLabel } from "@/lib/utils";
import { Link } from "wouter";
import { motion } from "framer-motion";

interface JobCardProps {
  job: JobResponse;
  variant?: "grid" | "list";
  highlighted?: boolean;
}

/**
 * 求人カードコンポーネント
 * 一覧表示用と詳細表示用のバリエーションを持つ
 */
export function JobCard({ job, variant = "grid", highlighted = false }: JobCardProps) {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={item} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={`/jobs/${job.id}`}>
        <Card 
          className={`h-full cursor-pointer border transition-all ${
            highlighted 
              ? "border-primary/30 bg-primary/5 shadow-md hover:shadow-lg"
              : "hover:border-primary/20 hover:shadow-md"
          }`}
        >
          <CardHeader className={variant === "grid" ? "pb-3" : "pb-2 md:pb-3"}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg line-clamp-2">
                  {job.businessName}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                  <div className="flex items-center shrink-0">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-rose-500" />
                    {job.location}
                  </div>
                  <div className="flex items-center shrink-0">
                    <Building2 className="h-3.5 w-3.5 mr-1 text-blue-500" />
                    {getServiceTypeLabel(job.serviceType as ServiceType)}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {/* 給与情報 */}
              <div className="flex items-center text-primary font-semibold">
                <Banknote className="h-4 w-4 mr-2 text-green-600" />
                <span>
                  {formatSalary(
                    job.minimumGuarantee, 
                    job.maximumGuarantee,
                    job.workingTimeHours,
                    job.averageHourlyPay
                  )}
                </span>
              </div>
              
              {/* 勤務時間 */}
              {job.workingHours && (
                <div className="flex items-center text-sm text-gray-700">
                  <Clock className="h-3.5 w-3.5 mr-2 text-gray-500" />
                  {job.workingHours}
                </div>
              )}
              
              {/* キャッチコピー */}
              {job.catchPhrase && (
                <div className="text-sm text-gray-700 line-clamp-2 mt-2 italic">
                  {job.catchPhrase}
                </div>
              )}
              
              {/* 福利厚生バッジ */}
              <div className="flex flex-wrap gap-2 mt-1 pt-1 border-t border-gray-100">
                {job.transportationSupport && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    交通費支給
                  </Badge>
                )}
                {job.housingSupport && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    寮完備
                  </Badge>
                )}
                {job.benefits && job.benefits.length > 0 && job.benefits[0] && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {job.benefits[0]}
                  </Badge>
                )}
                {job.benefits && job.benefits.length > 1 && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    +{job.benefits.length - 1}
                  </Badge>
                )}
              </div>
              
              {/* 投稿日 */}
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(job.updatedAt || job.createdAt)}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}