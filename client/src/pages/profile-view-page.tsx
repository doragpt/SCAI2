import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { type TalentProfileData } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { QUERY_KEYS, apiRequest } from "@/lib/queryClient";
import { Loader2, PenSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function ProfileViewPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ユーザー基本情報のみを取得
  const {
    data: userProfile,
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: () => apiRequest("GET", "/api/user/profile"),
    enabled: !!user,
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
    console.error("Profile fetch error:", error);
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
        <Button variant="outline" asChild>
          <Link href="/talent/register">
            <PenSquare className="h-4 w-4 mr-2" />
            編集する
          </Link>
        </Button>
      </div>

      <Card>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="p-6 space-y-6">
            {/* ユーザー基本情報のみを表示 */}
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
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}