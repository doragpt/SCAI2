import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JobForm } from "./job-form";
import { type StoreProfile } from "@shared/schema";
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type JobFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: StoreProfile;
};

export function JobFormDialog({
  open,
  onOpenChange,
  initialData
}: JobFormDialogProps) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const { toast } = useToast();

  const handleCloseAttempt = () => {
    setShowConfirmClose(true);
  };

  const handleConfirmedClose = () => {
    setShowConfirmClose(false);
    onOpenChange(false);
  };
  
  // 成功時のコールバック関数（確実にダイアログを閉じる）
  const handleSuccess = () => {
    console.log("JobFormDialog: 保存成功、ダイアログを閉じます");
    // 成功メッセージをトーストで表示
    toast({
      title: "店舗情報を保存しました",
      description: "変更内容が反映されました",
    });
    // ダイアログを閉じる
    onOpenChange(false);
    setShowConfirmClose(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseAttempt}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {initialData ? "店舗情報を編集" : "店舗情報を作成"}
            </DialogTitle>
            <DialogDescription>
              必要な情報を入力して店舗情報を{initialData ? "更新" : "作成"}してください。
            </DialogDescription>
          </DialogHeader>
          <JobForm
            initialData={initialData}
            onSuccess={handleSuccess}
            onCancel={handleCloseAttempt}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>編集を中止しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              保存されていない変更は失われます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmClose(false)}>
              編集を続ける
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedClose}>
              編集を中止
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}