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
import {
  Loader2,
  MapPin,
  AlertTriangle,
  FileText,
  Sparkles,
  Cigarette,
  Heart,
  Store,
  Check,
  XCircle,
  Camera,
  Clock,
  Home,
  Building2,
  Banknote,
  CreditCard,
  Share2,
  FileCheck
} from "lucide-react";
import { TalentProfileData } from "@shared/schema";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

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
  const formatValue = (value: any) => {
    if (value === undefined || value === null || value === "") return "未入力";
    return value;
  };

  if (!profileData) return null;

  // 年齢計算
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>プロフィール確認</DialogTitle>
          <DialogDescription>
            以下の内容でAIマッチングを開始します。内容をご確認ください。
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* 基本情報 */}
            <section>
              <SectionHeader icon={FileText} title="基本情報" />
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="氏名" value={`${profileData.lastName} ${profileData.firstName}`} />
                  <InfoItem label="フリガナ" value={`${profileData.lastNameKana} ${profileData.firstNameKana}`} />
                  <InfoItem
                    label="生年月日"
                    value={`${formatValue(profileData.birthDate)} (${calculateAge(profileData.birthDate)}歳)`}
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
                </div>
              </Card>
            </section>

            {/* 身分証明書 */}
            <section>
              <SectionHeader icon={FileCheck} title="身分証明書" />
              <Card className="p-4">
                <div className="space-y-4">
                  <InfoItem
                    label="提示可能な身分証明書"
                    value={
                      <div className="flex flex-wrap gap-2">
                        {profileData.availableIds?.types?.map((id, index) => (
                          <Badge key={index} variant="outline">
                            <CreditCard className="h-3 w-3 mr-1" />
                            {id}
                          </Badge>
                        ))}
                        {profileData.availableIds?.others?.map((id, index) => (
                          <Badge key={`other-${index}`} variant="outline">
                            <CreditCard className="h-3 w-3 mr-1" />
                            {id}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                  <InfoItem
                    label="本籍地記載の住民票"
                    value={
                      <Badge variant={profileData.canProvideResidenceRecord ? "default" : "secondary"}>
                        {profileData.canProvideResidenceRecord ? "提出可能" : "提出不可"}
                      </Badge>
                    }
                  />
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
                  <InfoItem
                    label="スリーサイズ"
                    value={`B${profileData.bust || '未入力'} W${profileData.waist || '未入力'} H${profileData.hip || '未入力'}`}
                  />
                  <InfoItem label="カップサイズ" value={`${profileData.cupSize}カップ`} />
                </div>
              </Card>
            </section>

            {/* 傷・タトゥー・アトピー */}
            {(profileData.bodyMark?.hasBodyMark || (profileData.bodyMark?.others && profileData.bodyMark.others.length > 0)) && (
              <section>
                <SectionHeader icon={AlertTriangle} title="傷・タトゥー・アトピー" />
                <Card className="p-4">
                  <div className="space-y-4">
                    {profileData.bodyMark?.others && profileData.bodyMark.others.length > 0 && (
                      <InfoItem
                        label="項目"
                        value={
                          <div className="flex flex-wrap gap-2">
                            {profileData.bodyMark.others.map((mark, index) => (
                              <Badge key={index} variant="outline">
                                <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
                                {mark}
                              </Badge>
                            ))}
                          </div>
                        }
                      />
                    )}
                    {profileData.bodyMark?.details && (
                      <InfoItem
                        label="詳細"
                        value={
                          <p className="text-sm whitespace-pre-wrap">
                            {profileData.bodyMark.details}
                          </p>
                        }
                      />
                    )}
                  </div>
                </Card>
              </section>
            )}

            {/* 喫煙情報 */}
            {profileData.smoking && (
              <section>
                <SectionHeader icon={Cigarette} title="喫煙情報" />
                <Card className="p-4">
                  <div className="space-y-4">
                    <InfoItem
                      label="喫煙"
                      value={
                        <Badge variant={profileData.smoking.enabled ? "default" : "secondary"}>
                          {profileData.smoking.enabled ? "喫煙あり" : "喫煙なし"}
                        </Badge>
                      }
                    />
                    {profileData.smoking.enabled && (profileData.smoking.types?.length > 0 || profileData.smoking.others?.length > 0) && (
                      <InfoItem
                        label="喫煙の種類"
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
            )}

            {/* 各種対応可否 */}
            <section>
              <SectionHeader icon={Check} title="各種対応可否" />
              <Card className="p-4">
                <div className="space-y-4">
                  <InfoItem
                    label="住民票の提出"
                    value={
                      <Badge variant={profileData.canProvideResidenceRecord ? "default" : "secondary"}>
                        {profileData.canProvideResidenceRecord ? "可能" : "不可"}
                      </Badge>
                    }
                  />
                  <InfoItem
                    label="写メ日記の投稿"
                    value={
                      <Badge variant={profileData.canPhotoDiary ? "default" : "secondary"}>
                        {profileData.canPhotoDiary ? "可能" : "不可"}
                      </Badge>
                    }
                  />
                  <InfoItem
                    label="自宅待機での出張"
                    value={
                      <Badge variant={profileData.canHomeDelivery ? "default" : "secondary"}>
                        {profileData.canHomeDelivery ? "可能" : "不可"}
                      </Badge>
                    }
                  />
                </div>
              </Card>
            </section>

            {/* NGオプション */}
            <section>
              <SectionHeader icon={XCircle} title="NGオプション" />
              <Card className="p-4">
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
              </Card>
            </section>

            {/* アレルギー */}
            {profileData.allergies && (profileData.allergies.types?.length > 0 || profileData.allergies.others?.length > 0) && (
              <section>
                <SectionHeader icon={AlertTriangle} title="アレルギー" />
                <Card className="p-4">
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
                </Card>
              </section>
            )}

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

            {/* 在籍店舗情報 */}
            {(profileData.currentStores?.length > 0 || profileData.previousStores?.length > 0) && (
              <section>
                <SectionHeader icon={Store} title="在籍店舗情報" />
                <Card className="p-4">
                  <div className="space-y-4">
                    {profileData.currentStores && profileData.currentStores.length > 0 && (
                      <InfoItem
                        label="現在の在籍店舗"
                        value={
                          <div className="space-y-2">
                            {profileData.currentStores.map((store, index) => (
                              <div key={index}>
                                {store.storeName}（{store.stageName}）
                              </div>
                            ))}
                          </div>
                        }
                      />
                    )}
                    {profileData.previousStores && profileData.previousStores.length > 0 && (
                      <InfoItem
                        label="過去の在籍店舗"
                        value={
                          <div className="space-y-2">
                            {profileData.previousStores.map((store, index) => (
                              <div key={index}>
                                {store.storeName}
                              </div>
                            ))}
                          </div>
                        }
                      />
                    )}
                  </div>
                </Card>
              </section>
            )}


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


            {/* 詳細な勤務条件 */}
            <section>
              <SectionHeader icon={Clock} title="詳細な勤務条件" />
              <Card className="p-4">
                <div className="space-y-4">
                  {profileData.workType && (
                    <InfoItem
                      label="勤務形態"
                      value={
                        <Badge variant="outline">
                          {profileData.workType}
                        </Badge>
                      }
                    />
                  )}

                  {(profileData.workPeriodStart || profileData.workPeriodEnd) && (
                    <InfoItem
                      label="勤務期間"
                      value={
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {profileData.workPeriodStart || '未定'} ～ {profileData.workPeriodEnd || '未定'}
                          </span>
                        </div>
                      }
                    />
                  )}

                  {profileData.waitingHours && (
                    <InfoItem
                      label="待機時間"
                      value={`${profileData.waitingHours}時間`}
                    />
                  )}

                  {profileData.departureLocation && (
                    <InfoItem
                      label="出発地"
                      value={
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          {profileData.departureLocation}
                        </div>
                      }
                    />
                  )}

                  {profileData.returnLocation && (
                    <InfoItem
                      label="帰宅地"
                      value={
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          {profileData.returnLocation}
                        </div>
                      }
                    />
                  )}
                </div>
              </Card>
            </section>

            {/* エステNGオプション */}
            {profileData.estheOptions?.otherNgOptions && (
              <section>
                <SectionHeader icon={XCircle} title="エステNGオプション" />
                <Card className="p-4">
                  <div className="whitespace-pre-wrap">
                    {profileData.estheOptions.otherNgOptions}
                  </div>
                </Card>
              </section>
            )}

            {/* 写真一覧 */}
            {profileData.photos && profileData.photos.length > 0 && (
              <section>
                <SectionHeader icon={Camera} title="登録写真" />
                <Card className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                </Card>
              </section>
            )}

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