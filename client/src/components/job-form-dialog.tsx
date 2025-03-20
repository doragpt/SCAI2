import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JobForm } from "./job-form";
import { type Job } from "@shared/schema";
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

type JobFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Job;
};

export function JobFormDialog({
  open,
  onOpenChange,
  initialData
}: JobFormDialogProps) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // フォームを閉じる前の確認
  const handleCloseAttempt = () => {
    setShowConfirmClose(true);
  };

  // 確認後に実際に閉じる
  const handleConfirmedClose = () => {
    setShowConfirmClose(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseAttempt}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {initialData ? "求人情報を編集" : "新規求人を作成"}
            </DialogTitle>
            <DialogDescription>
              必要な情報を入力して求人情報を{initialData ? "更新" : "作成"}してください。
            </DialogDescription>
          </DialogHeader>
          <JobForm
            initialData={initialData}
            onSuccess={() => onOpenChange(false)}
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