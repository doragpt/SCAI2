import React from 'react';
import { salaryExampleSchema } from '@shared/schema';
import type { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, Clock, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalaryExamplesDisplayProps {
  examples?: z.infer<typeof salaryExampleSchema>[];
  className?: string;
  compact?: boolean;
}

/**
 * 給与例・体験保証表示コンポーネント
 */
export function SalaryExamplesDisplay({ examples, className, compact = false }: SalaryExamplesDisplayProps) {
  if (!examples || examples.length === 0) {
    return null;
  }

  // コンパクト表示（シンプルなリスト）
  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          <span>給与例・体験保証</span>
        </h3>
        <ul className="space-y-1 pl-7">
          {examples.map((example) => (
            <li key={example.id} className="flex justify-between items-center">
              <span className="flex-1">{example.title}</span>
              <span className="font-bold">
                {example.hours}時間 {example.amount.toLocaleString()}円
                {example.isGuaranteed && <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">保証</Badge>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // 通常表示（カード形式）
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {examples.map((example) => (
        <Card key={example.id} className={cn(
          "overflow-hidden transition-all hover:shadow-md", 
          example.isGuaranteed ? "border-yellow-300 dark:border-yellow-800" : ""
        )}>
          <CardHeader className={cn(
            "pb-2",
            example.isGuaranteed ? "bg-yellow-50 dark:bg-yellow-950" : ""
          )}>
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                {example.isGuaranteed ? <Trophy className="h-5 w-5 text-yellow-600" /> : <Banknote className="h-5 w-5" />}
                {example.title}
              </span>
              {example.isGuaranteed && <Badge variant="secondary">保証</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{example.hours}時間勤務</span>
              </div>
              <div className="text-xl font-bold">
                {example.amount.toLocaleString()}円
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  (時給換算: {Math.round(example.amount / example.hours).toLocaleString()}円)
                </span>
              </div>
            </div>
            {example.description && (
              <p className="text-sm text-muted-foreground">{example.description}</p>
            )}
            {example.conditions && (
              <div className="text-sm border-t pt-2 mt-2">
                <span className="font-medium">条件:</span> {example.conditions}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}