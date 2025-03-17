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
  FormDescription,
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

type JobFormProps = {
  initialData?: Job;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function JobForm({ initialData, onSuccess, onCancel }: JobFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 文字数カウント用のstate
  const [mainCatchLength, setMainCatchLength] = useState(0);
  const [mainDescriptionLength, setMainDescriptionLength] = useState(0);

  const form = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: initialData || {
      title: "",
      status: "draft",
      mainCatch: "",
      mainDescription: "",
      businessName: "",
      location: "",
      serviceType: "",
      displayServiceType: "",
      selectedBenefits: [],
      phoneNumber1: "",
      phoneNumber2: "",
      phoneNumber3: "",
      phoneNumber4: "",
      contactEmail: "",
      contactSns: "",
      contactSnsUrl: ""
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/jobs/basic-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "基本情報の保存に失敗しました");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS_STORE] });
      toast({
        title: "基本情報を保存しました",
        description: "変更内容が保存されました。",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "基本情報の保存に失敗しました",
      });
    },
  });

  const onSubmit = (data) => {
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
                  <FormLabel className="font-medium">店名</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="店舗名を入力してください" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">業種（検索用）</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="displayServiceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">業種（表示用）</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="表示する業種を選択してください" />
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
              name="mainCatch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">
                    <span className="text-red-500">必須</span> キャッチコピー
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="ここにキャッチコピーを入力してください(300文字以内)"
                      className="min-h-[100px]"
                      onChange={(e) => {
                        field.onChange(e);
                        setMainCatchLength(e.target.value.length);
                      }}
                    />
                  </FormControl>
                  <div className="text-sm text-muted-foreground">
                    あと{300 - mainCatchLength}文字
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
                  <FormLabel className="font-medium">
                    <span className="text-red-500">必須</span> お仕事の内容
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="ここにお仕事の内容を入力してください(全角3000文字・半角9000文字)"
                      className="min-h-[200px]"
                      onChange={(e) => {
                        field.onChange(e);
                        setMainDescriptionLength(e.target.value.length);
                      }}
                    />
                  </FormControl>
                  <div className="text-sm text-muted-foreground">
                    あと{9000 - mainDescriptionLength}文字
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 待遇情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">待遇情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
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
                                          return checked
                                            ? field.onChange([...field.value, benefit])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== benefit
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {benefit}
                                    </FormLabel>
                                  </FormItem>
                                )
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
                  <FormDescription className="mt-4">
                    ※ チェックは0個から選択可能です
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 連絡先情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">応募用連絡先</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="contactSns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">SNS ID（任意）</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例：@shop_recruit" />
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
                    <Input {...field} type="url" placeholder="例：https://line.me/ti/p/xxxxx" />
                  </FormControl>
                  <FormDescription>
                    LINEやTwitterなどのSNSプロフィールURLを入力してください
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">
                    <span className="text-red-500">必須</span> 電話番号1
                  </FormLabel>
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
                name={`phoneNumber${num}` as "phoneNumber2" | "phoneNumber3" | "phoneNumber4"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">電話番号{num}（任意）</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="例：03-1234-5678" />
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
                    <Input {...field} type="email" placeholder="例：recruit@example.com" />
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
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存する
          </Button>
        </div>
      </form>
    </Form>
  );
}