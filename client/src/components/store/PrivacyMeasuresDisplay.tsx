import React from 'react';
import { privacyMeasureSchema } from '@shared/schema';
import type { z } from 'zod';
import { ShieldCheck, Eye, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PrivacyMeasuresDisplayProps {
  measures?: z.infer<typeof privacyMeasureSchema>[];
  securityMeasures?: string;
  privacyMeasures?: string[] | string;
  commitment?: string;
  compact?: boolean;
  className?: string;
}

/**
 * 身バレ対策表示コンポーネント
 */
export function PrivacyMeasuresDisplay({ 
  measures, 
  securityMeasures,
  privacyMeasures,
  commitment,
  compact = false, 
  className 
}: PrivacyMeasuresDisplayProps) {
  const hasTextContent = securityMeasures || privacyMeasures || commitment;
  const hasMeasures = measures && measures.length > 0;
  
  if (!hasMeasures && !hasTextContent) {
    return null;
  }

  // アイコンを取得
  const getIcon = (type?: string) => {
    switch (type) {
      case 'face':
        return <Eye className="h-5 w-5 text-indigo-500" />;
      case 'location':
        return <Lock className="h-5 w-5 text-purple-500" />;
      case 'online':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <ShieldCheck className="h-5 w-5 text-green-500" />;
    }
  };

  // 対策レベルのラベルを取得
  const getLevelLabel = (level?: number) => {
    if (!level) return null;
    
    switch (level) {
      case 1:
        return (
          <span className="text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">
            基本
          </span>
        );
      case 2:
        return (
          <span className="text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
            標準
          </span>
        );
      case 3:
        return (
          <span className="text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded">
            高度
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {!compact && (
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <span>安全対策</span>
        </h3>
      )}
      
      {/* テキストコンテンツセクション */}
      {hasTextContent && (
        <div className="mb-6 space-y-5">
          {securityMeasures && (
            <Card className="overflow-hidden border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-2">安全への取り組み</h4>
                    <p className="text-sm whitespace-pre-line">{securityMeasures}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {privacyMeasures && (
            <Card className="overflow-hidden border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <Lock className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-2">プライバシー保護</h4>
                    {Array.isArray(privacyMeasures) ? (
                      <ul className="text-sm space-y-1 list-disc pl-5">
                        {privacyMeasures.map((measure, index) => (
                          <li key={index}>{measure}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm whitespace-pre-line">{privacyMeasures}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {commitment && (
            <Card className="overflow-hidden border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <Eye className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-2">お店のコミットメント</h4>
                    <p className="text-sm whitespace-pre-line">{commitment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* 身バレ対策構造化データ */}
      {hasMeasures && (
        <>
          {!compact && hasTextContent && (
            <h4 className="text-md font-medium mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>身バレ対策</span>
            </h4>
          )}
          
          <div className={cn(
            "grid gap-4",
            compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
          )}>
            {measures && measures.map((measure) => (
              <Card key={measure.id} className="overflow-hidden border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {getIcon(measure.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-semibold text-base">
                          {measure.title || '対策項目'}
                        </h4>
                        {getLevelLabel(measure.level)}
                      </div>
                      
                      {measure.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {measure.description}
                        </p>
                      )}
                      
                      {measure.steps && measure.steps.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {measure.steps.map((step, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                {index + 1}
                              </div>
                              <p className="text-sm flex-1">{step}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}