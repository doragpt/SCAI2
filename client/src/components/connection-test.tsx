import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function ConnectionTest() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/health'],
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>接続テスト中...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>サーバーとの接続を確認しています</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">接続エラー</CardTitle>
        </CardHeader>
        <CardContent>
          <p>サーバーとの接続に失敗しました。</p>
          <p className="text-sm text-muted-foreground mt-2">
            エラー詳細: {error instanceof Error ? error.message : '不明なエラー'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="text-primary">接続成功</CardTitle>
      </CardHeader>
      <CardContent>
        <p>サーバーとの接続が確認できました。</p>
        <p className="text-sm text-muted-foreground mt-2">
          サーバー時刻: {data?.timestamp}
        </p>
      </CardContent>
    </Card>
  );
}
