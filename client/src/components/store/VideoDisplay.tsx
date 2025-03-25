import React from 'react';
import { jobVideoSchema } from '@shared/schema';
import type { z } from 'zod';
import { PlayCircle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VideoDisplayProps {
  videos?: z.infer<typeof jobVideoSchema>[];
  className?: string;
  onPlay?: (videoUrl: string) => void;
  featured?: boolean;
}

/**
 * 求人動画コンテンツ表示コンポーネント
 */
export function VideoDisplay({ videos, className, onPlay, featured = false }: VideoDisplayProps) {
  if (!videos || videos.length === 0) {
    return null;
  }

  // フィーチャー動画を表示する場合
  if (featured) {
    const featuredVideo = videos.find(video => video.featured) || videos[0];
    
    return (
      <div className={cn("relative rounded-lg overflow-hidden group", className)}>
        <div className="relative aspect-video">
          <img 
            src={featuredVideo.thumbnail} 
            alt={featuredVideo.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-16 w-16 rounded-full"
              onClick={() => onPlay?.(featuredVideo.url)}
            >
              <PlayCircle className="h-16 w-16 text-white" />
              <span className="sr-only">動画を再生</span>
            </Button>
          </div>
        </div>
        <div className="p-3 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0 text-white">
          <h3 className="font-bold text-lg">{featuredVideo.title}</h3>
          <p className="text-sm opacity-90">{featuredVideo.description}</p>
        </div>
      </div>
    );
  }

  // 複数の動画を一覧表示する場合
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", className)}>
      {videos.map((video) => (
        <div key={video.id} className="relative rounded-lg overflow-hidden group">
          <div className="relative aspect-video">
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => onPlay?.(video.url)}
              >
                <PlayCircle className="h-12 w-12 text-white" />
                <span className="sr-only">動画を再生</span>
              </Button>
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800">
            <h3 className="font-bold">{video.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{video.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}