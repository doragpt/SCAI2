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
    
    // 成功処理フラグをセット（onOpenChangeで自動閉じの際に判別するため）
    try {
      window.localStorage.setItem('form_save_confirmed', 'true');
      console.log("保存確認フラグをセットしました");
    } catch (storageError) {
      console.error("ローカルストレージへの保存に失敗:", storageError);
    }
    
    // 成功メッセージをトーストで表示
    toast({
      title: "店舗情報を保存しました",
      description: "変更内容が反映されました",
    });
    
    // 確認ダイアログを隠す
    setShowConfirmClose(false);
    
    // ダイアログを遅延なしで直接閉じる試行
    console.log("JobFormDialog: ダイアログを即時に閉じる試行開始");
    
    // DOM操作を優先させるために実行をスケジュール
    // マイクロタスクキューに入れることでレンダリングより先に実行される
    Promise.resolve().then(() => {
      try {
        console.log("JobFormDialog: Promise内でダイアログを閉じる試行");
        onOpenChange(false);
        console.log("JobFormDialog: ダイアログを閉じるコールバックが実行されました (即時)");
        
        // 閉じることに成功したらローカルストレージをクリア (少し遅延させる)
        setTimeout(() => {
          window.localStorage.removeItem('form_save_confirmed');
          console.log("保存確認フラグを削除しました (即時処理成功)");
        }, 200);
      } catch (error) {
        console.error("JobFormDialog: Promiseでのダイアログ閉じる処理でエラー", error);
        
        // エラー発生時のフォールバック: タイムアウトを使用して再試行
        setTimeout(() => {
          console.log("JobFormDialog: ダイアログを閉じる (タイムアウト経由での再試行)");
          try {
            onOpenChange(false);
            console.log("JobFormDialog: ダイアログを閉じるコールバックが実行されました (タイムアウト経由)");
            
            setTimeout(() => {
              window.localStorage.removeItem('form_save_confirmed');
              console.log("保存確認フラグを削除しました (タイムアウト処理成功)");
            }, 200);
          } catch (innerError) {
            console.error("JobFormDialog: ダイアログを閉じる処理でタイムアウト後もエラー発生", innerError);
            
            // 最後の手段として強制的に状態リセット
            setTimeout(() => {
              console.log("JobFormDialog: 緊急対応として画面リフレッシュを試行");
              window.localStorage.removeItem('form_save_confirmed');
              window.location.href = window.location.pathname;
            }, 500);
          }
        }, 100);
      }
    });
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
          
          // フォーム送信後の強制閉鎖と通常のキャンセルを区別
          if (open && !newOpenState) {
            // 直近の操作がフォーム保存だった場合は確認なしで閉じる（直接閉じられた場合）
            if (window.localStorage.getItem('form_save_confirmed') === 'true') {
              console.log("保存確認済みフラグを検出、ダイアログを閉じます");
              window.localStorage.removeItem('form_save_confirmed');
              onOpenChange(false);
            } else {
              // 通常のキャンセル時は確認ダイアログを表示
              handleCloseAttempt();
            }
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