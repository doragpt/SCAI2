import React from 'react';
import { GalleryCategory, galleryCategories } from '@shared/schema';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Image, ChevronRight, ChevronLeft, ImageIcon } from 'lucide-react';

interface PhotoGalleryDisplayProps {
  photos: Array<{
    id?: string;
    url: string;
    title?: string;
    description?: string;
    category: GalleryCategory;
    order?: number;
    featured?: boolean;
  }>;
  className?: string;
}

export function PhotoGalleryDisplay({ photos, className = "" }: PhotoGalleryDisplayProps) {
  // 画像が存在しない場合
  if (!photos || photos.length === 0) {
    return (
      <Card className={`overflow-hidden shadow-md ${className}`}>
        <CardContent className="p-6 text-center">
          <ImageIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">現在フォトギャラリーに画像はありません</p>
          <p className="text-xs text-muted-foreground mt-2">推奨画像サイズ: 200 × 150 px</p>
        </CardContent>
      </Card>
    );
  }

  // カテゴリごとに画像をグループ化
  const photosByCategory = galleryCategories.reduce((acc, category) => {
    acc[category] = photos.filter(photo => photo.category === category);
    return acc;
  }, {} as Record<GalleryCategory, typeof photos>);

  // 画像が存在するカテゴリのみをフィルタリング
  const availableCategories = galleryCategories.filter(category => 
    photosByCategory[category] && photosByCategory[category].length > 0
  );

  // デフォルトで最初のタブを選択
  const defaultTab = availableCategories.length > 0 ? availableCategories[0] : "";

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-end mb-1">
        <p className="text-xs text-muted-foreground">推奨画像サイズ: 200 × 150 px</p>
      </div>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full mb-4 flex overflow-x-auto">
          {availableCategories.map(category => (
            <TabsTrigger key={category} value={category} className="flex-1">
              {category}
              <Badge variant="outline" className="ml-2">
                {photosByCategory[category].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {availableCategories.map(category => (
          <TabsContent key={category} value={category} className="w-full">
            <Carousel>
              <CarouselContent>
                {photosByCategory[category].map((photo, index) => (
                  <CarouselItem key={photo.id || `photo-${index}`} className="basis-full md:basis-1/2 lg:basis-1/3">
                    <Card className="overflow-hidden">
                      <div className="w-[200px] h-[150px] mx-auto overflow-hidden relative group">
                        <img 
                          src={photo.url} 
                          alt={photo.title || `${category}画像`} 
                          className="w-[200px] h-[150px] object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22150%22%20viewBox%3D%220%200%20200%20150%22%3E%3Crect%20width%3D%22200%22%20height%3D%22150%22%20fill%3D%22%23f5f5f5%22%2F%3E%3Ctext%20x%3D%22100%22%20y%3D%2275%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999%22%3E%E7%94%BB%E5%83%8F%E3%82%92%E8%AA%AD%E3%81%BF%E8%BE%BC%E3%82%81%E3%81%BE%E3%81%9B%E3%82%93%3C%2Ftext%3E%3C%2Fsvg%3E';
                          }}
                        />
                        {photo.category && (
                          <div className="absolute top-1 right-1">
                            <Badge variant="secondary" className="text-xs bg-black/50 text-white">
                              {photo.category}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {(photo.title || photo.description) && (
                        <CardContent className="p-2 text-center">
                          {photo.title && <p className="font-medium text-sm truncate">{photo.title}</p>}
                          {photo.description && <p className="text-xs text-muted-foreground line-clamp-2">{photo.description}</p>}
                        </CardContent>
                      )}
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}