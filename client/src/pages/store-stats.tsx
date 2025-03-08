import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Users, LineChart } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function StoreStatsPage() {
  const [_, setLocation] = useLocation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["access-stats-detail"],
    queryFn: async () => {
      const response = await fetch(`/api/stores/stats/detail`);
      if (!response.ok) {
        throw new Error("統計データの取得に失敗しました");
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => setLocation('/store/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          ダッシュボードに戻る
        </Button>
        <h1 className="text-2xl font-bold">アクセス統計</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(new Date(), "yyyy年MM月dd日", { locale: ja })}のアクセス状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  総アクセス数
                </div>
                <div className="text-4xl font-bold text-primary">
                  {stats?.totalVisits?.toLocaleString() || 0}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  ユニークユーザー
                </div>
                <div className="text-4xl font-bold text-primary">
                  {stats?.uniqueVisitors?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {stats?.dailyBreakdown && (
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold">過去7日間の推移</h2>
            <div className="grid gap-4">
              {stats.dailyBreakdown.map((day) => (
                <Card key={day.date} className="hover:bg-accent/5 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(day.date), "M月d日（E）", { locale: ja })}
                        </div>
                        <div className="font-semibold">
                          {day.totalVisits.toLocaleString()} アクセス
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ユニーク: {day.uniqueVisitors.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}