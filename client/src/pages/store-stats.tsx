import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
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
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => setLocation('/store/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          ダッシュボードに戻る
        </Button>
        <h1 className="text-2xl font-bold">アクセス統計</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">日付</th>
                  <th className="text-center py-2 px-4 font-medium text-muted-foreground">本日の総アクセス数</th>
                  <th className="text-center py-2 px-4 font-medium text-muted-foreground">ユニークユーザー数</th>
                </tr>
              </thead>
              <tbody>
                {stats?.dailyBreakdown?.map((day) => (
                  <tr key={day.date} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      {format(new Date(day.date), "yyyy年MM月dd日（E）", { locale: ja })}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="font-semibold">{day.totalVisits.toLocaleString()}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="font-semibold">{day.uniqueVisitors.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}