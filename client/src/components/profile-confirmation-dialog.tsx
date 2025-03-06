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
import { Loader2 } from "lucide-react";
import { TalentProfileData } from "@shared/schema";

interface ProfileConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  profileData: TalentProfileData;
}

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
            以下の内容で登録します。内容をご確認ください。
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="appearance">容姿</TabsTrigger>
            <TabsTrigger value="conditions">条件</TabsTrigger>
            <TabsTrigger value="other">その他</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-4">
            <TabsContent value="basic" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">個人情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">氏名</span>
                    <p>{formatValue(`${profileData.lastName} ${profileData.firstName}`)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">フリガナ</span>
                    <p>{formatValue(`${profileData.lastNameKana} ${profileData.firstNameKana}`)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">生年月日</span>
                    <p>{formatValue(profileData.birthDate)} ({profileData.age}歳)</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">電話番号</span>
                    <p>{formatValue(profileData.phoneNumber)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">メールアドレス</span>
                    <p>{formatValue(profileData.email)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">住所情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">在住地</span>
                    <p>{formatValue(profileData.location)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">最寄り駅</span>
                    <p>{formatValue(profileData.nearestStation)}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">身体的特徴</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">身長</span>
                    <p>{profileData.height}cm</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">体重</span>
                    <p>{profileData.weight}kg</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">スリーサイズ</span>
                    <p>B{profileData.bust} W{profileData.waist} H{profileData.hip}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">カップサイズ</span>
                    <p>{profileData.cupSize}カップ</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">写真設定</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">顔出し設定</span>
                    <p>{formatValue(profileData.faceVisibility)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">写メ日記</span>
                    <Badge variant={profileData.photoDiaryAllowed ? "default" : "secondary"}>
                      {profileData.photoDiaryAllowed ? "投稿可" : "投稿不可"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">身分証明書</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">提示可能な身分証明書</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profileData.availableIds?.types?.map((id) => (
                        <Badge key={id} variant="outline">{id}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">本籍地記載の住民票</span>
                    <Badge variant={profileData.canProvideResidenceRecord ? "default" : "secondary"}>
                      {profileData.canProvideResidenceRecord ? "提出可" : "提出不可"}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">派遣条件</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">自宅派遣</span>
                    <Badge variant={profileData.canHomeDelivery ? "default" : "secondary"}>
                      {profileData.canHomeDelivery ? "可能" : "不可"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">NGオプション</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profileData.ngOptions?.common?.map((option) => (
                        <Badge key={option} variant="outline">{option}</Badge>
                      ))}
                      {profileData.ngOptions?.others?.map((option) => (
                        <Badge key={option} variant="outline">{option}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">エステ経験</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">経験</span>
                    <Badge variant={profileData.hasEstheExperience ? "default" : "secondary"}>
                      {profileData.hasEstheExperience ? `あり（${profileData.estheExperiencePeriod}）` : "無し"}
                    </Badge>
                  </div>
                  {profileData.hasEstheExperience && (
                    <div>
                      <span className="text-sm text-muted-foreground">対応可能なメニュー</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.estheOptions?.available?.map((option) => (
                          <Badge key={option} variant="outline">{option}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">その他情報</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">アレルギー</span>
                    <Badge variant={profileData.hasAllergies ? "destructive" : "secondary"}>
                      {profileData.hasAllergies ? "あり" : "無し"}
                    </Badge>
                    {profileData.hasAllergies && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.allergies?.types?.map((allergy) => (
                          <Badge key={allergy} variant="outline">{allergy}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">喫煙</span>
                    <Badge variant={profileData.isSmoker ? "destructive" : "secondary"}>
                      {profileData.isSmoker ? "あり" : "無し"}
                    </Badge>
                    {profileData.isSmoker && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.smoking?.types?.map((type) => (
                          <Badge key={type} variant="outline">{type}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">PR・備考</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">自己PR</span>
                    <p className="whitespace-pre-wrap mt-2">{formatValue(profileData.selfIntroduction)}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">備考</span>
                    <p className="whitespace-pre-wrap mt-2">{formatValue(profileData.notes)}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            戻る
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            登録する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
