import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import { type ProfileData } from "@shared/types/profile";

interface ProfileCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profileData: ProfileData;
}

export default function ProfileCheckDialog({
  isOpen,
  onClose,
  onConfirm,
  profileData,
}: ProfileCheckDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>プロフィール確認</DialogTitle>
          <DialogDescription>
            マッチングを開始する前に、以下のプロフィール情報を確認してください
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          <div className="space-y-6 p-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">基本情報</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "氏名", value: `${profileData.lastName} ${profileData.firstName}` },
                  { label: "フリガナ", value: `${profileData.lastNameKana} ${profileData.firstNameKana}` },
                  { label: "生年月日", value: profileData.birthDate },
                  { label: "年齢", value: `${profileData.age}歳` },
                  { label: "電話番号", value: profileData.phoneNumber },
                  { label: "メールアドレス", value: profileData.email },
                  { label: "居住地", value: profileData.location },
                  { label: "最寄り駅", value: profileData.nearestStation }
                ].map((item) => (
                  <div key={item.label}>
                    <Label>{item.label}</Label>
                    <p className="text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 身体的特徴 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">身体的特徴</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "身長", value: `${profileData.height}cm` },
                  { label: "体重", value: `${profileData.weight}kg` },
                  { label: "スリーサイズ", value: `B${profileData.bust} W${profileData.waist} H${profileData.hip}` },
                  { label: "カップサイズ", value: `${profileData.cupSize}カップ` }
                ].map((item) => (
                  <div key={item.label}>
                    <Label>{item.label}</Label>
                    <p className="text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 各種対応可否 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">各種対応可否</h3>
              <div className="space-y-2">
                {[
                  { label: "住民票の提出", value: profileData.canProvideResidenceRecord },
                  { label: "写メ日記の投稿", value: profileData.canPhotoDiary },
                  { label: "自宅待機での出張", value: profileData.canHomeDelivery }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    {item.value ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 身分証明書 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">身分証明書</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.availableIds?.types?.map((id) => (
                  <Badge key={id} variant="outline">
                    <Check className="mr-1 h-3 w-3" />
                    {id}
                  </Badge>
                ))}
                {profileData.availableIds?.others?.map((id) => (
                  <Badge key={id} variant="outline">
                    <Check className="mr-1 h-3 w-3" />
                    {id}
                  </Badge>
                ))}
              </div>
            </div>

            {/* NGオプション */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">NGオプション</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.ngOptions.common?.map((option) => (
                  <Badge key={option} variant="destructive">
                    <X className="mr-1 h-3 w-3" />
                    {option}
                  </Badge>
                ))}
                {profileData.ngOptions.others?.map((option) => (
                  <Badge key={option} variant="destructive">
                    <X className="mr-1 h-3 w-3" />
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            {/* アレルギー */}
            {(profileData.allergies.types?.length > 0 || profileData.allergies.others?.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">アレルギー</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(profileData.allergies.types || []),
                    ...(profileData.allergies.others || [])
                  ].map((allergy) => (
                    <Badge key={allergy} variant="outline">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 喫煙 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">喫煙</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  ...(profileData.smoking.types || []),
                  ...(profileData.smoking.others || [])
                ].map((type) => (
                  <Badge key={type} variant="outline">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* エステオプション */}
            {profileData.estheOptions && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">エステメニュー</h3>
                <div className="space-y-4">
                  <div>
                    <Label>対応可能なメニュー</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profileData.estheOptions.available?.map((option) => (
                        <Badge key={option} variant="outline">
                          <Check className="mr-1 h-3 w-3" />
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {profileData.estheOptions.ngOptions?.length > 0 && (
                    <div>
                      <Label>NGのメニュー</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.estheOptions.ngOptions.map((option) => (
                          <Badge key={option} variant="destructive">
                            <X className="mr-1 h-3 w-3" />
                            {option}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* エステ経験 */}
            {profileData.hasEstheExperience && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">エステ経験</h3>
                <p className="text-sm">あり（{profileData.estheExperiencePeriod}）</p>
              </div>
            )}

            {/* 顔出し設定 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">顔出し設定</h3>
              <p className="text-sm">{profileData.faceVisibility}</p>
            </div>

            {/* SNSアカウント */}
            {profileData.hasSnsAccount && profileData.snsUrls && profileData.snsUrls.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">SNSアカウント</h3>
                <div className="space-y-1">
                  {profileData.snsUrls.map((url, index) => (
                    <p key={index} className="text-sm">{url}</p>
                  ))}
                </div>
              </div>
            )}

            {/* 在籍店舗情報 */}
            {(profileData.currentStores?.length > 0 || profileData.previousStores?.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">在籍店舗情報</h3>
                {profileData.currentStores?.length > 0 && (
                  <div>
                    <Label>現在の在籍店舗</Label>
                    <div className="space-y-1 mt-2">
                      {profileData.currentStores.map((store) => (
                        <p key={store.storeName} className="text-sm">
                          {store.storeName}（{store.stageName}）
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {profileData.previousStores?.length > 0 && (
                  <div className="mt-4">
                    <Label>過去の在籍店舗</Label>
                    <div className="space-y-1 mt-2">
                      {profileData.previousStores.map((store) => (
                        <p key={store.storeName} className="text-sm">
                          {store.storeName}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 自己PR */}
            {profileData.selfIntroduction && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">自己PR</h3>
                <p className="text-sm whitespace-pre-wrap">{profileData.selfIntroduction}</p>
              </div>
            )}

            {/* その他備考 */}
            {profileData.notes && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">その他備考</h3>
                <p className="text-sm whitespace-pre-wrap">{profileData.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            プロフィールを修正する
          </Button>
          <Button onClick={onConfirm}>
            この内容で続ける
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}