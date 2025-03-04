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
import { Check, X } from "lucide-react";

interface ProfileData {
  availableIds?: {
    types?: string[];
    others?: string[];
  };
  canProvideResidenceRecord?: boolean;
  canPhotoDiary?: boolean;
  canHomeDelivery?: boolean;
  ngOptions: {
    common?: string[];
    others?: string[];
  };
  allergies: {
    types?: string[];
    others?: string[];
  };
  smoking: {
    types?: string[];
    others?: string[];
  };
  estheOptions?: {
    available?: string[];
    ngOptions?: string[];
  };
}

interface ProfileCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profileData: ProfileData;
}

export default function ProfileCheckDialog({
  isOpen,
  onClose,
  onConfirm,
  profileData,
}: ProfileCheckDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>プロフィール確認</DialogTitle>
          <DialogDescription>
            マッチングを開始する前に、以下のプロフィール情報を確認してください
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-6 p-4">
            {/* 身分証明書 */}
            <div className="space-y-2">
              <h3 className="font-medium">提示可能な身分証明書</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.availableIds?.types?.map((id, index) => (
                  <Badge key={index} variant="outline">
                    <Check className="mr-1 h-3 w-3" />
                    {id}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 各種可否 */}
            <div className="space-y-2">
              <h3 className="font-medium">各種対応可否</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {profileData.canProvideResidenceRecord ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>住民票の提出</span>
                </div>
                <div className="flex items-center gap-2">
                  {profileData.canPhotoDiary ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>写メ日記の投稿</span>
                </div>
                <div className="flex items-center gap-2">
                  {profileData.canHomeDelivery ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>自宅待機での出張</span>
                </div>
              </div>
            </div>

            {/* NGオプション */}
            <div className="space-y-2">
              <h3 className="font-medium">NGオプション</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.ngOptions.common?.map((option, index) => (
                  <Badge key={index} variant="destructive">
                    <X className="mr-1 h-3 w-3" />
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            {/* アレルギー */}
            {profileData.allergies.types && profileData.allergies.types.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">アレルギー</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.allergies.types.map((allergy, index) => (
                    <Badge key={index} variant="outline">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 喫煙 */}
            <div className="space-y-2">
              <h3 className="font-medium">喫煙</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.smoking.types?.map((type, index) => (
                  <Badge key={index} variant="outline">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* エステオプション */}
            {profileData.estheOptions && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">対応可能なエステメニュー</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData.estheOptions.available?.map((option, index) => (
                      <Badge key={index} variant="outline">
                        <Check className="mr-1 h-3 w-3" />
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">NGのエステメニュー</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData.estheOptions.ngOptions?.map((option, index) => (
                      <Badge key={index} variant="destructive">
                        <X className="mr-1 h-3 w-3" />
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            プロフィールを修正する
          </Button>
          <Button onClick={onConfirm}>
            この内容で続ける
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
