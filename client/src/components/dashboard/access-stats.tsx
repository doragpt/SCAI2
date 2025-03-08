import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function AccessStats({ storeId }: { storeId: number }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["access-stats", storeId],
    queryFn: async () => {
      const response = await fetch(`/api/stores/${storeId}/stats`);
      if (!response.ok) {
        throw new Error("統計データの取得に失敗しました");
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 時間帯別データの整形
  const hourlyData = stats?.hourlyStats ? Object.entries(stats.hourlyStats).map(([hour, count]) => ({
    hour: `${hour}時`,
    count
  })) : [];

  return (
    <div className="space-y-6">
      {/* 基本統計 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats?.totalVisits || 0}</div>
            <div className="text-sm text-muted-foreground">本日の総アクセス数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats?.uniqueVisitors || 0}</div>
            <div className="text-sm text-muted-foreground">ユニークユーザー数</div>
          </CardContent>
        </Card>
      </div>

      {/* 時間帯別グラフ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">時間帯別アクセス数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={hourlyData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
