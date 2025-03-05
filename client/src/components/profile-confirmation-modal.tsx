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
  formData?: TalentProfileData;
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
      <DialogContent>
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
            {formData.availableIds && (
              <section className="space-y-2">
                <h3 className="font-medium">身分証明書</h3>
                <div>
                  <p className="text-sm text-muted-foreground">持参可能な身分証明書</p>
                  <ul className="list-disc list-inside">
                    {formData.availableIds.types?.map((type) => (
                      <li key={type}>{type}</li>
                    ))}
                    {formData.availableIds.others?.map((other) => (
                      <li key={other}>{other}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">本籍地入りの住民票</p>
                  <p>{formData.canProvideResidenceRecord ? "提供可能" : "提供不可"}</p>
                </div>
              </section>
            )}

            {/* 身体的特徴 */}
            <section className="space-y-2">
              <h3 className="font-medium">身体的特徴</h3>
              <div className="grid grid-cols-3 gap-4">
                {formData.height && (
                  <div>
                    <p className="text-sm text-muted-foreground">身長</p>
                    <p>{formData.height}cm</p>
                  </div>
                )}
                {formData.weight && (
                  <div>
                    <p className="text-sm text-muted-foreground">体重</p>
                    <p>{formData.weight}kg</p>
                  </div>
                )}
                {formData.cupSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">カップサイズ</p>
                    <p>{formData.cupSize}カップ</p>
                  </div>
                )}
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

            {/* パネル設定 */}
            <section className="space-y-2">
              <h3 className="font-medium">パネル設定</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">顔出し</p>
                  <p>{formData.faceVisibility}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">写メ日記</p>
                  <p>{formData.canPhotoDiary ? "可能" : "不可"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">自宅への派遣</p>
                  <p>{formData.canHomeDelivery ? "可能" : "不可"}</p>
                </div>
              </div>
            </section>

            {/* NGオプション */}
            {formData.ngOptions && (
              <section className="space-y-2">
                <h3 className="font-medium">NGオプション</h3>
                <ul className="list-disc list-inside">
                  {[
                    ...(formData.ngOptions.common || []),
                    ...(formData.ngOptions.others || [])
                  ].map((option) => (
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
                  {[
                    ...(formData.allergies.types || []),
                    ...(formData.allergies.others || [])
                  ].map((allergy) => (
                    <li key={allergy}>{allergy}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* 喫煙 */}
            {formData.smoking?.enabled && (
              <section className="space-y-2">
                <h3 className="font-medium">喫煙</h3>
                <ul className="list-disc list-inside">
                  {[
                    ...(formData.smoking.types || []),
                    ...(formData.smoking.others || [])
                  ].map((type) => (
                    <li key={type}>{type}</li>
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

        <DialogFooter>
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