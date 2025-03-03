import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  allergyTypes,
  smokingTypes,
  cupSizes,
  faceVisibilityTypes,
  commonNgOptions,
  idTypes,
  type AllergyType,
  type SmokingType,
  type TalentProfileData,
  talentProfileSchema,
} from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Tag } from "lucide-react";

// FormField wrapper component for consistent styling
const FormField: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
  description?: string;
}> = ({ label, required = false, children, description }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Label>{label}</Label>
      {required && <span className="text-destructive">*</span>}
    </div>
    {children}
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
  </div>
);

// SwitchField component for consistent switch styling
const SwitchField: React.FC<{
  label: string;
  required?: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
}> = ({ label, required = false, checked, onCheckedChange, description }) => (
  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {required && <span className="text-destructive">*</span>}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <span className={checked ? "text-primary" : "text-muted-foreground"}>
        {checked ? "可" : "不可"}
      </span>
    </div>
  </div>
);

export const TalentForm: React.FC = () => {
  const { toast } = useToast();
  const form = useForm<TalentProfileData>({
    resolver: zodResolver(talentProfileSchema),
    defaultValues: {
      name: "",
      location: "",
      nearestStation: "",
      availableIds: {
        types: [],
        others: [],
      },
      canProvideResidenceRecord: false,
      height: 150,
      weight: 45,
      cupSize: undefined,
      bust: undefined,
      waist: undefined,
      hip: undefined,
      faceVisibility: undefined,
      canPhotoDiary: false,
      canHomeDelivery: false,
      ngOptions: {
        common: [],
        others: [],
      },
      allergies: {
        types: [],
        others: [],
        hasAllergy: false,
      },
      smoking: {
        enabled: false,
        types: [],
        others: [],
      },
      hasSnsAccount: false,
      snsUrls: [],
      currentStores: [],
      photoDiaryUrls: [],
      selfIntroduction: "",
      notes: "",
    },
  });

  const { mutate: createProfile, isPending } = useMutation({
    mutationFn: (data: TalentProfileData) =>
      apiRequest('/api/talent/profile', { method: 'POST', body: data }),
    onSuccess: () => {
      toast({ title: 'プロフィールが作成されました。' });
    },
    onError: (err) => {
      toast({
        title: 'プロフィールの作成に失敗しました。',
        description: err instanceof Error ? err.message : '不明なエラーが発生しました。',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TalentProfileData) => {
    createProfile(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. 名前（必須） */}
        <FormField label="名前" required>
          <Input
            {...form.register("name")}
            placeholder="お名前を入力してください"
          />
        </FormField>

        {/* 2. 在住地と最寄り駅（必須） */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="在住地" required>
            <Input
              {...form.register("location")}
              placeholder="在住地を入力してください"
            />
          </FormField>
          <FormField label="最寄り駅" required>
            <Input
              {...form.register("nearestStation")}
              placeholder="最寄り駅を入力してください"
            />
          </FormField>
        </div>

        {/* 3. 持参身分証（必須） */}
        <FormField label="持参可能な身分証明書" required>
          <div className="grid grid-cols-2 gap-4">
            {idTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  checked={form.watch("availableIds.types").includes(type)}
                  onCheckedChange={(checked) => {
                    const current = form.watch("availableIds.types");
                    const updated = checked
                      ? [...current, type]
                      : current.filter(t => t !== type);
                    form.setValue("availableIds.types", updated);
                  }}
                />
                <label className="text-sm">{type}</label>
              </div>
            ))}
          </div>
        </FormField>

        {/* 4. 本籍地入りの住民票の用意可否（必須） */}
        <SwitchField
          label="本籍地入りの住民票の用意"
          required
          checked={form.watch("canProvideResidenceRecord")}
          onCheckedChange={(checked) => form.setValue("canProvideResidenceRecord", checked)}
        />

        {/* 5-8. 身体的特徴 */}
        <div className="grid md:grid-cols-3 gap-4">
          <FormField label="身長 (cm)" required>
            <Input
              type="number"
              {...form.register("height", { valueAsNumber: true })}
              min={130}
              max={190}
            />
          </FormField>
          <FormField label="体重 (kg)" required>
            <Input
              type="number"
              {...form.register("weight", { valueAsNumber: true })}
              min={30}
              max={150}
            />
          </FormField>
          <FormField label="カップサイズ" required>
            <Select
              value={form.watch("cupSize")}
              onValueChange={(value) => form.setValue("cupSize", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {cupSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}カップ
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="バスト (cm)">
            <Input
              type="number"
              {...form.register("bust", { valueAsNumber: true })}
              min={65}
              max={120}
            />
          </FormField>
          <FormField label="ウエスト (cm)">
            <Input
              type="number"
              {...form.register("waist", { valueAsNumber: true })}
              min={50}
              max={100}
            />
          </FormField>
          <FormField label="ヒップ (cm)">
            <Input
              type="number"
              {...form.register("hip", { valueAsNumber: true })}
              min={65}
              max={120}
            />
          </FormField>
        </div>

        {/* 9. パネルの顔出し（必須） */}
        <FormField label="パネルの顔出し" required>
          <Select
            value={form.watch("faceVisibility")}
            onValueChange={(value) => form.setValue("faceVisibility", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {faceVisibilityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* 10-11. 写メ日記と自宅への派遣 */}
        <SwitchField
          label="写メ日記"
          required
          checked={form.watch("canPhotoDiary")}
          onCheckedChange={(checked) => form.setValue("canPhotoDiary", checked)}
        />

        <SwitchField
          label="自宅への派遣"
          required
          checked={form.watch("canHomeDelivery")}
          onCheckedChange={(checked) => form.setValue("canHomeDelivery", checked)}
          description="自宅での接客が可能な場合は「可」を選択してください"
        />

        {/* 12. NGオプション（必須） */}
        <FormField label="NGオプション" required>
          <div className="grid grid-cols-2 gap-4">
            {commonNgOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  checked={form.watch("ngOptions.common").includes(option)}
                  onCheckedChange={(checked) => {
                    const current = form.watch("ngOptions.common");
                    const updated = checked
                      ? [...current, option]
                      : current.filter(o => o !== option);
                    form.setValue("ngOptions.common", updated);
                  }}
                />
                <label className="text-sm">{option}</label>
              </div>
            ))}
          </div>
        </FormField>

        {/* 13-14. アレルギーと喫煙 */}
        <SwitchField
          label="アレルギー"
          required
          checked={form.watch("allergies.hasAllergy")}
          onCheckedChange={(checked) => {
            form.setValue("allergies", {
              types: [],
              others: [],
              hasAllergy: checked,
            });
          }}
        />

        {form.watch("allergies.hasAllergy") && (
          <div className="ml-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {allergyTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.watch("allergies.types").includes(type)}
                    onCheckedChange={(checked) => {
                      const current = form.watch("allergies.types");
                      const updated = checked
                        ? [...current, type]
                        : current.filter(t => t !== type);
                      form.setValue("allergies.types", updated);
                    }}
                  />
                  <label className="text-sm">{type}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        <SwitchField
          label="喫煙"
          required
          checked={form.watch("smoking.enabled")}
          onCheckedChange={(checked) => {
            form.setValue("smoking", {
              enabled: checked,
              types: [],
              others: [],
            });
          }}
        />

        {form.watch("smoking.enabled") && (
          <div className="ml-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {smokingTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.watch("smoking.types").includes(type)}
                    onCheckedChange={(checked) => {
                      const current = form.watch("smoking.types");
                      const updated = checked
                        ? [...current, type]
                        : current.filter(t => t !== type);
                      form.setValue("smoking.types", updated);
                    }}
                  />
                  <label className="text-sm">{type}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 15. SNSアカウント */}
        <SwitchField
          label="SNSアカウント"
          required
          checked={form.watch("hasSnsAccount")}
          onCheckedChange={(checked) => form.setValue("hasSnsAccount", checked)}
        />

        {form.watch("hasSnsAccount") && (
          <div className="ml-4 space-y-4">
            <FormField label="SNSアカウントのURL">
              <div className="flex flex-wrap gap-2">
                {form.watch("snsUrls").map((url, index) => (
                  <Badge key={index} variant="secondary">
                    {url}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0"
                      onClick={() => {
                        const current = form.watch("snsUrls");
                        form.setValue("snsUrls", current.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="SNSのURLを入力"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const url = e.currentTarget.value.trim();
                      if (url) {
                        const current = form.watch("snsUrls");
                        form.setValue("snsUrls", [...current, url]);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
            </FormField>
          </div>
        )}

        {/* 16-17. 在籍店舗と写メ日記URL */}
        <FormField label="現在在籍中の店舗">
          <div className="space-y-4">
            {form.watch("currentStores").map((store, index) => (
              <div key={index} className="grid gap-4 p-4 border rounded-lg">
                <Input
                  placeholder="店舗名"
                  value={store.storeName}
                  onChange={(e) => {
                    const current = form.watch("currentStores");
                    current[index].storeName = e.target.value;
                    form.setValue("currentStores", [...current]);
                  }}
                />
                <Input
                  placeholder="源氏名"
                  value={store.stageName}
                  onChange={(e) => {
                    const current = form.watch("currentStores");
                    current[index].stageName = e.target.value;
                    form.setValue("currentStores", [...current]);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = form.watch("currentStores");
                    form.setValue("currentStores", current.filter((_, i) => i !== index));
                  }}
                >
                  削除
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const current = form.watch("currentStores");
                form.setValue("currentStores", [...current, { storeName: '', stageName: '' }]);
              }}
            >
              店舗を追加
            </Button>
          </div>
        </FormField>

        <FormField label="写メ日記URL">
          <div className="flex flex-wrap gap-2">
            {form.watch("photoDiaryUrls").map((url, index) => (
              <Badge key={index} variant="secondary">
                {url}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => {
                    const current = form.watch("photoDiaryUrls");
                    form.setValue("photoDiaryUrls", current.filter((_, i) => i !== index));
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="写メ日記のURLを入力"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const url = e.currentTarget.value.trim();
                  if (url) {
                    const current = form.watch("photoDiaryUrls");
                    form.setValue("photoDiaryUrls", [...current, url]);
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
          </div>
        </FormField>

        {/* 18-19. 自己PRとその他備考 */}
        <FormField label="自己PR">
          <textarea
            className="w-full h-32 p-2 border rounded-md"
            placeholder="自己PRを入力してください（1000文字以内）"
            {...form.register("selfIntroduction")}
          />
        </FormField>

        <FormField label="その他備考">
          <textarea
            className="w-full h-24 p-2 border rounded-md"
            placeholder="その他の要望がありましたらご記入ください"
            {...form.register("notes")}
          />
        </FormField>

        <Button
          type="submit"
          className="w-full"
          disabled={!form.formState.isValid || isPending}
        >
          {isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          プロフィールを作成
        </Button>
      </form>
    </Form>
  );
};