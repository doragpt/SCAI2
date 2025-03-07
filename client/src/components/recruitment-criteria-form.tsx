```tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  recruitmentCriteriaSchema,
  type InsertRecruitmentCriteria,
  cupSizes
} from "@shared/schema";
import { motion } from "framer-motion";

export function RecruitmentCriteriaForm({
  onSubmit,
  initialData,
  jobId,
}: {
  onSubmit: (data: InsertRecruitmentCriteria) => Promise<void>;
  initialData?: Partial<InsertRecruitmentCriteria>;
  jobId: number;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InsertRecruitmentCriteria>({
    resolver: zodResolver(recruitmentCriteriaSchema),
    defaultValues: {
      storeId: jobId,
      minAge: initialData?.minAge || 18,
      maxAge: initialData?.maxAge || 35,
      minSpec: initialData?.minSpec || 105,
      maxSpec: initialData?.maxSpec,
      specialConditions: initialData?.specialConditions || {},
    },
  });

  const handleSubmit = async (data: InsertRecruitmentCriteria) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>注意</AlertTitle>
          <AlertDescription>
            この採用基準は内部情報として扱われ、応募者には表示されません。
          </AlertDescription>
        </Alert>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>基本採用基準</CardTitle>
              <CardDescription>
                応募者の基本的な採用基準を設定してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="minAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最小年齢</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>18歳以上を推奨</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最大年齢</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="minSpec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最小スペック</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        体重-身長=スペック値（例：105以上）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxSpec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最大スペック（任意）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>特例条件</CardTitle>
              <CardDescription>
                特定の条件下での採用基準の調整が可能です
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="specialConditions.cupSize.size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>カップサイズ条件</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="カップサイズを選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cupSizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}カップ以上
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
                  name="specialConditions.cupSize.adjustedMinSpec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>調整後の最小スペック</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        カップサイズ条件を満たす場合の緩和された基準
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specialConditions.other"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>その他の特記事項</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            リセット
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "送信中..." : "保存する"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```
