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
  const formatValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') return "未入力";
    if (typeof value === 'number' && value === 0) return "未入力";
    return String(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>プロフィール確認</DialogTitle>
          <DialogDescription>
            マッチングを開始する前に、以下の内容を確認してください
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          <div className="space-y-6 p-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">基本情報</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "性", value: profileData.lastName },
                  { label: "名", value: profileData.firstName },
                  { label: "性 (カナ)", value: profileData.lastNameKana },
                  { label: "名 (カナ)", value: profileData.firstNameKana },
                  { label: "在住地", value: profileData.location },
                  { label: "最寄り駅", value: profileData.nearestStation },
                  { label: "生年月日", value: profileData.birthDate },
                  { label: "年齢", value: profileData.age },
                  { label: "電話番号", value: profileData.phoneNumber },
                  { label: "メールアドレス", value: profileData.email },
                ].map((item) => (
                  <div key={item.label}>
                    <Label>{item.label}</Label>
                    <p className="text-sm">{formatValue(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 身体的特徴 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">身体的特徴</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "身長 (cm)", value: profileData.height },
                  { label: "体重 (kg)", value: profileData.weight },
                  { label: "カップサイズ", value: profileData.cupSize || "未選択" },
                  { label: "バスト (cm)", value: profileData.bust },
                  { label: "ウエスト (cm)", value: profileData.waist },
                  { label: "ヒップ (cm)", value: profileData.hip },
                ].map((item) => (
                  <div key={item.label}>
                    <Label>{item.label}</Label>
                    <p className="text-sm">{formatValue(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 身分証明書 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">身分証明書</h3>
              <div>
                <Label>持参可能な身分証明書</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.availableIds?.types?.map((id) => (
                    <Badge key={id} variant="outline">
                      <Check className="mr-1 h-3 w-3 text-green-500" />
                      {id}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>本籍地記載の住民票</Label>
                <div className="flex items-center gap-2 mt-1">
                  {profileData.canProvideResidenceRecord ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>
                    {profileData.canProvideResidenceRecord ? "可能" : "不可"}
                  </span>
                </div>
              </div>
            </div>

            {/* 写真関連 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">写真関連</h3>
              <div>
                <Label>写メ日記の投稿</Label>
                <div className="flex items-center gap-2 mt-1">
                  {profileData.photoDiaryAllowed ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>{profileData.photoDiaryAllowed ? "可能" : "不可"}</span>
                </div>
              </div>
              <div>
                <Label>顔出し設定</Label>
                <p className="text-sm">{formatValue(profileData.faceVisibility)}</p>
              </div>
            </div>

            {/* 自宅派遣 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">自宅派遣</h3>
              <div className="flex items-center gap-2">
                {profileData.canHomeDelivery ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span>{profileData.canHomeDelivery ? "可能" : "不可"}</span>
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

            {/* エステ関連 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">エステ関連</h3>
              <div className="space-y-2">
                <div>
                  <Label>エステ経験</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {profileData.hasEstheExperience ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span>
                      {profileData.hasEstheExperience ? 
                        `あり（${profileData.estheExperiencePeriod}）` : 
                        "無し"}
                    </span>
                  </div>
                </div>
                {profileData.estheOptions && (
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
                )}
              </div>
            </div>

            {/* アレルギー */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">アレルギー</h3>
              <div className="flex items-center gap-2">
                {profileData.hasAllergies ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span>{profileData.hasAllergies ? "あり" : "無し"}</span>
              </div>
            </div>

            {/* 喫煙 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">喫煙</h3>
              <div className="flex items-center gap-2">
                {profileData.isSmoker ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span>{profileData.isSmoker ? "あり" : "無し"}</span>
              </div>
            </div>

            {/* 各種対応可否 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">各種対応可否</h3>
              <div className="space-y-2">
                {[
                  { label: "住民票の提出", value: profileData.canProvideResidenceRecord },
                  { label: "写メ日記の投稿", value: profileData.photoDiaryAllowed },
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
                <p className="text-sm whitespace-pre-wrap">
                  {profileData.notes}
                </p>
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