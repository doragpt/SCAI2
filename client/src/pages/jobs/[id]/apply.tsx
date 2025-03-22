import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/breadcrumb";
import { Loader2, MapPin, Building, Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatSalary, getServiceTypeLabel, getErrorMessage } from "@/lib/utils";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { JobResponse } from "@shared/schema";

// 応募フォームのバリデーションスキーマ
const applicationFormSchema = z.object({
  message: z.string().max(1000, "メッセージは1000文字以内で入力してください").optional(),
});

type ApplicationFormData = z.infer<typeof applicationFormSchema>;

export default function JobApplicationPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // IDが確実に存在する場合のみ処理を進めるための安全対策
  const isValidId = id ? !isNaN(parseInt(id)) : false;
  const jobId = isValidId ? id : '';

  // 求人情報の取得
  const {
    data: job,
    isLoading,
    error
  } = useQuery({
    queryKey: [QUERY_KEYS.JOB_DETAIL(jobId)],
    enabled: Boolean(isValidId),
    queryFn: async (): Promise<JobResponse> => {
      try {
        const url = `/api${QUERY_KEYS.JOB_DETAIL(jobId)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error("求人詳細の取得に失敗しました");
        }

        return await response.json() as JobResponse;
      } catch (error) {
        console.error("求人詳細取得エラー:", error);
        throw error;
      }
    }
  });

  // フォーム初期化
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      message: "",
    },
  });

  // 応募処理のMutation
  const applicationMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      return apiRequest(`/api/applications/${jobId}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/history"] });
      toast({
        title: "応募完了",
        description: "正常に応募が完了しました。マイページから応募状況を確認できます。",
      });
      navigate("/my-page");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "応募エラー",
        description: getErrorMessage(error),
      });
    },
  });

  // エラー処理
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: getErrorMessage(error),
      });
      navigate("/jobs");
    }
  }, [error, navigate, toast]);

  // 未認証ユーザーはログインページへリダイレクト
  useEffect(() => {
    if (!user && !isLoading) {
      toast({
        title: "ログインが必要です",
        description: "求人に応募するには、ログインまたは会員登録が必要です。",
      });
      navigate("/auth");
    }
  }, [user, isLoading, navigate, toast]);

  // フォーム送信ハンドラ
  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      await applicationMutation.mutateAsync(data);
    } catch (error) {
      console.error("応募エラー:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">求人情報が見つかりませんでした。</p>
            <Button asChild className="mt-4">
              <Link href="/jobs">求人一覧に戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "求人一覧", href: "/jobs" },
    { label: job.businessName, href: `/jobs/${jobId}` },
    { label: "応募フォーム" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Breadcrumb items={breadcrumbItems} />

        <div className="grid md:grid-cols-3 gap-8 mt-4">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">応募フォーム</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>メッセージ (任意)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="お店への質問や希望条件などがあればこちらにご記入ください"
                              {...field}
                              className="min-h-[150px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-sm text-muted-foreground">
                      <p>※応募後はマイページから応募状況を確認できます。</p>
                      <p>※応募情報は店舗側に通知されます。</p>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`/jobs/${jobId}`)}
                      >
                        キャンセル
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            送信中...
                          </>
                        ) : (
                          "応募する"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>応募先情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg">{job.businessName}</h3>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{job.location}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="font-medium">業種:</span>
                    <span className="ml-2">
                      {getServiceTypeLabel(job.serviceType)}
                    </span>
                  </div>

                  <div>
                    <span className="font-medium">日給:</span>
                    <span className="ml-2">
                      {formatSalary(job.minimumGuarantee, job.maximumGuarantee)}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">更新日:</span>
                    <span className="ml-2">
                      {new Date(job.updatedAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-1">キャッチコピー</h4>
                  <p className="text-sm">{job.catchPhrase}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/jobs/${jobId}`)}
                >
                  詳細に戻る
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}