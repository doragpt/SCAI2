import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { type ViewHistory } from "@shared/schema";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ViewHistoryPage() {
  const { user } = useAuth();

  const { data: viewHistory, isLoading } = useQuery<ViewHistory[]>({
    queryKey: ["/api/view-history"],
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">閲覧履歴</h1>
          <p className="text-muted-foreground">
            最近チェックした求人情報
          </p>
        </div>
      </motion.div>

      <ScrollArea className="h-[600px]">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4 pr-4"
        >
          {viewHistory?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                閲覧履歴はありません
              </CardContent>
            </Card>
          ) : (
            viewHistory?.map((item) => (
              <motion.div key={item.id} variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Store #{item.storeId}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      閲覧日時: {format(new Date(item.viewedAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </ScrollArea>
    </div>
  );
}