import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PenSquare, AlertCircle } from "lucide-react";
import { Redirect } from "wouter";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { getTalentProfile } from "@/lib/api/talent";
import type { UserResponse, TalentProfileData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function ProfileViewPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 最初にチェックAPIを呼び出して確実にユーザー情報を取得
  useQuery({
    queryKey: [QUERY_KEYS.AUTH_CHECK],
    queryFn: async () => {
      const response = await apiRequest("GET", QUERY_KEYS.AUTH_CHECK);
      if (!response.ok) {
        throw new Error("認証チェックに失敗しました");
      }
      const userData = await response.json();
      // 成功したらユーザー情報をキャッシュに保存
      queryClient.setQueryData([QUERY_KEYS.USER], userData);
      return userData;
    },
    enabled: !!user && !queryClient.getQueryData([QUERY_KEYS.USER]),
    staleTime: 0,
  });
  
  // タレントプロフィールデータ取得
  const { data: talentProfile, isLoading: isProfileLoading } = useQuery<TalentProfileData>({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    queryFn: async () => {
      try {
        console.log('Profile View page: Fetching talent profile...');
        const data = await getTalentProfile();
        console.log('Profile View page: Talent profile data:', data);
        return data as TalentProfileData;
      } catch (error) {
        console.error('Profile View page: Error fetching talent profile:', error);
        // エラーを表示するが、処理は続行
        toast({
          title: "プロフィールデータの取得に失敗しました",
          description: "基本情報は表示できますが、詳細情報の取得に失敗しました",
          variant: "destructive",
        });
        return null;
      }
    },
    enabled: !!user?.id,
    retry: 1,
    refetchOnMount: true,
  });

  const { data: userProfile, isLoading: isUserLoading } = useQuery<UserResponse>({
    queryKey: [QUERY_KEYS.USER],
    queryFn: async () => {
      console.log("ユーザー情報取得開始");
      const response = await apiRequest("GET", QUERY_KEYS.USER);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "ユーザー情報の取得に失敗しました");
      }
      const data = await response.json();
      console.log("取得したユーザーデータ:", data);
      return data;
    },
    enabled: !!user,
    staleTime: 0, // キャッシュを無効化
    refetchOnMount: true, // マウント時に必ず再取得
    refetchInterval: 30000, // 30秒ごとに再取得
  });
  
  // ユーザーデータとタレントプロフィールデータを結合
  const isLoading = isUserLoading || isProfileLoading;

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ユーザーとタレントのデータを結合して表示
  const birthDate = userProfile?.birthDate || (talentProfile && talentProfile.birth_date) || null;
  const displayLocation = userProfile?.location || (talentProfile && talentProfile.location) || "未設定";
  const displayPreferredLocations = userProfile?.preferredLocations || [];

  // Web履歴書への誘導メッセージ
  const showProfilePrompt = !talentProfile || Object.keys(talentProfile).length === 0;

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">プロフィール</h1>
        <div className="flex gap-2">
          <Link href="/basic-info/edit">
            <Button variant="outline" className="flex items-center gap-2">
              <PenSquare className="h-4 w-4" />
              基本情報を編集
            </Button>
          </Link>
        </div>
      </div>

      {showProfilePrompt && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800">プロフィールを完成させましょう</h3>
            <p className="text-amber-700 text-sm mt-1">
              Web履歴書を作成すると、より多くの求人に応募できるようになります。
            </p>
            <Link href="/talent/register">
              <Button size="sm" className="mt-3">
                Web履歴書を作成する
              </Button>
            </Link>
          </div>
        </div>
      )}

      <Card>
        <ScrollArea>
          <div className="p-6 space-y-6">
            {/* 基本情報 */}
            <div>
              <h2 className="text-lg font-medium mb-4">基本情報</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ニックネーム</p>
                  <p className="mt-1">{userProfile?.username || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">メールアドレス</p>
                  <p className="mt-1">{userProfile?.email || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">生年月日</p>
                  <p className="mt-1">
                    {birthDate
                      ? format(new Date(birthDate), "yyyy年MM月dd日", {
                          locale: ja,
                        })
                      : "未設定"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">居住地</p>
                  <p className="mt-1">{displayLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">希望エリア</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {displayPreferredLocations.length > 0 ? (
                      displayPreferredLocations.map((location) => (
                        <span
                          key={location}
                          className="px-2 py-1 bg-muted rounded-md text-sm"
                        >
                          {location}
                        </span>
                      ))
                    ) : (
                      <p>未設定</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* タレントプロフィール情報 */}
            {talentProfile && Object.keys(talentProfile).length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-4">詳細情報</h2>
                <p className="text-sm text-muted-foreground mb-2">※Web履歴書の内容が反映されます</p>
                
                {/* ここに詳細情報を表示 */}
                <div className="grid grid-cols-2 gap-4">
                  {talentProfile.height && (
                    <div>
                      <p className="text-sm text-muted-foreground">身長</p>
                      <p className="mt-1">{talentProfile.height}cm</p>
                    </div>
                  )}
                  
                  {talentProfile.bust && talentProfile.waist && talentProfile.hip && (
                    <div>
                      <p className="text-sm text-muted-foreground">スリーサイズ</p>
                      <p className="mt-1">B{talentProfile.bust} W{talentProfile.waist} H{talentProfile.hip}</p>
                    </div>
                  )}
                  
                  {talentProfile.cup_size && (
                    <div>
                      <p className="text-sm text-muted-foreground">カップサイズ</p>
                      <p className="mt-1">{talentProfile.cup_size}カップ</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}