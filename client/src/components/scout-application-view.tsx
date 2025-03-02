import { useQuery } from "@tanstack/react-query";
import { Application } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

export function ScoutApplicationView() {
  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/scout"],
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
          You haven't made any applications yet.
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
                <span>Application #{application.id}</span>
                <Badge
                  variant={
                    application.status === "accepted"
                      ? "default"
                      : application.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {application.status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Offer Amount:</span>
                  <span className="font-medium">
                    ¥{application.guaranteeOffer?.toLocaleString() ?? "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="font-medium">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {application.message && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Message:</h4>
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
