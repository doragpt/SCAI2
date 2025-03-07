import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2,
  Camera,
  Building2,
  MapPin,
  AlertTriangle,
  FileText,
  Sparkles,
  Cigarette,
  Heart,
  Home,
  Clock,
  Banknote 
} from "lucide-react";
import { TalentProfileData } from "@shared/schema";

interface ProfileConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  profileData: TalentProfileData;
}

// InfoItem コンポーネント
const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div>{value}</div>
  </div>
);

// SectionHeader コンポーネント
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="p-2 rounded-full bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <h3 className="text-lg font-medium">{title}</h3>
  </div>
);

export function ProfileConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  profileData,
}: ProfileConfirmationDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");

  const formatValue = (value: any) => {
    if (value === undefined || value === null || value === "") return "未入力";
    return value;
  };

  if (!profileData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>プロフィール確認</DialogTitle>
          <DialogDescription>
            以下の内容でAIマッチングを開始します。内容をご確認ください。
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-4">
            {/* 基本情報 */}
            <section>
              <SectionHeader icon={FileText} title="基本情報" />
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="氏名" value={`${profileData.lastName} ${profileData.firstName}`} />
                  <InfoItem label="フリガナ" value={`${profileData.lastNameKana} ${profileData.firstNameKana}`} />
                  <InfoItem label="生年月日" value={formatValue(profileData.birthDate)} />
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
                </div>
              </Card>
            </section>

            {/* 身体的特徴 */}
            <section>
              <SectionHeader icon={Heart} title="身体的特徴" />
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="身長" value={`${profileData.height}cm`} />
                  <InfoItem label="体重" value={`${profileData.weight}kg`} />
                  <InfoItem label="スリーサイズ" value={`B${profileData.bust} W${profileData.waist} H${profileData.hip}`} />
                  <InfoItem label="カップサイズ" value={`${profileData.cupSize}カップ`} />
                </div>
              </Card>
            </section>

            {/* 写真関連 */}
            <section>
              <SectionHeader icon={Camera} title="写真関連" />
              <Card className="p-4">
                <div className="space-y-4">
                  <InfoItem
                    label="写メ日記"
                    value={
                      <Badge variant={profileData.canPhotoDiary ? "default" : "secondary"}>
                        {profileData.canPhotoDiary ? "投稿可" : "投稿不可"}
                      </Badge>
                    }
                  />
                  <InfoItem label="顔出し設定" value={formatValue(profileData.faceVisibility)} />
                </div>
              </Card>
            </section>

            {/* 勤務情報 */}
            <section>
              <SectionHeader icon={Building2} title="勤務情報" />
              <Card className="p-4">
                <div className="space-y-4">
                  {profileData.preferredLocations && profileData.preferredLocations.length > 0 && (
                    <InfoItem
                      label="希望エリア"
                      value={
                        <div className="flex flex-wrap gap-2">
                          {profileData.preferredLocations.map((location, index) => (
                            <Badge key={index} variant="outline">
                              <MapPin className="h-3 w-3 text-green-500 mr-1" />
                              {location}
                            </Badge>
                          ))}
                        </div>
                      }
                    />
                  )}

                  {profileData.ngLocations && profileData.ngLocations.length > 0 && (
                    <InfoItem
                      label="NGエリア"
                      value={
                        <div className="flex flex-wrap gap-2">
                          {profileData.ngLocations.map((location, index) => (
                            <Badge key={index} variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {location}
                            </Badge>
                          ))}
                        </div>
                      }
                    />
                  )}

                  <InfoItem
                    label="前日到着"
                    value={
                      <Badge variant={profileData.canArrivePreviousDay ? "default" : "secondary"}>
                        {profileData.canArrivePreviousDay ? "可能" : "不可"}
                      </Badge>
                    }
                  />

                  {profileData.desiredGuarantee && (
                    <InfoItem
                      label="希望給与"
                      value={
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-primary" />
                          <span>{profileData.desiredGuarantee}円</span>
                        </div>
                      }
                    />
                  )}

                  {profileData.desiredRate && (
                    <InfoItem
                      label="希望バック率"
                      value={
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-primary" />
                          <span>{profileData.desiredRate}%</span>
                        </div>
                      }
                    />
                  )}
                </div>
              </Card>
            </section>

            {/* エステ関連 */}
            <section>
              <SectionHeader icon={Sparkles} title="エステ関連" />
              <Card className="p-4">
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
              </Card>
            </section>

            {/* アレルギー・喫煙 */}
            <section>
              <SectionHeader icon={AlertTriangle} title="アレルギー・喫煙" />
              <Card className="p-4">
                <div className="space-y-4">
                  {profileData.allergies && (
                    <InfoItem
                      label="アレルギー"
                      value={
                        <div className="flex flex-wrap gap-2">
                          {[
                            ...(profileData.allergies.types || []),
                            ...(profileData.allergies.others || [])
                          ].map((allergy, index) => (
                            <Badge key={index} variant="destructive">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      }
                    />
                  )}

                  {profileData.smoking && (
                    <InfoItem
                      label="喫煙"
                      value={
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
                      }
                    />
                  )}
                </div>
              </Card>
            </section>

            {/* 自己PR・備考 */}
            <section>
              <SectionHeader icon={FileText} title="自己PR・備考" />
              <Card className="p-4">
                <div className="space-y-4">
                  <InfoItem
                    label="自己PR"
                    value={
                      <p className="whitespace-pre-wrap text-sm">
                        {formatValue(profileData.selfIntroduction)}
                      </p>
                    }
                  />
                  <Separator />
                  <InfoItem
                    label="備考"
                    value={
                      <p className="whitespace-pre-wrap text-sm">
                        {formatValue(profileData.notes)}
                      </p>
                    }
                  />
                </div>
              </Card>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            修正する
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            この内容で開始する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}