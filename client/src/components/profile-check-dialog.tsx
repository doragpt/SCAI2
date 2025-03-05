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
import { Check, X, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";

interface ProfileCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ProfileCheckDialog({
  isOpen,
  onClose,
  onConfirm,
}: ProfileCheckDialogProps) {
  const { profileData, isLoading, isError } = useProfile();

  // フォーマット関数
  const formatProfileValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return "未入力";
    if (typeof value === 'number' && value === 0) return "未入力";
    return String(value);
  };

  const formatMeasurement = (value: number | undefined | null, unit: string): string => {
    if (!value || value === 0) return "未入力";
    return `${value}${unit}`;
  };

  const formatThreeSizes = (bust?: number | null, waist?: number | null, hip?: number | null): string => {
    if (!bust || !waist || !hip || bust === 0 || waist === 0 || hip === 0) return "未入力";
    return `B${bust} W${waist} H${hip}`;
  };

  // ローディング中の表示
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">読み込み中...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // エラー時の表示
  if (isError || !profileData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center p-6 text-red-500">
            プロフィールデータの取得に失敗しました。
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
                <div>
                  <Label>性</Label>
                  <p className="text-sm">{formatProfileValue(profileData.lastName)}</p>
                </div>
                <div>
                  <Label>名</Label>
                  <p className="text-sm">{formatProfileValue(profileData.firstName)}</p>
                </div>
                <div>
                  <Label>性 (カナ)</Label>
                  <p className="text-sm">{formatProfileValue(profileData.lastNameKana)}</p>
                </div>
                <div>
                  <Label>名 (カナ)</Label>
                  <p className="text-sm">{formatProfileValue(profileData.firstNameKana)}</p>
                </div>
                <div>
                  <Label>在住地</Label>
                  <p className="text-sm">{formatProfileValue(profileData.location)}</p>
                </div>
                <div>
                  <Label>最寄り駅</Label>
                  <p className="text-sm">{formatProfileValue(profileData.nearestStation)}</p>
                </div>
                <div>
                  <Label>生年月日</Label>
                  <p className="text-sm">{formatProfileValue(profileData.birthDate)}</p>
                </div>
                <div>
                  <Label>年齢</Label>
                  <p className="text-sm">{profileData.age > 0 ? `${profileData.age}歳` : "未入力"}</p>
                </div>
                <div>
                  <Label>電話番号</Label>
                  <p className="text-sm">{formatProfileValue(profileData.phoneNumber)}</p>
                </div>
                <div>
                  <Label>メールアドレス</Label>
                  <p className="text-sm">{formatProfileValue(profileData.email)}</p>
                </div>
              </div>
            </div>

            {/* 身体的特徴 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">身体的特徴</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>身長 (cm)</Label>
                  <p className="text-sm">{formatMeasurement(profileData.height, "cm")}</p>
                </div>
                <div>
                  <Label>体重 (kg)</Label>
                  <p className="text-sm">{formatMeasurement(profileData.weight, "kg")}</p>
                </div>
                <div>
                  <Label>カップサイズ</Label>
                  <p className="text-sm">{profileData.cupSize ? `${profileData.cupSize}カップ` : "未入力"}</p>
                </div>
                <div>
                  <Label>スリーサイズ</Label>
                  <p className="text-sm">{formatThreeSizes(profileData.bust, profileData.waist, profileData.hip)}</p>
                </div>
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
                  <span>{profileData.canProvideResidenceRecord ? "可能" : "不可"}</span>
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
                <p className="text-sm">{formatProfileValue(profileData.faceVisibility)}</p>
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
                {profileData.ngOptions && [
                  ...(profileData.ngOptions.common || []),
                  ...(profileData.ngOptions.others || [])
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
                {profileData.estheOptions?.available && profileData.estheOptions.available.length > 0 && (
                  <div>
                    <Label>対応可能なメニュー</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profileData.estheOptions.available.map((option) => (
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
              {profileData.hasAllergies && (
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(profileData.allergies?.types || []),
                    ...(profileData.allergies?.others || [])
                  ].map((allergy) => (
                    <Badge key={allergy} variant="outline">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              )}
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
              {profileData.isSmoker && profileData.smoking && profileData.smoking.types && (
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
              )}
            </div>

            {/* 自己PR */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">自己PR</h3>
              <p className="text-sm whitespace-pre-wrap">
                {formatProfileValue(profileData.selfIntroduction)}
              </p>
            </div>

            {/* その他備考 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">その他備考</h3>
              <p className="text-sm whitespace-pre-wrap">
                {formatProfileValue(profileData.notes)}
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
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