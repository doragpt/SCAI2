import { useEffect, useState } from "react";
import { useParams, useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Breadcrumb } from "@/components/breadcrumb";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { ApplicationFormData } from "@/types/application";
import { apiRequest } from "@/lib/queryClient";

// Zodスキーマを定義
const applicationFormSchema = z.object({
  message: z.string().max(1000, "メッセージは1000文字以内で入力してください").optional(),
});

type ApplicationFormData = z.infer<typeof applicationFormSchema>;

export default function JobApplicationPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const jobId = params?.id;
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // ジョブ詳細を取得
  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: [QUERY_KEYS.JOB_DETAIL(jobId)],
    enabled: !!jobId,
  });
  
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      message: "",
    },
  });
  
  // 応募送信ミューテーション
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      return apiRequest(`/api/applications/${jobId}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "応募が完了しました",
        description: "店舗からの連絡をお待ちください",
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICATIONS_TALENT] });
      navigate("/my-page");
    },
    onError: (error: Error) => {
      toast({
        title: "エラーが発生しました",
        description: error.message || "応募処理中にエラーが発生しました。後でもう一度お試しください。",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (data: ApplicationFormData) => {
    if (!user) {
      toast({
        title: "ログインが必要です",
        description: "応募するにはログインしてください",
        variant: "destructive",
      });
      return;
    }
    
    mutate(data);
  };
  
  // ユーザーがログインしていない場合はログインページにリダイレクト
  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast({
        title: "ログインが必要です",
        description: "応募するにはログインしてください",
      });
      navigate("/auth?redirect=" + encodeURIComponent(`/jobs/${jobId}/apply`));
    }
  }, [user, isAuthLoading, navigate, jobId, toast]);
  
  // タレント以外のユーザーはリダイレクト
  useEffect(() => {
    if (!isAuthLoading && user && user.role !== "talent") {
      toast({
        title: "アクセス権限がありません",
        description: "タレントアカウントでログインしてください",
        variant: "destructive",
      });
      navigate("/jobs/" + jobId);
    }
  }, [user, isAuthLoading, navigate, jobId, toast]);
  
  const isLoading = isAuthLoading || isJobLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">求人が見つかりませんでした</h2>
          <p className="mt-2 text-muted-foreground">
            この求人は削除されたか、存在しない可能性があります
          </p>
          <Button className="mt-4" onClick={() => navigate("/jobs")}>
            求人一覧に戻る
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "求人一覧", href: "/jobs" },
          { label: job.businessName, href: `/jobs/${jobId}` },
          { label: "面接申請" },
        ]}
      />
      
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">面接申請</CardTitle>
            <CardDescription>
              <span className="font-medium">{job.businessName}</span> への応募情報を入力してください
            </CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">申請求人</h3>
                    <p className="text-foreground">{job.businessName}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">エリア</h3>
                    <p className="text-foreground">{job.location}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">業種</h3>
                    <p className="text-foreground">{job.serviceType}</p>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メッセージ (任意)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="面接の希望日時や質問などあればご記入ください"
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        店舗担当者に伝えたいことがあれば入力してください
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => navigate(`/jobs/${jobId}`)}
                >
                  戻る
                </Button>
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    "申請を送信する"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}