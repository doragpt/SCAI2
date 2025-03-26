import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2, Info } from "lucide-react";
import { format } from "date-fns";
import { trialEntrySchema, requiredDocumentTypes } from "@shared/schema";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { TrialEntryDisplay } from "./TrialEntryDisplay";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ja } from "date-fns/locale";
import { useEffect, useState } from "react";

// フォームスキーマの拡張
const formSchema = trialEntrySchema.extend({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TrialEntryFormTabProps {
  initialData?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
}

// 新しいQAアイテムの初期値
const emptyQAItem = { question: "", answer: "" };

// 新しい給与例の初期値
const emptyExample = { hours: 6, amount: 30000, description: "" };

export function TrialEntryFormTab({ initialData, onSubmit, isLoading }: TrialEntryFormTabProps) {
  const [qaItems, setQaItems] = useState<{ question: string; answer: string }[]>(
    initialData?.qaItems || []
  );
  
  const [examples, setExamples] = useState<{ hours: number; amount: number; description?: string }[]>(
    initialData?.examples || []
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      storeProfileId: initialData?.storeProfileId || 0,
      dailyGuarantee: 30000,
      workingHours: 6,
      isActive: true,
    },
  });

  // QAアイテムとサンプル給与が変更されたらフォームに反映
  useEffect(() => {
    form.setValue("qaItems", qaItems);
  }, [qaItems, form]);
  
  useEffect(() => {
    form.setValue("examples", examples);
  }, [examples, form]);

  // QAアイテムの追加
  const addQAItem = () => {
    setQaItems([...qaItems, { ...emptyQAItem }]);
  };

  // QAアイテムの削除
  const removeQAItem = (index: number) => {
    setQaItems(qaItems.filter((_, i) => i !== index));
  };

  // QAアイテムの更新
  const updateQAItem = (index: number, field: "question" | "answer", value: string) => {
    const newItems = [...qaItems];
    newItems[index][field] = value;
    setQaItems(newItems);
  };

  // 給与例の追加
  const addExample = () => {
    setExamples([...examples, { ...emptyExample }]);
  };

  // 給与例の削除
  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  // 給与例の更新
  const updateExample = (index: number, field: keyof typeof emptyExample, value: any) => {
    const newExamples = [...examples];
    if (field === "hours" || field === "amount") {
      newExamples[index][field] = parseInt(value, 10) || 0;
    } else {
      newExamples[index][field as "description"] = value;
    }
    setExamples(newExamples);
  };

  const handleSubmit = (values: FormValues) => {
    // QAアイテムと給与例を追加
    const data = {
      ...values,
      qaItems,
      examples,
    };
    onSubmit(data);
  };

  // フォームのプレビュー用
  const previewData = {
    dailyGuarantee: form.watch("dailyGuarantee") || 30000,
    hourlyRate: form.watch("hourlyRate"),
    workingHours: form.watch("workingHours") || 6,
    requirements: form.watch("requirements"),
    benefitsDescription: form.watch("benefitsDescription"),
    startDate: form.watch("startDate"),
    endDate: form.watch("endDate"),
    isActive: form.watch("isActive") ?? true,
    examples: examples,
    requiredDocuments: form.watch("requiredDocuments") || [],
    qaItems: qaItems,
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="dailyGuarantee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>日給保証額（円）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="例：30000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="workingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>勤務時間（時間）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="例：6"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>時給目安（円）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="例：5000"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormDescription>
                        計算上の目安時給（任意）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="benefitsDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>特典の説明</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="例：今だけ特典！体験入店で日給保証+交通費全額支給！"
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium">給与例</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addExample}>
                    <Plus className="h-4 w-4 mr-1" />
                    給与例を追加
                  </Button>
                </div>
                
                {examples.map((example, index) => (
                  <div key={index} className="border rounded-md p-4 space-y-4">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium">給与例 #{index + 1}</h4>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeExample(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FormLabel htmlFor={`example-hours-${index}`}>勤務時間（時間）</FormLabel>
                        <Input
                          id={`example-hours-${index}`}
                          type="number"
                          min="1"
                          value={example.hours}
                          onChange={(e) => updateExample(index, "hours", e.target.value)}
                        />
                      </div>
                      <div>
                        <FormLabel htmlFor={`example-amount-${index}`}>金額（円）</FormLabel>
                        <Input
                          id={`example-amount-${index}`}
                          type="number"
                          min="0"
                          value={example.amount}
                          onChange={(e) => updateExample(index, "amount", e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <FormLabel htmlFor={`example-description-${index}`}>説明（任意）</FormLabel>
                      <Input
                        id={`example-description-${index}`}
                        value={example.description || ""}
                        onChange={(e) => updateExample(index, "description", e.target.value)}
                        placeholder="例：人気店舗の場合"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>応募条件</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="応募に必要な条件があれば入力してください"
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="requiredDocuments"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">必要書類</FormLabel>
                      <FormDescription>
                        体験入店時に必要な身分証明書類を選択してください
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {requiredDocumentTypes.map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="requiredDocuments"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value || [], item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>開始日（任意）</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "yyyy/MM/dd", { locale: ja })
                              ) : (
                                <span>開始日を選択</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                            locale={ja}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        特定期間のみの特典の場合に設定
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>終了日（任意）</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "yyyy/MM/dd", { locale: ja })
                              ) : (
                                <span>終了日を選択</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => 
                              date < new Date("1900-01-01") || 
                              (form.getValues("startDate") && date < form.getValues("startDate"))
                            }
                            initialFocus
                            locale={ja}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        特定期間のみの特典の場合に設定
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium">よくある質問</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addQAItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    質問を追加
                  </Button>
                </div>
                
                {qaItems.map((item, index) => (
                  <div key={index} className="border rounded-md p-4 space-y-4">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium">質問 #{index + 1}</h4>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeQAItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <div>
                      <FormLabel htmlFor={`qa-question-${index}`}>質問</FormLabel>
                      <Input
                        id={`qa-question-${index}`}
                        value={item.question}
                        onChange={(e) => updateQAItem(index, "question", e.target.value)}
                        placeholder="例：体験入店でもらえる日給は確実ですか？"
                      />
                    </div>
                    
                    <div>
                      <FormLabel htmlFor={`qa-answer-${index}`}>回答</FormLabel>
                      <Textarea
                        id={`qa-answer-${index}`}
                        value={item.answer}
                        onChange={(e) => updateQAItem(index, "answer", e.target.value)}
                        placeholder="例：はい、規定の時間を働いていただければ確実にお支払いします。"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        公開状態
                      </FormLabel>
                      <FormDescription>
                        オンにすると体験入店情報が公開されます
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button variant="outline" type="button" onClick={() => form.reset()}>
                  リセット
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "保存中..." : "体験入店情報を保存"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="sticky top-4 border p-4">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Info className="h-5 w-5 mr-2 text-primary" />
              プレビュー
            </h3>
            <div className="max-w-sm mx-auto">
              <TrialEntryDisplay 
                trialEntry={previewData}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              ※実際の表示はデザインが異なる場合があります
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}