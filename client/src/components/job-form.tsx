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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryClient";
import { useState } from "react";
import type { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const log = (level: 'info' | 'error', message: string, data?: any) => {
  console[level](message, data);
};

type JobFormData = z.infer<typeof jobSchema>;

type JobFormProps = {
  initialData?: Job;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function JobForm({ initialData, onSuccess, onCancel }: JobFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [catchPhraseLength, setCatchPhraseLength] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    mode: "onChange",
    defaultValues: {
      businessName: initialData?.businessName || "",
      location: initialData?.location || "東京都",
      serviceType: initialData?.serviceType || "デリヘル",
      status: initialData?.status || "draft",
      catchPhrase: initialData?.catchPhrase || "",
      description: initialData?.description || "",
      benefits: initialData?.benefits || [],
      minimumGuarantee: initialData?.minimumGuarantee || null,
      maximumGuarantee: initialData?.maximumGuarantee || null,
      transportationSupport: initialData?.transportationSupport || false,
      housingSupport: initialData?.housingSupport || false,
      phone_number_1: initialData?.phone_number_1 || "",
      phone_number_2: initialData?.phone_number_2 || "",
      phone_number_3: initialData?.phone_number_3 || "",
      phone_number_4: initialData?.phone_number_4 || "",
      contactEmail: initialData?.contactEmail || "",
      contactSns: initialData?.contactSns || "",
      contactSnsUrl: initialData?.contactSnsUrl || ""
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: JobFormData) => {
      const endpoint = initialData ? `/api/jobs/${initialData.id}` : "/api/jobs";
      const method = initialData ? "PATCH" : "POST";

      log('info', '求人フォーム送信開始', {
        method,
        endpoint,
        isUpdate: !!initialData,
        formData: data
      });

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
      log('error', '求人フォーム送信エラー', {
        error: error.message,
        formState: form.formState
      });
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: JobFormData) => {
    log('info', 'フォーム送信前の検証', {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      data
    });

    if (!form.formState.isValid) {
      toast({
        variant: "destructive",
        title: "入力内容に誤りがあります",
        description: "必須項目を入力してください。",
      });
      return;
    }

    mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 店舗基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">店舗基本情報</CardTitle>
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

        {/* 求人情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">求人情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {/* 給与・待遇情報 */}
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
                        type="number"
                        placeholder="例：30000"
                        value={field.value?.toString() || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value, 10) : null;
                          field.onChange(value);
                        }}
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
                        type="number"
                        placeholder="例：50000"
                        value={field.value?.toString() || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value, 10) : null;
                          field.onChange(value);
                        }}
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

        {/* 応募用連絡先 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">応募用連絡先</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="phone_number_1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">電話番号1</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" placeholder="例：03-1234-5678" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {[2, 3, 4].map((num) => (
              <FormField
                key={num}
                control={form.control}
                name={`phone_number_${num}` as "phone_number_2" | "phone_number_3" | "phone_number_4"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">電話番号{num}（任意）</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="例：03-1234-5678"
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">メールアドレス（任意）</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="例：recruit@example.com"
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactSns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">SNS ID（任意）</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="例：@shop_recruit"
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactSnsUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">SNS友達追加URL（任意）</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="例：https://line.me/ti/p/xxxxx"
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={!form.formState.isValid || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存する
          </Button>
        </div>
      </form>
    </Form>
  );
}