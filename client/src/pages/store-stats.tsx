import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function StoreStatsPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: stats, isLoading } = useQuery({
    queryKey: ["access-stats-detail", user?.id, format(selectedDate, "yyyy-MM")],
    queryFn: async () => {
      const response = await fetch(`/api/stores/${user?.id}/stats/detail?date=${format(selectedDate, "yyyy-MM")}`);
      if (!response.ok) {
        throw new Error("統計データの取得に失敗しました");
      }
      return response.json();
    }
  });

  const prevMonth = () => {
    setSelectedDate(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const nextMonth = () => {
    const now = new Date();
    setSelectedDate(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate > now ? d : newDate;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-[1200px] mx-auto px-6 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold">アクセス解析</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* 年月選択 */}
          <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-base font-medium">
                {format(selectedDate, "yyyy年MM月", { locale: ja })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                disabled={selectedDate >= new Date()}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* テーブル */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-sm whitespace-nowrap bg-muted/30" rowSpan={2}>日付</th>
                  <th className="text-center p-2 font-medium text-sm whitespace-nowrap bg-muted/30" colSpan={3}>アクセス状況</th>
                  <th className="text-center p-2 font-medium text-sm whitespace-nowrap bg-muted/30" colSpan={3}>アクション状況</th>
                </tr>
                <tr className="border-b">
                  <th className="text-center p-2 font-medium text-sm whitespace-nowrap bg-muted/20">総数</th>
                  <th className="text-center p-2 font-medium text-sm whitespace-nowrap bg-muted/20">PC</th>
                  <th className="text-center p-2 font-medium text-sm whitespace-nowrap bg-muted/20">スマホ</th>
                  <th className="text-center p-2 font-medium text-sm whitespace-nowrap bg-muted/20">応募</th>
                  <th className="text-center p-2 font-medium text-sm whitespace-nowrap bg-muted/20">質問</th>
                  <th className="text-center p-2 font-medium text-sm whitespace-nowrap bg-muted/20">電話</th>
                </tr>
              </thead>
              <tbody>
                {stats?.dailyStats?.map((day: any) => (
                  <tr key={day.date} className="border-b hover:bg-muted/10 transition-colors">
                    <td className="p-2 text-sm">{format(new Date(day.date), "M/d")}</td>
                    <td className="text-center p-2 text-sm">{day.totalVisits.toLocaleString()}</td>
                    <td className="text-center p-2 text-sm">{day.pcVisits.toLocaleString()}</td>
                    <td className="text-center p-2 text-sm">{day.mobileVisits.toLocaleString()}</td>
                    <td className="text-center p-2 text-sm">{day.applications.toLocaleString()}</td>
                    <td className="text-center p-2 text-sm">{day.questions.toLocaleString()}</td>
                    <td className="text-center p-2 text-sm">{day.calls.toLocaleString()}</td>
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