import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobSchema, prefectures, serviceTypes, type Job, type InsertJob } from "@shared/schema";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryClient";
import { type z } from "zod";

type JobFormData = z.infer<typeof jobSchema>;

type JobFormProps = {
  jobId: number | null;
  initialData?: Job;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function JobForm({ jobId, initialData, onSuccess, onCancel }: JobFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: initialData || {
      title: "",
      catchPhrase: "",
      description: "",
      location: "",
      serviceType: "",
      workingHours: "",
      minimumGuarantee: 0,
      maximumGuarantee: 0,
      transportationSupport: false,
      housingSupport: false,
      requirements: {
        ageMin: 18,
        ageMax: 99,
        specMin: undefined,
        specMax: undefined,
        otherConditions: [],
      },
      qualifications: "",
      benefits: "",
      workingConditions: "",
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: JobFormData) => {
      console.log('Submitting job form:', {
        jobId,
        isUpdate: !!jobId,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(jobId ? `/api/jobs/${jobId}` : "/api/jobs", {
        method: jobId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "求人情報の保存に失敗しました");
      }

      return response.json() as Promise<Job>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS_STORE] });
      toast({
        title: `求人情報を${jobId ? "更新" : "作成"}しました`,
        description: "変更内容が保存されました。",
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Job form submission error:', {
        error,
        jobId,
        timestamp: new Date().toISOString()
      });

      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "求人情報の保存に失敗しました",
      });
    },
  });

  const onSubmit = (data: JobFormData) => {
    mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>求人タイトル</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例：経験者優遇！高収入求人" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="catchPhrase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>キャッチフレーズ</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例：未経験者も安心！充実した研修制度あり" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>仕事内容</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="仕事内容の詳細を入力してください"
                  className="min-h-[120px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>勤務地</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="勤務地を選択" />
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
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>業種</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="業種を選択" />
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
        </div>

        <FormField
          control={form.control}
          name="workingHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>勤務時間</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例：10:00～翌5:00" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minimumGuarantee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>最低保証</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="例：30000"
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  />
                </FormControl>
                <FormDescription>1日の最低保証額を入力してください</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maximumGuarantee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>最高保証</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="例：50000"
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  />
                </FormControl>
                <FormDescription>1日の最高保証額を入力してください</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="transportationSupport"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>交通費支給</FormLabel>
                  <FormDescription>
                    交通費の支給がある場合はオンにしてください
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
            name="housingSupport"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>寮完備</FormLabel>
                  <FormDescription>
                    寮の完備がある場合はオンにしてください
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

        <FormField
          control={form.control}
          name="qualifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>応募資格</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="応募に必要な資格や条件を入力してください"
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="benefits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>待遇・福利厚生</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="待遇や福利厚生の内容を入力してください"
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="workingConditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>勤務条件</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="勤務条件の詳細を入力してください"
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            {jobId ? "更新する" : "作成する"}
          </Button>
        </div>
      </form>
    </Form>
  );
}