import React from 'react';
import { salaryExampleSchema } from '@shared/schema';
import type { z } from 'zod';
import { Banknote, Clock, Award, CalendarDays, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SalaryExamplesDisplayProps {
  examples?: z.infer<typeof salaryExampleSchema>[];
  compact?: boolean;
  className?: string;
}

/**
 * 給与例・体験保証表示コンポーネント
 */
export function SalaryExamplesDisplay({ examples, compact = false, className }: SalaryExamplesDisplayProps) {
  if (!examples || examples.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {!compact && (
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          <span>給与例・体験保証</span>
        </h3>
      )}
      
      <div className={cn(
        "grid gap-4",
        compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
      )}>
        {examples.map((example) => (
          <Card key={example.id} className={cn(
            "overflow-hidden border",
            example.highlighted && "border-primary/50"
          )}>
            <div className={cn(
              "p-4",
              example.highlighted ? "bg-primary/10" : "bg-muted/50"
            )}>
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-base">
                  {example.title || '給与例'}
                </h4>
                
                {example.category && (
                  <Badge 
                    variant={
                      example.category === 'experience' ? 'default' :
                      example.category === 'guarantee' ? 'secondary' :
                      'outline'
                    }
                    className="ml-2"
                  >
                    {example.category === 'experience' ? '体験入店' :
                     example.category === 'guarantee' ? '保証' :
                     example.category}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              {/* 金額 */}
              <div className="flex items-center">
                <Banknote className="h-4 w-4 mr-2 text-green-500" />
                <div className="flex-1">
                  <span className="font-bold text-lg text-green-700 dark:text-green-500">
                    {example.amount?.toLocaleString() || '応相談'}{example.amount ? '円' : ''}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    {example.type === 'hourly' ? '/ 時給' : 
                     example.type === 'daily' ? '/ 日給' : 
                     example.type === 'monthly' ? '/ 月給' : ''}
                  </span>
                </div>
              </div>
              
              {/* 勤務時間 */}
              {example.hours && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm">
                    {example.hours}時間 
                    {example.shifts && ` × ${example.shifts}シフト`}
                  </span>
                </div>
              )}
              
              {/* 条件 */}
              {example.conditions && (
                <div className="flex items-center">
                  <Info className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="text-sm">{example.conditions}</span>
                </div>
              )}
              
              {/* 期間 */}
              {example.period && (
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="text-sm">{example.period}</span>
                </div>
              )}
              
              {/* 追加情報 */}
              {example.description && (
                <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                  {example.description}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}