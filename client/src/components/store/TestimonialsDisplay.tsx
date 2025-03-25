import React from 'react';
import { MessageSquare, Star, Calendar, CheckCircle, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Testimonial {
  user_name: string;
  age?: number;
  content: string;
  rating: number;
  verified: boolean;
  date: string;
  tags?: string[];
}

interface TestimonialsDisplayProps {
  testimonials?: Testimonial[];
  compact?: boolean;
  className?: string;
}

/**
 * 口コミ・体験談表示コンポーネント
 */
export function TestimonialsDisplay({ testimonials, compact = false, className }: TestimonialsDisplayProps) {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  // レビューの星評価を表示
  const RatingStars = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4 mr-0.5",
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      {!compact && (
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span>口コミ・体験談</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {testimonials.length}件
          </Badge>
        </h3>
      )}
      
      <div className="space-y-4">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="overflow-hidden border">
            <CardContent className="p-4">
              {/* ヘッダー部分 */}
              <div className="flex flex-wrap justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium">{testimonial.user_name}</span>
                      {testimonial.age && (
                        <span className="text-muted-foreground text-sm ml-2">
                          {testimonial.age}歳
                        </span>
                      )}
                      {testimonial.verified && (
                        <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 flex items-center gap-1 h-5 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                          <CheckCircle className="h-3 w-3" />
                          <span>認証済</span>
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {testimonial.date}
                      </span>
                    </div>
                  </div>
                </div>
                
                <RatingStars rating={testimonial.rating} />
              </div>
              
              {/* 内容 */}
              <div className="mb-3">
                <p className="text-sm">{testimonial.content}</p>
              </div>
              
              {/* タグ */}
              {testimonial.tags && testimonial.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {testimonial.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {testimonials.length > 3 && !compact && (
        <div className="mt-4 text-center">
          <button 
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            もっと見る ({testimonials.length - 3}件)
          </button>
        </div>
      )}
    </div>
  );
}