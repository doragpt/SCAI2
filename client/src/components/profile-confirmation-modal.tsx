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
import { TalentProfileData } from "@shared/schema";

interface ProfileConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profileData?: TalentProfileData;
}

export function ProfileConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  profileData,
}: ProfileConfirmationModalProps) {
  if (!profileData) {
    return null;
  }

  const renderContent = () => (
    <div className="flex flex-col h-full max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>プロフィール内容の確認</DialogTitle>
        <DialogDescription>
          入力内容をご確認ください。この内容でよろしいですか？
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-2">
            <h3 className="font-medium">基本情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">氏名</p>
                <p>{profileData.lastName} {profileData.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">フリガナ</p>
                <p>{profileData.lastNameKana} {profileData.firstNameKana}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">在住地</p>
                <p>{profileData.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">最寄り駅</p>
                <p>{profileData.nearestStation}</p>
              </div>
            </div>
          </div>

          {/* 身分証明書 */}
          {profileData.availableIds && (
            <div className="space-y-2">
              <h3 className="font-medium">身分証明書</h3>
              <div>
                <p className="text-sm text-muted-foreground">持参可能な身分証明書</p>
                <ul className="list-disc list-inside">
                  {profileData.availableIds.types?.map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                  {profileData.availableIds.others?.map((other) => (
                    <li key={other}>{other}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">本籍地入りの住民票</p>
                <p>{profileData.canProvideResidenceRecord ? "提供可能" : "提供不可"}</p>
              </div>
            </div>
          )}

          {/* 身体的特徴 */}
          <div className="space-y-2">
            <h3 className="font-medium">身体的特徴</h3>
            <div className="grid grid-cols-3 gap-4">
              {profileData.height && (
                <div>
                  <p className="text-sm text-muted-foreground">身長</p>
                  <p>{profileData.height}cm</p>
                </div>
              )}
              {profileData.weight && (
                <div>
                  <p className="text-sm text-muted-foreground">体重</p>
                  <p>{profileData.weight}kg</p>
                </div>
              )}
              {profileData.cupSize && (
                <div>
                  <p className="text-sm text-muted-foreground">カップサイズ</p>
                  <p>{profileData.cupSize}カップ</p>
                </div>
              )}
              {profileData.bust && (
                <div>
                  <p className="text-sm text-muted-foreground">バスト</p>
                  <p>{profileData.bust}cm</p>
                </div>
              )}
              {profileData.waist && (
                <div>
                  <p className="text-sm text-muted-foreground">ウエスト</p>
                  <p>{profileData.waist}cm</p>
                </div>
              )}
              {profileData.hip && (
                <div>
                  <p className="text-sm text-muted-foreground">ヒップ</p>
                  <p>{profileData.hip}cm</p>
                </div>
              )}
            </div>
          </div>

          {/* その他の情報 */}
          {Object.entries({
            "パネル設定": {
              "顔出し": profileData.faceVisibility,
              "写メ日記": profileData.canPhotoDiary ? "可能" : "不可",
              "自宅への派遣": profileData.canHomeDelivery ? "可能" : "不可",
            },
            "NGオプション": profileData.ngOptions && [
              ...profileData.ngOptions.common,
              ...profileData.ngOptions.others,
            ],
            "アレルギー": profileData.allergies?.hasAllergy && [
              ...profileData.allergies.types || [],
              ...profileData.allergies.others || [],
            ],
            "喫煙": profileData.smoking?.enabled && [
              ...profileData.smoking.types || [],
              ...profileData.smoking.others || [],
            ],
            "SNSアカウント": profileData.hasSnsAccount && profileData.snsUrls,
            "自己PR": profileData.selfIntroduction,
            "その他備考": profileData.notes,
          }).map(([title, content]) => content && (
            <div key={title} className="space-y-2">
              <h3 className="font-medium">{title}</h3>
              {Array.isArray(content) ? (
                <ul className="list-disc list-inside">
                  {content.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : typeof content === 'object' ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(content).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-muted-foreground">{key}</p>
                      <p>{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{content}</p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={onClose}>
          修正する
        </Button>
        <Button onClick={onConfirm}>
          この内容で確定する
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}