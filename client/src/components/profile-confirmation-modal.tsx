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
  if (!formData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>プロフィール内容の確認</DialogTitle>
          <DialogDescription>
            入力内容をご確認ください。この内容でよろしいですか？
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-6 px-4">
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

            {/* 身分証明書 */}
            <section className="space-y-2">
              <h3 className="font-medium">身分証明書</h3>
              <div>
                <p className="text-sm text-muted-foreground">持参可能な身分証明書</p>
                <ul className="list-disc list-inside">
                  {formData.availableIds.types.map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                  {formData.availableIds.others.map((other) => (
                    <li key={other}>{other}</li>
                  ))}
                </ul>
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

            {/* NGオプション */}
            {formData.ngOptions && (formData.ngOptions.common.length > 0 || formData.ngOptions.others.length > 0) && (
              <section className="space-y-2">
                <h3 className="font-medium">NGオプション</h3>
                <ul className="list-disc list-inside">
                  {formData.ngOptions.common.map((option) => (
                    <li key={option}>{option}</li>
                  ))}
                  {formData.ngOptions.others.map((option) => (
                    <li key={option}>{option}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* アレルギー */}
            {formData.allergies?.hasAllergy && (
              <section className="space-y-2">
                <h3 className="font-medium">アレルギー</h3>
                <ul className="list-disc list-inside">
                  {formData.allergies.types.map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                  {formData.allergies.others.map((other) => (
                    <li key={other}>{other}</li>
                  ))}
                </ul>
              </section>
            )}

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
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            修正する
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? "送信中..." : "この内容で確定する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}