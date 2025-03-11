import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PenSquare } from "lucide-react";
import { Redirect } from "wouter";
import { format, differenceInYears } from "date-fns";
import { ja } from "date-fns/locale";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import type { UserResponse } from "@shared/schema";

export default function ProfileViewPage() {
  const { user } = useAuth();

  const { data: userProfile, isLoading } = useQuery<UserResponse>({
    queryKey: [QUERY_KEYS.USER],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "ユーザー情報の取得に失敗しました");
      }
      const data = await response.json();
      console.log('Received user profile:', data); // デバッグ用
      return data;
    },
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

  const calculateAge = (birthDate: string) => {
    return differenceInYears(new Date(), new Date(birthDate));
  };

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
                  <p className="text-sm text-muted-foreground">年齢</p>
                  <p className="mt-1">
                    {userProfile?.birthDate
                      ? `${calculateAge(userProfile.birthDate)}歳`
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
            </div>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}