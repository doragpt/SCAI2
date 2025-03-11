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
import { Loader2, User, MapPin, Camera } from "lucide-react";
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>登録内容の確認</DialogTitle>
          <DialogDescription>
            入力内容を確認してください。この内容でよろしいですか？
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
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
                <InfoItem
                  label="身長"
                  value={`${formData.height}cm`}
                />
                <InfoItem
                  label="体重"
                  value={`${formData.weight}kg`}
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