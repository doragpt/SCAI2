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
  profileData?: TalentProfileData;
}

export function ProfileConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  profileData,
}: ProfileConfirmationModalProps) {
  if (!profileData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <>
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
                    <p>{profileData.lastName} {profileData.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">フリガナ</p>
                    <p>{profileData.lastNameKana} {profileData.firstNameKana}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">在住地</p>
                    <p>{profileData.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">最寄り駅</p>
                    <p>{profileData.nearestStation}</p>
                  </div>
                </div>
              </section>

              {/* 身分証明書 */}
              {profileData.availableIds && (
                <section className="space-y-2">
                  <h3 className="font-medium">身分証明書</h3>
                  <div>
                    <p className="text-sm text-muted-foreground">持参可能な身分証明書</p>
                    <ul className="list-disc list-inside">
                      {profileData.availableIds.types?.map((type) => (
                        <li key={type}>{type}</li>
                      ))}
                      {profileData.availableIds.others?.map((other) => (
                        <li key={other}>{other}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">本籍地入りの住民票</p>
                    <p>{profileData.canProvideResidenceRecord ? "提供可能" : "提供不可"}</p>
                  </div>
                </section>
              )}

              {/* 身体的特徴 */}
              <section className="space-y-2">
                <h3 className="font-medium">身体的特徴</h3>
                <div className="grid grid-cols-3 gap-4">
                  {profileData.height && (
                    <div>
                      <p className="text-sm text-muted-foreground">身長</p>
                      <p>{profileData.height}cm</p>
                    </div>
                  )}
                  {profileData.weight && (
                    <div>
                      <p className="text-sm text-muted-foreground">体重</p>
                      <p>{profileData.weight}kg</p>
                    </div>
                  )}
                  {profileData.cupSize && (
                    <div>
                      <p className="text-sm text-muted-foreground">カップサイズ</p>
                      <p>{profileData.cupSize}カップ</p>
                    </div>
                  )}
                  {profileData.bust && (
                    <div>
                      <p className="text-sm text-muted-foreground">バスト</p>
                      <p>{profileData.bust}cm</p>
                    </div>
                  )}
                  {profileData.waist && (
                    <div>
                      <p className="text-sm text-muted-foreground">ウエスト</p>
                      <p>{profileData.waist}cm</p>
                    </div>
                  )}
                  {profileData.hip && (
                    <div>
                      <p className="text-sm text-muted-foreground">ヒップ</p>
                      <p>{profileData.hip}cm</p>
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
                    <p>{profileData.faceVisibility}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">写メ日記</p>
                    <p>{profileData.canPhotoDiary ? "可能" : "不可"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">自宅への派遣</p>
                    <p>{profileData.canHomeDelivery ? "可能" : "不可"}</p>
                  </div>
                </div>
              </section>

              {/* NGオプション */}
              {profileData.ngOptions && (
                <section className="space-y-2">
                  <h3 className="font-medium">NGオプション</h3>
                  <ul className="list-disc list-inside">
                    {[
                      ...(profileData.ngOptions.common || []),
                      ...(profileData.ngOptions.others || [])
                    ].map((option) => (
                      <li key={option}>{option}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* アレルギー */}
              {profileData.allergies?.hasAllergy && (
                <section className="space-y-2">
                  <h3 className="font-medium">アレルギー</h3>
                  <ul className="list-disc list-inside">
                    {[
                      ...(profileData.allergies.types || []),
                      ...(profileData.allergies.others || [])
                    ].map((allergy) => (
                      <li key={allergy}>{allergy}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 喫煙 */}
              {profileData.smoking?.enabled && (
                <section className="space-y-2">
                  <h3 className="font-medium">喫煙</h3>
                  <ul className="list-disc list-inside">
                    {[
                      ...(profileData.smoking.types || []),
                      ...(profileData.smoking.others || [])
                    ].map((type) => (
                      <li key={type}>{type}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* その他の情報 */}
              {profileData.selfIntroduction && (
                <section className="space-y-2">
                  <h3 className="font-medium">自己PR</h3>
                  <p className="whitespace-pre-wrap">{profileData.selfIntroduction}</p>
                </section>
              )}

              {profileData.notes && (
                <section className="space-y-2">
                  <h3 className="font-medium">その他備考</h3>
                  <p className="whitespace-pre-wrap">{profileData.notes}</p>
                </section>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              修正する
            </Button>
            <Button onClick={onConfirm}>
              この内容で確定する
            </Button>
          </DialogFooter>
        </>
      </DialogContent>
    </Dialog>
  );
}