import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TalentProfileData } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { QUERY_KEYS } from "@/lib/queryClient";
import { Loader2, PenSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfileViewPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile, isLoading, error } = useQuery<TalentProfileData>({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
    onError: (error) => {
      console.error("Profile fetch error:", error);
      toast({
        title: "エラーが発生しました",
        description: "プロフィールの取得に失敗しました。",
        variant: "destructive",
      });
    },
  });

  // ローディング状態の処理
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // エラー状態の処理
  if (error) {
    return (
      <div className="container max-w-2xl py-8">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-red-600">エラーが発生しました</h1>
            <p className="text-muted-foreground">
              プロフィールの取得中にエラーが発生しました。
            </p>
            <Button onClick={() => window.location.reload()}>
              再読み込み
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // プロフィールが存在しない場合
  if (!profile) {
    return (
      <div className="container max-w-2xl py-8">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">プロフィールが未作成です</h1>
            <p className="text-muted-foreground">
              プロフィールを作成して、あなたの情報を登録しましょう。
            </p>
            <Button asChild>
              <Link href="/talent/resume/create">プロフィールを作成する</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">プロフィール</h1>
        <Button variant="outline" asChild>
          <Link href="/talent/resume/edit">
            <PenSquare className="h-4 w-4 mr-2" />
            編集する
          </Link>
        </Button>
      </div>

      <Card>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="p-6 space-y-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium">基本情報</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">氏名</p>
                  <p>{profile.lastName} {profile.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">フリガナ</p>
                  <p>{profile.lastNameKana} {profile.firstNameKana}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">在住地</p>
                  <p>{profile.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">最寄り駅</p>
                  <p>{profile.nearestStation}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 身分証明書 */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium">身分証明書</h2>
              <div>
                <p className="text-sm text-muted-foreground">持参可能な身分証明書</p>
                <ul className="list-disc list-inside mt-2">
                  {profile.availableIds?.types?.map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                  {profile.availableIds?.others?.map((other) => (
                    <li key={other}>{other}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">本籍地入りの住民票</p>
                <p>{profile.canProvideResidenceRecord ? "提供可能" : "提供不可"}</p>
              </div>
            </div>

            <Separator />

            {/* 身体的特徴 */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium">身体的特徴</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">身長</p>
                  <p>{profile.height}cm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">体重</p>
                  <p>{profile.weight}kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">カップサイズ</p>
                  <p>{profile.cupSize}カップ</p>
                </div>
                {profile.bust && (
                  <div>
                    <p className="text-sm text-muted-foreground">バスト</p>
                    <p>{profile.bust}cm</p>
                  </div>
                )}
                {profile.waist && (
                  <div>
                    <p className="text-sm text-muted-foreground">ウエスト</p>
                    <p>{profile.waist}cm</p>
                  </div>
                )}
                {profile.hip && (
                  <div>
                    <p className="text-sm text-muted-foreground">ヒップ</p>
                    <p>{profile.hip}cm</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* パネル設定 */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium">パネル設定</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">顔出し</p>
                  <p>{profile.faceVisibility}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">写メ日記</p>
                  <p>{profile.canPhotoDiary ? "可能" : "不可"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">自宅への派遣</p>
                  <p>{profile.canHomeDelivery ? "可能" : "不可"}</p>
                </div>
              </div>
            </div>

            {/* 写メ日記URL */}
            {profile.photoDiaryUrls && profile.photoDiaryUrls.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">写メ日記が確認できる店舗URL</h2>
                  <ul className="list-disc list-inside">
                    {profile.photoDiaryUrls.map((url, index) => (
                      <li key={index}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* NGオプション */}
            {(profile.ngOptions?.common?.length > 0 || profile.ngOptions?.others?.length > 0) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">NGオプション</h2>
                  <ul className="list-disc list-inside">
                    {profile.ngOptions?.common?.map((option) => (
                      <li key={option}>{option}</li>
                    ))}
                    {profile.ngOptions?.others?.map((option) => (
                      <li key={option}>{option}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* アレルギー */}
            {profile.allergies?.hasAllergy && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">アレルギー</h2>
                  <ul className="list-disc list-inside">
                    {profile.allergies?.types?.map((type) => (
                      <li key={type}>{type}</li>
                    ))}
                    {profile.allergies?.others?.map((other) => (
                      <li key={other}>{other}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* 喫煙 */}
            {profile.smoking?.enabled && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">喫煙</h2>
                  <ul className="list-disc list-inside">
                    {profile.smoking?.types?.map((type) => (
                      <li key={type}>{type}</li>
                    ))}
                    {profile.smoking?.others?.map((other) => (
                      <li key={other}>{other}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* SNSアカウント */}
            {profile.hasSnsAccount && profile.snsUrls?.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">SNSアカウント</h2>
                  <ul className="list-disc list-inside">
                    {profile.snsUrls?.map((url) => (
                      <li key={url}>{url}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* 在籍店舗 */}
            {profile.currentStores?.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">現在の在籍店舗</h2>
                  {profile.currentStores?.map((store, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">店舗名</p>
                        <p>{store.storeName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">源氏名</p>
                        <p>{store.stageName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 過去の在籍店舗 */}
            {profile.previousStores?.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">過去の在籍店舗</h2>
                  <ul className="list-disc list-inside">
                    {profile.previousStores?.map((store, index) => (
                      <li key={index}>{store.storeName}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* エステオプション */}
            {profile.estheOptions?.available?.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">エステオプション</h2>
                  <div>
                    <p className="text-sm text-muted-foreground">可能なオプション</p>
                    <ul className="list-disc list-inside mt-2">
                      {profile.estheOptions?.available?.map((option) => (
                        <li key={option}>{option}</li>
                      ))}
                    </ul>
                  </div>
                  {profile.estheOptions?.ngOptions?.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">NGオプション</p>
                      <ul className="list-disc list-inside mt-2">
                        {profile.estheOptions?.ngOptions?.map((option, index) => (
                          <li key={index}>{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {profile.hasEstheExperience && (
                    <div>
                      <p className="text-sm text-muted-foreground">エステ経験</p>
                      <p>経験あり（{profile.estheExperiencePeriod}）</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 自己PR */}
            {profile.selfIntroduction && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">自己PR</h2>
                  <p className="whitespace-pre-wrap">{profile.selfIntroduction}</p>
                </div>
              </>
            )}

            {/* その他備考 */}
            {profile.notes && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">その他備考</h2>
                  <p className="whitespace-pre-wrap">{profile.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}