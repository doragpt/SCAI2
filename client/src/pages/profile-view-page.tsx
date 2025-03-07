import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PenSquare } from "lucide-react";
import { Redirect } from "wouter";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";

interface UserProfile {
  id: number;
  username: string;
  displayName: string | null;
  birthDate: string | null;
  location: string | null;
  preferredLocations: string[] | null;
}

export default function ProfileViewPage() {
  const { user } = useAuth();

  // ユーザー基本情報を取得
  const {
    data: userProfile,
    isLoading: isUserLoading,
    error: userError
  } = useQuery<UserProfile>({
    queryKey: [QUERY_KEYS.USER_PROFILE],
    queryFn: () => apiRequest<UserProfile>("GET", QUERY_KEYS.USER_PROFILE),
    enabled: !!user,
  });

  // タレントプロフィールを取得
  const {
    data: talentProfile,
    isLoading: isTalentLoading,
    error: talentError
  } = useQuery<TalentProfileData>({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    queryFn: async () => {
      try {
        const response = await apiRequest<TalentProfileData>("GET", QUERY_KEYS.TALENT_PROFILE);
        console.log('Talent profile response:', {
          hasData: !!response,
          profileData: response,
          timestamp: new Date().toISOString()
        });
        return response;
      } catch (error) {
        console.error('Talent profile fetch error:', {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    },
    enabled: !!user,
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isUserLoading || isTalentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userError || talentError) {
    console.error("Profile fetch error:", {
      userError,
      talentError,
      timestamp: new Date().toISOString()
    });
    return (
      <div className="container max-w-2xl py-8">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-red-600">エラーが発生しました</h1>
            <p className="text-muted-foreground">
              プロフィールの取得中にエラーが発生しました。
            </p>
          </div>
        </Card>
      </div>
    );
  }

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
          {!talentProfile && (
            <Link href="/talent/register">
              <Button variant="default" className="flex items-center gap-2">
                <PenSquare className="h-4 w-4" />
                ウェブ履歴書を作成
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="p-6 space-y-6">
            {/* ユーザー基本情報 */}
            <div>
              <h2 className="text-lg font-medium">基本情報</h2>
              <Card className="p-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ニックネーム</p>
                    <p className="mt-1">{userProfile?.username || "未設定"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">本名</p>
                    <p className="mt-1">{userProfile?.displayName || "未設定"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">生年月日</p>
                    <p className="mt-1">
                      {userProfile?.birthDate
                        ? format(new Date(userProfile.birthDate), "yyyy年MM月dd日", {
                            locale: ja,
                          })
                        : "未設定"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">希望エリア</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {userProfile?.preferredLocations?.length > 0 ? (
                        userProfile.preferredLocations.map((location) => (
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
              </Card>
            </div>

            {/* タレントプロフィール情報 */}
            {talentProfile && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">ウェブ履歴書</h2>
                    <Link href="/talent/register">
                      <Button variant="outline" size="sm">
                        <PenSquare className="h-4 w-4 mr-2" />
                        編集する
                      </Button>
                    </Link>
                  </div>
                  <Card className="p-6 mt-4">
                    <div className="space-y-6">
                      {/* 基本情報 */}
                      <div className="space-y-4">
                        <h3 className="font-medium">基本情報</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">氏名</p>
                            <p className="mt-1">
                              {talentProfile.lastName} {talentProfile.firstName}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">フリガナ</p>
                            <p className="mt-1">
                              {talentProfile.lastNameKana} {talentProfile.firstNameKana}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">在住地</p>
                            <p className="mt-1">{talentProfile.location}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">最寄り駅</p>
                            <p className="mt-1">{talentProfile.nearestStation}</p>
                          </div>
                        </div>
                      </div>

                      {/* 身体的特徴 */}
                      <div className="space-y-4">
                        <h3 className="font-medium">身体的特徴</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">身長</p>
                            <p className="mt-1">{talentProfile.height}cm</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">体重</p>
                            <p className="mt-1">{talentProfile.weight}kg</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">カップサイズ</p>
                            <p className="mt-1">{talentProfile.cupSize}カップ</p>
                          </div>
                          {talentProfile.bust && (
                            <div>
                              <p className="text-sm text-muted-foreground">バスト</p>
                              <p className="mt-1">{talentProfile.bust}cm</p>
                            </div>
                          )}
                          {talentProfile.waist && (
                            <div>
                              <p className="text-sm text-muted-foreground">ウエスト</p>
                              <p className="mt-1">{talentProfile.waist}cm</p>
                            </div>
                          )}
                          {talentProfile.hip && (
                            <div>
                              <p className="text-sm text-muted-foreground">ヒップ</p>
                              <p className="mt-1">{talentProfile.hip}cm</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* パネル設定 */}
                      <div className="space-y-4">
                        <h3 className="font-medium">パネル設定</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">顔出し</p>
                            <p className="mt-1">{talentProfile.faceVisibility}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">写メ日記</p>
                            <p className="mt-1">
                              {talentProfile.canPhotoDiary ? "可能" : "不可"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 自己PR */}
                      {talentProfile.selfIntroduction && (
                        <div className="space-y-4">
                          <h3 className="font-medium">自己PR</h3>
                          <p className="whitespace-pre-wrap">
                            {talentProfile.selfIntroduction}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}