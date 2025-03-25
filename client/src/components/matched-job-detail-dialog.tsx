import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HtmlContent } from "@/components/html-content";
import { MatchedJob } from "@/hooks/use-matching";
import {
  MapPin,
  Building,
  Briefcase,
  Clock,
  CreditCard,
  Bus,
  Home,
  Star,
  Check,
  Info,
  Heart,
  PhoneCall,
  Send,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MatchedJobDetailDialogProps {
  job: MatchedJob | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: MatchedJob) => void;
  onKeep: (job: MatchedJob) => void;
}

export const MatchedJobDetailDialog: React.FC<MatchedJobDetailDialogProps> = ({
  job,
  isOpen,
  onClose,
  onApply,
  onKeep,
}) => {
  if (!job) return null;

  // マッチングスコアの計算
  const scorePercent = Math.round(job.matchScore * 100);
  
  // マッチング理由をカテゴリーごとに分類
  const categorizeReasons = () => {
    const categories: Record<string, string[]> = {
      location: [],
      guarantee: [],
      workType: [],
      support: [],
      other: [],
    };
    
    job.matches.forEach(reason => {
      if (reason.includes('エリア') || reason.includes('地域')) {
        categories.location.push(reason);
      } else if (reason.includes('給与') || reason.includes('保証') || reason.includes('時給')) {
        categories.guarantee.push(reason);
      } else if (reason.includes('業種') || reason.includes('仕事')) {
        categories.workType.push(reason);
      } else if (reason.includes('交通') || reason.includes('宿泊') || reason.includes('サポート')) {
        categories.support.push(reason);
      } else {
        categories.other.push(reason);
      }
    });
    
    return categories;
  };
  
  const categorizedReasons = categorizeReasons();
  
  // カテゴリ名の日本語マッピング
  const categoryLabels: Record<string, { label: string, icon: React.ReactNode }> = {
    location: { label: '地域', icon: <MapPin className="h-4 w-4" /> },
    guarantee: { label: '給与', icon: <CreditCard className="h-4 w-4" /> },
    workType: { label: '業種', icon: <Briefcase className="h-4 w-4" /> },
    support: { label: 'サポート', icon: <Bus className="h-4 w-4" /> },
    other: { label: 'その他', icon: <Info className="h-4 w-4" /> },
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center">
              {job.businessName}
              <Badge 
                className="ml-3" 
                variant={scorePercent >= 80 ? "success" : scorePercent >= 60 ? "default" : "secondary"}
              >
                マッチ度 {scorePercent}%
              </Badge>
            </DialogTitle>
          </div>
          <DialogDescription className="flex items-center text-foreground">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>{job.location}</span>
            <span className="mx-2">•</span>
            <Briefcase className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>{job.serviceType}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          {/* 左カラム: マッチング情報 */}
          <div className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
              <h3 className="font-medium flex items-center mb-3">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                マッチング分析
              </h3>
              
              <div className="space-y-4">
                {Object.entries(categorizedReasons).map(([category, reasons]) => {
                  if (reasons.length === 0) return null;
                  
                  const { label, icon } = categoryLabels[category];
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center text-sm font-medium">
                        <div className="mr-2 text-primary/70">{icon}</div>
                        <div>{label}マッチング</div>
                      </div>
                      <div className="pl-6 space-y-1">
                        {reasons.map((reason, idx) => (
                          <div key={idx} className="text-sm flex items-start">
                            <Check className="h-3 w-3 text-green-500 mt-1 mr-1.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4 border">
              <h3 className="font-medium flex items-center mb-3">
                <CreditCard className="h-5 w-5 text-primary/70 mr-2" />
                待遇・福利厚生
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1.5 rounded-md mr-3 flex-shrink-0">
                    <CreditCard className="h-4 w-4 text-primary/70" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">保証金額</div>
                    <div className="text-lg font-bold">
                      {job.minimumGuarantee && job.maximumGuarantee ? 
                        `${job.minimumGuarantee.toLocaleString()}円〜${job.maximumGuarantee.toLocaleString()}円` : 
                        job.minimumGuarantee ? 
                          `${job.minimumGuarantee.toLocaleString()}円〜` : 
                          job.maximumGuarantee ? 
                            `〜${job.maximumGuarantee.toLocaleString()}円` : '応相談'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1.5 rounded-md mr-3 flex-shrink-0">
                    <Clock className="h-4 w-4 text-primary/70" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">勤務時間</div>
                    <div className="text-lg">{job.workingHours || '応相談'}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start">
                    <div className={`p-1.5 rounded-md mr-3 flex-shrink-0 ${job.transportationSupport ? 'bg-green-100' : 'bg-muted'}`}>
                      <Bus className={`h-4 w-4 ${job.transportationSupport ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">交通費</div>
                      <div className="text-sm">{job.transportationSupport ? '支給あり' : 'なし'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className={`p-1.5 rounded-md mr-3 flex-shrink-0 ${job.housingSupport ? 'bg-green-100' : 'bg-muted'}`}>
                      <Home className={`h-4 w-4 ${job.housingSupport ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">宿泊施設</div>
                      <div className="text-sm">{job.housingSupport ? '提供あり' : 'なし'}</div>
                    </div>
                  </div>
                </div>
                
                {job.benefits && job.benefits.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">その他特典</div>
                    <div className="flex flex-wrap gap-2">
                      {job.benefits.map((benefit, index) => (
                        <Badge key={index} variant="outline" className="bg-primary/5 text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 右カラム: 詳細情報 */}
          <div className="md:col-span-2 space-y-4">
            {job.catchPhrase && (
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <h3 className="text-xl font-bold text-center">{job.catchPhrase}</h3>
              </div>
            )}
            
            {job.description && (
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-medium mb-3">仕事内容</h3>
                <div className="text-sm prose prose-sm max-w-none">
                  <HtmlContent html={job.description} />
                </div>
              </div>
            )}
            
            <div className="flex space-x-2 mt-6">
              <Button 
                onClick={() => onApply(job)} 
                size="lg" 
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                応募する
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => onKeep(job)} 
                      variant="outline" 
                      size="lg"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      キープ
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>気になるリストに追加</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                    >
                      <PhoneCall className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>店舗に電話する</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};