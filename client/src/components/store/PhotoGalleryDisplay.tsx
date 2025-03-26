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
    id: string;
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
  const defaultTab = availableCategories.length > 0 ? availableCategories[0] : null;

  return (
    <div className={`w-full ${className}`}>
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
                {photosByCategory[category].map((photo) => (
                  <CarouselItem key={photo.id} className="basis-full md:basis-1/2 lg:basis-1/3">
                    <Card className="overflow-hidden">
                      <div className="w-[200px] h-[150px] mx-auto overflow-hidden">
                        <img 
                          src={photo.url} 
                          alt={photo.title || `${category}画像`} 
                          className="w-[200px] h-[150px] object-cover"
                        />
                      </div>
                      {(photo.title || photo.description) && (
                        <CardContent className="p-2 text-center">
                          {photo.title && <p className="font-medium">{photo.title}</p>}
                          {photo.description && <p className="text-sm text-muted-foreground">{photo.description}</p>}
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