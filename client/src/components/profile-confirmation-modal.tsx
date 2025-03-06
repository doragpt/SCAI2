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
import { Loader2 } from "lucide-react";

interface ProfileConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: TalentProfileData | null;
  isSubmitting?: boolean;
}

export function ProfileConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  formData,
  isSubmitting,
}: ProfileConfirmationModalProps) {
  console.log('Modal render:', { isOpen, formData: !!formData });

  if (!isOpen || !formData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>プロフィール内容の確認</DialogTitle>
          <DialogDescription>
            入力内容をご確認ください。この内容でよろしいですか？
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">基本情報</h3>
            <p>氏名: {formData.lastName} {formData.firstName}</p>
            <p>フリガナ: {formData.lastNameKana} {formData.firstNameKana}</p>
            <p>居住地: {formData.location}</p>
            <p>最寄り駅: {formData.nearestStation}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">身体情報</h3>
            <p>身長: {formData.height}cm</p>
            <p>体重: {formData.weight}kg</p>
            {formData.bust && <p>バスト: {formData.bust}cm</p>}
            {formData.waist && <p>ウエスト: {formData.waist}cm</p>}
            {formData.hip && <p>ヒップ: {formData.hip}cm</p>}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">写真</h3>
            <p>アップロード済み: {formData.photos?.length || 0}枚</p>
            {formData.photos?.some(photo => photo.tag === "現在の髪色") && (
              <p className="text-primary">現在の髪色の写真: 登録済み</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            修正する
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                送信中...
              </>
            ) : (
              "確定する"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}