import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Clock, Coins, Award, BookCheck, Check, AlertCircle, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface TrialEntryDisplayProps {
  trialEntry: {
    dailyGuarantee: number;
    hourlyRate?: number;
    workingHours: number;
    requirements?: string;
    benefitsDescription?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    examples?: { hours: number; amount: number; description?: string }[];
    requiredDocuments?: string[];
    qaItems?: { question: string; answer: string }[];
  };
  className?: string;
  onApply?: () => void; // 応募ボタンのコールバック
}

export function TrialEntryDisplay({ 
  trialEntry, 
  className = "", 
  onApply 
}: TrialEntryDisplayProps) {
  const {
    dailyGuarantee,
    hourlyRate,
    workingHours,
    requirements,
    benefitsDescription,
    startDate,
    endDate,
    isActive = true,
    examples,
    requiredDocuments,
    qaItems
  } = trialEntry;

  // 現在有効期間内かどうか
  const isCurrentlyActive = isActive && startDate && endDate 
    ? new Date() >= new Date(startDate) && new Date() <= new Date(endDate)
    : isActive;

  // 時給の計算（設定されていなければ日給÷時間で計算）
  const calculatedHourlyRate = hourlyRate || Math.round(dailyGuarantee / workingHours);

  return (
    <Card className={`overflow-hidden ${className} relative`}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/20 pb-4">
        <div className="flex items-center justify-between mb-1">
          <Badge variant="outline" className="bg-white/80 font-medium">
            体験入店保証
          </Badge>
          
          {startDate && endDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {new Date(startDate).toLocaleDateString()} 〜 {new Date(endDate).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between flex-wrap gap-2 mt-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-primary mr-2" />
            <div className="text-sm">勤務時間: <span className="font-bold">{workingHours}時間</span></div>
          </div>
          
          <div className="flex items-center">
            <Coins className="h-5 w-5 text-amber-500 mr-2" />
            <div className="text-sm">時給目安: <span className="font-bold">{calculatedHourlyRate.toLocaleString()}円</span></div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="mb-6 text-center bg-gradient-to-r from-primary/5 to-primary/10 py-5 rounded-md">
          <div className="text-sm mb-1">日給保証金額</div>
          <div className="flex items-center justify-center">
            <span className="text-4xl font-bold text-primary mr-1">
              {dailyGuarantee.toLocaleString()}
            </span>
            <span>円</span>
          </div>
        </div>
        
        {benefitsDescription && (
          <div className="mb-4 text-sm">
            {benefitsDescription}
          </div>
        )}
        
        {examples && examples.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium flex items-center">
              <Award className="h-4 w-4 mr-1 text-primary" />
              収入目安例
            </h4>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <div key={index} className="border rounded-md p-2.5 bg-muted/10">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm font-medium">{example.hours}時間勤務</div>
                    <div className="text-primary font-bold">{example.amount.toLocaleString()}円</div>
                  </div>
                  {example.description && (
                    <div className="text-xs text-muted-foreground">{example.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {requirements && (
          <div className="mb-4">
            <h4 className="text-sm font-medium flex items-center mb-2">
              <BookCheck className="h-4 w-4 mr-1 text-primary" />
              応募条件
            </h4>
            <div className="text-sm whitespace-pre-line">{requirements}</div>
          </div>
        )}
        
        {requiredDocuments && requiredDocuments.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium flex items-center mb-2">
              <Check className="h-4 w-4 mr-1 text-primary" />
              必要書類
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {requiredDocuments.map((doc, index) => (
                <Badge key={index} variant="outline" className="bg-muted/20">
                  {doc}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {qaItems && qaItems.length > 0 && (
          <div className="mt-5">
            <h4 className="text-sm font-medium flex items-center mb-2">
              <HelpCircle className="h-4 w-4 mr-1 text-primary" />
              よくある質問
            </h4>
            <Accordion type="single" collapsible className="border rounded-md overflow-hidden">
              {qaItems.map((qa, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b-0 last:border-b-0">
                  <AccordionTrigger className="py-3 px-4 hover:no-underline text-sm font-medium">
                    {qa.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 pt-0 px-4 text-sm">
                    {qa.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {onApply && (
          <div className="mt-6">
            <Button 
              className="w-full" 
              onClick={onApply}
              size="lg"
            >
              <Check className="mr-2 h-4 w-4" />
              体験入店に応募する
            </Button>
          </div>
        )}
      </CardContent>
      
      {!isCurrentlyActive && (
        <CardFooter className="bg-muted/30 text-sm text-muted-foreground border-t">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            この体験入店特典は現在終了しています
          </div>
        </CardFooter>
      )}
    </Card>
  );
}