import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  storeJobFormSchema,
  prefectures, 
  benefitTypes,
  serviceTypeSearch,
  serviceTypeDisplay,
  serviceTypeLabels,
  type StoreJobFormData
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryClient";

type JobFormProps = {
  initialData?: Partial<StoreJobFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function JobForm({ initialData, onSuccess, onCancel }: JobFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<StoreJobFormData>({
    resolver: zodResolver(storeJobFormSchema),
    defaultValues: initialData || {
      // 店舗基本情報
      businessName: "",
      serviceTypeSearch: "deriheru",
      serviceTypeDisplay: "デリバリーヘルス",
      location: "東京都",
      address: "",
      nearestStation: "",
      interviewAddress: "",
      snsId: "",
      snsText: "",
      snsUrl: "",
      officialSiteUrl: "",
      receptionTime: "",
      contactPerson: "",

      // 求人情報
      mainCatch: "",
      mainDescription: "",
      imageDescription: "",
      selectedBenefits: [],

      // 連絡先情報
      phoneNumber1: "",
      phoneNumber2: "",
      phoneNumber3: "",
      phoneNumber4: "",
      email1: "",
      email1Note: "",
      email2: "",
      email2Note: "",
      email3: "",
      email3Note: "",
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: StoreJobFormData) => {
      const response = await fetch("/api/stores/basic-info", {
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STORE_INFO] });
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

  const onSubmit = (data: StoreJobFormData) => {
    mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 店舗基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>店舗基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>店名</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="店舗名を入力してください" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serviceTypeSearch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>業種（検索用）</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // 検索用業種が変更されたら、対応する表示用業種も自動的に更新
                        form.setValue("serviceTypeDisplay", serviceTypeLabels[value]);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="業種を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypeSearch.map((type) => (
                          <SelectItem key={type} value={type}>
                            {serviceTypeLabels[type]}
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
                name="serviceTypeDisplay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>業種（表示用）</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // 表示用業種に対応する検索用業種を見つけて設定
                        const searchType = Object.entries(serviceTypeLabels).find(
                          ([_, displayType]) => displayType === value
                        )?.[0];
                        if (searchType) {
                          form.setValue("serviceTypeSearch", searchType);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="表示名を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypeDisplay.map((type) => (
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>エリア</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="エリアを選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {prefectures.map((pref) => (
                        <SelectItem key={pref} value={pref}>
                          {pref}
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>住所</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="住所を入力してください" />
                  </FormControl>
                  <FormDescription>300文字以内</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nearestStation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>地区・最寄り</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例：西船橋駅周辺" />
                  </FormControl>
                  <FormDescription>150文字以内</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interviewAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>面接場所住所</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="面接場所の住所を入力してください" />
                  </FormControl>
                  <FormDescription>300文字以内</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="snsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SNSID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SNSのIDを入力" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="snsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SNSテキスト</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例：ラインで24時間受付中" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="snsUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SNS友達追加URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="SNSのURLを入力" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="officialSiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>オフィシャルサイトURL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="公式サイトのURLを入力" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="receptionTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>受付時間</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例：12:00〜翌4:00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>担当者氏名</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例：店長：山田" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 求人情報 */}
        <Card>
          <CardHeader>
            <CardTitle>求人情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="mainCatch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>キャッチコピー</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="魅力的なキャッチコピーを入力してください" />
                  </FormControl>
                  <FormDescription>300文字以内</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mainDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>仕事内容</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="仕事内容の詳細を入力してください"
                      className="min-h-[200px]"
                    />
                  </FormControl>
                  <FormDescription>全角3000文字・半角9000文字以内</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>画像横文言</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="画像の横に表示する説明文を入力してください"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>900文字以内</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 待遇情報 */}
        <Card>
          <CardHeader>
            <CardTitle>待遇情報</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="selectedBenefits"
              render={() => (
                <FormItem>
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
            <CardTitle>連絡先情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="phoneNumber1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>電話番号1（必須）</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" placeholder="例：03-1234-5678" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {['phoneNumber2', 'phoneNumber3', 'phoneNumber4'].map((name, index) => (
              <FormField
                key={name}
                control={form.control}
                name={name as "phoneNumber2" | "phoneNumber3" | "phoneNumber4"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電話番号{index + 2}（任意）</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="例：03-1234-5678" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {[1, 2, 3].map((num) => (
              <div key={num} className="space-y-2">
                <FormField
                  control={form.control}
                  name={`email${num}` as "email1" | "email2" | "email3"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス{num}{num === 1 ? "（必須）" : "（任意）"}</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="例：example@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`email${num}Note` as "email1Note" | "email2Note" | "email3Note"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス{num}但し書き</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="メールアドレスの補足情報" />
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