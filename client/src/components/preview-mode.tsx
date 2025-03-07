import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { TalentProfileData } from "@shared/schema";

interface PreviewModeProps {
  data: TalentProfileData;
}

export const PreviewMode = ({ data }: PreviewModeProps) => {
  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <Card className="m-6">
        <div className="p-6 space-y-8">
          {/* 基本情報 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">基本情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">氏名</p>
                <p className="font-medium">{data.lastName} {data.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">フリガナ</p>
                <p className="font-medium">{data.lastNameKana} {data.firstNameKana}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">在住地</p>
                <p className="font-medium">{data.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">最寄り駅</p>
                <p className="font-medium">{data.nearestStation}</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* 身体的特徴 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">身体的特徴</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">身長</p>
                <p className="font-medium">{data.height}cm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">体重</p>
                <p className="font-medium">{data.weight}kg</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">カップ</p>
                <p className="font-medium">{data.cupSize}カップ</p>
              </div>
              {data.bust && (
                <div>
                  <p className="text-sm text-muted-foreground">バスト</p>
                  <p className="font-medium">{data.bust}cm</p>
                </div>
              )}
              {data.waist && (
                <div>
                  <p className="text-sm text-muted-foreground">ウエスト</p>
                  <p className="font-medium">{data.waist}cm</p>
                </div>
              )}
              {data.hip && (
                <div>
                  <p className="text-sm text-muted-foreground">ヒップ</p>
                  <p className="font-medium">{data.hip}cm</p>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* その他の設定 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">その他の設定</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">顔出し設定</p>
                <p className="font-medium">{data.faceVisibility}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">写メ日記</p>
                <Badge variant={data.canPhotoDiary ? "default" : "secondary"}>
                  {data.canPhotoDiary ? "可能" : "不可"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">自宅待機での出張</p>
                <Badge variant={data.canHomeDelivery ? "default" : "secondary"}>
                  {data.canHomeDelivery ? "可能" : "不可"}
                </Badge>
              </div>
            </div>
          </section>

          {/* NGオプション */}
          {data.ngOptions && (data.ngOptions.common.length > 0 || data.ngOptions.others.length > 0) && (
            <>
              <Separator />
              <section>
                <h3 className="text-lg font-semibold mb-4">NGオプション</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(data.ngOptions.common || []),
                    ...(data.ngOptions.others || [])
                  ].map((option, index) => (
                    <Badge key={index} variant="secondary">{option}</Badge>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* アレルギー */}
          {data.allergies && data.allergies.hasAllergy && (
            <>
              <Separator />
              <section>
                <h3 className="text-lg font-semibold mb-4">アレルギー</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(data.allergies.types || []),
                    ...(data.allergies.others || [])
                  ].map((allergy, index) => (
                    <Badge key={index} variant="destructive">{allergy}</Badge>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* 傷・タトゥー・アトピー */}
          {data.bodyMark && data.bodyMark.hasBodyMark && (
            <>
              <Separator />
              <section>
                <h3 className="text-lg font-semibold mb-4">傷・タトゥー・アトピー</h3>
                <div className="space-y-2">
                  {data.bodyMark.details && (
                    <p className="whitespace-pre-wrap">{data.bodyMark.details}</p>
                  )}
                  {data.bodyMark.others && data.bodyMark.others.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {data.bodyMark.others.map((mark, index) => (
                        <Badge key={index} variant="outline">{mark}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* 自己PR */}
          {data.selfIntroduction && (
            <>
              <Separator />
              <section>
                <h3 className="text-lg font-semibold mb-4">自己PR</h3>
                <p className="whitespace-pre-wrap">{data.selfIntroduction}</p>
              </section>
            </>
          )}

          {/* 備考 */}
          {data.notes && (
            <>
              <Separator />
              <section>
                <h3 className="text-lg font-semibold mb-4">備考</h3>
                <p className="whitespace-pre-wrap">{data.notes}</p>
              </section>
            </>
          )}
        </div>
      </Card>
    </ScrollArea>
  );
};