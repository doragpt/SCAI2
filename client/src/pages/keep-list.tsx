import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { type KeepList } from "@shared/schema";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function KeepListPage() {
  const { user } = useAuth();

  const { data: keepList, isLoading } = useQuery<KeepList[]>({
    queryKey: ["/api/keep-list"],
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">キープリスト</h1>
          <p className="text-muted-foreground">
            保存した求人の一覧
          </p>
        </div>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4 pr-4">
          {keepList?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                キープリストは空です
              </CardContent>
            </Card>
          ) : (
            keepList?.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-lg">Store #{item.storeId}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      追加日: {format(new Date(item.addedAt), 'yyyy年MM月dd日', { locale: ja })}
                    </p>
                    {item.note && (
                      <p className="text-sm mt-2 whitespace-pre-wrap">{item.note}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}