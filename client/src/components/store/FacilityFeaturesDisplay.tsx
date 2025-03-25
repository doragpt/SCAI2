import React from 'react';
import { facilityFeatureSchema } from '@shared/schema';
import type { z } from 'zod';
import { 
  Home, Wifi, Bath, Bed, Coffee, Camera, Lock, 
  Utensils, Sofa, Tv, Music, Droplet, Fan, 
  Footprints, Smartphone, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FacilityFeaturesDisplayProps {
  features?: z.infer<typeof facilityFeatureSchema>[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

/**
 * 店舗設備表示コンポーネント
 */
export function FacilityFeaturesDisplay({ 
  features,
  className,
  columns = 3
}: FacilityFeaturesDisplayProps) {
  if (!features || features.length === 0) {
    return null;
  }

  function getFeatureIcon(category: string) {
    switch (category) {
      case 'internet':
        return <Wifi className="h-4 w-4" />;
      case 'bath':
        return <Bath className="h-4 w-4" />;
      case 'bed':
        return <Bed className="h-4 w-4" />;
      case 'food':
        return <Utensils className="h-4 w-4" />;
      case 'drink':
        return <Coffee className="h-4 w-4" />;
      case 'security':
        return <Lock className="h-4 w-4" />;
      case 'camera':
        return <Camera className="h-4 w-4" />;
      case 'lounge':
        return <Sofa className="h-4 w-4" />;
      case 'entertainment':
        return <Tv className="h-4 w-4" />;
      case 'music':
        return <Music className="h-4 w-4" />;
      case 'water':
        return <Droplet className="h-4 w-4" />;
      case 'climate':
        return <Fan className="h-4 w-4" />;
      case 'footwear':
        return <Footprints className="h-4 w-4" />;
      case 'phone':
        return <Smartphone className="h-4 w-4" />;
      case 'cleaning':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  }

  // 設備をカテゴリ別に整理
  const categoryMap = features.reduce((acc, feature) => {
    const category = feature.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, z.infer<typeof facilityFeatureSchema>[]>);

  // カテゴリのラベル
  const categoryLabels: Record<string, string> = {
    'room': '部屋設備',
    'bath': '浴室・衛生設備',
    'lounge': 'ラウンジ・待機設備',
    'food': '飲食関連',
    'security': 'セキュリティ',
    'entertainment': 'エンターテイメント',
    'convenience': '便利設備',
    'climate': '快適環境',
    'working': '仕事環境',
    'other': 'その他設備'
  };

  // カラム数に応じたグリッドクラス
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  }[columns];

  return (
    <div className={className}>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Home className="h-5 w-5" />
        <span>店舗設備</span>
      </h3>
      
      <div className="space-y-6">
        {Object.entries(categoryMap).map(([category, categoryFeatures]) => (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-base text-muted-foreground">
              {categoryLabels[category] || category}
            </h4>
            
            <div className={cn("grid gap-2", gridClass)}>
              {categoryFeatures.map((feature) => (
                <div key={feature.id} className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "px-2 py-1 h-auto text-xs font-normal flex items-center gap-1.5",
                      feature.highlight && "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    )}
                  >
                    {getFeatureIcon(feature.category)}
                    <span>{feature.name}</span>
                  </Badge>
                  
                  {feature.highlight && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                      Premium
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}