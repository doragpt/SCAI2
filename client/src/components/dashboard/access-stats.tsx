import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, LineChart, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export function AccessStats({ storeId }: { storeId: number }) {
  const [_, setLocation] = useLocation();
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
      <div className="flex items-center justify-center h-[100px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<LineChart className="h-5 w-5" />}
          label="本日のアクセス"
          value={stats?.totalVisits || 0}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="ユニーク"
          value={stats?.uniqueVisitors || 0}
        />
      </div>
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={() => setLocation('/store/stats')}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        詳細を確認
      </Button>
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
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <div className="text-2xl font-bold text-primary">
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}