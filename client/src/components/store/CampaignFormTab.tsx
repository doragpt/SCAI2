import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Info } from "lucide-react";
import { format } from "date-fns";
import { campaignSchema, campaignTypeOptions, targetAudienceOptions } from "@shared/schema";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CampaignDisplay } from "./CampaignDisplay";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ja } from "date-fns/locale";

// フォームスキーマの拡張
const formSchema = campaignSchema.extend({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  imageUrl: z.string().url("有効なURLを入力してください").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CampaignFormTabProps {
  initialData?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
}

export function CampaignFormTab({ initialData, onSubmit, isLoading }: CampaignFormTabProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      type: "入店祝い金",
      isActive: true,
      isLimited: false,
      targetAudience: [],
      storeProfileId: initialData?.storeProfileId || 0,
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  // フォームのプレビュー用
  const previewData = {
    id: initialData?.id || "preview",
    title: form.watch("title") || "キャンペーンタイトル",
    description: form.watch("description") || "キャンペーンの説明文がここに表示されます。",
    amount: form.watch("amount"),
    type: form.watch("type") || "入店祝い金",
    conditions: form.watch("conditions"),
    startDate: form.watch("startDate"),
    endDate: form.watch("endDate"),
    isActive: form.watch("isActive") ?? true,
    imageUrl: form.watch("imageUrl"),
    tagline: form.watch("tagline"),
    isLimited: form.watch("isLimited") ?? false,
    targetAudience: form.watch("targetAudience") || [],
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>キャンペーンタイトル</FormLabel>
                      <FormControl>
                        <Input placeholder="例：入店祝い金10万円プレゼント" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>キャンペーンタイプ</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="タイプを選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campaignTypeOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>キャッチコピー</FormLabel>
                    <FormControl>
                      <Input placeholder="例：未経験者大歓迎！登録だけで5,000円GET！" {...field} />
                    </FormControl>
                    <FormDescription>
                      キャンペーンを目立たせるための短いフレーズ
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>キャンペーン内容</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="キャンペーンの詳細内容を入力してください"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>金額（円）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="例：100000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>特典金額がある場合は入力してください</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>開始日</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>終了日</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>画像URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例：https://example.com/images/campaign.jpg"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>キャンペーン画像のURLがあれば入力してください</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>適用条件</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="条件があれば入力してください"
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
                name="targetAudience"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">対象者</FormLabel>
                      <FormDescription>
                        このキャンペーンが対象とする方を選択してください
                      </FormDescription>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {targetAudienceOptions.map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="targetAudience"
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
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          公開状態
                        </FormLabel>
                        <FormDescription>
                          オンにするとキャンペーンが公開されます
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
                
                <FormField
                  control={form.control}
                  name="isLimited"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          期間限定表示
                        </FormLabel>
                        <FormDescription>
                          オンにすると「期間限定」バッジが表示されます
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
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button variant="outline" type="button" onClick={() => form.reset()}>
                  リセット
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "保存中..." : "キャンペーンを保存"}
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
              <CampaignDisplay 
                campaign={previewData}
                featured={true}
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