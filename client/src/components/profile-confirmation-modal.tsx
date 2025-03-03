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
  profileData: TalentProfileData;
}

export function ProfileConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  profileData,
}: ProfileConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>プロフィール内容の確認</DialogTitle>
          <DialogDescription>
            入力内容をご確認ください。この内容でよろしいですか？
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] px-4">
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="space-y-2">
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
            </div>

            {/* 身分証明書 */}
            <div className="space-y-2">
              <h3 className="font-medium">身分証明書</h3>
              <div>
                <p className="text-sm text-muted-foreground">持参可能な身分証明書</p>
                <ul className="list-disc list-inside">
                  {profileData.availableIds.types.map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                  {profileData.availableIds.others.map((other) => (
                    <li key={other}>{other}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">本籍地入りの住民票</p>
                <p>{profileData.canProvideResidenceRecord ? "提供可能" : "提供不可"}</p>
              </div>
            </div>

            {/* 身体的特徴 */}
            <div className="space-y-2">
              <h3 className="font-medium">身体的特徴</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">身長</p>
                  <p>{profileData.height}cm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">体重</p>
                  <p>{profileData.weight}kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">カップサイズ</p>
                  <p>{profileData.cupSize}カップ</p>
                </div>
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
            </div>

            {/* パネル設定 */}
            <div className="space-y-2">
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
            </div>

            {/* NGオプション */}
            {(profileData.ngOptions.common.length > 0 || profileData.ngOptions.others.length > 0) && (
              <div className="space-y-2">
                <h3 className="font-medium">NGオプション</h3>
                <ul className="list-disc list-inside">
                  {profileData.ngOptions.common.map((option) => (
                    <li key={option}>{option}</li>
                  ))}
                  {profileData.ngOptions.others.map((option) => (
                    <li key={option}>{option}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* アレルギー */}
            {profileData.allergies.hasAllergy && (
              <div className="space-y-2">
                <h3 className="font-medium">アレルギー</h3>
                <ul className="list-disc list-inside">
                  {profileData.allergies.types.map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                  {profileData.allergies.others.map((other) => (
                    <li key={other}>{other}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 喫煙 */}
            {profileData.smoking.enabled && (
              <div className="space-y-2">
                <h3 className="font-medium">喫煙</h3>
                <ul className="list-disc list-inside">
                  {profileData.smoking.types.map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                  {profileData.smoking.others.map((other) => (
                    <li key={other}>{other}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* SNSアカウント */}
            {profileData.hasSnsAccount && profileData.snsUrls.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">SNSアカウント</h3>
                <ul className="list-disc list-inside">
                  {profileData.snsUrls.map((url) => (
                    <li key={url}>{url}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 在籍店舗 */}
            {profileData.currentStores.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">現在の在籍店舗</h3>
                {profileData.currentStores.map((store, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">店舗名</p>
                      <p>{store.storeName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">源氏名</p>
                      <p>{store.stageName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 過去の在籍店舗 */}
            {profileData.previousStores.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">過去の在籍店舗</h3>
                <ul className="list-disc list-inside">
                  {profileData.previousStores.map((store, index) => (
                    <li key={index}>{store.storeName}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* エステオプション */}
            {profileData.estheOptions.available.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">エステオプション</h3>
                <div>
                  <p className="text-sm text-muted-foreground">可能なオプション</p>
                  <ul className="list-disc list-inside">
                    {profileData.estheOptions.available.map((option) => (
                      <li key={option}>{option}</li>
                    ))}
                  </ul>
                </div>
                {profileData.estheOptions.ngOptions.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">NGオプション</p>
                    <ul className="list-disc list-inside">
                      {profileData.estheOptions.ngOptions.map((option, index) => (
                        <li key={index}>{option}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {profileData.hasEstheExperience && (
                  <div>
                    <p className="text-sm text-muted-foreground">エステ経験</p>
                    <p>経験あり（{profileData.estheExperiencePeriod}）</p>
                  </div>
                )}
              </div>
            )}

            {/* 自己PR */}
            {profileData.selfIntroduction && (
              <div className="space-y-2">
                <h3 className="font-medium">自己PR</h3>
                <p className="whitespace-pre-wrap">{profileData.selfIntroduction}</p>
              </div>
            )}

            {/* その他備考 */}
            {profileData.notes && (
              <div className="space-y-2">
                <h3 className="font-medium">その他備考</h3>
                <p className="whitespace-pre-wrap">{profileData.notes}</p>
              </div>
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
      </DialogContent>
    </Dialog>
  );
}
