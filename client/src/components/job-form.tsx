import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storeProfileSchema, type StoreProfileFormData, benefitTypes, benefitCategories } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";

type StoreProfileFormProps = {
  initialData?: StoreProfileFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
};

function StoreProfileForm({ initialData, onSuccess, onCancel }: StoreProfileFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [catchPhraseLength, setCatchPhraseLength] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);

  const form = useForm<StoreProfileFormData>({
    resolver: zodResolver(storeProfileSchema),
    mode: "onChange",
    defaultValues: {
      catch_phrase: initialData?.catch_phrase || "",
      description: initialData?.description || "",
      benefits: initialData?.benefits || [],
      minimum_guarantee: initialData?.minimum_guarantee || 0,
      maximum_guarantee: initialData?.maximum_guarantee || 0,
      status: initialData?.status || "draft",
    }
  });

  // フォームの状態をデバッグ用にログ出力
  console.log("Form State:", {
    isValid: form.formState.isValid,
    errors: form.formState.errors,
    values: form.getValues(),
    isDirty: form.formState.isDirty
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: StoreProfileFormData) => {
      // 送信前のデータを整形
      const formattedData = {
        ...data,
        minimum_guarantee: Number(data.minimum_guarantee) || 0,
        maximum_guarantee: Number(data.maximum_guarantee) || 0,
        status: data.status || "draft",
        benefits: data.benefits || [],
      };

      console.log("Mutation - Request data:", formattedData);

      try {
        const response = await apiRequest("PATCH", "/api/store/profile", formattedData);
        if (!response.ok) {
          const error = await response.json();
          console.error("Mutation - API Error:", error);
          throw new Error(error.message || "店舗情報の保存に失敗しました");
        }

        const result = await response.json();
        console.log("Mutation - API Success:", result);
        return result;
      } catch (error) {
        console.error("Mutation - Request Error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation - onSuccess:", data);
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.STORE_PROFILE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STORE_STATS],
      });

      toast({
        title: "店舗情報を保存しました",
        description: "変更内容が保存されました。",
      });

      form.reset(data);
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Mutation - onError:", error);
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error.message || "店舗情報の保存に失敗しました",
      });
    },
  });

  const onSubmit = (data: StoreProfileFormData) => {
    console.log("Submitting form data:", data);
    mutate(data);
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          console.log("Form submit event triggered");
          form.handleSubmit(onSubmit)(e);
        }} 
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="catch_phrase"
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

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="minimum_guarantee"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="font-medium">最低保証（円）</FormLabel>
                <FormControl>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                    value={field.value === 0 ? "" : field.value}
                    placeholder="例：30000"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maximum_guarantee"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="font-medium">最高保証（円）</FormLabel>
                <FormControl>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                    value={field.value === 0 ? "" : field.value}
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <input 
                  type="hidden" 
                  {...field} 
                  value={field.value || "draft"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="flex items-center justify-between">
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
            onClick={() => {
              console.log("Submit button clicked");
              console.log("Current form state:", form.getValues());
            }}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存する
          </Button>
        </div>
      </form>
    </Form>
  );
}

export { StoreProfileForm as JobForm };