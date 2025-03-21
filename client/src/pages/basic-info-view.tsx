import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, PenSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function BasicInfoView() {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: userProfile,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: async () => {
      const response = await apiRequest("GET", QUERY_KEYS.USER);
      if (!response.ok) {
        throw new Error("ユーザー情報の取得に失敗しました");
      }
      const data = await response.json();
      return data;
    },
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

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

  if (error) {
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
        <h1 className="text-2xl font-semibold">基本情報</h1>
        <Button variant="outline" asChild>
          <Link href="/basic-info/edit">
            <PenSquare className="h-4 w-4 mr-2" />
            編集する
          </Link>
        </Button>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">ニックネーム</p>
          <p>{userProfile?.username || "未設定"}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">生年月日</p>
          <p>
            {userProfile?.birthDate
              ? (() => {
                  console.log('Birth date value:', userProfile.birthDate, typeof userProfile.birthDate);
                  try {
                    // 日付文字列の形式に基づいて処理を分岐
                    let formattedDate;
                    if (typeof userProfile.birthDate === 'string' && userProfile.birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      // YYYY-MM-DD形式の場合
                      const [year, month, day] = userProfile.birthDate.split('-');
                      formattedDate = `${year}年${month}月${day}日`;
                    } else {
                      // それ以外の場合はDate型に変換して表示
                      const date = new Date(userProfile.birthDate);
                      if (isNaN(date.getTime())) {
                        // 無効な日付の場合はそのまま表示
                        return userProfile.birthDate;
                      }
                      formattedDate = format(date, "yyyy年MM月dd日", { locale: ja });
                    }
                    return formattedDate;
                  } catch (error) {
                    console.error('Date format error:', error);
                    return userProfile.birthDate; // そのまま表示
                  }
                })()
              : "未設定"}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">メールアドレス</p>
          <p>{userProfile?.email || "未設定"}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">在住地</p>
          <p>{userProfile?.location || "未設定"}</p>
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
      </Card>
    </div>
  );
}