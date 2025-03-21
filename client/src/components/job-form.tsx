import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobSchema, benefitTypes, benefitCategories, type Job } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";

const FORM_STEP_NAMES = {
  detail: "詳細情報",
  benefits: "給与・待遇"
} as const;

type FormStep = keyof typeof FORM_STEP_NAMES;
type JobFormData = typeof jobSchema._type;

type JobFormProps = {
  initialData?: Job;
  onSuccess?: () => void;
  onCancel?: () => void;
  storeInfo: {
    businessName: string;
    location: string;
  };
};

export function JobForm({ initialData, onSuccess, onCancel, storeInfo }: JobFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [catchPhraseLength, setCatchPhraseLength] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [currentStep, setCurrentStep] = useState<FormStep>("detail");
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    mode: "onChange",
    defaultValues: {
      businessName: initialData?.businessName || storeInfo.businessName,
      catchPhrase: initialData?.catchPhrase || "",
      description: initialData?.description || "",
      benefits: initialData?.benefits || [],
      minimumGuarantee: initialData?.minimumGuarantee || 0,
      maximumGuarantee: initialData?.maximumGuarantee || 0,
      status: initialData?.status || "draft",
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: JobFormData) => {
      const endpoint = initialData ? `/api/jobs/${initialData.id}` : "/api/jobs";
      const method = initialData ? "PATCH" : "POST";

      // APIリクエストデータの整形
      const formattedData = {
        ...data,
        location: storeInfo.location, // 運営側で設定された所在地を使用
        minimumGuarantee: Number(data.minimumGuarantee) || 0,
        maximumGuarantee: Number(data.maximumGuarantee) || 0,
      };

      const response = await apiRequest(method, endpoint, formattedData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "求人情報の保存に失敗しました");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.JOBS_STORE],
        refetchType: 'all'
      });
      toast({
        title: "求人情報を保存しました",
        description: "変更内容が保存されました。",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: JobFormData) => {
    mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as FormStep)}>
          <TabsList className="grid w-full grid-cols-2">
            {Object.entries(FORM_STEP_NAMES).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="detail">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">詳細情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 店舗名（表示のみ） */}
                <div className="space-y-2">
                  <FormLabel>店舗名</FormLabel>
                  <div className="p-3 bg-muted rounded-md">
                    <p>{storeInfo.businessName}</p>
                  </div>
                </div>

                {/* 所在地（表示のみ） */}
                <div className="space-y-2">
                  <FormLabel>所在地</FormLabel>
                  <div className="p-3 bg-muted rounded-md">
                    <p>{storeInfo.location}</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="catchPhrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">キャッチコピー</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="キャッチコピーを入力してください（300文字以内）"
                          className="min-h-[100px]"
                          onChange={(e) => {
                            field.onChange(e);
                            setCatchPhraseLength(e.target.value.length);
                          }}
                        />
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        {catchPhraseLength}/300文字
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">お仕事の内容</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="お仕事の内容を入力してください（9000文字以内）"
                          className="min-h-[200px]"
                          onChange={(e) => {
                            field.onChange(e);
                            setDescriptionLength(e.target.value.length);
                          }}
                        />
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        {descriptionLength}/9000文字
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">給与・待遇情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="minimumGuarantee"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="font-medium">最低保証（円）</FormLabel>
                        <FormControl>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="例：30000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maximumGuarantee"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="font-medium">最高保証（円）</FormLabel>
                        <FormControl>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="例：50000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="benefits"
                  render={() => (
                    <FormItem>
                      <div className="space-y-8">
                        {Object.entries(benefitTypes).map(([category, benefits]) => (
                          <div key={category}>
                            <h3 className="text-base font-medium mb-4">
                              {benefitCategories[category as keyof typeof benefitCategories]}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {benefits.map((benefit) => (
                                <FormField
                                  key={benefit}
                                  control={form.control}
                                  name="benefits"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={benefit}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(benefit)}
                                            onCheckedChange={(checked) => {
                                              const currentValue = field.value || [];
                                              const newValue = checked
                                                ? [...currentValue, benefit]
                                                : currentValue.filter((value) => value !== benefit);
                                              field.onChange(newValue);
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer">
                                          {benefit}
                                        </FormLabel>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            {category !== Object.keys(benefitTypes).slice(-1)[0] && (
                              <Separator className="my-6" />
                            )}
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            プレビュー
          </Button>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存する
            </Button>
          </div>
        </div>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>求人情報プレビュー</DialogTitle>
              <DialogDescription>
                求職者に表示される実際の画面イメージです
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 p-6 bg-background rounded-lg border">
              <div className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-lg font-bold text-primary">{form.getValues("catchPhrase")}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">お仕事の内容</h3>
                    <p className="whitespace-pre-wrap leading-relaxed">{form.getValues("description")}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">店舗情報</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">店舗名</p>
                        <p>{storeInfo.businessName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">所在地</p>
                        <p>{storeInfo.location}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">給与</h3>
                    <div className="text-xl font-bold">
                      {form.getValues("minimumGuarantee") ? `${form.getValues("minimumGuarantee").toLocaleString()}円` : ""}
                      {form.getValues("maximumGuarantee") ? ` ～ ${form.getValues("maximumGuarantee").toLocaleString()}円` : ""}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">待遇・福利厚生</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {form.getValues("benefits")?.map((benefit) => (
                        <div key={benefit} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
}