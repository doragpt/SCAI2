import React from 'react';
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
import type { TalentProfileData } from "@shared/schema";
import { Loader2, User, MapPin, Camera, Building2, AlertTriangle, Star, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: TalentProfileData | null;
  isSubmitting?: boolean;
}

// セクションヘッダーコンポーネント
const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
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

export function ProfileConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  formData,
  isSubmitting = false,
}: ProfileConfirmationModalProps) {
  if (!isOpen || !formData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>登録内容の確認</DialogTitle>
          <DialogDescription>
            入力内容を確認してください。この内容でよろしいですか？
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* 基本情報 */}
            <section>
              <SectionHeader icon={User} title="基本情報" />
              <div className="grid grid-cols-2 gap-4 bg-card p-4 rounded-lg">
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
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{formData.location} ({formData.nearestStation})</span>
                    </div>
                  }
                />
                <InfoItem
                  label="希望エリア"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {formData.preferredLocations.map((location, index) => (
                        <Badge key={index} variant="outline">{location}</Badge>
                      ))}
                    </div>
                  }
                />
                <InfoItem
                  label="NGエリア"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {formData.ngLocations.map((location, index) => (
                        <Badge key={index} variant="outline">{location}</Badge>
                      ))}
                    </div>
                  }
                />
                <InfoItem
                  label="身長"
                  value={`${formData.height}cm`}
                />
                <InfoItem
                  label="体重"
                  value={`${formData.weight}kg`}
                />
                <InfoItem
                  label="カップサイズ"
                  value={formData.cupSize}
                />
                {formData.bust && (
                  <InfoItem
                    label="バスト"
                    value={`${formData.bust}cm`}
                  />
                )}
                {formData.waist && (
                  <InfoItem
                    label="ウエスト"
                    value={`${formData.waist}cm`}
                  />
                )}
                {formData.hip && (
                  <InfoItem
                    label="ヒップ"
                    value={`${formData.hip}cm`}
                  />
                )}
                <InfoItem
                  label="身分証明書"
                  value={
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {formData.availableIds.types.map((type, index) => (
                          <Badge key={index} variant="outline">{type}</Badge>
                        ))}
                        {formData.availableIds.others.map((other, index) => (
                          <Badge key={index} variant="outline">{other}</Badge>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        住民票提出: {formData.canProvideResidenceRecord ? "可能" : "不可"}
                      </div>
                    </div>
                  }
                />
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
                    </div>
                  ))}
                </div>
                <InfoItem 
                  label="顔出し設定" 
                  value={<Badge variant="secondary">{formData.faceVisibility}</Badge>} 
                />
              </div>
            </section>

            <Separator />

            {/* 勤務情報 */}
            <section>
              <SectionHeader icon={Building2} title="勤務情報" />
              <div className="grid grid-cols-2 gap-4 bg-card p-4 rounded-lg">
                <InfoItem
                  label="写メ日記"
                  value={formData.canPhotoDiary ? "可能" : "不可"}
                />
                <InfoItem
                  label="自宅派遣"
                  value={formData.canHomeDelivery ? "可能" : "不可"}
                />
                <InfoItem
                  label="現在の在籍店舗"
                  value={
                    <div className="space-y-2">
                      {formData.currentStores.map((store, index) => (
                        <div key={index} className="text-sm">
                          {store.storeName} ({store.stageName})
                        </div>
                      ))}
                    </div>
                  }
                />
                <InfoItem
                  label="過去の在籍店舗"
                  value={
                    <div className="space-y-2">
                      {formData.previousStores.map((store, index) => (
                        <div key={index} className="text-sm">
                          {store.storeName}
                        </div>
                      ))}
                    </div>
                  }
                />
                {formData.photoDiaryUrls && formData.photoDiaryUrls.length > 0 && (
                  <InfoItem
                    label="写メ日記URL"
                    value={
                      <div className="space-y-2">
                        {formData.photoDiaryUrls.map((url, index) => (
                          <div key={index} className="text-sm break-all">
                            {url}
                          </div>
                        ))}
                      </div>
                    }
                  />
                )}
              </div>
            </section>

            <Separator />

            {/* 制限事項 */}
            <section>
              <SectionHeader icon={AlertTriangle} title="制限事項" />
              <div className="grid grid-cols-2 gap-4 bg-card p-4 rounded-lg">
                <InfoItem
                  label="NGオプション"
                  value={
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {formData.ngOptions.common.map((option, index) => (
                          <Badge key={index} variant="outline">{option}</Badge>
                        ))}
                        {formData.ngOptions.others.map((other, index) => (
                          <Badge key={index} variant="outline">{other}</Badge>
                        ))}
                      </div>
                    </div>
                  }
                />
                <InfoItem
                  label="アレルギー"
                  value={
                    formData.allergies.hasAllergy ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {formData.allergies.types.map((type, index) => (
                            <Badge key={index} variant="outline">{type}</Badge>
                          ))}
                          {formData.allergies.others.map((other, index) => (
                            <Badge key={index} variant="outline">{other}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : "なし"
                  }
                />
                <InfoItem
                  label="喫煙"
                  value={
                    formData.smoking.enabled ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {formData.smoking.types.map((type, index) => (
                            <Badge key={index} variant="outline">{type}</Badge>
                          ))}
                          {formData.smoking.others.map((other, index) => (
                            <Badge key={index} variant="outline">{other}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : "なし"
                  }
                />
                {formData.bodyMark.hasBodyMark && (
                  <InfoItem
                    label="ボディマーク"
                    value={
                      <div className="space-y-2">
                        <div className="text-sm">{formData.bodyMark.details}</div>
                        <div className="flex flex-wrap gap-2">
                          {formData.bodyMark.others.map((mark, index) => (
                            <Badge key={index} variant="outline">{mark}</Badge>
                          ))}
                        </div>
                      </div>
                    }
                  />
                )}
              </div>
            </section>

            <Separator />

            {/* エステ情報 */}
            <section>
              <SectionHeader icon={Star} title="エステ情報" />
              <div className="grid grid-cols-2 gap-4 bg-card p-4 rounded-lg">
                <InfoItem
                  label="エステ経験"
                  value={formData.hasEstheExperience ? "あり" : "なし"}
                />
                {formData.hasEstheExperience && (
                  <InfoItem
                    label="経験期間"
                    value={formData.estheExperiencePeriod}
                  />
                )}
                <InfoItem
                  label="対応可能なエステ"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {formData.estheOptions.available.map((option, index) => (
                        <Badge key={index} variant="outline">{option}</Badge>
                      ))}
                    </div>
                  }
                />
                <InfoItem
                  label="エステNG項目"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {formData.estheOptions.ngOptions.map((option, index) => (
                        <Badge key={index} variant="outline">{option}</Badge>
                      ))}
                    </div>
                  }
                />
              </div>
            </section>

            <Separator />

            {/* その他 */}
            <section>
              <SectionHeader icon={FileText} title="その他" />
              <div className="space-y-4 bg-card p-4 rounded-lg">
                <InfoItem
                  label="自己紹介"
                  value={
                    <p className="text-sm whitespace-pre-wrap">
                      {formData.selfIntroduction || "未入力"}
                    </p>
                  }
                />
                <InfoItem
                  label="備考"
                  value={
                    <p className="text-sm whitespace-pre-wrap">
                      {formData.notes || "未入力"}
                    </p>
                  }
                />
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