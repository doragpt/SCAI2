import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Building, Briefcase, Clock, CreditCard, Bus, Home, Star, Info } from "lucide-react";
import { motion } from "framer-motion";
import { MatchedJob } from "@/hooks/use-matching";

interface MatchedJobCardProps {
  job: MatchedJob;
  index: number;
  onViewDetails: (job: MatchedJob) => void;
}

export const MatchedJobCard: React.FC<MatchedJobCardProps> = ({ job, index, onViewDetails }) => {
  // 円グラフのスコア表示のためのスタイル計算
  const scorePercent = Math.round(job.matchScore * 100);
  const circumference = 2 * Math.PI * 40; // SVG円の周囲長
  const dashOffset = circumference - (circumference * scorePercent) / 100;
  
  // マッチ理由のグループ化（カテゴリごとに整理）
  const matchReasonsByCategory = {
    location: job.matches.filter(m => m.includes('エリア') || m.includes('地域')),
    guarantee: job.matches.filter(m => m.includes('給与') || m.includes('保証') || m.includes('時給')),
    workType: job.matches.filter(m => m.includes('業種') || m.includes('仕事')),
    support: job.matches.filter(m => m.includes('交通') || m.includes('宿泊') || m.includes('サポート')),
    other: job.matches.filter(m => 
      !m.includes('エリア') && 
      !m.includes('地域') && 
      !m.includes('給与') && 
      !m.includes('保証') && 
      !m.includes('時給') && 
      !m.includes('業種') && 
      !m.includes('仕事') && 
      !m.includes('交通') && 
      !m.includes('宿泊') && 
      !m.includes('サポート')
    )
  };

  // メインとなるマッチング理由を2つ選択
  const primaryReasons = [
    job.matches[0], 
    job.matches.length > 1 ? job.matches[1] : null
  ].filter(Boolean) as string[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow border-l-4" 
        style={{ borderLeftColor: scorePercent >= 80 ? '#10b981' : scorePercent >= 60 ? '#3b82f6' : '#6b7280' }}
      >
        <CardHeader className="pb-2 pt-3 px-4 flex flex-row justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-12 w-12 bg-gradient-to-br from-primary/20 to-primary/30">
                <AvatarFallback className="text-primary text-lg">
                  {job.businessName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5">
                <Badge variant={scorePercent >= 80 ? "success" : scorePercent >= 60 ? "default" : "secondary"} className="text-xs px-1.5 py-0">
                  {index + 1}位
                </Badge>
              </div>
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {job.businessName}
              </CardTitle>
              <div className="flex items-center text-muted-foreground text-sm mt-1">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>{job.location}</span>
                <span className="mx-2">•</span>
                <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>{job.serviceType}</span>
              </div>
            </div>
          </div>
          
          {/* マッチングスコア表示（円グラフ） */}
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={scorePercent >= 80 ? '#10b981' : scorePercent >= 60 ? '#3b82f6' : '#6b7280'}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{scorePercent}%</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground mt-1">マッチ度</span>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pb-2 pt-0">
          {/* マッチング理由のハイライト */}
          <div className="bg-muted/30 rounded-lg p-3 mb-3">
            <div className="flex items-start space-x-2">
              <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium mb-1">マッチング理由</div>
                <div className="space-y-1">
                  {primaryReasons.map((reason, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground flex items-start">
                      <div className="w-1 h-1 rounded-full bg-primary mt-1.5 mr-1.5 flex-shrink-0"></div>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
  
          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-primary/70" />
              <div className="text-sm">
                保証: <span className="font-medium">
                  {job.minimumGuarantee && job.maximumGuarantee ? 
                    `${job.minimumGuarantee.toLocaleString()}円〜${job.maximumGuarantee.toLocaleString()}円` : 
                    job.minimumGuarantee ? 
                      `${job.minimumGuarantee.toLocaleString()}円〜` : 
                      job.maximumGuarantee ? 
                        `〜${job.maximumGuarantee.toLocaleString()}円` : '応相談'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary/70" />
              <div className="text-sm">
                時間: <span className="font-medium">{job.workingHours || '応相談'}</span>
              </div>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Bus className="h-4 w-4 mr-2 text-primary/70" />
                    <div className="text-sm">
                      交通費: <span className={`font-medium ${job.transportationSupport ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {job.transportationSupport ? '支給あり' : 'なし'}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>交通費の支給{job.transportationSupport ? 'があります' : 'はありません'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Home className="h-4 w-4 mr-2 text-primary/70" />
                    <div className="text-sm">
                      宿泊: <span className={`font-medium ${job.housingSupport ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {job.housingSupport ? '支援あり' : 'なし'}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>宿泊施設の提供{job.housingSupport ? 'があります' : 'はありません'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* カテゴリー別のマッチング強度バー */}
          <div className="space-y-2 mb-2">
            {Object.entries(matchReasonsByCategory).map(([category, reasons]) => {
              if (reasons.length === 0) return null;
              
              // カテゴリごとのマッチング強度を計算（理由の数とキーワードの重みに基づく）
              let strength = Math.min(reasons.length * 20, 100);
              
              // 特定のキーワードでスコアを調整
              if (reasons.some(r => r.includes('完全一致') || r.includes('非常に') || r.includes('最適'))) {
                strength = Math.min(strength + 20, 100);
              }
              
              let label = '';
              let icon = <Info className="h-3.5 w-3.5" />;
              
              switch(category) {
                case 'location':
                  label = '地域適合度';
                  icon = <MapPin className="h-3.5 w-3.5" />;
                  break;
                case 'guarantee':
                  label = '給与適合度';
                  icon = <CreditCard className="h-3.5 w-3.5" />;
                  break;
                case 'workType':
                  label = '業種適合度';
                  icon = <Briefcase className="h-3.5 w-3.5" />;
                  break;
                case 'support':
                  label = 'サポート適合度';
                  icon = <Bus className="h-3.5 w-3.5" />;
                  break;
                case 'other':
                  label = 'その他適合度';
                  icon = <Info className="h-3.5 w-3.5" />;
                  break;
              }
              
              return (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center text-xs">
                      <span className="mr-1.5 text-muted-foreground">{icon}</span>
                      <span>{label}</span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-xs text-muted-foreground cursor-help">
                            {strength}%
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {reasons.slice(0, 2).join('、')}
                            {reasons.length > 2 ? `... 他${reasons.length - 2}件` : ''}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Progress value={strength} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </CardContent>
        
        <CardFooter className="px-4 pt-0 pb-3">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full mt-2" 
            onClick={() => onViewDetails(job)}
          >
            詳細を見る
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};