import React from 'react';
import { privacyMeasureSchema } from '@shared/schema';
import type { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrivacyMeasuresDisplayProps {
  measures?: z.infer<typeof privacyMeasureSchema>[];
  className?: string;
  limit?: number;
}

/**
 * 身バレ対策表示コンポーネント
 */
export function PrivacyMeasuresDisplay({ measures, className, limit }: PrivacyMeasuresDisplayProps) {
  if (!measures || measures.length === 0) {
    return null;
  }

  const displayMeasures = limit ? measures.slice(0, limit) : measures;
  const hasMore = limit && measures.length > limit;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-lg font-bold flex items-center gap-2">
        <ShieldCheck className="h-5 w-5" />
        <span>身バレ対策・プライバシー保護</span>
      </h3>
      
      <div className="space-y-4">
        {displayMeasures.map((measure) => (
          <div key={measure.id} className="flex gap-3">
            <div className="mt-1">
              {measure.icon ? getPrivacyIconByName(measure.icon) : getPrivacyIconByCategory(measure.category || 'other')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{measure.title}</h4>
                {measure.level && (
                  <Badge variant={getVariantByLevel(measure.level)}>{getLevelLabel(measure.level)}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{measure.description}</p>
            </div>
          </div>
        ))}
        
        {hasMore && (
          <div className="text-center pt-2">
            <Badge variant="outline" className="cursor-pointer">
              他{measures.length - limit!}件の対策を表示
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// プライバシーレベルに応じたラベル
function getLevelLabel(level: string): string {
  switch (level) {
    case 'high':
      return '最高レベル';
    case 'medium':
      return '標準対策';
    case 'low':
      return '基本対策';
    default:
      return '対策あり';
  }
}

// プライバシーレベルに応じたバッジバリアント
function getVariantByLevel(level: string): "default" | "secondary" | "destructive" | "outline" {
  switch (level) {
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
}

// アイコン名からアイコンを取得
function getPrivacyIconByName(iconName: string) {
  switch (iconName) {
    case 'eye-off':
      return <EyeOff className="h-5 w-5 text-indigo-500" />;
    case 'shield':
      return <Shield className="h-5 w-5 text-green-500" />;
    case 'shield-check':
      return <ShieldCheck className="h-5 w-5 text-blue-500" />;
    case 'shield-alert':
      return <ShieldAlert className="h-5 w-5 text-red-500" />;
    case 'eye':
      return <Eye className="h-5 w-5 text-gray-500" />;
    default:
      return <ShieldCheck className="h-5 w-5 text-gray-500" />;
  }
}

// カテゴリに応じたアイコン
function getPrivacyIconByCategory(category: string) {
  switch (category) {
    case 'face':
      return <EyeOff className="h-5 w-5 text-indigo-500" />;
    case 'location':
      return <Shield className="h-5 w-5 text-green-500" />;
    case 'data':
      return <ShieldCheck className="h-5 w-5 text-blue-500" />;
    case 'emergency':
      return <ShieldAlert className="h-5 w-5 text-red-500" />;
    default:
      return <Eye className="h-5 w-5 text-gray-500" />;
  }
}