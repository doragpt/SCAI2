import React from 'react';
import { facilityFeatureSchema } from '@shared/schema';
import type { z } from 'zod';
import { 
  Building, 
  Bed, 
  ShowerHead, 
  Utensils, 
  Wifi, 
  Cctv, 
  UmbrellaOff,
  Tv,
  FlaskConical,
  Car
} from 'lucide-react';
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
  columns = 2
}: FacilityFeaturesDisplayProps) {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <Building className="h-5 w-5" />
        <span>店舗設備・特徴</span>
      </h3>
      
      <div className={cn(
        "grid gap-3",
        columns === 1 ? "grid-cols-1" : 
        columns === 3 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" :
        columns === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
        "grid-cols-1 sm:grid-cols-2" // default 2 columns
      )}>
        {features.map((feature) => (
          <div 
            key={feature.id} 
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg",
              feature.highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {getFeatureIcon(feature.category)}
            </div>
            <div>
              <h4 className="font-medium text-base">{feature.name}</h4>
              {feature.description && (
                <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// カテゴリに応じたアイコン
function getFeatureIcon(category: string) {
  switch (category) {
    case 'room':
      return <Bed className="h-5 w-5 text-violet-500" />;
    case 'bath':
      return <ShowerHead className="h-5 w-5 text-blue-500" />;
    case 'meal':
      return <Utensils className="h-5 w-5 text-orange-500" />;
    case 'security':
      return <Cctv className="h-5 w-5 text-red-500" />;
    case 'privacy':
      return <UmbrellaOff className="h-5 w-5 text-green-500" />;
    case 'entertainment':
      return <Tv className="h-5 w-5 text-pink-500" />;
    case 'amenity':
      return <FlaskConical className="h-5 w-5 text-cyan-500" />;
    case 'transportation':
      return <Car className="h-5 w-5 text-yellow-500" />;
    case 'internet':
      return <Wifi className="h-5 w-5 text-sky-500" />;
    default:
      return <Building className="h-5 w-5 text-gray-500" />;
  }
}