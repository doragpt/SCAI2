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
import { Separator } from "@/components/ui/separator";
import {
  Check,
  X,
  Loader2,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Ruler,
  Weight,
  Heart,
  Camera,
  Home,
  AlertTriangle,
  Cigarette,
  FileText,
  Sparkles,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom'; // Import useNavigate

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
  const navigate = useNavigate(); // Initialize useNavigate

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

  // セクションヘッダーコンポーネント
  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
    </div>
  );

  // 項目表示コンポーネント
  const InfoItem = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className={cn("space-y-1", className)}>
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );

  // ステータスバッジコンポーネント
  const StatusBadge = ({ value, positive }: { value: boolean; positive?: boolean }) => (
    <Badge variant={positive ? "outline" : "destructive"} className="font-normal">
      {positive ? (
        <Check className="mr-1 h-3 w-3 text-green-500" />
      ) : (
        <X className="mr-1 h-3 w-3" />
      )}
      {positive ? "可能" : "不可"}
    </Badge>
  );

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

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-8">
            {/* 基本情報 */}
            <section>
              <SectionHeader icon={User} title="基本情報" />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="性" value={formatProfileValue(profileData.lastName)} />
                <InfoItem label="名" value={formatProfileValue(profileData.firstName)} />
                <InfoItem label="性 (カナ)" value={formatProfileValue(profileData.lastNameKana)} />
                <InfoItem label="名 (カナ)" value={formatProfileValue(profileData.firstNameKana)} />
                <InfoItem
                  label="生年月日"
                  value={`${formatProfileValue(profileData.birthDate)} (${profileData.age}歳)`}
                  className="col-span-2"
                />
                <InfoItem
                  label="在住地"
                  value={
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {formatProfileValue(profileData.location)}
                    </div>
                  }
                />
                <InfoItem label="最寄り駅" value={formatProfileValue(profileData.nearestStation)} />
                <InfoItem
                  label="電話番号"
                  value={
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {formatProfileValue(profileData.phoneNumber)}
                    </div>
                  }
                />
                <InfoItem
                  label="メールアドレス"
                  value={
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {formatProfileValue(profileData.email)}
                    </div>
                  }
                />
              </div>
            </section>

            <Separator />

            {/* 身体的特徴 */}
            <section>
              <SectionHeader icon={Ruler} title="身体的特徴" />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="身長"
                  value={
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      {formatMeasurement(profileData.height, "cm")}
                    </div>
                  }
                />
                <InfoItem
                  label="体重"
                  value={
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                      {formatMeasurement(profileData.weight, "kg")}
                    </div>
                  }
                />
                <InfoItem
                  label="カップサイズ"
                  value={
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      {profileData.cupSize ? `${profileData.cupSize}カップ` : "未入力"}
                    </div>
                  }
                />
                <InfoItem
                  label="スリーサイズ"
                  value={formatThreeSizes(profileData.bust, profileData.waist, profileData.hip)}
                />
              </div>
            </section>

            <Separator />

            {/* 身分証明書 */}
            <section>
              <SectionHeader icon={FileText} title="身分証明書" />
              <div className="space-y-4">
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
                <InfoItem
                  label="本籍地記載の住民票"
                  value={<StatusBadge value={profileData.canProvideResidenceRecord} positive={profileData.canProvideResidenceRecord} />}
                />
              </div>
            </section>

            <Separator />

            {/* 写真関連 */}
            <section>
              <SectionHeader icon={Camera} title="写真関連" />
              <div className="space-y-4">
                <InfoItem
                  label="写メ日記の投稿"
                  value={<StatusBadge value={profileData.photoDiaryAllowed} positive={profileData.photoDiaryAllowed} />}
                />
                <InfoItem label="顔出し設定" value={formatProfileValue(profileData.faceVisibility)} />
              </div>
            </section>

            <Separator />

            {/* 自宅派遣 */}
            <section>
              <SectionHeader icon={Home} title="自宅派遣" />
              <InfoItem
                label="自宅派遣"
                value={<StatusBadge value={profileData.canHomeDelivery} positive={profileData.canHomeDelivery} />}
              />
            </section>

            <Separator />

            {/* NGオプション */}
            <section>
              <SectionHeader icon={AlertTriangle} title="NGオプション" />
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
            </section>

            <Separator />

            {/* エステ関連 */}
            <section>
              <SectionHeader icon={Sparkles} title="エステ関連" />
              <div className="space-y-4">
                <InfoItem
                  label="エステ経験"
                  value={
                    <div className="flex items-center gap-2">
                      {profileData.hasEstheExperience ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span>あり（{profileData.estheExperiencePeriod}）</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-500" />
                          <span>無し</span>
                        </>
                      )}
                    </div>
                  }
                />
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
            </section>

            <Separator />

            {/* アレルギー */}
            <section>
              <SectionHeader icon={AlertTriangle} title="アレルギー" />
              <div className="space-y-4">
                <InfoItem
                  label="アレルギーの有無"
                  value={
                    <div className="flex items-center gap-2">
                      {profileData.hasAllergies ? (
                        <Badge variant="destructive">あり</Badge>
                      ) : (
                        <Badge variant="outline">無し</Badge>
                      )}
                    </div>
                  }
                />
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
            </section>

            <Separator />

            {/* 喫煙 */}
            <section>
              <SectionHeader icon={Cigarette} title="喫煙" />
              <div className="space-y-4">
                <InfoItem
                  label="喫煙の有無"
                  value={
                    <div className="flex items-center gap-2">
                      {profileData.isSmoker ? (
                        <Badge variant="destructive">あり</Badge>
                      ) : (
                        <Badge variant="outline">無し</Badge>
                      )}
                    </div>
                  }
                />
                {profileData.isSmoker && profileData.smoking && (
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
            </section>

            {/* 自己PR */}
            <section>
              <SectionHeader icon={FileText} title="自己PR" />
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {formatProfileValue(profileData.selfIntroduction)}
                </p>
              </div>
            </section>

            {/* その他備考 */}
            <section>
              <SectionHeader icon={FileText} title="その他備考" />
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {formatProfileValue(profileData.notes)}
                </p>
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            プロフィールを修正する
          </Button>
          <Button onClick={() => {
            onConfirm(); // Call the original onConfirm function
            navigate("/talent/ai-matching"); // Add the navigation after the original onConfirm
          }}>
            この内容で続ける
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}