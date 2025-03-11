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
import { Loader2, User, MapPin, Camera, AlertTriangle, FileText, Building2, Instagram, Star } from "lucide-react";
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
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{formData.location} ({formData.nearestStation})</span>
                    </div>
                  }
                />
                <InfoItem label="身分証明書" value={<div>身分証明書の情報は省略</div>} />
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
                  value={<Badge variant="secondary">{formData.faceVisibility}</Badge>} 
                />
                <InfoItem label="写メ日記" value={<div>写メ日記の情報は省略</div>} />
              </div>
            </section>
            <Separator/>
            {/* 勤務情報 */}
            <section>
              <SectionHeader icon={Building2} title="勤務情報" />
              <div className="space-y-4 bg-card p-4 rounded-lg">
                <div>勤務情報は省略</div>
              </div>
            </section>
            <Separator/>
            {/* SNS情報 */}
            <section>
                <SectionHeader icon={Instagram} title="SNS情報" />
                <div className="space-y-4 bg-card p-4 rounded-lg">
                    <div>SNS情報は省略</div>
                </div>
            </section>
            <Separator/>
            {/* 傷・タトゥー・アトピーセクション */}
            <section>
                <SectionHeader icon={AlertTriangle} title="傷・タトゥー・アトピー" />
                <div className="space-y-4 bg-card p-4 rounded-lg">
                    <div>傷・タトゥー・アトピーの情報は省略</div>
                </div>
            </section>
            <Separator/>
            {/* エステ関連セクション */}
            <section>
                <SectionHeader icon={Star} title="エステ関連" />
                <div className="space-y-4 bg-card p-4 rounded-lg">
                  <div>エステ関連の情報は省略</div>
                </div>
            </section>
            <Separator/>
            {/* 制限事項・その他 */}
            <section>
                <SectionHeader icon={AlertTriangle} title="制限事項・その他" />
                <div className="space-y-4 bg-card p-4 rounded-lg">
                    <div>制限事項・その他の情報は省略</div>
                </div>
            </section>
            <Separator/>
            {/* 自己PR */}
            <section>
                <SectionHeader icon={Star} title="自己PR" />
                <div className="bg-card p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{formData.selfIntroduction || "未入力"}</p>
                </div>
            </section>
            <Separator/>
            {/* その他情報 */}
            <section>
                <SectionHeader icon={FileText} title="その他情報" />
                <div className="space-y-4 bg-card p-4 rounded-lg">
                  <div>その他情報は省略</div>
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