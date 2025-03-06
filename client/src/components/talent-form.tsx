import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, X, ChevronDown, Camera } from "lucide-react";
import { Link, Redirect } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  idTypes,
  prefectures,
  estheOptions,
  photoTags,
  type TalentProfileData,
  type Photo,
  talentProfileSchema,
} from "@shared/schema";
import { calculateAge } from "@/utils/date";
import { useAuth } from "@/hooks/use-auth";

// Store type definitions
type CurrentStore = {
  storeName: string;
  stageName: string;
};

type PreviousStore = {
  storeName: string;
  photoDiaryUrls: string[];
};

const PhotoUploadGuidelines = () => (
  <div className="space-y-4 text-sm">
    <div className="border rounded-lg p-4 bg-muted/5">
      <h4 className="font-semibold mb-2">【写真アップロードに関するご案内】</h4>

      <div className="space-y-4">
        <div>
          <p className="font-medium mb-1">お顔の写真:</p>
          <p>無加工の状態で、正面から撮影したお顔の写真を3枚ご用意ください。</p>
          <p className="text-muted-foreground">※無加工である理由：ご本人の自然な外見を正確に確認するためです。加工やフィルターによって実際の見た目と異なる場合、現地での保証トラブルや受け入れ拒否につながる可能性がございます。</p>
        </div>

        <div>
          <p className="font-medium mb-1">下着／水着姿の写真:</p>
          <p>スタイルが分かるよう、無加工の写真を正面から1枚、横から1枚、計2枚ご用意ください。</p>
          <p className="text-muted-foreground">※無加工である理由：実際の体型やスタイルを正確に判断するため、加工により誤解が生じるリスクを避けるためです。</p>
        </div>

        <div>
          <p className="font-medium mb-1">宣材写真:</p>
          <p>お持ちの場合は、宣材写真も併せてアップロードしてください。</p>
        </div>

        <div>
          <p className="font-medium mb-1">その他の注意点:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>最大20枚までアップロード可能です（1枚あたり2MBまで）</li>
            <li className="text-primary">現在の髪色の写真は必須です</li>
            <li>傷、タトゥー、アトピーがある場合は、該当部分が分かる写真も必ず添付してください</li>
          </ul>
        </div>

        <p className="text-destructive">
          ご注意：写真と実際の外見との大きな差異は、保証トラブルや現地での受け入れ拒否の原因となりますので、正確な状態の写真をご提供いただけますようご協力をお願いいたします。
        </p>
      </div>
    </div>
  </div>
);

