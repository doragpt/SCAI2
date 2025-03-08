import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <StatCard
          icon={<LineChart className="h-5 w-5" />}
          label="本日の総アクセス数"
          value={stats?.totalVisits || 0}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="ユニークユーザー数"
          value={stats?.uniqueVisitors || 0}
        />
      </div>

      {/* 時間帯別グラフ */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={hourlyData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  className
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden group hover:shadow-md transition-all", className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="text-3xl font-bold text-primary group-hover:scale-105 transition-transform">
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}