import React from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader
} from '@/components/ui/card';
import { Quote, Star, BadgeCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Testimonial {
  user_name: string;
  age: number;
  content: string;
  rating: number;
  verified: boolean;
  date: string;
}

interface TestimonialsDisplayProps {
  testimonials?: Testimonial[];
  className?: string;
  limit?: number;
}

/**
 * 口コミ・体験談表示コンポーネント
 */
export function TestimonialsDisplay({ 
  testimonials, 
  className,
  limit
}: TestimonialsDisplayProps) {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const displayTestimonials = limit ? testimonials.slice(0, limit) : testimonials;
  
  return (
    <div className={className}>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Quote className="h-5 w-5" />
        <span>口コミ・体験談</span>
        <span className="text-base font-normal text-muted-foreground">
          ({testimonials.length}件)
        </span>
      </h3>
      
      <div className="space-y-4">
        {displayTestimonials.map((testimonial, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-2 pt-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{testimonial.user_name}</span>
                  <span className="text-sm text-muted-foreground">({testimonial.age}歳)</span>
                  {testimonial.verified && (
                    <div className="flex items-center text-green-600 text-xs">
                      <BadgeCheck className="h-3.5 w-3.5 mr-0.5" />
                      <span>認証済</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4", 
                        i < testimonial.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-3 pb-2">
              <p className="text-sm whitespace-pre-line">{testimonial.content}</p>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground pt-0 pb-2 justify-end">
              {formatDate(new Date(testimonial.date))}
            </CardFooter>
          </Card>
        ))}
        
        {limit && testimonials.length > limit && (
          <div className="text-center pt-2">
            <button className="text-sm text-primary hover:underline">
              他{testimonials.length - limit}件の口コミを見る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}