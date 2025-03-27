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
    console.log("JobFormDialog: 保存成功、ダイアログを閉じます", {
      isOpen: open,
      timestamp: new Date().toISOString()
    });
    
    // 成功メッセージをトーストで表示
    toast({
      title: "店舗情報を保存しました",
      description: "変更内容が反映されました",
    });
    
    // 重要: ダイアログを明示的に閉じる
    // setTimeout を使用して非同期処理の完了後に確実に実行する
    setShowConfirmClose(false);
    
    // 二重のタイムアウトを使用して確実にダイアログを閉じる
    // React の状態更新と UI 更新のサイクルを完了させるため
    setTimeout(() => {
      console.log("JobFormDialog: 外側のタイマー実行");
      
      // 内側のタイムアウトで確実に実行（マイクロタスクキューを活用）
      setTimeout(() => {
        console.log("JobFormDialog: 内側のタイマー実行 - ダイアログを閉じます");
        try {
          // 明示的にダイアログを閉じる
          onOpenChange(false);
          console.log("JobFormDialog: ダイアログを閉じるコールバックが実行されました");
        } catch (error) {
          console.error("JobFormDialog: ダイアログを閉じる処理でエラーが発生しました", error);
        }
      }, 10); // 短い遅延で内側のタイマーを実行
    }, 50); // 外側のタイマーも短い遅延
  };

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(newOpenState) => {
          console.log("Dialog onOpenChange イベント発生:", { 
            currentOpen: open, 
            newOpenState, 
            timestamp: new Date().toISOString() 
          });
          
          // ダイアログを閉じる場合のみ確認ダイアログを表示
          if (open && !newOpenState) {
            handleCloseAttempt();
          } else {
            // それ以外の場合（ダイアログを開く場合）は直接状態を変更
            onOpenChange(newOpenState);
          }
        }}
      >
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