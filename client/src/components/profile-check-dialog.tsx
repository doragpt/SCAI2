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
  const formatName = (lastName: string, firstName: string) => {
    return [lastName, firstName].filter(Boolean).join(" ") || "未入力";
  };

  const formatMeasurements = (value: number) => {
    return value > 0 ? value.toString() : "未入力";
  };

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
                <div>
                  <Label>氏名</Label>
                  <p className="text-sm">
                    {formatName(profileData.lastName, profileData.firstName)}
                  </p>
                </div>
                <div>
                  <Label>フリガナ</Label>
                  <p className="text-sm">
                    {formatName(profileData.lastNameKana, profileData.firstNameKana)}
                  </p>
                </div>
                <div>
                  <Label>生年月日</Label>
                  <p className="text-sm">{profileData.birthDate || "未入力"}</p>
                </div>
                <div>
                  <Label>年齢</Label>
                  <p className="text-sm">
                    {profileData.age > 0 ? `${profileData.age}歳` : "未入力"}
                  </p>
                </div>
                <div>
                  <Label>電話番号</Label>
                  <p className="text-sm">{profileData.phoneNumber || "未入力"}</p>
                </div>
                <div>
                  <Label>メールアドレス</Label>
                  <p className="text-sm">{profileData.email || "未入力"}</p>
                </div>
                <div>
                  <Label>居住地</Label>
                  <p className="text-sm">{profileData.location || "未入力"}</p>
                </div>
                <div>
                  <Label>最寄り駅</Label>
                  <p className="text-sm">{profileData.nearestStation || "未入力"}</p>
                </div>
              </div>
            </div>

            {/* 身体的特徴 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">身体的特徴</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>身長</Label>
                  <p className="text-sm">
                    {profileData.height > 0 ? `${profileData.height}cm` : "未入力"}
                  </p>
                </div>
                <div>
                  <Label>体重</Label>
                  <p className="text-sm">
                    {profileData.weight > 0 ? `${profileData.weight}kg` : "未入力"}
                  </p>
                </div>
                <div>
                  <Label>スリーサイズ</Label>
                  <p className="text-sm">
                    B{formatMeasurements(profileData.bust)} 
                    W{formatMeasurements(profileData.waist)} 
                    H{formatMeasurements(profileData.hip)}
                  </p>
                </div>
                <div>
                  <Label>カップサイズ</Label>
                  <p className="text-sm">
                    {profileData.cupSize ? `${profileData.cupSize}カップ` : "未入力"}
                  </p>
                </div>
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
                    <Check className="mr-1 h-3 w-3 text-green-500" />
                    {id}
                  </Badge>
                ))}
                {profileData.availableIds?.others?.map((id) => (
                  <Badge key={id} variant="outline">
                    <Check className="mr-1 h-3 w-3 text-green-500" />
                    {id}
                  </Badge>
                ))}
              </div>
            </div>

            {/* NGオプション */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">NGオプション</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  ...(profileData.ngOptions?.common || []),
                  ...(profileData.ngOptions?.others || [])
                ].map((option) => (
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
                          <Check className="mr-1 h-3 w-3 text-green-500" />
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
                <p className="text-sm">
                  あり（{profileData.estheExperiencePeriod}）
                </p>
              </div>
            )}

            {/* 顔出し設定 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">顔出し設定</h3>
              <p className="text-sm">{profileData.faceVisibility || "未設定"}</p>
            </div>

            {/* SNSアカウント */}
            {profileData.hasSnsAccount && profileData.snsUrls?.length > 0 && (
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
                <p className="text-sm whitespace-pre-wrap">
                  {profileData.selfIntroduction}
                </p>
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