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
    refetchInterval: 300000, // 5分ごとに更新
  });

  if (isLoading) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-5 w-5 text-primary animate-spin rounded-full border-2 border-primary border-t-transparent" />
            アクセス状況
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-muted rounded" />
              <div className="h-40 bg-muted rounded" />
            </div>
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="h-5 w-5 text-primary">📊</div>
          アクセス状況
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              本日のアクセス
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Card className="hover:bg-accent/5 transition-colors">
                <CardContent className="p-3">
                  <div className="text-2xl font-bold text-primary">
                    {stats?.today.total.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">総アクセス</div>
                </CardContent>
              </Card>
              <Card className="hover:bg-accent/5 transition-colors">
                <CardContent className="p-3">
                  <div className="text-2xl font-bold text-primary">
                    {stats?.today.unique.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">ユニーク</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 時間帯別グラフ */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              時間帯別アクセス
            </h3>
            <div className="h-40 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    interval={3}
                    className="text-muted-foreground"
                  />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    formatter={(value: number) => [`${value}件`, 'アクセス数']}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
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
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              今月のアクセス
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Card className="hover:bg-accent/5 transition-colors">
                <CardContent className="p-3">
                  <div className="text-2xl font-bold text-primary">
                    {stats?.monthly.total.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">総アクセス</div>
                </CardContent>
              </Card>
              <Card className="hover:bg-accent/5 transition-colors">
                <CardContent className="p-3">
                  <div className="text-2xl font-bold text-primary">
                    {stats?.monthly.unique.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">ユニーク</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}