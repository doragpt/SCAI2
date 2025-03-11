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
import { useEffect } from "react";

export default function TalentRegistration() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  // タレントプロフィールデータを取得
  const { data: talentProfile, isLoading, error } = useQuery<TalentProfileData>({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    queryFn: async () => {
      try {
        console.log("Fetching talent profile...");
        const response = await apiRequest("GET", QUERY_KEYS.TALENT_PROFILE);
        if (!response.ok) {
          console.error("Failed to fetch talent profile:", response.status);
          throw new Error("タレントプロフィールの取得に失敗しました");
        }
        const data = await response.json();
        console.log("Talent profile fetched successfully:", data);
        return data;
      } catch (error) {
        console.error("Error fetching talent profile:", error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 1,
  });

  // エラーが発生した場合はuseEffectでトースト表示
  useEffect(() => {
    if (error) {
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "プロフィールの取得に失敗しました",
        variant: "destructive",
      });
    }
  }, [error, toast]);

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
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    プロフィール情報を読み込んでいます...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center p-8">
                  <p className="text-sm text-destructive">
                    プロフィールの読み込みに失敗しました。
                    <br />
                    ページを更新してもう一度お試しください。
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    ページを更新
                  </Button>
                </div>
              ) : (
                <TalentForm />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}