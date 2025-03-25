import React from 'react';
import { jobVideoSchema } from '@shared/schema';
import type { z } from 'zod';
import { cn } from '@/lib/utils';
import { Play, Video as VideoIcon, Award, FileVideo } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface VideoDisplayProps {
  videos?: z.infer<typeof jobVideoSchema>[];
  featured?: boolean;
  className?: string;
  onPlay?: (url: string) => void;
}

/**
 * 求人動画表示コンポーネント
 */
export function VideoDisplay({ videos, featured = false, className, onPlay }: VideoDisplayProps) {
  if (!videos || videos.length === 0) {
    return null;
  }

  // 動画サムネイルをクリック時の処理
  const handleVideoClick = (video: z.infer<typeof jobVideoSchema>) => {
    if (onPlay && video.url) {
      onPlay(video.url);
    }
  };

  // 動画の種類によって表示アイコンを変更
  const getVideoTypeIcon = (type: string | undefined) => {
    switch (type) {
      case 'interview':
        return <Award className="h-4 w-4 text-purple-400" />;
      case 'facility':
        return <FileVideo className="h-4 w-4 text-green-400" />;
      case 'work':
        return <VideoIcon className="h-4 w-4 text-blue-400" />;
      default:
        return <VideoIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  // フィーチャー動画（大きく表示する動画）を取得
  const featuredVideo = featured && videos.length > 0 
    ? videos.find(v => v.featured) || videos[0]
    : null;
  
  // 通常の動画リスト
  const normalVideos = featured && featuredVideo
    ? videos.filter(v => v.id !== featuredVideo.id)
    : videos;

  return (
    <div className={className}>
      {/* フィーチャー動画 */}
      {featuredVideo && (
        <div className="mb-6">
          <div 
            className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 cursor-pointer group"
            onClick={() => handleVideoClick(featuredVideo)}
          >
            {featuredVideo.thumbnail ? (
              <img 
                src={featuredVideo.thumbnail} 
                alt={featuredVideo.title || '動画サムネイル'} 
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900/20 dark:bg-gray-900/60">
                <VideoIcon className="h-16 w-16 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-4 rounded-full bg-black/30 group-hover:bg-primary/80 transition-colors duration-200">
                <Play className="h-10 w-10 text-white" />
              </div>
            </div>
            
            {featuredVideo.title && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white font-medium text-lg">{featuredVideo.title}</h3>
                {featuredVideo.duration && (
                  <div className="text-white/80 text-sm mt-1 flex items-center">
                    <span className="mr-3">{featuredVideo.duration}</span>
                    {featuredVideo.type && getVideoTypeIcon(featuredVideo.type)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 動画リスト */}
      {normalVideos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {normalVideos.map((video) => (
            <Card 
              key={video.id} 
              className={cn(
                "overflow-hidden cursor-pointer hover:border-primary transition-colors duration-200",
                video.highlighted && "border-primary/50"
              )}
              onClick={() => handleVideoClick(video)}
            >
              <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
                {video.thumbnail ? (
                  <img 
                    src={video.thumbnail} 
                    alt={video.title || '動画サムネイル'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoIcon className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors duration-200">
                  <div className="p-3 rounded-full bg-black/30 opacity-80 hover:opacity-100 transition-opacity">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                {video.duration && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                    {video.duration}
                  </div>
                )}
              </div>
              
              <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium line-clamp-1">{video.title || '店舗動画'}</h4>
                  {video.type && (
                    <div className="ml-2 flex-shrink-0">
                      {getVideoTypeIcon(video.type)}
                    </div>
                  )}
                </div>
                
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}