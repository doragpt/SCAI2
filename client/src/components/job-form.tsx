import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  jobSchema, 
  prefectures, 
  serviceTypes,
  phoneTypes,
  benefitTypes,
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

type JobFormData = z.infer<typeof jobSchema>;

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
  const [imageDescriptionLength, setImageDescriptionLength] = useState(0);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: initialData || {
      title: "",
      status: "draft",
      mainCatch: "",
      mainDescription: "",
      imageDescription: "",
      businessName: "",
      location: "",
      serviceType: "",
      displayServiceType: "",
      selectedBenefits: [],
      phoneNumber1: "",
      phoneType1: "通常電話",
      phoneNumber2: "",
      phoneType2: undefined,
      phoneNumber3: "",
      phoneType3: undefined,
      phoneNumber4: "",
      phoneType4: undefined,
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: JobFormData) => {
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

  const onSubmit = (data: JobFormData) => {
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
                    <span className="text-red-500">必須</span> 仕事情報
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="ここに仕事情報を入力してください(全角3000文字・半角9000文字)"
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

        {/* 画像設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">画像設定</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="imageDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">
                    <span className="text-red-500">必須</span> 画像横文言
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="ここに画像横文言を入力してください(900文字以内)"
                      className="min-h-[150px]"
                      onChange={(e) => {
                        field.onChange(e);
                        setImageDescriptionLength(e.target.value.length);
                      }}
                    />
                  </FormControl>
                  <div className="text-sm text-muted-foreground">
                    あと{900 - imageDescriptionLength}文字
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
          <CardContent>
            <FormField
              control={form.control}
              name="selectedBenefits"
              render={() => (
                <FormItem>
                  <FormLabel className="font-medium mb-4">
                    <span className="text-red-500">必須</span> 業態（待遇）
                  </FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {benefitTypes.map((benefit) => (
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
                              <FormLabel className="font-normal">
                                {benefit}
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
          </CardContent>
        </Card>

        {/* 連絡先情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">連絡先情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="phoneType1"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-medium">
                      <span className="text-red-500">必須</span> 電話種別1
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="電話種別を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {phoneTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber1"
                render={({ field }) => (
                  <FormItem className="flex-[2]">
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
            </div>

            {[2, 3, 4].map((num) => (
              <div key={num} className="flex gap-4">
                <FormField
                  control={form.control}
                  name={`phoneType${num}` as "phoneType2" | "phoneType3" | "phoneType4"}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="font-medium">電話種別{num}（任意）</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="電話種別を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {phoneTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`phoneNumber${num}` as "phoneNumber2" | "phoneNumber3" | "phoneNumber4"}
                  render={({ field }) => (
                    <FormItem className="flex-[2]">
                      <FormLabel className="font-medium">電話番号{num}（任意）</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="例：03-1234-5678" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
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