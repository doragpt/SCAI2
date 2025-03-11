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
  FileText,
  Sparkles,
  Cigarette,
  Heart,
  Store,
  Check,
  XCircle,
  Camera,
  AlertTriangle,
  User,
  Loader2,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useLocation } from 'wouter';
import type { TalentProfileData } from "@shared/schema";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ProfileCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

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
    <div className="text-sm font-medium">{value || "未入力"}</div>
  </div>
);

export function ProfileCheckDialog({
  isOpen,
  onClose,
  onConfirm,
}: ProfileCheckDialogProps) {
  const { profileData, isLoading, isError } = useProfile();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // 値のフォーマット
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return "未入力";
    return String(value);
  };

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

  if (isError || !profileData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center p-6 text-red-500">
            プロフィールデータの取得に失敗しました
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "未入力";
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日', { locale: ja });
    } catch (e) {
      return "未入力";
    }
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

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* 基本情報 */}
            <section>
              <SectionHeader icon={User} title="基本情報" />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem 
                  label="氏名" 
                  value={profileData.lastName && profileData.firstName ? 
                    `${profileData.lastName} ${profileData.firstName}` : "未入力"} 
                />
                <InfoItem 
                  label="フリガナ" 
                  value={profileData.lastNameKana && profileData.firstNameKana ? 
                    `${profileData.lastNameKana} ${profileData.firstNameKana}` : "未入力"} 
                />
                <InfoItem
                  label="生年月日"
                  value={formatDate(user?.birthDate)}
                />
                <InfoItem label="在住地" value={formatValue(profileData.location)} />
                <InfoItem label="最寄り駅" value={formatValue(profileData.nearestStation)} />
              </div>
            </section>

            <Separator />

            {/* 身体的特徴 */}
            <section>
              <SectionHeader icon={Heart} title="身体的特徴" />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="身長" value={profileData.height ? `${profileData.height}cm` : "未入力"} />
                <InfoItem label="体重" value={profileData.weight ? `${profileData.weight}kg` : "未入力"} />
                <InfoItem label="カップサイズ" value={profileData.cupSize ? `${profileData.cupSize}カップ` : "未入力"} />
                <InfoItem
                  label="スリーサイズ"
                  value={`B${profileData.bust || '未入力'} W${profileData.waist || '未入力'} H${profileData.hip || '未入力'}`}
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
                  value={
                    <Badge variant={profileData.canPhotoDiary ? "default" : "secondary"}>
                      {profileData.canPhotoDiary ? "可能" : "不可"}
                    </Badge>
                  }
                />
                <InfoItem label="顔出し設定" value={formatValue(profileData.faceVisibility)} />
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
                    <Badge variant={profileData.hasEstheExperience ? "default" : "secondary"}>
                      {profileData.hasEstheExperience ? `あり（${profileData.estheExperiencePeriod}）` : "無し"}
                    </Badge>
                  }
                />
                {profileData.estheOptions?.available && profileData.estheOptions.available.length > 0 && (
                  <InfoItem
                    label="対応可能なメニュー"
                    value={
                      <div className="flex flex-wrap gap-2">
                        {profileData.estheOptions.available.map((option, index) => (
                          <Badge key={index} variant="outline">
                            {option}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                )}
              </div>
            </section>

            <Separator />

            {/* NGオプション */}
            {(profileData.ngOptions?.common?.length > 0 || profileData.ngOptions?.others?.length > 0) && (
              <section>
                <SectionHeader icon={XCircle} title="NGオプション" />
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(profileData.ngOptions?.common || []),
                    ...(profileData.ngOptions?.others || [])
                  ].map((option, index) => (
                    <Badge key={index} variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {option}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            {/* アレルギー */}
            {profileData.allergies?.hasAllergy && (
              <section>
                <SectionHeader icon={AlertTriangle} title="アレルギー" />
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(profileData.allergies.types || []),
                    ...(profileData.allergies.others || [])
                  ].map((allergy, index) => (
                    <Badge key={index} variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            {/* 喫煙 */}
            {profileData.smoking?.enabled && (
              <section>
                <SectionHeader icon={Cigarette} title="喫煙" />
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(profileData.smoking.types || []),
                    ...(profileData.smoking.others || [])
                  ].map((type, index) => (
                    <Badge key={index} variant="outline">
                      <Cigarette className="h-3 w-3 mr-1" />
                      {type}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* 自己PR・備考 */}
            {(profileData.selfIntroduction || profileData.notes) && (
              <section>
                <SectionHeader icon={FileText} title="自己PR・備考" />
                {profileData.selfIntroduction && (
                  <div className="mb-4">
                    <Label className="text-sm text-muted-foreground">自己PR</Label>
                    <p className="mt-2 text-sm whitespace-pre-wrap">
                      {profileData.selfIntroduction}
                    </p>
                  </div>
                )}
                {profileData.notes && (
                  <div>
                    <Label className="text-sm text-muted-foreground">備考</Label>
                    <p className="mt-2 text-sm whitespace-pre-wrap">
                      {profileData.notes}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
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

export default ProfileCheckDialog;