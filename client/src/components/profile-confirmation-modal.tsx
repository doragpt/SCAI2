import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  console.log('Modal render with props:', { isOpen, formData });

  // formDataが存在しない場合は何も表示しない
  if (!formData) {
    console.log('No form data provided to modal');
    return null;
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log('Dialog onOpenChange:', open);
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>プロフィール内容の確認</DialogTitle>
          <DialogDescription>
            入力内容をご確認ください。この内容でよろしいですか？
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6">
            {/* 基本情報 */}
            <section className="space-y-2">
              <h3 className="font-medium">基本情報</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">氏名</p>
                  <p>{formData.lastName} {formData.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">フリガナ</p>
                  <p>{formData.lastNameKana} {formData.firstNameKana}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">在住地</p>
                  <p>{formData.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">最寄り駅</p>
                  <p>{formData.nearestStation}</p>
                </div>
              </div>
            </section>

            {/* スタイル */}
            <section className="space-y-2">
              <h3 className="font-medium">スタイル</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">身長</p>
                  <p>{formData.height}cm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">体重</p>
                  <p>{formData.weight}kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">カップ</p>
                  <p>{formData.cupSize}</p>
                </div>
                {formData.bust && (
                  <div>
                    <p className="text-sm text-muted-foreground">バスト</p>
                    <p>{formData.bust}cm</p>
                  </div>
                )}
                {formData.waist && (
                  <div>
                    <p className="text-sm text-muted-foreground">ウエスト</p>
                    <p>{formData.waist}cm</p>
                  </div>
                )}
                {formData.hip && (
                  <div>
                    <p className="text-sm text-muted-foreground">ヒップ</p>
                    <p>{formData.hip}cm</p>
                  </div>
                )}
              </div>
            </section>

            {/* 写真 */}
            <section className="space-y-2">
              <h3 className="font-medium">登録写真</h3>
              <p className="text-sm text-muted-foreground">アップロード済み写真: {formData.photos.length}枚</p>
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="space-y-1">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo.url}
                          alt={`写真 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">{photo.tag}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* その他の情報 */}
            {formData.selfIntroduction && (
              <section className="space-y-2">
                <h3 className="font-medium">自己PR</h3>
                <p className="whitespace-pre-wrap">{formData.selfIntroduction}</p>
              </section>
            )}

            {formData.notes && (
              <section className="space-y-2">
                <h3 className="font-medium">その他備考</h3>
                <p className="whitespace-pre-wrap">{formData.notes}</p>
              </section>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('Cancel button clicked');
              onClose();
            }} 
            disabled={isPending}
          >
            修正する
          </Button>
          <Button 
            onClick={() => {
              console.log('Confirm button clicked');
              onConfirm();
            }} 
            disabled={isPending}
          >
            {isPending ? "送信中..." : "この内容で確定する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}