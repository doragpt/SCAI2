import React, { useState } from 'react';
import { JobResponse } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  MessageSquare, Video, Banknote, ShieldCheck, 
  Building, Heart, Phone, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 拡張表示用のコンポーネントをインポート
import { VideoDisplay } from './VideoDisplay';
import { SalaryExamplesDisplay } from './SalaryExamplesDisplay';
import { PrivacyMeasuresDisplay } from './PrivacyMeasuresDisplay';
import { FacilityFeaturesDisplay } from './FacilityFeaturesDisplay';
import { TestimonialsDisplay } from './TestimonialsDisplay';

interface JobDetailExpandedProps {
  job: JobResponse;
  onApply?: () => void;
  onKeep?: () => void;
  className?: string;
}

/**
 * バニラ風の拡張された詳細コンポーネント
 * 動画、給与例、身バレ対策、設備、口コミなどを含む
 */
export function JobDetailExpanded({ job, onApply, onKeep, className }: JobDetailExpandedProps) {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');

  // 動画プレイヤーを開く
  const handlePlayVideo = (url: string) => {
    setSelectedVideoUrl(url);
    setVideoModalOpen(true);
  };

  // 求人詳細がある項目のみタブとして表示
  const hasVideos = job.job_videos && job.job_videos.length > 0;
  const hasSalaryExamples = job.salary_examples && job.salary_examples.length > 0;
  const hasPrivacyMeasures = job.privacy_measures && job.privacy_measures.length > 0;
  const hasFacilityFeatures = job.facility_features && job.facility_features.length > 0;
  const hasTestimonials = job.testimonials && job.testimonials.length > 0;

  // アクティブなタブを設定（データがある最初のタブをデフォルトで選択）
  const getDefaultTab = () => {
    if (hasVideos) return 'videos';
    if (hasSalaryExamples) return 'salary';
    if (hasPrivacyMeasures) return 'privacy';
    if (hasFacilityFeatures) return 'facility';
    if (hasTestimonials) return 'testimonials';
    return 'videos'; // フォールバック
  };

  // 表示すべきタブがなければ何も表示しない
  const hasAnyTabs = hasVideos || hasSalaryExamples || hasPrivacyMeasures || 
                     hasFacilityFeatures || hasTestimonials;
  
  if (!hasAnyTabs) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue={getDefaultTab()} className="w-full">
        <div className="mb-4 overflow-x-auto no-scrollbar pb-1">
          <TabsList className="bg-background border">
            {hasVideos && (
              <TabsTrigger value="videos" className="flex items-center gap-1.5">
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">動画</span>
              </TabsTrigger>
            )}
            
            {hasSalaryExamples && (
              <TabsTrigger value="salary" className="flex items-center gap-1.5">
                <Banknote className="h-4 w-4" />
                <span className="hidden sm:inline">給与例</span>
              </TabsTrigger>
            )}
            
            {hasPrivacyMeasures && (
              <TabsTrigger value="privacy" className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">身バレ対策</span>
              </TabsTrigger>
            )}
            
            {hasFacilityFeatures && (
              <TabsTrigger value="facility" className="flex items-center gap-1.5">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">設備</span>
              </TabsTrigger>
            )}
            
            {hasTestimonials && (
              <TabsTrigger value="testimonials" className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">口コミ</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        
        {/* 動画タブ */}
        {hasVideos && (
          <TabsContent value="videos" className="mt-0">
            <VideoDisplay 
              videos={job.job_videos} 
              featured={true}
              onPlay={handlePlayVideo}
            />
          </TabsContent>
        )}
        
        {/* 給与例タブ */}
        {hasSalaryExamples && (
          <TabsContent value="salary" className="mt-0">
            <SalaryExamplesDisplay examples={job.salary_examples} />
          </TabsContent>
        )}
        
        {/* 身バレ対策タブ */}
        {hasPrivacyMeasures && (
          <TabsContent value="privacy" className="mt-0">
            <PrivacyMeasuresDisplay measures={job.privacy_measures} />
          </TabsContent>
        )}
        
        {/* 設備タブ */}
        {hasFacilityFeatures && (
          <TabsContent value="facility" className="mt-0">
            <FacilityFeaturesDisplay features={job.facility_features} />
          </TabsContent>
        )}
        
        {/* 口コミタブ */}
        {hasTestimonials && (
          <TabsContent value="testimonials" className="mt-0">
            <TestimonialsDisplay testimonials={job.testimonials} />
          </TabsContent>
        )}
      </Tabs>
      
      {/* 応募ボタン */}
      {onApply && (
        <Card className="mb-8 overflow-hidden border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex flex-row justify-between items-center">
            <h3 className="text-lg font-bold">この求人に応募する</h3>
          </CardHeader>
          <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                無料で面接日程を予約できます。
                電話でもオンラインでも、あなたの都合に合わせて調整可能です。
              </p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <span>採用担当者があなたからの連絡をお待ちしています</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 sm:items-end justify-center">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                onClick={onApply}
              >
                面接予約をする
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              {onKeep && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto"
                  onClick={onKeep}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  キープリストに追加
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 動画モーダル - デモのため簡易的な実装 */}
      {videoModalOpen && selectedVideoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setVideoModalOpen(false)}>
          <div className="relative w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setVideoModalOpen(false)}
            >
              閉じる
            </Button>
            <iframe 
              src={selectedVideoUrl} 
              className="w-full h-full" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}