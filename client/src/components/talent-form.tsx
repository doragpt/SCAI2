import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, X, ChevronDown, Camera } from "lucide-react";
import { Link } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, QUERY_KEYS } from "@/lib/queryClient";
import { ProfileConfirmationModal } from "./profile-confirmation-modal";
import {
  allergyTypes,
  smokingTypes,
  cupSizes,
  faceVisibilityTypes,
  commonNgOptions,
  idTypes as availableIdTypes,
  prefectures,
  estheOptions,
  photoTags,
  type TalentProfileData,
  type Photo,
  talentProfileSchema,
} from "@shared/schema";

// Store type definitions
type CurrentStore = {
  storeName: string;
  stageName: string;
};

type PreviousStore = {
  storeName: string;
  photoDiaryUrls: string[];
};

// FormFieldWrapperコンポーネント
const FormFieldWrapper = ({
  label,
  required = false,
  children,
  description,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  description?: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Label>{label}</Label>
      {required && <span className="text-destructive">*</span>}
    </div>
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
    <div className="mt-1.5">{children}</div>
  </div>
);

// メインのTalentFormコンポーネント
export function TalentForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [otherIds, setOtherIds] = useState<string[]>([]);
  const [otherNgOptions, setOtherNgOptions] = useState<string[]>([]);
  const [otherAllergies, setOtherAllergies] = useState<string[]>([]);
  const [otherSmokingTypes, setOtherSmokingTypes] = useState<string[]>([]);
  const [isEstheOpen, setIsEstheOpen] = useState(false);
  const [bodyMarkDetails, setBodyMarkDetails] = useState("");
  const [newPhotoDiaryUrl, setNewPhotoDiaryUrl] = useState("");

  const form = useForm<TalentProfileData>({
    resolver: zodResolver(talentProfileSchema),
    defaultValues: {
      lastName: "",
      firstName: "",
      lastNameKana: "",
      firstNameKana: "",
      location: "東京都",
      nearestStation: "",
      availableIds: {
        types: [],
        others: [],
      },
      canProvideResidenceRecord: false,
      height: 150,
      weight: 45,
      cupSize: "D",
      bust: null,
      waist: null,
      hip: null,
      faceVisibility: "全隠し",
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
      photos: [],
      selfIntroduction: "",
      notes: "",
      estheOptions: {
        available: [],
        ngOptions: [],
      },
      hasEstheExperience: false,
      estheExperiencePeriod: "",
      bodyMark: {
        hasBodyMark: false,
        details: "",
      },
    },
  });

  // 身分証明書関連のハンドラー
  const handleAddOtherId = (value: string) => {
    if (!value || otherIds.includes(value)) return;
    const updatedIds = [...otherIds, value];
    setOtherIds(updatedIds);
    form.setValue("availableIds.others", updatedIds);
  };

  const handleRemoveOtherId = (idToRemove: string) => {
    const updatedIds = otherIds.filter((id) => id !== idToRemove);
    setOtherIds(updatedIds);
    form.setValue("availableIds.others", updatedIds);
  };

  // 写メ日記URL関連のハンドラー
  const handleAddPhotoDiaryUrl = () => {
    if (!newPhotoDiaryUrl) return;
    const currentUrls = form.getValues("photoDiaryUrls") || [];
    form.setValue("photoDiaryUrls", [...currentUrls, newPhotoDiaryUrl]);
    setNewPhotoDiaryUrl("");
  };

  const handleRemovePhotoDiaryUrl = (index: number) => {
    const currentUrls = form.getValues("photoDiaryUrls") || [];
    form.setValue("photoDiaryUrls", currentUrls.filter((_, i) => i !== index));
  };

  // 店舗情報関連のハンドラー
  const handleAddCurrentStore = () => {
    const currentStores = form.getValues("currentStores") || [];
    form.setValue("currentStores", [...currentStores, { storeName: "", stageName: "" }]);
  };

  const handleUpdateCurrentStore = (index: number, field: "storeName" | "stageName", value: string) => {
    const currentStores = form.getValues("currentStores");
    if (currentStores && currentStores[index]) {
      const updated = [...currentStores];
      updated[index] = { ...updated[index], [field]: value };
      form.setValue("currentStores", updated);
    }
  };

  const handleRemoveCurrentStore = (index: number) => {
    const currentStores = form.getValues("currentStores");
    if (currentStores) {
      const updated = currentStores.filter((_, i) => i !== index);
      form.setValue("currentStores", updated);
    }
  };

  const handleAddPreviousStore = () => {
    const previousStores = form.getValues("previousStores") || [];
    form.setValue("previousStores", [...previousStores, { storeName: "", photoDiaryUrls: [] }]);
  };

  const handleUpdatePreviousStore = (index: number, field: "storeName", value: string) => {
    const previousStores = form.getValues("previousStores");
    if (previousStores && previousStores[index]) {
      const updated = [...previousStores];
      updated[index] = { ...updated[index], [field]: value };
      form.setValue("previousStores", updated);
    }
  };

  const handleRemovePreviousStore = (index: number) => {
    const previousStores = form.getValues("previousStores");
    if (previousStores) {
      const updated = previousStores.filter((_, i) => i !== index);
      form.setValue("previousStores", updated);
    }
  };

  // SNS関連のハンドラー
  const handleAddSnsUrl = () => {
    const snsUrls = form.getValues("snsUrls") || [];
    form.setValue("snsUrls", [...snsUrls, ""]);
  };

  const handleUpdateSnsUrl = (index: number, value: string) => {
    const snsUrls = form.getValues("snsUrls") || [];
    const updatedUrls = [...snsUrls];
    updatedUrls[index] = value;
    form.setValue("snsUrls", updatedUrls);
  };

  const handleRemoveSnsUrl = (index: number) => {
    const snsUrls = form.getValues("snsUrls") || [];
    const updatedUrls = snsUrls.filter((_, i) => i !== index);
    form.setValue("snsUrls", updatedUrls);
  };

  const handleSubmit = async (values: TalentProfileData) => {
    setIsPending(true);
    try {
      // Handle form submission
      setIsConfirmationOpen(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "エラーが発生しました",
        description: "フォームの送信に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* 身分証明書セクション */}
            <div>
              <h3 className="text-lg font-semibold mb-4">身分証明書</h3>
              <FormFieldWrapper label="持参可能な身分証明書" required>
                <div className="space-y-4">
                  {/* 既存の身分証明書チェックボックス */}
                  <div className="grid grid-cols-2 gap-4">
                    {availableIdTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`id-${type}`}
                          checked={form.watch("availableIds.types").includes(type)}
                          onCheckedChange={(checked) => {
                            const current = form.watch("availableIds.types") || [];
                            const updated = checked
                              ? [...current, type]
                              : current.filter((t) => t !== type);
                            form.setValue("availableIds.types", updated);
                          }}
                        />
                        <Label htmlFor={`id-${type}`} className="text-sm">{type}</Label>
                      </div>
                    ))}
                  </div>

                  {/* その他の身分証明書 */}
                  <div className="space-y-2">
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
                            onClick={() => handleRemoveOtherId(id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="その他の身分証明書を入力"
                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") {
                            handleAddOtherId(e.currentTarget.value.trim());
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enterキーで追加できます
                    </p>
                  </div>
                </div>
              </FormFieldWrapper>
            </div>

            {/* 本籍地記載の住民票 */}
            <FormField
              control={form.control}
              name="canProvideResidenceRecord"
              render={({ field }) => (
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label>本籍地記載の住民票の提出 可否</Label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span className={field.value ? "text-primary" : "text-muted-foreground"}>
                      {field.value ? "可能" : "不可"}
                    </span>
                  </div>
                </div>
              )}
            />

            {/* 現在の勤務先 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">現在の勤務先</h3>
              <div className="space-y-4">
                {form.watch("currentStores")?.map((store, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="店名"
                      value={store.storeName}
                      onChange={(e) =>
                        handleUpdateCurrentStore(index, "storeName", e.target.value)
                      }
                    />
                    <Input
                      placeholder="源氏名"
                      value={store.stageName}
                      onChange={(e) =>
                        handleUpdateCurrentStore(index, "stageName", e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveCurrentStore(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCurrentStore}
                  className="w-full"
                >
                  勤務先を追加
                </Button>
              </div>
            </div>

            {/* 過去の勤務先 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">過去の勤務先</h3>
              <div className="space-y-6">
                {form.watch("previousStores")?.map((store, index) => (
                  <div key={index} className="space-y-4 border p-4 rounded-lg">
                    <div className="flex gap-2">
                      <Input
                        placeholder="店名"
                        value={store.storeName}
                        onChange={(e) =>
                          handleUpdatePreviousStore(index, "storeName", e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemovePreviousStore(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddPreviousStore}
                  className="w-full"
                >
                  過去の勤務先を追加
                </Button>
              </div>
            </div>

            {/* 写メ日記URL */}
            <div>
              <h3 className="text-lg font-semibold mb-4">写メ日記URL</h3>
              <div className="space-y-4">
                {form.watch("photoDiaryUrls")?.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => {
                        const updatedUrls = [...form.getValues("photoDiaryUrls")];
                        updatedUrls[index] = e.target.value;
                        form.setValue("photoDiaryUrls", updatedUrls);
                      }}
                      placeholder="写メ日記のURLを入力"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemovePhotoDiaryUrl(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="写メ日記のURLを入力"
                    value={newPhotoDiaryUrl}
                    onChange={(e) => setNewPhotoDiaryUrl(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddPhotoDiaryUrl();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddPhotoDiaryUrl}
                    disabled={!newPhotoDiaryUrl}
                  >
                    追加
                  </Button>
                </div>
              </div>
            </div>

            {/* SNSアカウント */}
            <FormField
              control={form.control}
              name="snsUrls"
              render={({ field }) => (
                <FormItem>
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">SNSアカウント</h3>
                      <div className="space-y-4">
                        {form.watch("snsUrls")?.map((url, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder="SNSアカウントのURLを入力"
                              value={url}
                              onChange={(e) => handleUpdateSnsUrl(index, e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveSnsUrl(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddSnsUrl}
                        >
                          SNSアカウントを追加
                        </Button>
                      </div>
                    </div>
                  </>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 送信ボタン */}
            <div className="sticky bottom-0 bg-background border-t p-4 -mx-4">
              <div className="container mx-auto flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    "保存する"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </main>

      <ProfileConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={() => {
          setIsConfirmationOpen(false);
          // Handle confirmation
        }}
        formData={form.getValues()}
        isPending={isPending}
      />
    </div>
  );
}