import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Application } from "@/types/application";

const statusLabels: Record<string, string> = {
  pending: "処理中",
  accepted: "承諾",
  rejected: "拒否",
  withdrawn: "取り下げ"
};

export function StoreApplicationView() {
  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/store"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!applications?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          申請履歴はありません。
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        {applications.map((application) => (
          <Card key={application.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>申請 #{application.id}</span>
                <Badge
                  variant={
                    application.status === "accepted"
                      ? "default"
                      : application.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {statusLabels[application.status]}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">申請者:</span>
                  <span className="font-medium">
                    {application.username || "不明"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">申請日時:</span>
                  <span className="font-medium">
                    {new Date(application.created_at).toLocaleDateString()}
                  </span>
                </div>
                {application.message && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">メッセージ:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.message}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
