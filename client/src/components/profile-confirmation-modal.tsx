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
import {
  Loader2,
  User,
  MapPin,
  Ruler,
  Heart,
  Camera,
  AlertTriangle,
  FileText,
  Building2,
  History,
  Instagram,
  Calendar,
  FileCheck,
  Cigarette,
  Clock,
  Star,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Clock4,
  Banknote,
  Navigation,
  Home,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

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
                <InfoItem
                  label="身分証明書"
                  value={
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {formData.availableIds?.types?.map((id) => (
                          <Badge key={id} variant="outline" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {id}
                          </Badge>
                        ))}
                      </div>
                      <Badge variant={formData.canProvideResidenceRecord ? "default" : "secondary"}>
                        {formData.canProvideResidenceRecord ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>本籍地記載の住民票提出可能</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            <span>本籍地記載の住民票提出不可</span>
                          </div>
                        )}
                      </Badge>
                    </div>
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
                <InfoItem
                  label="写メ日記"
                  value={
                    <div className="space-y-2">
                      <Badge variant={formData.canPhotoDiary ? "default" : "secondary"}>
                        {formData.canPhotoDiary ? "投稿可能" : "投稿不可"}
                      </Badge>
                      {formData.canPhotoDiary && formData.photoDiaryUrls && formData.photoDiaryUrls.length > 0 && (
                        <div className="space-y-2">
                          {formData.photoDiaryUrls.map((url, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <ImagePlus className="h-4 w-4 text-primary" />
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                写メ日記 {index + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
                <InfoItem
                  label="自宅待機"
                  value={
                    <Badge variant={formData.canHomeDelivery ? "default" : "secondary"}>
                      {formData.canHomeDelivery ? "可能" : "不可"}
                    </Badge>
                  }
                />
              </div>
            </section>

            <Separator />

            {/* 勤務情報 */}
            <section>
              <SectionHeader icon={Building2} title="勤務情報" />
              <div className="space-y-4 bg-card p-4 rounded-lg">
                {/* 勤務店舗情報 */}
                {formData.currentStores && formData.currentStores.length > 0 && (
                  <InfoItem
                    label="現在の在籍店舗"
                    value={
                      <div className="space-y-2">
                        {formData.currentStores.map((store, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span>{store.storeName}{store.stageName && ` (${store.stageName})`}</span>
                          </div>
                        ))}
                      </div>
                    }
                  />
                )}
                {formData.previousStores && formData.previousStores.length > 0 && (
                  <InfoItem
                    label="過去の在籍店舗"
                    value={
                      <div className="space-y-2">
                        {formData.previousStores.map((store, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <History className="h-4 w-4 text-primary" />
                            <span>{store.storeName}</span>
                          </div>
                        ))}
                      </div>
                    }
                  />
                )}

                {/* 勤務形態と期間 */}
                {formData.workType && (
                  <InfoItem
                    label="希望勤務形態"
                    value={
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{formData.workType}</span>
                      </div>
                    }
                  />
                )}
                {(formData.workPeriodStart || formData.workPeriodEnd) && (
                  <InfoItem
                    label="希望勤務期間"
                    value={
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {formData.workPeriodStart && format(new Date(formData.workPeriodStart), 'yyyy年MM月dd日', { locale: ja })}
                          {formData.workPeriodEnd && ` 〜 ${format(new Date(formData.workPeriodEnd), 'yyyy年MM月dd日', { locale: ja })}`}
                        </span>
                      </div>
                    }
                  />
                )}

                {/* 勤務条件 */}
                <InfoItem
                  label="前日到着可否"
                  value={
                    <Badge variant={formData.canArrivePreviousDay ? "default" : "secondary"}>
                      {formData.canArrivePreviousDay ? "可能" : "不可"}
                    </Badge>
                  }
                />

                {formData.desiredGuarantee && (
                  <InfoItem
                    label="希望給与・保証額"
                    value={
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-primary" />
                        <span>{formData.desiredGuarantee.toLocaleString()}円</span>
                      </div>
                    }
                  />
                )}

                {formData.desiredRate && (
                  <InfoItem
                    label="希望バック率"
                    value={
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-primary" />
                        <span>{formData.desiredRate}%</span>
                      </div>
                    }
                  />
                )}

                {formData.waitingHours && (
                  <InfoItem
                    label="待機時間"
                    value={
                      <div className="flex items-center gap-2">
                        <Clock4 className="h-4 w-4 text-primary" />
                        <span>{formData.waitingHours}時間</span>
                      </div>
                    }
                  />
                )}

                {/* 出発・戻り地点 */}
                {formData.departureLocation && (
                  <InfoItem
                    label="出発地点"
                    value={
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span>{formData.departureLocation}</span>
                      </div>
                    }
                  />
                )}

                {formData.returnLocation && (
                  <InfoItem
                    label="戻り地点"
                    value={
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span>{formData.returnLocation}</span>
                      </div>
                    }
                  />
                )}

                {/* 希望エリアとNGエリア */}
                {formData.preferredLocations && formData.preferredLocations.length > 0 && (
                  <InfoItem
                    label="希望エリア"
                    value={
                      <div className="flex flex-wrap gap-2">
                        {formData.preferredLocations.map((location, index) => (
                          <Badge key={index} variant="outline">
                            <MapPin className="h-3 w-3 text-green-500 mr-1" />
                            {location}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                )}

                {formData.ngLocations && formData.ngLocations.length > 0 && (
                  <InfoItem
                    label="NGエリア"
                    value={
                      <div className="flex flex-wrap gap-2">
                        {formData.ngLocations.map((location, index) => (
                          <Badge key={index} variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            {location}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                )}
              </div>
            </section>

            <Separator />

            {/* SNS情報 */}
            {formData.hasSnsAccount && (
              <>
                <section>
                  <SectionHeader icon={Instagram} title="SNS情報" />
                  <div className="space-y-4 bg-card p-4 rounded-lg">
                    {formData.snsUrls && formData.snsUrls.length > 0 && (
                      <div className="space-y-2">
                        {formData.snsUrls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <Instagram className="h-4 w-4" />
                            <span className="text-sm">SNSアカウント {index + 1}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
                <Separator />
              </>
            )}

            {/* 傷・タトゥー・アトピーセクション */}
            {(formData.bodyMark?.hasBodyMark || (formData.bodyMark?.others && formData.bodyMark.others.length > 0)) && (
              <section>
                <SectionHeader icon={AlertTriangle} title="傷・タトゥー・アトピー" />
                <div className="space-y-4 bg-card p-4 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {formData.bodyMark?.others?.map((mark, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
                        {mark}
                      </Badge>
                    ))}
                  </div>
                  {formData.bodyMark?.details && (
                    <InfoItem
                      label="詳細"
                      value={
                        <p className="text-sm whitespace-pre-wrap">
                          {formData.bodyMark.details}
                        </p>
                      }
                    />
                  )}
                </div>
              </section>
            )}

            {/* エステ関連セクション */}
            <section>
              <SectionHeader icon={Star} title="エステ関連" />
              <div className="space-y-4 bg-card p-4 rounded-lg">
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
                {formData.hasEstheExperience && formData.estheOptions && (
                  <>
                    <InfoItem
                      label="可能オプション"
                      value={
                        <div className="flex flex-wrap gap-2">
                          {formData.estheOptions.available?.map((option) => (
                            <Badge key={option} variant="outline">
                              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                              {option}
                            </Badge>
                          ))}
                        </div>
                      }
                    />
                    {formData.estheOptions.otherNgOptions && (
                      <InfoItem
                        label="その他できないプレイやオプション"
                        value={
                          <div className="flex flex-wrap gap-2">
                            {formData.estheOptions.otherNgOptions.split('\n').filter(Boolean).map((option, index) => (
                              <Badge key={index} variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                {option}
                              </Badge>
                            ))}
                          </div>
                        }
                      />
                    )}
                  </>
                )}
              </div>
            </section>

            {/* 制限事項・その他 */}
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
                            <XCircle className="h-3 w-3 mr-1" />
                            {option}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                )}

                {formData.allergies && formData.allergies.hasAllergy && (
                  <InfoItem
                    label="アレルギー"
                    value={
                      <div className="flex flex-wrap gap-2">
                        {[
                          ...(formData.allergies.types || []),
                          ...(formData.allergies.others || [])
                        ].map((allergy, index) => (
                          <Badge key={index} variant="outline">
                            <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                )}

                {formData.smoking && formData.smoking.enabled && (
                  <InfoItem
                    label="喫煙"
                    value={
                      <div className="flex flex-wrap gap-2">
                        {[
                          ...(formData.smoking.types || []),
                          ...(formData.smoking.others || [])
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

            {/* その他情報 */}
            <section>
              <SectionHeader icon={FileText} title="その他情報" />
              <div className="space-y-4 bg-card p-4 rounded-lg">
                {formData.notes && (
                  <InfoItem
                    label="備考"
                    value={
                      <div className="bg-muted/10 p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">
                          {formData.notes}
                        </p>
                      </div>
                    }
                  />
                )}
              </div>
            </section>
            <section>
              <SectionHeader icon={Clock} title="勤務可能時間帯" />
              <div className="space-y-4 bg-card p-4 rounded-lg">
                <InfoItem label="勤務可能時間帯" value={formData.availableTimeSlots?.join(', ') || '未設定'} />
              </div>
            </section>
            <section>
              <SectionHeader icon={Banknote} title="希望報酬" />
              <div className="space-y-4 bg-card p-4 rounded-lg">
                <InfoItem label="希望報酬" value={formData.desiredCompensation?.toLocaleString() || '未設定'} />
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