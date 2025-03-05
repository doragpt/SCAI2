import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, X } from "lucide-react";
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
import {
  allergyTypes,
  smokingTypes,
  cupSizes,
  faceVisibilityTypes,
  commonNgOptions,
  idTypes,
  prefectures,
  estheOptions,
  photoTags,
  type TalentProfileData,
  type Photo,
  talentProfileSchema,
} from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QUERY_KEYS } from "@/lib/queryClient";
import { ProfileConfirmationModal } from "./profile-confirmation-modal";

// PhotoUpload component
const PhotoUpload = ({
  photos,
  onChange,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}) => {
  return (
    <div className="space-y-4">
      {photos.map((photo, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="aspect-[3/4] w-32 bg-muted rounded-lg overflow-hidden">
            <img
              src={photo.url}
              alt={`プロフィール写真 ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <Select
              value={photo.tag}
              onValueChange={(tag) => {
                const updatedPhotos = [...photos];
                updatedPhotos[index] = { ...photo, tag: tag as typeof photoTags[number] };
                onChange(updatedPhotos);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="タグを選択してください（必須）" />
              </SelectTrigger>
              <SelectContent>
                {photoTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              const updatedPhotos = photos.filter((_, i) => i !== index);
              onChange(updatedPhotos);
            }}
          >
            削除
          </Button>
        </div>
      ))}
      {photos.length < 20 && (
        <Input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                onChange([
                  ...photos,
                  {
                    url: reader.result as string,
                    tag: "現在の髪色", // デフォルトで「現在の髪色」を選択
                  },
                ]);
              };
              reader.readAsDataURL(file);
            }
          }}
        />
      )}
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>※最大20枚までアップロード可能です。</p>
        <p>※現在の髪色の写真は必須です。</p>
        <p>※傷、タトゥー、アトピーがある場合は、該当部位の写真を必ずアップロードしタグ付けしてください。</p>
      </div>
    </div>
  );
};

export function TalentForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [formData, setFormData] = useState<TalentProfileData | null>(null);
  const [otherIds, setOtherIds] = useState<string[]>([]);
  const [otherNgOptions, setOtherNgOptions] = useState<string[]>([]);
  const [otherAllergies, setOtherAllergies] = useState<string[]>([]);
  const [otherSmokingTypes, setOtherSmokingTypes] = useState<string[]>([]);
  const [isEstheOpen, setIsEstheOpen] = useState(false);
  const [bodyMarkDetails, setBodyMarkDetails] = useState("");


  // プロフィールデータの取得
  const { data: existingProfile, isLoading } = useQuery<TalentProfileData>({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
  });

  const form = useForm<TalentProfileData>({
    resolver: zodResolver(talentProfileSchema),
    mode: "onChange",
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
      photos: [], // デフォルト値を空配列に設定
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

  // 既存のプロフィールデータが取得された時にフォームを更新
  useEffect(() => {
    if (existingProfile) {
      form.reset({
        ...existingProfile,
        photos: existingProfile.photos || [], // 既存のphotosがない場合は空配列を設定
      });
      setOtherIds(existingProfile.availableIds.others || []);
      setOtherNgOptions(existingProfile.ngOptions.others || []);
      setOtherAllergies(existingProfile.allergies.others || []);
      setOtherSmokingTypes(existingProfile.smoking.others || []);
      setIsEstheOpen(existingProfile.hasEstheExperience || false);
      setBodyMarkDetails(existingProfile.bodyMark?.details || "");

    }
  }, [existingProfile, form]);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: TalentProfileData) => {
      try {
        const processedData = {
          ...data,
          height: Number(data.height),
          weight: Number(data.weight),
          bust: data.bust === "" || data.bust === undefined ? null : Number(data.bust),
          waist: data.waist === "" || data.waist === undefined ? null : Number(data.waist),
          hip: data.hip === "" || data.hip === undefined ? null : Number(data.hip),
          availableIds: {
            types: data.availableIds.types,
            others: otherIds,
          },
          ngOptions: {
            common: data.ngOptions.common,
            others: otherNgOptions,
          },
          allergies: {
            types: data.allergies.types,
            others: otherAllergies,
            hasAllergy: data.allergies.hasAllergy,
          },
          smoking: {
            enabled: data.smoking.enabled,
            types: data.smoking.types,
            others: otherSmokingTypes,
          },
          photos: form.getValues("photos"),
          bodyMark: {
            hasBodyMark: data.bodyMark.hasBodyMark,
            details: bodyMarkDetails
          }
        };

        const response = await apiRequest(
          existingProfile ? "PUT" : "POST",
          "/api/talent/profile",
          processedData
        );

        if (!response.ok) {
          throw new Error("プロフィールの更新に失敗しました");
        }

        return await response.json();
      } catch (error) {
        console.error("API error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
      toast({
        title: existingProfile ? "プロフィールを更新しました" : "プロフィールを作成しました",
        description: "プロフィールの保存が完了しました。",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラーが発生しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // フォーム送信前の確認
  const handleSubmit = async (data: TalentProfileData) => {
    setFormData(data);
    setIsConfirmationOpen(true);
  };

  // 確認後の送信処理
  const handleConfirm = async () => {
    if (!formData) return;

    try {
      await updateProfile(formData);
      setIsConfirmationOpen(false);
    } catch (error) {
      console.error("送信エラー:", error);
    }
  };

  // Store management functions
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
    form.setValue("previousStores", [...previousStores, { storeName: "", stageName: "" }]);
  };

  const handleUpdatePreviousStore = (index: number, field: "storeName" | "stageName", value: string) => {
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

  const handleAddSnsUrl = () => {
    const snsUrls = form.getValues("snsUrls") || [];
    form.setValue("snsUrls", [...snsUrls, ""]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {existingProfile ? "プロフィール編集" : "プロフィール作成"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {existingProfile
                ? "プロフィール情報を編集できます"
                : "安全に働くための詳細情報を登録してください"}
            </p>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/talent/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-32">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* 1. 基本情報 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">基本情報</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="姓" required>
                        <FormControl>
                          <Input {...field} placeholder="姓を入力してください" />
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="名" required>
                        <FormControl>
                          <Input {...field} placeholder="名を入力してください" />
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastNameKana"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="姓（カナ）" required>
                        <FormControl>
                          <Input {...field} placeholder="セイを入力してください" />
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstNameKana"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="名（カナ）" required>
                        <FormControl>
                          <Input {...field} placeholder="メイを入力してください" />
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 2. 住所情報 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">住所情報</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="在住地" required>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
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
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nearestStation"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="最寄り駅" required>
                        <FormControl>
                          <Input {...field} placeholder="最寄り駅を入力してください" />
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 3. 身分証明書 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">身分証明書</h3>
              <FormFieldWrapper label="持参可能な身分証明書" required>
                <div className="grid grid-cols-2 gap-4">
                  {idTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        checked={form.watch("availableIds.types").includes(type)}
                        onCheckedChange={(checked) => {
                          const current = form.watch("availableIds.types") || [];
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
              </FormFieldWrapper>

              {/* 本籍地記載の住民票の用意可否を追加 */}
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="canProvideResidenceRecord"
                  render={({ field }) => (
                    <FormItem>
                      <SwitchField
                        label="本籍地記載の住民票"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        description="本籍地記載の住民票の用意が可能かどうか"
                        valueLabels={{ checked: "用意可能", unchecked: "用意不可" }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 4. 身体的特徴 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">身体的特徴</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="身長 (cm)" required>
                        <FormControl>
                          <Input type="number" {...field} min={130} max={190} />
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="体重 (kg)" required>
                        <FormControl>
                          <Input type="number" {...field} min={30} max={150} />
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cupSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="カップサイズ" required>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
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
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bust"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="バスト (cm) (任意)">
                        <FormControl>
                          <Input type="text" {...field} placeholder="未入力可" />
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="waist"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="ウエスト (cm) (任意)">
                        <FormControl>
                          <Input type="text" {...field} placeholder="未入力可" />
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hip"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldWrapper label="ヒップ (cm) (任意)">
                        <FormControl>
                          <Input type="text" {...field} placeholder="未入力可" />
                        </FormControl>
                      </FormFieldWrapper>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 5. 顔出し */}
            <div>
              <h3 className="text-lg font-semibold mb-4">顔出し</h3>
              <FormField
                control={form.control}
                name="faceVisibility"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldWrapper label="パネルの顔出し" required>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
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
                      </FormControl>
                    </FormFieldWrapper>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 6. 写メ日記の投稿可否 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">写メ日記の投稿可否</h3>
              <FormField
                control={form.control}
                name="canPhotoDiary"
                render={({ field }) => (
                  <FormItem>
                    <SwitchField
                      label="写メ日記の投稿"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      valueLabels={{ checked: "可能", unchecked: "不可" }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 7. 自宅派遣可否 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">自宅派遣可否</h3>
              <FormField
                control={form.control}
                name="canHomeDelivery"
                render={({ field }) => (
                  <FormItem>
                    <SwitchField
                      label="自宅派遣"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      valueLabels={{ checked: "可能", unchecked: "不可" }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 8. NGオプション */}
            <div>
              <h3 className="text-lg font-semibold mb-4">NGオプション</h3>
              <FormFieldWrapper label="NGオプション">
                <div className="grid grid-cols-2 gap-4">
                  {commonNgOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        checked={form.watch("ngOptions.common").includes(option)}
                        onCheckedChange={(checked) => {
                          const current = form.watch("ngOptions.common") || [];
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
              </FormFieldWrapper>
            </div>

            {/* 9. エステオプション */}
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
                            const current = form.watch("estheOptions.available") || [];
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

                  <FormField
                    control={form.control}
                    name="hasEstheExperience"
                    render={({ field }) => (
                      <FormItem>
                        <div className="mt-4">
                          <SwitchField
                            label="エステ経験"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          {field.value && (
                            <div className="mt-2">
                              <FormField
                                control={form.control}
                                name="estheExperiencePeriod"
                                render={({ field: innerField }) => (
                                  <Input
                                    placeholder="経験期間を入力（例：2年）"
                                    {...innerField}
                                  />
                                )}
                              />
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* 10. アレルギー */}
            <div>
              <h3 className="text-lg font-semibold mb-4">アレルギー</h3>
              <FormField
                control={form.control}
                name="allergies.hasAllergy"
                render={({ field }) => (
                  <FormItem>
                    <SwitchField
                      label="アレルギーの有無"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("allergies.hasAllergy") && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {allergyTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.watch("allergies.types").includes(type)}
                          onCheckedChange={(checked) => {
                            const current = form.watch("allergies.types") || [];
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
                  <div className="mt-4">
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
                            if (value && !otherAllergies.includes(value)) {
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

            {/* 11. 喫煙 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">喫煙</h3>
              <FormField
                control={form.control}
                name="smoking.enabled"
                render={({ field }) => (
                  <FormItem>
                    <SwitchField
                      label="喫煙の有無"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("smoking.enabled") && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {smokingTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.watch("smoking.types").includes(type)}
                          onCheckedChange={(checked) => {
                            const current = form.watch("smoking.types") || [];
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
                  <div className="mt-4">
                    <Label>その他の喫煙に関する情報</Label>
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
                        placeholder="その他の喫煙情報を入力"
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
                </div>
              )}
            </div>

            {/* 12. SNSアカウント */}
            <FormField
              control={form.control}
              name="hasSnsAccount"
              render={({ field }) => (
                <FormItem>
                  <>
                    {field.value && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">SNSアカウント</h3>
                        <div className="space-y-4">
                          {form.watch("snsUrls").map((url, index) => (
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
                    )}
                  </>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 13. プロフィール写真 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">プロフィール写真</h3>
              <FormField
                control={form.control}
                name="photos"
                render={({ field }) => (
                  <FormItem>
                    <PhotoUpload
                      photos={field.value || []}
                      onChange={(photos) => {
                        field.onChange(photos);
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 14. 自己紹介 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">自己紹介</h3>
              <FormField
                control={form.control}
                name="selfIntroduction"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldWrapper label="自己紹介文">
                      <FormControl>
                        <textarea
                          {...field}
                          className="w-full h-32 p-2 border rounded-md"
                          placeholder="自己紹介文を入力してください"
                        />
                      </FormControl>
                    </FormFieldWrapper>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 15. 備考 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">備考</h3>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldWrapper label="その他の備考">
                      <FormControl>
                        <textarea
                          {...field}
                          className="w-full h-32 p-2 border rounded-md"
                          placeholder="その他の備考を入力してください"
                        />
                      </FormControl>
                    </FormFieldWrapper>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 新しいセクション: 傷・タトゥー・アトピー */}
            <div>
              <h3 className="text-lg font-semibold mb-4">傷・タトゥー・アトピー</h3>
              <FormField
                control={form.control}
                name="bodyMark.hasBodyMark"
                render={({ field }) => (
                  <FormItem>
                    <SwitchField
                      label="傷・タトゥー・アトピーの有無"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("bodyMark.hasBodyMark") && (
                <div className="mt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="bodyMark.details"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <textarea
                            {...field}
                            className="w-full h-32 p-2 border rounded-md"
                            placeholder="詳細を入力してください"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground mt-2">
                          ※傷、タトゥー、アトピーなどがある場合、必ずその部位の写真をアップロードしタグ付けしてください。
                        </p>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>


            {/* 送信ボタン */}
            <div className="sticky bottom-0 bg-background border-t p-4 -mx-4">
              <div className="container mx-auto flex justify-end">
                <Button type="submit" disabled={isPending || !form.formState.isValid}>
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
        onConfirm={handleConfirm}
        formData={formData}
        isPending={isPending}
      />
    </div>
  );
}