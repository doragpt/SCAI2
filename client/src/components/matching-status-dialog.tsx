```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Clock, Building2 } from "lucide-react";

interface Store {
  id: number;
  name: string;
  status: 'pending' | 'accepted' | 'rejected';
  responseTime?: string;
}

interface MatchingStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
}

export function MatchingStatusDialog({
  isOpen,
  onClose,
  stores,
}: MatchingStatusDialogProps) {
  const pendingCount = stores.filter(s => s.status === 'pending').length;
  const acceptedCount = stores.filter(s => s.status === 'accepted').length;
  const rejectedCount = stores.filter(s => s.status === 'rejected').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>マッチング状況</DialogTitle>
          <DialogDescription>
            現在のマッチング状況をご確認いただけます
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="space-y-2 text-center p-4 bg-primary/5 rounded-lg">
            <Building2 className="h-5 w-5 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">連絡済み</p>
            <p className="text-2xl font-bold">{stores.length}件</p>
          </div>
          <div className="space-y-2 text-center p-4 bg-primary/5 rounded-lg">
            <Clock className="h-5 w-5 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">返信待ち</p>
            <p className="text-2xl font-bold">{pendingCount}件</p>
          </div>
          <div className="space-y-2 text-center p-4 bg-primary/5 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">受入可能</p>
            <p className="text-2xl font-bold">{acceptedCount}件</p>
          </div>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {stores.map(store => (
              <div
                key={store.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{store.name}</h4>
                  <div className="flex items-center gap-2">
                    {store.status === 'pending' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">返信待ち</span>
                      </>
                    ) : store.status === 'accepted' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-500">受入可能</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">対応不可</span>
                    )}
                  </div>
                </div>
                {store.responseTime && (
                  <p className="text-sm text-muted-foreground">
                    返信日時: {store.responseTime}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```
