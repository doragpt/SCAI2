import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TalentProfileData } from "@shared/schema";

interface ProfileConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: TalentProfileData | null;
  isPending?: boolean;
}

export function ProfileConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  formData,
  isPending,
}: ProfileConfirmationModalProps) {
  console.log('Modal component render:', { isOpen, formData: !!formData });

  // Dialogを常にレンダリングし、openプロパティで表示制御
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>プロフィール内容の確認</DialogTitle>
          <DialogDescription>
            入力内容をご確認ください。この内容でよろしいですか？
          </DialogDescription>
        </DialogHeader>

        {formData && (
          <div className="py-4">
            <h3>基本情報の確認</h3>
            <p>名前: {formData.lastName} {formData.firstName}</p>
            <p>フリガナ: {formData.lastNameKana} {formData.firstNameKana}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            修正する
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            確定する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}