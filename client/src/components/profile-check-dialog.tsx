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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  AlertTriangle,
  FileText,
  Sparkles,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { useNavigate } from 'wouter';

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
  const [, navigate] = useNavigate();

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return "未入力";
    return String(value);
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
    </div>
  );

  const InfoItem = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className={cn("space-y-1", className)}>
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );

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

  if (isLoading || !profileData) {
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
          <div className="space-y-6">
            {/* 基本情報 */}
            <section>
              <SectionHeader icon={User} title="基本情報" />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="氏名" value={`${formatValue(profileData.lastName)} ${formatValue(profileData.firstName)}`} />
                <InfoItem label="フリガナ" value={`${formatValue(profileData.lastNameKana)} ${formatValue(profileData.firstNameKana)}`} />
                <InfoItem
                  label="生年月日"
                  value={`${formatValue(profileData.birthDate)} (${profileData.age}歳)`}
                />
                <InfoItem
                  label="在住地"
                  value={
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {formatValue(profileData.location)}
                    </div>
                  }
                />
                <InfoItem label="最寄り駅" value={formatValue(profileData.nearestStation)} />
                <InfoItem
                  label="電話番号"
                  value={
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {formatValue(profileData.phoneNumber)}
                    </div>
                  }
                />
                <InfoItem
                  label="メールアドレス"
                  value={
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {formatValue(profileData.email)}
                    </div>
                  }
                />
              </div>
            </section>

            <Separator />

            {/* 身体的特徴 */}
            <section>
              <SectionHeader icon={Heart} title="身体的特徴" />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="身長"
                  value={
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      {formatValue(profileData.height)}cm
                    </div>
                  }
                />
                <InfoItem
                  label="体重"
                  value={
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                      {formatValue(profileData.weight)}kg
                    </div>
                  }
                />
                <InfoItem
                  label="スリーサイズ"
                  value={`B${profileData.bust || '未入力'} W${profileData.waist || '未入力'} H${profileData.hip || '未入力'}`}
                />
                <InfoItem
                  label="カップサイズ"
                  value={
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      {formatValue(profileData.cupSize)}
                    </div>
                  }
                />
              </div>
            </section>

            <Separator />

            {/* 写真情報 */}
            <section>
              <SectionHeader icon={Camera} title="写真情報" />
              <div className="space-y-4">
                <InfoItem
                  label="写メ日記"
                  value={<StatusBadge value={profileData.canPhotoDiary} positive={profileData.canPhotoDiary} />}
                />
                <InfoItem label="顔出し設定" value={formatValue(profileData.faceVisibility)} />
                {profileData.photos && (
                  <div>
                    <Label>登録写真</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {profileData.photos.map((photo, index) => (
                        <div key={index} className="relative aspect-[3/4]">
                          <img
                            src={photo.url}
                            alt={`プロフィール写真 ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Badge
                            className="absolute top-2 right-2 bg-black/75"
                            variant="outline"
                          >
                            {photo.tag}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* エステ関連 */}
            <section>
              <SectionHeader icon={Sparkles} title="エステ関連" />
              <div className="space-y-4">
                <InfoItem
                  label="エステ経験"
                  value={profileData.hasEstheExperience ? `あり（${formatValue(profileData.estheExperiencePeriod)}）` : "なし"}
                />
                {profileData.estheOptions?.available && (
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
                {profileData.estheOptions?.ngOptions && (
                  <div>
                    <Label>NGメニュー</Label>
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
            </section>

            <Separator />

            {/* その他情報 */}
            <section>
              <SectionHeader icon={FileText} title="その他情報" />
              <div className="space-y-4">
                <InfoItem label="自己紹介" value={<p className="whitespace-pre-wrap text-sm">{formatValue(profileData.selfIntroduction)}</p>} />
                <InfoItem label="備考" value={<p className="whitespace-pre-wrap text-sm">{formatValue(profileData.notes)}</p>} />
                <InfoItem
                  label="本籍地記載の住民票"
                  value={<StatusBadge value={profileData.canProvideResidenceRecord} positive={profileData.canProvideResidenceRecord} />}
                />
                <div>
                  <Label>持参可能な身分証明書</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
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
                <InfoItem
                  label="自宅派遣"
                  value={<StatusBadge value={profileData.canHomeDelivery} positive={profileData.canHomeDelivery} />}
                />
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
                <SectionHeader icon={AlertTriangle} title="アレルギー" />
                <div className="space-y-4">
                  <InfoItem
                    label="アレルギーの有無"
                    value={
                      <div className="flex items-center gap-2">
                        {profileData.allergies?.hasAllergy ? (
                          <Badge variant="destructive">あり</Badge>
                        ) : (
                          <Badge variant="outline">無し</Badge>
                        )}
                      </div>
                    }
                  />
                  {profileData.allergies?.hasAllergy && (
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
                <SectionHeader icon={Cigarette} title="喫煙" />
                <div className="space-y-4">
                  <InfoItem
                    label="喫煙の有無"
                    value={
                      <div className="flex items-center gap-2">
                        {profileData.smoking?.enabled ? (
                          <Badge variant="destructive">あり</Badge>
                        ) : (
                          <Badge variant="outline">無し</Badge>
                        )}
                      </div>
                    }
                  />
                  {profileData.smoking?.enabled && profileData.smoking && (
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
              </div>
            </section>

          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            プロフィールを修正する
          </Button>
          <Button onClick={() => {
            onConfirm();
            navigate("/talent/ai-matching");
          }}>
            この内容で続ける
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}