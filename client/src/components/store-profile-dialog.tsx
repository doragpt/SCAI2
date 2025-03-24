import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StoreProfileForm } from "./store-profile-form";
import { type StoreProfile } from "@shared/schema";
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

type StoreProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: StoreProfile;
};

export function StoreProfileDialog({
  open,
  onOpenChange,
  initialData,
}: StoreProfileDialogProps) {
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);
  const [formKey, setFormKey] = useState(Date.now()); // Used to reset the form when reopened

  // Handle dialog close with confirmation if needed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Request confirmation before closing
      setShowUnsavedChangesAlert(true);
    } else {
      onOpenChange(open);
    }
  };

  // Handle confirmation to discard changes
  const handleConfirmClose = () => {
    setShowUnsavedChangesAlert(false);
    onOpenChange(false);
    // Reset form on next open
    setFormKey(Date.now());
  };

  // Handle cancel of confirmation dialog
  const handleCancelClose = () => {
    setShowUnsavedChangesAlert(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">店舗プロフィール編集</DialogTitle>
            <DialogDescription>
              魅力的な店舗プロフィールを作成して、求職者の応募を増やしましょう。
            </DialogDescription>
          </DialogHeader>
          
          <StoreProfileForm
            key={formKey}
            initialData={initialData}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => handleOpenChange(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for unsaved changes */}
      <AlertDialog open={showUnsavedChangesAlert} onOpenChange={setShowUnsavedChangesAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>変更内容が保存されていません</AlertDialogTitle>
            <AlertDialogDescription>
              編集中の内容は保存されません。本当に閉じますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>閉じる</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}