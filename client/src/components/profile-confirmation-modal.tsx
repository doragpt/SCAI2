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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProfileData } from "@shared/types/profile";
import { Loader2, User, MapPin, Ruler, Heart, Camera, AlertTriangle, FileText, ExternalLink, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: ProfileData | null;
  isSubmitting?: boolean;
}

export function ProfileConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  formData,
  isSubmitting,
}: ProfileConfirmationModalProps) {
  if (!isOpen || !formData) {
    return null;
  }

  // セクションヘッダーコンポーネント
  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-4 bg-primary/5 p-3 rounded-lg">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-lg font-medium">{title}</h3>
    </div>
  );

  // 情報項目コンポーネント
  const InfoItem = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className={cn("space-y-1.5", className)}>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );

  // リストアイテムコンポーネント
  const ListItem = ({ icon: Icon, text }: { icon: any; text: string }) => (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <span>{text}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">ウェブ履歴書の確認</DialogTitle>
          <DialogDescription>
            入力内容を確認してください。この内容でよろしいですか？
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* 基本情報 */}
            <section>
              <SectionHeader icon={User} title="基本情報" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card p-4 rounded-lg">
                <InfoItem
                  label="氏名"
                  value={
                    <div className="flex flex-col space-y-1">
                      <span>{formData.lastName} {formData.firstName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formData.lastNameKana} {formData.firstNameKana}
                      </span>
                    </div>
                  }
                />
                <InfoItem
                  label="在住地"
                  value={
                    <ListItem
                      icon={MapPin}
                      text={`${formData.location} (${formData.nearestStation})`}
                    />
                  }
                />
              </div>
            </section>

            <Separator />

            {/* 身体情報 */}
            <section>
              <SectionHeader icon={Ruler} title="身体情報" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card p-4 rounded-lg">
                <InfoItem
                  label="身長・体重"
                  value={
                    <ListItem
                      icon={Ruler}
                      text={`${formData.height}cm / ${formData.weight}kg`}
                    />
                  }
                />
                <InfoItem
                  label="スリーサイズ"
                  value={
                    <ListItem
                      icon={Heart}
                      text={`B${formData.bust} W${formData.waist} H${formData.hip}`}
                    />
                  }
                />
                {formData.cupSize && (
                  <InfoItem
                    label="カップサイズ"
                    value={`${formData.cupSize}カップ`}
                  />
                )}
              </div>
            </section>

            <Separator />

            {/* 写真情報 */}
            <section>
              <SectionHeader icon={Camera} title="写真情報" />
              <div className="space-y-4 bg-card p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  {formData.photos && formData.photos.map((photo, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline">{photo.tag}</Badge>
                      <span className="text-sm text-muted-foreground">登録済み</span>
                    </div>
                  ))}
                </div>
                <InfoItem
                  label="顔出し設定"
                  value={
                    <Badge variant="secondary">
                      {formData.faceVisibility}
                    </Badge>
                  }
                />
              </div>
            </section>

            <Separator />

            {/* 制限事項 */}
            <section>
              <SectionHeader icon={AlertTriangle} title="制限事項・その他" />
              <div className="space-y-4 bg-card p-4 rounded-lg">
                {formData.ngOptions && (
                  <InfoItem
                    label="NGオプション"
                    value={
                      <div className="flex flex-wrap gap-2">
                        {[
                          ...(formData.ngOptions.common || []),
                          ...(formData.ngOptions.others || [])
                        ].map((option, index) => (
                          <Badge key={index} variant="destructive">
                            {option}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                )}

                {formData.allergies && (
                  <InfoItem
                    label="アレルギー"
                    value={
                      <div className="flex flex-wrap gap-2">
                        {[
                          ...(formData.allergies.types || []),
                          ...(formData.allergies.others || [])
                        ].map((allergy, index) => (
                          <Badge key={index} variant="outline">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                )}
              </div>
            </section>

            {/* 自己PR */}
            <section>
              <SectionHeader icon={Star} title="自己PR" />
              <div className="bg-card p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {formData.selfIntroduction || "未入力"}
                </p>
              </div>
            </section>

            {/* その他 */}
            <section>
              <SectionHeader icon={FileText} title="その他情報" />
              <div className="space-y-4 bg-card p-4 rounded-lg">
                <InfoItem
                  label="写メ日記"
                  value={
                    <Badge variant={formData.photoDiaryAllowed ? "default" : "secondary"}>
                      {formData.photoDiaryAllowed ? "投稿可能" : "投稿不可"}
                    </Badge>
                  }
                />
                <InfoItem
                  label="エステ経験"
                  value={
                    formData.hasEstheExperience ? (
                      <div className="flex flex-col space-y-2">
                        <Badge variant="default">あり</Badge>
                        <span className="text-sm text-muted-foreground">
                          経験期間: {formData.estheExperiencePeriod}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="secondary">なし</Badge>
                    )
                  }
                />
                {formData.notes && (
                  <InfoItem
                    label="備考"
                    value={
                      <p className="text-sm whitespace-pre-wrap">
                        {formData.notes}
                      </p>
                    }
                  />
                )}
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            戻る
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                送信中...
              </>
            ) : (
              "この内容で登録する"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}