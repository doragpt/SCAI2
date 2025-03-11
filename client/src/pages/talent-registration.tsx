import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TalentForm } from "@/components/talent-form";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function TalentRegistration() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  // タレントプロフィールデータを取得
  const { data: talentProfile, isLoading, error } = useQuery<TalentProfileData>({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    queryFn: async () => {
      try {
        console.log('Fetching talent profile...'); // デバッグログ
        const response = await apiRequest("GET", "/api/talent/profile");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "タレントプロフィールの取得に失敗しました");
        }
        const data = await response.json();
        console.log('Received talent profile:', data); // デバッグログ
        return data;
      } catch (error) {
        console.error('Talent profile fetch error:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 1, // リトライを1回に制限
  });

  // エラーが発生した場合はトースト表示
  if (error) {
    toast({
      title: "エラー",
      description: error instanceof Error ? error.message : "データの取得に失敗しました",
      variant: "destructive",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              SCAI 女性登録
            </h1>
            <p className="text-sm text-muted-foreground">
              安全に働くための詳細情報を登録してください
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              ログイン中: {user?.username}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="ml-2">ログアウト</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Web履歴書作成</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center text-destructive">
                  <p>データの取得に失敗しました</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    再読み込み
                  </Button>
                </div>
              ) : (
                <TalentForm initialData={talentProfile} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}