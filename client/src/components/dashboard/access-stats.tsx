import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { AccessStatsResponse } from "@shared/schema";

export function AccessStats() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<AccessStatsResponse>({
    queryKey: [`/api/stores/${user?.id}/access-stats`],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>アクセス状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 時間帯別データの整形
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hourData = stats?.hourly.find(h => h.hour === i);
    return {
      hour: i,
      count: hourData?.count || 0,
      label: `${i}時`
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>アクセス状況</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* 今日のアクセス数 */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {stats?.today.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  本日の総アクセス数
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {stats?.today.unique || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  本日のユニークユーザー数
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 時間帯別グラフ */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  interval={3}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value}件`, 'アクセス数']}
                  labelFormatter={(label) => `${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 今月のアクセス数 */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {stats?.monthly.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  今月の総アクセス数
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {stats?.monthly.unique || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  今月のユニークユーザー数
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
