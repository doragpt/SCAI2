import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  jobSchema,
  prefectures,
  serviceTypes,
  benefitTypes,
  benefitCategories,
  type Job
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryClient";
import { useState } from "react";
import type { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// スタイル用の定数
const FORM_STEP_NAMES = {
  basic: "基本情報",
  detail: "詳細情報",
  benefits: "給与・待遇"
} as const;

type FormStep = keyof typeof FORM_STEP_NAMES;

type JobFormData = z.infer<typeof jobSchema>;

type JobFormProps = {
  initialData?: Job;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function JobForm({ initialData, onSuccess, onCancel }: JobFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mainCatchLength, setMainCatchLength] = useState(0);
  const [mainDescriptionLength, setMainDescriptionLength] = useState(0);
  const [currentStep, setCurrentStep] = useState<FormStep>("basic");
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      businessName: initialData?.businessName || "",
      location: initialData?.location || "東京都",
      serviceType: initialData?.serviceType || "デリヘル",
      status: initialData?.status || "draft",
      mainCatch: initialData?.mainCatch || "",
      mainDescription: initialData?.mainDescription || "",
      selectedBenefits: initialData?.selectedBenefits || [],
      phoneNumber1: initialData?.phoneNumber1 || "",
      phoneNumber2: initialData?.phoneNumber2 || "",
      phoneNumber3: initialData?.phoneNumber3 || "",
      phoneNumber4: initialData?.phoneNumber4 || "",
      contactEmail: initialData?.contactEmail || "",
      contactSns: initialData?.contactSns || "",
      contactSnsUrl: initialData?.contactSnsUrl || "",
      minimumGuarantee: initialData?.minimumGuarantee || null,
      maximumGuarantee: initialData?.maximumGuarantee || null,
      transportationSupport: initialData?.transportationSupport || false,
      housingSupport: initialData?.housingSupport || false
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: JobFormData) => {
      const endpoint = initialData ? `/api/jobs/${initialData.id}` : "/api/jobs";
      const method = initialData ? "PATCH" : "POST";

      const response = await apiRequest(method, endpoint, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "求人情報の保存に失敗しました");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS_STORE] });
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

  const PreviewDialog = () => (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>求人情報プレビュー</DialogTitle>
          <DialogDescription>
            実際の表示イメージを確認できます
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold">{form.getValues("mainCatch")}</h3>
            <p className="mt-2 whitespace-pre-wrap">{form.getValues("mainDescription")}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">勤務地</p>
              <p>{form.getValues("location")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">業種</p>
              <p>{form.getValues("serviceType")}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">給与</p>
            <p>
              {form.getValues("minimumGuarantee") && `${form.getValues("minimumGuarantee").toLocaleString()}円`}
              {form.getValues("maximumGuarantee") && ` ～ ${form.getValues("maximumGuarantee").toLocaleString()}円`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">待遇</p>
            <div className="flex flex-wrap gap-2">
              {form.getValues("selectedBenefits")?.map((benefit) => (
                <span key={benefit} className="px-2 py-1 bg-primary/10 rounded-md text-sm">
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as FormStep)}>
          <TabsList className="grid w-full grid-cols-3">
            {Object.entries(FORM_STEP_NAMES).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>

          {/* 基本情報 */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">店舗名</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="店舗名を入力してください" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">勤務地</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="勤務地を選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {prefectures.map((prefecture) => (
                            <SelectItem key={prefecture} value={prefecture}>
                              {prefecture}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">業種</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="業種を選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceTypes.map((type) => (
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* 詳細情報 */}
          <TabsContent value="detail">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">詳細情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="mainCatch"
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
                            setMainCatchLength(e.target.value.length);
                          }}
                        />
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        {mainCatchLength}/300文字
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mainDescription"
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
                            setMainDescriptionLength(e.target.value.length);
                          }}
                        />
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        {mainDescriptionLength}/9000文字
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 給与・待遇情報 */}
          <TabsContent value="benefits">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">給与・待遇情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="minimumGuarantee"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="font-medium">最低保証（円）</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="例：30000"
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
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
                          <Input
                            {...field}
                            type="number"
                            placeholder="例：50000"
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="selectedBenefits"
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
                                  name="selectedBenefits"
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存する
            </Button>
          </div>
        </div>

        <PreviewDialog />
      </form>
    </Form>
  );
}