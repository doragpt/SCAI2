import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS, getJobsQuery } from "@/lib/queryClient";

// ServiceTypeの型定義
type ServiceType = {
  id: string;
  label: string;
};

// サービスタイプの定義
const serviceTypes: ServiceType[] = [
  { id: "deriheru", label: "デリヘル" },
  { id: "hoteheru", label: "ホテヘル" },
  { id: "hakoheru", label: "箱ヘル" },
  { id: "esthe", label: "エステ" },
  { id: "onakura", label: "オナクラ" },
  { id: "mseikan", label: "M性感" },
];

import {
  Loader2,
  MapPin,
  Banknote,
  Clock,
  Building,
  Star,
  Bell,
  ChevronRight,
  Search,
  BookOpen,
  Wallet,
  HelpCircle,
  MessageSquare,
  User as UserIcon,
  Check,
  Building2,
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
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BlockQuote } from "@/components/ui/blockquote";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import React from 'react';


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

// カスタムアイコンコンポーネント
const IconWrapper = ({ type, className }: { type: string; className?: string }) => {
  const IconComponent = {
    BookOpen,
    Wallet,
    HelpCircle,
  }[type];

  return IconComponent ? <IconComponent className={className} /> : null;
};

const areaGroups = [
  { label: "北海道・東北", areas: ["北海道", "青森県", "秋田県", "岩手県", "山形県", "福島県", "宮城県"] },
  { label: "関東", areas: ["東京都", "神奈川県", "千葉県", "埼玉県", "茨城県", "栃木県", "群馬県"] },
  { label: "中部", areas: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { label: "関西", areas: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { label: "中国", areas: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] },
  { label: "四国", areas: ["徳島県", "香川県", "愛媛県", "高知県"] },
  { label: "九州・沖縄", areas: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
];


// getServiceTypeLabelの修正
const getServiceTypeLabel = (serviceType: ServiceType): string => {
  return serviceType.label || "";
};

// データの追加
const workGuides = [
  {
    title: "はじめての方へ",
    description: "お仕事の流れや準備するものなど、初めての方向けの詳しい説明です",
    icon: "BookOpen",
  },
  {
    title: "お給料について",
    description: "給与システムや報酬の受け取り方について詳しく解説",
    icon: "Wallet",
  },
  {
    title: "よくある質問",
    description: "求人に関するよくある疑問にお答えします",
    icon: "HelpCircle",
  },
];

const testimonials = [
  {
    name: "Aさん (26歳)",
    role: "エステ",
    content: "未経験でも丁寧に教えていただき、今では安定した収入を得られています。",
    image: "/testimonials/1.jpg",
  },
  {
    name: "Bさん (31歳)",
    role: "セラピスト",
    content: "子育て中でも柔軟なシフトで働けて助かっています。",
    image: "/testimonials/2.jpg",
  },
];

// エリア統計の型定義
type AreaStats = {
  [key: string]: number;
};

const areaStats: AreaStats = {
  "北海道・東北": 234,
  "関東": 567,
  "中部": 345,
  "関西": 456,
  "中国": 123,
  "四国": 89,
  "九州・沖縄": 234,
};

// 給与範囲の表示用フォーマッター
const formatSalary = (min?: number, max?: number) => {
  if (!min && !max) return "応相談";
  if (!max) return `${min?.toLocaleString()}円〜`;
  if (!min) return `〜${max?.toLocaleString()}円`;
  return `${min?.toLocaleString()}円 〜 ${max?.toLocaleString()}円`;
};

// ジョブデータの型定義
interface Job {
  id: number;
  business_name: string;
  location: string;
  service_type: ServiceType;
  minimum_guarantee: number | null;
  maximum_guarantee: number | null;
  transportation_support: boolean;
  housing_support: boolean;
}

// JobCardコンポーネントを修正
const JobCard = ({ job }: { job: Job }) => {
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
                {job.business_name}
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {job.location}
              </CardDescription>
            </div>
            <HoverCard>
              <HoverCardTrigger>
                <Badge variant="outline" className="bg-primary/5">
                  {getServiceTypeLabel(job.service_type)}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm">
                  {getServiceTypeLabel(job.service_type)}に関する求人です
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center text-primary font-semibold">
              <Banknote className="h-5 w-5 mr-2" />
              <span>日給 {formatSalary(job.minimum_guarantee, job.maximum_guarantee)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.transportation_support && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  交通費支給
                </Badge>
              )}
              {job.housing_support && (
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
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to SCAI</CardTitle>
          </CardHeader>
          <CardContent>
            <p>高収入求人マッチングサイト</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}