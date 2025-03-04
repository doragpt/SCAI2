import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, X, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import {
  allergyTypes,
  smokingTypes,
  cupSizes,
  faceVisibilityTypes,
  commonNgOptions,
  idTypes,
  prefectures,
  estheOptions,
  type TalentProfileData,
  talentProfileSchema,
} from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// FormField wrapper component
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

// SwitchField component
const SwitchField: React.FC<{
  label: string;
  required?: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
  valueLabels?: { checked: string; unchecked: string };
}> = ({
  label,
  required = false,
  checked,
  onCheckedChange,
  description,
  valueLabels = { checked: "有り", unchecked: "無し" },
}) => (
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
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      <span className={checked ? "text-primary" : "text-muted-foreground"}>
        {checked ? valueLabels.checked : valueLabels.unchecked}
      </span>
    </div>
  </div>
);

// FormErrorMessage component
const FormErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <p className="text-sm text-destructive mt-1">{message}</p>
);

export const TalentForm: React.FC = () => {
  const { toast } = useToast();
  const [otherIds, setOtherIds] = useState<string[]>([]);
  const [otherNgOptions, setOtherNgOptions] = useState<string[]>([]);
  const [otherAllergies, setOtherAllergies] = useState<string[]>([]);
  const [otherSmokingTypes, setOtherSmokingTypes] = useState<string[]>([]);
  const [isEstheOpen, setIsEstheOpen] = useState(false);
  const [, setLocation] = useLocation();

  const defaultValues: TalentProfileData = {
    lastName: "",
    firstName: "",
    lastNameKana: "",
    firstNameKana: "",
    location: undefined,
    nearestStation: "",
    availableIds: {
      types: [],
      others: [],
    },
    canProvideResidenceRecord: false,
    height: 150,
    weight: 45,
    cupSize: undefined,
    bust: null,
    waist: null,
    hip: null,
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
    previousStores: [],
    photoDiaryUrls: [],
    selfIntroduction: "",
    notes: "",
    estheOptions: {
      available: [],
      ngOptions: [],
    },
    hasEstheExperience: false,
    estheExperiencePeriod: "",
  };

  const form = useForm<TalentProfileData>({
    resolver: zodResolver(talentProfileSchema),
    defaultValues,
    mode: "onChange",
  });

  const { mutate: createProfile } = useMutation({
    mutationFn: async (data: TalentProfileData) => {
      try {
        const processedData = {
          ...data,
          bust: data.bust === "" || data.bust === undefined ? null : Number(data.bust),
          waist: data.waist === "" || data.waist === undefined ? null : Number(data.waist),
          hip: data.hip === "" || data.hip === undefined ? null : Number(data.hip),
          ngOptions: {
            common: data.ngOptions?.common ?? [],
            others: data.ngOptions?.others ?? [],
          },
          allergies: {
            types: data.allergies?.types ?? [],
            others: data.allergies?.others ?? [],
            hasAllergy: data.allergies?.hasAllergy ?? false,
          },
          smoking: {
            enabled: data.smoking?.enabled ?? false,
            types: data.smoking?.types ?? [],
            others: data.smoking?.others ?? [],
          },
          snsUrls: data.snsUrls ?? [],
          currentStores: data.currentStores ?? [],
          previousStores: data.previousStores ?? [],
          photoDiaryUrls: data.photoDiaryUrls ?? [],
          estheOptions: {
            available: data.estheOptions?.available ?? [],
            ngOptions: data.estheOptions?.ngOptions ?? [],
          },
        };

        const response = await apiRequest("POST", "/api/talent/profile", processedData);
        const responseData = await response.json();

        if (response.status === 303) {
          toast({
            title: "プロフィール情報",
            description: responseData.message,
          });
          setLocation(responseData.redirect);
          return;
        }

        if (!response.ok) {
          throw new Error(responseData.message || "プロフィールの作成に失敗しました");
        }

        return responseData;
      } catch (error) {
        console.error("API通信エラー:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "プロフィールが作成されました",
        description: "プロフィールの作成が完了しました。",
      });
      setLocation("/talent/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "エラーが発生しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: TalentProfileData) => {
    if (!form.formState.isValid) {
      toast({
        title: "入力エラー",
        description: "必須項目を入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      await createProfile(data);
    } catch (error) {
      console.error("送信エラー:", error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/talent/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">ダッシュボードに戻る</span>
          </div>
          <h1 className="text-xl font-bold">プロフィール編集</h1>
          <div className="w-10" /> {/* スペーサー */}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 pt-24 pb-32">
        <Form {...form}>
          <form id="profileForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 店舗情報のセクション */}
            <div>
              <h3 className="text-lg font-semibold mb-4">在籍店舗情報</h3>
              <div className="space-y-4">
                {/* 現在の在籍店舗 */}
                <FormField label="現在在籍中の店舗">
                  <div className="space-y-4">
                    {form.watch("currentStores").map((store, index) => (
                      <div key={index} className="grid gap-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="店舗名"
                            value={store.storeName || ""}
                            onChange={(e) => {
                              const current = form.watch("currentStores");
                              current[index] = {
                                ...current[index],
                                storeName: e.target.value
                              };
                              form.setValue("currentStores", [...current]);
                            }}
                          />
                          <Input
                            placeholder="源氏名"
                            value={store.stageName || ""}
                            onChange={(e) => {
                              const current = form.watch("currentStores");
                              current[index] = {
                                ...current[index],
                                stageName: e.target.value
                              };
                              form.setValue("currentStores", [...current]);
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.watch("currentStores");
                            form.setValue(
                              "currentStores",
                              current.filter((_, i) => i !== index)
                            );
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
                        const current = form.watch("currentStores") || [];
                        form.setValue("currentStores", [
                          ...current,
                          { storeName: "", stageName: "" }
                        ]);
                      }}
                    >
                      店舗を追加
                    </Button>
                  </div>
                </FormField>

                {/* 写メ日記URL - 現在在籍中の店舗の直後に配置 */}
                <FormField label="写メ日記が確認できる店舗URL">
                  <div className="space-y-4">
                    {form.watch("photoDiaryUrls").map((url, index) => (
                      <div key={index} className="grid gap-4 p-4 border rounded-lg">
                        <Input 
                          placeholder="店舗の写メ日記URLを入力"
                          value={url} 
                          onChange={(e) => {
                            const current = form.watch("photoDiaryUrls");
                            current[index] = e.target.value;
                            form.setValue("photoDiaryUrls", [...current]);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.watch("photoDiaryUrls");
                            form.setValue(
                              "photoDiaryUrls",
                              current.filter((_, i) => i !== index)
                            );
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
                        const current = form.watch("photoDiaryUrls") || [];
                        form.setValue("photoDiaryUrls", [...current, ""]);
                      }}
                    >
                      URLを追加
                    </Button>
                  </div>
                </FormField>

                {/* 過去経験店舗 */}
                <FormField label="過去経験店舗">
                  <div className="space-y-4">
                    {form.watch("previousStores").map((store, index) => (
                      <div key={index} className="grid gap-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="店舗名"
                            value={store.storeName || ""}
                            onChange={(e) => {
                              const current = form.watch("previousStores");
                              current[index] = {
                                ...current[index],
                                storeName: e.target.value
                              };
                              form.setValue("previousStores", [...current]);
                            }}
                          />
                          <Input
                            placeholder="源氏名"
                            value={store.stageName || ""}
                            onChange={(e) => {
                              const current = form.watch("previousStores");
                              current[index] = {
                                ...current[index],
                                stageName: e.target.value
                              };
                              form.setValue("previousStores", [...current]);
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.watch("previousStores");
                            form.setValue(
                              "previousStores",
                              current.filter((_, i) => i !== index)
                            );
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
                        const current = form.watch("previousStores") || [];
                        form.setValue("previousStores", [
                          ...current,
                          { storeName: "", stageName: "" }
                        ]);
                      }}
                    >
                      店舗を追加
                    </Button>
                  </div>
                </FormField>
              </div>
            </div>

            {/* 身分証明書 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">身分証明書</h3>
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
                            : current.filter((t) => t !== type);
                          form.setValue("availableIds.types", updated);
                        }}
                      />
                      <label className="text-sm">{type}</label>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Label>その他の身分証明書</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {otherIds.map((id) => (
                      <Badge key={id} variant="secondary">
                        {id}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-4 w-4 p-0"
                          onClick={() => {
                            setOtherIds(otherIds.filter((i) => i !== id));
                            form.setValue(
                              "availableIds.others",
                              otherIds.filter((i) => i !== id)
                            );
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="その他の身分証明書を入力"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const value = e.currentTarget.value.trim();
                          if (value && !otherIds.includes(value)) {
                            const newIds = [...otherIds, value];
                            setOtherIds(newIds);
                            form.setValue("availableIds.others", newIds);
                            e.currentTarget.value = "";
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </FormField>
            </div>

            {/* 基本情報セクション */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">基本情報</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField label="姓" required>
                    <Input
                      {...form.register("lastName")}
                      placeholder="姓を入力してください"
                    />
                    {form.formState.errors.lastName && (
                      <FormErrorMessage message={form.formState.errors.lastName.message as string} />
                    )}
                  </FormField>
                  <FormField label="名" required>
                    <Input
                      {...form.register("firstName")}
                      placeholder="名を入力してください"
                    />
                    {form.formState.errors.firstName && (
                      <FormErrorMessage message={form.formState.errors.firstName.message as string} />
                    )}
                  </FormField>
                  <FormField label="姓（カナ）" required>
                    <Input
                      {...form.register("lastNameKana")}
                      placeholder="セイを入力してください"
                    />
                    {form.formState.errors.lastNameKana && (
                      <FormErrorMessage message={form.formState.errors.lastNameKana.message as string} />
                    )}
                  </FormField>
                  <FormField label="名（カナ）" required>
                    <Input
                      {...form.register("firstNameKana")}
                      placeholder="メイを入力してください"
                    />
                    {form.formState.errors.firstNameKana && (
                      <FormErrorMessage message={form.formState.errors.firstNameKana.message as string} />
                    )}
                  </FormField>
                </div>
              </div>

              {/* 住所情報 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">住所情報</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField label="在住地" required>
                    <Select
                      value={form.watch("location")}
                      onValueChange={(value) => form.setValue("location", value, { shouldValidate: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="都道府県を選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {prefectures.map((pref) => (
                          <SelectItem key={pref} value={pref}>
                            {pref}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.location && (
                      <FormErrorMessage message={form.formState.errors.location.message as string} />
                    )}
                  </FormField>
                  <FormField label="最寄り駅" required>
                    <Input
                      {...form.register("nearestStation")}
                      placeholder="最寄り駅を入力してください"
                    />
                    {form.formState.errors.nearestStation && (
                      <FormErrorMessage message={form.formState.errors.nearestStation.message as string} />
                    )}
                  </FormField>
                </div>
              </div>


              {/* 本籍地入りの住民票の用意可否（必須） */}
              <div>
                <h3 className="text-lg font-semibold mb-4">住民票</h3>
                <SwitchField
                  label="本籍地入りの住民票の用意"
                  required
                  checked={form.watch("canProvideResidenceRecord")}
                  onCheckedChange={(checked) =>
                    form.setValue("canProvideResidenceRecord", checked)
                  }
                />
              </div>

              {/* 身体的特徴 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">身体的特徴</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField label="身長 (cm)" required>
                    <Input
                      type="number"
                      {...form.register("height", { valueAsNumber: true })}
                      min={130}
                      max={190}
                    />
                    {form.formState.errors.height && (
                      <FormErrorMessage message={form.formState.errors.height.message as string} />
                    )}
                  </FormField>
                  <FormField label="体重 (kg)" required>
                    <Input
                      type="number"
                      {...form.register("weight", { valueAsNumber: true })}
                      min={30}
                      max={150}
                    />
                    {form.formState.errors.weight && (
                      <FormErrorMessage message={form.formState.errors.weight.message as string} />
                    )}
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
                    {form.formState.errors.cupSize && (
                      <FormErrorMessage message={form.formState.errors.cupSize.message as string} />
                    )}
                  </FormField>
                  <FormField label="バスト (cm) (任意)">
                    <Input
                      type="text"
                      {...form.register("bust", {
                        setValueAs: (value: string) => (value === "" ? null : Number(value)),
                      })}
                      placeholder="未入力可"
                    />
                    {form.formState.errors.bust && (
                      <FormErrorMessage message={form.formState.errors.bust.message as string} />
                    )}
                  </FormField>
                  <FormField label="ウエスト (cm) (任意)">
                    <Input
                      type="text"
                      {...form.register("waist", {
                        setValueAs: (value: string) => (value === "" ? null : Number(value)),
                      })}
                      placeholder="未入力可"
                    />
                    {form.formState.errors.waist && (
                      <FormErrorMessage message={form.formState.errors.waist.message as string} />
                    )}
                  </FormField>
                  <FormField label="ヒップ (cm) (任意)">
                    <Input
                      type="text"
                      {...form.register("hip", {
                        setValueAs: (value: string) => (value === "" ? null : Number(value)),
                      })}
                      placeholder="未入力可"
                    />
                    {form.formState.errors.hip && (
                      <FormErrorMessage message={form.formState.errors.hip.message as string} />
                    )}
                  </FormField>
                </div>
              </div>

              {/* 顔出し */}
              <div>
                <h3 className="text-lg font-semibold mb-4">顔出し</h3>
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
                  {form.formState.errors.faceVisibility && (
                    <FormErrorMessage message={form.formState.errors.faceVisibility.message as string} />
                  )}
                </FormField>
              </div>

              {/* 写メ日記と自宅への派遣 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">その他</h3>
                <SwitchField
                  label="写メ日記の投稿可否"
                  required
                  checked={form.watch("canPhotoDiary")}
                  onCheckedChange={(checked) =>
                    form.setValue("canPhotoDiary", checked, { shouldValidate: true })
                  }
                  valueLabels={{ checked: "可能", unchecked: "不可" }}
                />

                <SwitchField
                  label="自宅への派遣"
                  required
                  checked={form.watch("canHomeDelivery")}
                  onCheckedChange={(checked) =>
                    form.setValue("canHomeDelivery", checked, { shouldValidate: true })
                  }
                  valueLabels={{ checked: "可能", unchecked: "不可" }}
                  description="自宅での接客が可能な場合は「可能」を選択してください"
                />
              </div>

              {/* NGオプション */}
              <div>
                <h3 className="text-lg font-semibold mb-4">NGオプション</h3>
                <FormField label="NGオプション">
                  <div className="grid grid-cols-2 gap-4">
                    {commonNgOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.watch("ngOptions.common").includes(option)}
                          onCheckedChange={(checked) => {
                            const current = form.watch("ngOptions.common");
                            const updated = checked
                              ? [...current, option]
                              : current.filter((o) => o !== option);
                            form.setValue("ngOptions.common", updated);
                          }}
                        />
                        <label className="text-sm">{option}</label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Label>その他のNGオプション</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {otherNgOptions.map((option) => (
                        <Badge key={option} variant="secondary">
                          {option}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0"
                            onClick={() => {
                              setOtherNgOptions(otherNgOptions.filter((o) => o !== option));
                              form.setValue(
                                "ngOptions.others",
                                otherNgOptions.filter((o) => o !== option)
                              );
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="その他のNGオプションを入力"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            const value = e.currentTarget.value.trim();
                            if (value && !otherNgOptions.includes(value)) {
                              const newOptions = [...otherNgOptions, value];
                              setOtherNgOptions(newOptions);
                              form.setValue("ngOptions.others", newOptions);
                              e.currentTarget.value = "";
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </FormField>
              </div>

              {/* エステオプション */}
              <div>
                <h3 className="text-lg font-semibold mb-4">エステオプション</h3>
                <Collapsible
                  open={isEstheOpen}
                  onOpenChange={setIsEstheOpen}
                  className="border rounded-lg p-4"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <span className="font-medium">風俗エステ用可能オプション</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isEstheOpen ? 'transform rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {estheOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            checked={form.watch("estheOptions.available").includes(option)}
                            onCheckedChange={(checked) => {
                              const current = form.watch("estheOptions.available");
                              const updated = checked
                                ? [...current, option]
                                : current.filter((o) => o !== option);
                              form.setValue("estheOptions.available", updated);
                            }}
                          />
                          <label className="text-sm">{option}</label>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <Label>その他NGプレイ</Label>
                      <Input
                        placeholder="その他のNGプレイを入力"
                        value={form.watch("estheOptions.ngOptions").join(", ")}
                        onChange={(e) => {
                          const value = e.target.value;
                          form.setValue(
                            "estheOptions.ngOptions",
                            value ? value.split(",").map((v) => v.trim()) : []
                          );
                        }}
                      />
                    </div>

                    <div className="mt-4">
                      <SwitchField
                        label="エステ経験"
                        checked={form.watch("hasEstheExperience")}
                        onCheckedChange={(checked) => {
                          form.setValue("hasEstheExperience", checked, { shouldValidate: true });
                          if (!checked) {
                            form.setValue("estheExperiencePeriod", undefined);
                          }
                        }}
                      />

                      {form.watch("hasEstheExperience") && (
                        <div className="mt-2">
                          <Input
                            placeholder="経験期間を入力（例：2年）"
                            {...form.register("estheExperiencePeriod")}
                          />
                          {form.formState.errors.estheExperiencePeriod && (
                            <FormErrorMessage message={form.formState.errors.estheExperiencePeriod.message as string} />
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* アレルギーと喫煙 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">アレルギー・喫煙</h3>

                {/* アレルギーサブセクション */}
                <div>
                  <SwitchField
                    label="アレルギー"
                    required
                    checked={form.watch("allergies.hasAllergy")}
                    onCheckedChange={(checked) => {
                      form.setValue("allergies", {
                        types: [],
                        others: [],
                        hasAllergy: checked,
                      }, { shouldValidate: true });
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
                                  : current.filter((t) => t !== type);
                                form.setValue("allergies.types", updated);
                              }}
                            />
                            <label className="text-sm">{type}</label>
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>その他のアレルギー</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {otherAllergies.map((allergy) => (
                            <Badge key={allergy} variant="secondary">
                              {allergy}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="ml-1 h-4 w-4 p-0"
                                onClick={() => {
                                  setOtherAllergies(otherAllergies.filter((a) => a !== allergy));
                                  form.setValue(
                                    "allergies.others",
                                    otherAllergies.filter((a) => a !== allergy)
                                  );
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="その他のアレルギーを入力"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                const value = e.currentTarget.value.trim();
                                if(value && !otherAllergies.includes(value)) {
                                    const newAllergies = [...otherAllergies, value];
                                    setOtherAllergies(newAllergies);
                                    form.setValue("allergies.others", newAllergies);
                                    e.currentTarget.value = "";
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* 喫煙サブセクション */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">喫煙</h3>
                  <SwitchField
                    label="喫煙"
                    required
                    checked={form.watch("smoking.enabled")}
                    onCheckedChange={(checked) => {
                      form.setValue("smoking", {
                        enabled: checked,
                        types: [],
                        others: [],
                      }, { shouldValidate: true });
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
                                  : current.filter((t) => t !== type);
                                form.setValue("smoking.types", updated);
                              }}
                            />
                            <label className="text-sm">{type}</label>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {otherSmokingTypes.map((type) => (
                          <Badge key={type} variant="secondary">
                            {type}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-1 h-4 w-4 p-0"
                              onClick={() => {
                                setOtherSmokingTypes(otherSmokingTypes.filter((t) => t !== type));
                                form.setValue(
                                  "smoking.others",
                                  otherSmokingTypes.filter((t) => t !== type)
                                );
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="その他の喫煙種類を入力"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              const value = e.currentTarget.value.trim();
                              if (value && !otherSmokingTypes.includes(value)) {
                                const newTypes = [...otherSmokingTypes, value];
                                setOtherSmokingTypes(newTypes);
                                form.setValue("smoking.others", newTypes);
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SNSアカウント */}
              <div>
                <h3 className="text-lg font-semibold mb-4">SNSアカウント</h3>
                <SwitchField
                  label="SNSアカウント"
                  required
                  checked={form.watch("hasSnsAccount")}
                  onCheckedChange={(checked) => {
                    form.setValue("hasSnsAccount", checked, { shouldValidate: true });
                    if (!checked) {
                      form.setValue("snsUrls", []);
                    }
                  }}
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
                            if (e.key === "Enter") {
                              const url = e.currentTarget.value.trim();
                              if (url) {
                                const current = form.watch("snsUrls");
                                form.setValue("snsUrls", [...current, url]);
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                      </div>
                    </FormField>
                  </div>
                )}
              </div>

              {/* 勤務先 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">勤務先</h3>
                <FormField label="現在在籍中の店舗">
                  <div className="space-y-4">
                    {form.watch("currentStores").map((store, index) => (
                      <div key={index} className="grid gap-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="店舗名"
                            value={store.storeName || ""}
                            onChange={(e) => {
                              const current = form.watch("currentStores");
                              current[index] = {
                                ...current[index],
                                storeName: e.target.value
                              };
                              form.setValue("currentStores", [...current]);
                            }}
                          />
                          <Input
                            placeholder="源氏名"
                            value={store.stageName || ""}
                            onChange={(e) => {
                              const current = form.watch("currentStores");
                              current[index] = {
                                ...current[index],
                                stageName: e.target.value
                              };
                              form.setValue("currentStores", [...current]);
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.watch("currentStores");
                            form.setValue(
                              "currentStores",
                              current.filter((_, i) => i !== index)
                            );
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
                        const current = form.watch("currentStores") || [];
                        form.setValue("currentStores", [
                          ...current,
                          { storeName: "", stageName: "" }
                        ]);
                      }}
                    >
                      店舗を追加
                    </Button>
                  </div>
                </FormField>

                {/* 写メ日記URL */}
                <FormField label="写メ日記URL">
                  <div className="space-y-4">
                    {form.watch("photoDiaryUrls").map((url, index) => (
                      <div key={index} className="grid gap-4 p-4 border rounded-lg">
                        <Input 
                          value={url} 
                          onChange={(e) => {
                            const current = form.watch("photoDiaryUrls");
                            current[index] = e.target.value;
                            form.setValue("photoDiaryUrls", [...current]);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.watch("photoDiaryUrls");
                            form.setValue(
                              "photoDiaryUrls",
                              current.filter((_, i) => i !== index)
                            );
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
                        const current = form.watch("photoDiaryUrls") || [];
                        form.setValue("photoDiaryUrls", [...current, ""]);
                      }}
                    >
                      URLを追加
                    </Button>
                  </div>
                </FormField>

                {/* 過去経験店舗 */}
                <FormField label="過去経験店舗">
                  <div className="space-y-4">
                    {form.watch("previousStores").map((store, index) => (
                      <div key={index} className="grid gap-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="店舗名"
                            value={store.storeName || ""}
                            onChange={(e) => {
                              const current = form.watch("previousStores");
                              current[index] = {
                                ...current[index],
                                storeName: e.target.value
                              };
                              form.setValue("previousStores", [...current]);
                            }}
                          />
                          <Input
                            placeholder="源氏名"
                            value={store.stageName || ""}
                            onChange={(e) => {
                              const current = form.watch("previousStores");
                              current[index] = {
                                ...current[index],
                                stageName: e.target.value
                              };
                              form.setValue("previousStores", [...current]);
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.watch("previousStores");
                            form.setValue(
                              "previousStores",
                              current.filter((_, i) => i !== index)
                            );
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
                        const current = form.watch("previousStores") || [];
                        form.setValue("previousStores", [
                          ...current,
                          { storeName: "", stageName: "" }
                        ]);
                      }}
                    >
                      店舗を追加
                    </Button>
                  </div>
                </FormField>
              </div>

              {/* 自己PRとその他備考 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">その他</h3>
                <FormField label="自己PR(任意)">
                  <textarea
                    className="w-full h-32 p-2 border rounded-md"
                    placeholder="自己PRを入力してください"
                    {...form.register("selfIntroduction")}
                  />
                  {form.formState.errors.selfIntroduction && (
                    <FormErrorMessage message={form.formState.errors.selfIntroduction.message as string} />
                  )}
                </FormField>

                <FormField label="その他備考(任意)">
                  <textarea
                    className="w-full h-32 p-2 border rounded-md"
                    placeholder="その他の要望がありましたらご記入ください"
                    {...form.register("notes")}
                  />
                  {form.formState.errors.notes && (
                    <FormErrorMessage message={form.formState.errors.notes.message as string} />
                  )}
                </FormField>
              </div>
            </div>
          </form>
        </Form>
      </main>

      {/* フッターナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setLocation("/talent/dashboard")}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              form="profileForm"
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  送信中...
                </>
              ) : (
                "プロフィールを保存"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};