const PhotoUpload = ({
  photos,
  onChange,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedTag, setSelectedTag] = useState<typeof photoTags[number]>("スタジオ写真");
  const [showBulkTagging, setShowBulkTagging] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = async (file: File): Promise<string | null> => {
    try {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "エラー",
          description: "ファイルサイズは2MB以下にしてください。",
          variant: "destructive",
        });
        return null;
      }

      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });

      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);

      const base64Size = compressedDataUrl.length * 0.75;
      if (base64Size > 512 * 1024) {
        toast({
          title: "エラー",
          description: "画像サイズを小さくできませんでした。別の画像を試してください。",
          variant: "destructive",
        });
        return null;
      }

      return compressedDataUrl;
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "エラー",
        description: "画像の処理中にエラーが発生しました。",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setSelectedFiles(files);
    const newPhotos: Photo[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const compressedDataUrl = await compressImage(file);

      if (compressedDataUrl) {
        newPhotos.push({
          url: compressedDataUrl,
          tag: selectedTag,
        });
      }
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
      toast({
        title: "アップロード完了",
        description: `${newPhotos.length}枚の写真をアップロードしました。`,
      });
    }
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBulkTagging = (tag: typeof photoTags[number]) => {
    const updatedPhotos = photos.map((photo, index) => {
      if (selectedPhotos.includes(index)) {
        return { ...photo, tag };
      }
      return photo;
    });
    onChange(updatedPhotos);
    setSelectedPhotos([]);
    setShowBulkTagging(false);
    toast({
      title: "タグ付け完了",
      description: `${selectedPhotos.length}枚の写真のタグを更新しました。`,
    });
  };

  const hasHairColorPhoto = photos.some((photo) => photo.tag === "現在の髪色");

  return (
    <div className="space-y-6">
      {/* 写真アップロードのガイドライン */}
      <PhotoUploadGuidelines />

      {/* 写真アップロード前のタグ選択 */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/10">
        <Label>アップロード時のタグ:</Label>
        <Select
          value={selectedTag}
          onValueChange={(value) => setSelectedTag(value as typeof photoTags[number])}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {photoTags.map((tag) => (
              <SelectItem
                key={tag}
                value={tag}
                disabled={tag === "現在の髪色" && hasHairColorPhoto}
              >
                {tag}
                {tag === "現在の髪色" && " (必須)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 一括タグ付けUI */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowBulkTagging(!showBulkTagging);
                setSelectedPhotos([]);
              }}
            >
              {showBulkTagging ? "一括タグ付けをキャンセル" : "一括タグ付け"}
            </Button>
            {showBulkTagging && (
              <>
                <p className="text-sm text-muted-foreground">
                  {selectedPhotos.length}枚選択中
                </p>
                <Select
                  value={selectedTag}
                  onValueChange={(value) => handleBulkTagging(value as typeof photoTags[number])}
                  disabled={selectedPhotos.length === 0}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="タグを選択して一括適用" />
                  </SelectTrigger>
                  <SelectContent>
                    {photoTags.map((tag) => (
                      <SelectItem
                        key={tag}
                        value={tag}
                        disabled={tag === "現在の髪色" && hasHairColorPhoto}
                      >
                        {tag}
                        {tag === "現在の髪色" && " (必須)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      )}

      {/* 写真一覧 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={index}
            className={`relative group ${
              selectedPhotos.includes(index) ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => {
              if (showBulkTagging) {
                setSelectedPhotos((prev) =>
                  prev.includes(index)
                    ? prev.filter((i) => i !== index)
                    : [...prev, index]
                );
              }
            }}
          >
            <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
              <img
                src={photo.url}
                alt={`プロフィール写真 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
              {!showBulkTagging && (
                <Select
                  value={photo.tag}
                  onValueChange={(value) => {
                    const updatedPhotos = [...photos];
                    updatedPhotos[index] = { ...photo, tag: value as typeof photoTags[number] };
                    onChange(updatedPhotos);
                  }}
                >
                  <SelectTrigger className="bg-white/90">
                    <SelectValue placeholder="タグを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {photoTags.map((tag) => (
                      <SelectItem
                        key={tag}
                        value={tag}
                        disabled={tag === "現在の髪色" && hasHairColorPhoto && photo.tag !== "現在の髪色"}
                      >
                        {tag}
                        {tag === "現在の髪色" && " (必須)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!showBulkTagging && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    const updatedPhotos = photos.filter((_, i) => i !== index);
                    onChange(updatedPhotos);
                  }}
                >
                  削除
                </Button>
              )}
            </div>
            <Badge
              className={`absolute top-2 right-2 ${
                photo.tag === "現在の髪色"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/90 text-black"
              }`}
            >
              {photo.tag}
            </Badge>
          </div>
        ))}
      </div>

      {/* 写真アップロード */}
      {photos.length < 20 && (
        <div className="border-2 border-dashed rounded-lg p-6 space-y-4">
          <div className="text-center">
            <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">写真をアップロード</h3>
            <p className="text-xs text-muted-foreground mt-1">
              クリックまたはドラッグ＆ドロップで複数の写真を選択できます
            </p>
          </div>

          <div className="flex justify-center">
            <label htmlFor="photo-upload" className="cursor-pointer">
              <Button type="button" variant="outline" className="relative">
                写真を選択
                <input
                  ref={fileInputRef}
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
              </Button>
            </label>
          </div>
        </div>
      )}

      {/*  The following lines are removed as they are now in PhotoUploadGuidelines */}
      {/* <div className="space-y-2 text-sm text-muted-foreground">
        <p>※最大20枚までアップロード可能です（1枚あたり2MBまで）</p>
        <p className="font-medium text-primary">※現在の髪色の写真は必須です</p>
        <p>※傷、タトゥー、アトピーがある場合は、該当部位の写真を必ずアップロードしタグ付けしてください</p>
      </div> */}
    </div>
  );
};

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

const SwitchField = ({
  label,
  required = false,
  checked,
  onCheckedChange,
  description,
  valueLabels = { checked: "有り", unchecked: "無し" },
}: {
  label: string;
  required?: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
  valueLabels?: { checked: string; unchecked: string };
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


export function TalentForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();

  // デバッグ用のログを追加
  console.log('TalentForm auth user:', user);

  // formの定義を先に移動
  const form = useForm<TalentProfileData>({
    resolver: zodResolver(talentProfileSchema),
    mode: "onChange",
    defaultValues: {
      lastName: "",
      firstName: "",
      lastNameKana: "",
      firstNameKana: "",
      location: "",
      nearestStation: "",
      availableIds: {
        types: [],
        others: [],
      },
      canProvideResidenceRecord: false,
      height: 150,
      weight: 45,
      cupSize: "D",
      bust: "",
      waist: "",
      hip: "",
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

  // プロフィールデータの取得
  const { data: existingProfile, isLoading: isLoadingProfile } = useQuery<TalentProfileData>({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    enabled: !!user,
  });

  // ユーザー基本情報の取得を修正
  const { data: userProfile, isLoading: isUserProfileLoading } = useQuery({
    queryKey: ["/api/user"],
    enabled: !!user,
  });

  // デバッグ用のログを追加
  console.log('TalentForm user profile:', userProfile);

  // 生年月日から年齢を計算
  const age = userProfile?.birthDate
    ? calculateAge(new Date(userProfile.birthDate))
    : null;

  console.log('Calculated age:', age);

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [formData, setFormData] = useState<TalentProfileData | null>(null);
  const [otherIds, setOtherIds] = useState<string[]>([]);
  const [otherNgOptions, setOtherNgOptions] = useState<string[]>([]);
  const [otherAllergies, setOtherAllergies] = useState<string[]>([]);
  const [otherSmokingTypes, setOtherSmokingTypes] = useState<string[]>([]);
  const [isEstheOpen, setIsEstheOpen] = useState(false);
  const [bodyMarkDetails, setBodyMarkDetails] = useState("");
  const [newIdType, setNewIdType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 既存のプロフィールデータが取得された時にフォームを更新
  useEffect(() => {
    if (existingProfile) {
      console.log("Loading existing profile:", existingProfile);
      form.reset({
        ...existingProfile,
        bust: existingProfile.bust?.toString() ?? "",
        waist: existingProfile.waist?.toString() ?? "",
        hip: existingProfile.hip?.toString() ?? "",
        photos: existingProfile.photos || [],
        bodyMark: existingProfile.bodyMark || {
          hasBodyMark: false,
          details: "",
        },
      });

      setOtherIds(existingProfile.availableIds?.others || []);
      setOtherNgOptions(existingProfile.ngOptions?.others || []);
      setOtherAllergies(existingProfile.allergies?.others || []);
      setOtherSmokingTypes(existingProfile.smoking?.others || []);
      setIsEstheOpen(existingProfile.hasEstheExperience || false);
      setBodyMarkDetails(existingProfile.bodyMark?.details || "");
    }
  }, [existingProfile, form]);

  const handleSubmit = async (data: TalentProfileData) => {
    try {
      setIsSubmitting(true);
      const optimizedData = {
        ...data,
        height: Number(data.height),
        weight: Number(data.weight),
        bust: data.bust === "" ? null : Number(data.bust),
        waist: data.waist === "" ? null : Number(data.waist),
        hip: data.hip === "" ? null : Number(data.hip),
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
        bodyMark: {
          hasBodyMark: data.bodyMark.hasBodyMark,
          details: bodyMarkDetails,
        },
        photos: data.photos || [],
      };

      setFormData(optimizedData);
      setIsConfirmationOpen(true);
    } catch (error) {
      console.error("データの準備中にエラーが発生しました:", error);
      toast({
        title: "エラー",
        description: "データの準備中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!formData) return;

    try {
      setIsSubmitting(true);
      const response = await apiRequest(
        existingProfile ? "PUT" : "POST",
        "/api/talent/profile",
        formData
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "プロフィールの更新に失敗しました");
      }

      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });

      toast({
        title: existingProfile ? "プロフィールを更新しました" : "プロフィールを作成しました",
        description: "プロフィールの保存が完了しました。",
      });

      setIsConfirmationOpen(false);
    } catch (error) {
      console.error("送信エラー:", error);
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "プロフィールの更新に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIdType = () => {
    if (!newIdType.trim()) return;
    setOtherIds([...otherIds, newIdType.trim()]);
    setNewIdType("");
  };

  // ローディング中の表示
  if (isAuthLoading || isUserProfileLoading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 未認証時の表示
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">認証が必要です</p>
          <Button asChild>
            <Link href="/auth">ログイン</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleUpdateSnsUrl = (index: number, value: string) => {
    const updatedUrls = [...form.watch("snsUrls") || []];
    updatedUrls[index] = value;
    form.setValue("snsUrls", updatedUrls);
  };

  const handleRemoveSnsUrl = (index: number) => {
    const updatedUrls = [...form.watch("snsUrls") || []].filter((_, i) => i !== index);
    form.setValue("snsUrls", updatedUrls);
  };

  const handleAddSnsUrl = () => {
    form.setValue("snsUrls", [...form.watch("snsUrls") || [], ""]);
  };

  const handleUpdateCurrentStore = (index: number, key: keyof CurrentStore, value: string) => {
    const updatedStores = [...form.watch("currentStores") || []];
    updatedStores[index][key] = value;
    form.setValue("currentStores", updatedStores);
  };

  const handleRemoveCurrentStore = (index: number) => {
    const updatedStores = [...form.watch("currentStores") || []].filter((_, i) => i !== index);
    form.setValue("currentStores", updatedStores);
  };

  const handleAddCurrentStore = () => {
    form.setValue("currentStores", [...form.watch("currentStores") || [], { storeName: "", stageName: "" }]);
  };


  const handleUpdatePreviousStore = (index: number, key: keyof PreviousStore, value: any) => {
    const updatedStores = [...form.watch("previousStores") || []];
    updatedStores[index][key] = value;
    form.setValue("previousStores", updatedStores);
  };

  const handleRemovePreviousStore = (index: number) => {
    const updatedStores = [...form.watch("previousStores") || []].filter((_, i) => i !== index);
    form.setValue("previousStores", updatedStores);
  };

  const handleAddPreviousStore = () => {
    form.setValue("previousStores", [...form.watch("previousStores") || [], { storeName: "", photoDiaryUrls: [] }]);
  };

  const handleAddPhotoDiaryUrl = (storeIndex: number) => {
    const updatedStores = [...form.watch("previousStores") || []];
    updatedStores[storeIndex].photoDiaryUrls = [...updatedStores[storeIndex].photoDiaryUrls, ""];
    form.setValue("previousStores", updatedStores);
  };

  const handleRemovePhotoDiaryUrl = (storeIndex: number, urlIndex: number) => {
    const updatedStores = [...form.watch("previousStores") || []];
    updatedStores[storeIndex].photoDiaryUrls = updatedStores[storeIndex].photoDiaryUrls.filter((_, i) => i !== urlIndex);
    form.setValue("previousStores", updatedStores);
  };

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
            <div>
              <h3 className="text-lg font-semibold mb-4">氏名</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormFieldWrapper label="姓" required>
                      <FormControl>
                        <Input {...field} placeholder="例：中山" />
                      </FormControl>
                    </FormFieldWrapper>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormFieldWrapper label="名" required>
                      <FormControl>
                        <Input {...field} placeholder="例：奈々子" />
                      </FormControl>
                    </FormFieldWrapper>
                  )}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">フリガナ</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lastNameKana"
                  render={({ field }) => (
                    <FormFieldWrapper label="セイ" required>
                      <FormControl>
                        <Input {...field} placeholder="例：ナカヤマ" />
                      </FormControl>
                    </FormFieldWrapper>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstNameKana"
                  render={({ field }) => (
                    <FormFieldWrapper label="メイ" required>
                      <FormControl>
                        <Input {...field} placeholder="例：ナナコ" />
                      </FormControl>
                    </FormFieldWrapper>
                  )}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2 border rounded-lg p-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>生年月日</Label>
                  <p className="text-lg font-medium">
                    {userProfile?.birthDate
                      ? new Date(userProfile.birthDate).toLocaleDateString('ja-JP')
                      : '基本情報から設定してください'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>年齢</Label>
                  <p className="text-lg font-medium">
                    {age ? `${age}歳` : '基本情報から設定してください'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                ※生年月日の設定・修正は基本情報編集ページから行ってください
                {userProfile?.birthDateModified && '（修正は1回のみ可能です）'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormFieldWrapper label="都道府県" required>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {prefectures.map((prefecture) => (
                            <SelectItem key={prefecture} value={prefecture}>
                              {prefecture}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormFieldWrapper>
                )}
              />
              <FormField
                control={form.control}
                name="nearestStation"
                render={({ field }) => (
                  <FormFieldWrapper label="最寄駅" required>
                    <FormControl>
                      <Input {...field} placeholder="例：渋谷駅" />
                    </FormControl>
                  </FormFieldWrapper>
                )}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">身分証明書</h3>
              <FormFieldWrapper label="持参可能な身分証明書" required>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {idTypes.map((type) => (
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

                  <div className="space-y-2">
                    <Label>その他の身分証明書</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {otherIds.map((id, index) => (
                        <Badge key={index} variant="secondary">
                          {id}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0"
                            onClick={() => {
                              setOtherIds(otherIds.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newIdType}
                        onChange={(e) => setNewIdType(e.target.value)}
                        placeholder="その他の身分証明書を入力"
                      />
                      <Button
                        type="button"
                        onClick={handleAddIdType}
                        disabled={!newIdType.trim()}
                      >
                        追加
                      </Button>
                    </div>
                  </div>
                </div>
              </FormFieldWrapper>
            </div>

            <FormField
              control={form.control}
              name="canProvideResidenceRecord"
              render={({ field }) => (
                <FormItem>
                  <SwitchField
                    label="本籍地記載の住民票の提出"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldWrapper label="身長 (cm)" required>
                      <FormControl>
                        <Input type="number" {...field} min={100} max={200} />
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
            </div>
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
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bust"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldWrapper label="バスト (cm) (任意)">
                      <FormControl>
                        <Input
                          type="text"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              field.onChange(null);
                            } else if (!isNaN(Number(value))) {
                              field.onChange(Number(value));
                            }
                          }}
                          placeholder="未入力可"
                        />
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
                        <Input
                          type="text"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              field.onChange(null);
                            } else if (!isNaN(Number(value))) {
                              field.onChange(Number(value));
                            }
                          }}
                          placeholder="未入力可"
                        />
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
                        <Input
                          type="text"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              field.onChange(null);
                            } else if (!isNaN(Number(value))) {
                              field.onChange(Number(value));
                            }
                          }}
                          placeholder="未入力可"
                        />
                      </FormControl>
                    </FormFieldWrapper>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <h3 className="textlg font-semibold mb-4">顔出し</h3>
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
                    {otherNgOptions.map((option, index) => (
                      <Badge key={index} variant="secondary">
                        {option}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-4 w-4 p-0"
                          onClick={() => {
                            setOtherNgOptions(otherNgOptions.filter((_, i) => i !== index));
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

            <div>
              <h3 className="text-lg font-semibold mb-4">エステオプション</h3>
              <FormField
                control={form.control}
                name="hasEstheExperience"
                render={({ field }) => (
                  <FormItem>
                    <SwitchField
                      label="エステ経験"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setIsEstheOpen(checked);
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("hasEstheExperience") && (
                <Collapsible
                  open={isEstheOpen}
                  onOpenChange={setIsEstheOpen}
                  className="mt-4 space-y-4 border rounded-lg p-4"
                >
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="estheExperiencePeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormFieldWrapper label="経験期間">
                            <FormControl>
                              <Input {...field} placeholder="例：2年" />
                            </FormControl>
                          </FormFieldWrapper>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label>可能オプション</Label>
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
                            <Label>{option}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>NGオプション</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {estheOptions.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                              checked={form.watch("estheOptions.ngOptions").includes(option)}
                              onCheckedChange={(checked) => {
                                const current = form.watch("estheOptions.ngOptions");
                                const updated = checked
                                  ? [...current, option]
                                  : current.filter((o) => o !== option);
                                form.setValue("estheOptions.ngOptions", updated);
                              }}
                            />
                            <Label>{option}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Collapsible>
              )}
            </div>

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
                      {otherAllergies.map((allergy, index) => (
                        <Badge key={index} variant="secondary">
                          {allergy}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0"
                            onClick={() => {
                              setOtherAllergies(otherAllergies.filter((_, i) => i !== index));
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
                  <div className="space-y-4">
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
                    <div>
                      <Label>その他の喫煙情報</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {otherSmokingTypes.map((type, index) => (
                          <Badge key={index} variant="secondary">
                            {type}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-1 h-4 w-4 p-0"
                              onClick={() => {
                                setOtherSmokingTypes(otherSmokingTypes.filter((_, i) => i !== index));
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
                </div>
              )}
            </div>

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
                            value={bodyMarkDetails}
                            onChange={(e) => setBodyMarkDetails(e.target.value)}
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

            <div>
              <h3 className="text-lg font-semibold mb-4">過去の勤務先</h3>
              <div className="space-y-4">
                {form.watch("previousStores")?.map((store, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Input
                        placeholder="店舗名"
                        value={store.storeName}
                        onChange={(e) =>
                          handleUpdatePreviousStore(index, "storeName", e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePreviousStore(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>写メ日記URL</Label>
                      <div className="flex flex-wrap gap-2">
                        {store.photoDiaryUrls.map((url, urlIndex) => (
                          <div key={urlIndex} className="flex items-center">
                            <Input
                              value={url}
                              onChange={(e) => {
                                const updatedUrls = [...store.photoDiaryUrls];
                                updatedUrls[urlIndex] = e.target.value;
                                handleUpdatePreviousStore(index, "photoDiaryUrls", updatedUrls);
                              }}
                              placeholder="写メ日記のURLを入力"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemovePhotoDiaryUrl(index, urlIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAddPhotoDiaryUrl(index)}
                      >
                        写メ日記URLを追加
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAddPreviousStore}
                >
                  過去の勤務先を追加
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">写メ日記が確認できるURL</h3>
              <div className="space-y-4">
                {form.watch("photoDiaryUrls")?.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="写メ日記のURL"
                      value={url}
                      onChange={(e) => {
                        const updatedUrls = [...form.watch("photoDiaryUrls") || []];
                        updatedUrls[index] = e.target.value;
                        form.setValue("photoDiaryUrls", updatedUrls);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updatedUrls = [...form.watch("photoDiaryUrls") || []].filter(
                          (_, i) => i !== index
                        );
                        form.setValue("photoDiaryUrls", updatedUrls);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    form.setValue("photoDiaryUrls", [...form.watch("photoDiaryUrls") || [], ""]);
                  }}
                >
                  写メ日記URLを追加
                </Button>
              </div>
            </div>

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

            <div className="sticky bottom-0 bg-background border-t p-4 -mx-4">
              <div className="container mx-auto flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
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
      />
    </div>
  );
}