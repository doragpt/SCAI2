import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, X, ChevronDown, Camera, Plus, Preview } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PreviewMode } from "./preview-mode";

// Store type definitions
type CurrentStore = {
  storeName: string;
  stageName: string;
};

type PreviousStore = {
  storeName: string;
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
  const [selectedTag, setSelectedTag] = useState<typeof photoTags[number]>("現在の髪色");
  const [showBulkTagging, setShowBulkTagging] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const hasHairColorPhoto = photos.some((photo) => photo.tag === "現在の髪色");

  const compressImage = async (file: File): Promise<string | null> => {
    try {
      if (file.size > 10 * 1024 * 1024) { // 10MBまで許可
        toast({
          title: "エラー",
          description: "ファイルサイズは10MB以下にしてください。",
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
      const MAX_WIDTH = 800; // 最大幅を調整
      const MAX_HEIGHT = 1000; // 最大高さを調整
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

      // 画質を調整（0.7は比較的高品質だが、ファイルサイズは抑える）
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

      // Base64サイズチェック
      const base64Size = compressedDataUrl.length * 0.75;
      if (base64Size > 1024 * 1024) { // 1MB以上の場合はさらに圧縮
        return canvas.toDataURL('image/jpeg', 0.5);
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
      const updatedPhotos = [...photos, ...newPhotos];
      onChange(updatedPhotos);
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
                {tag === "現在の髪色" && (!hasHairColorPhoto ? " (必須)" : " (登録済み)")}
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


const OtherItemInput = React.forwardRef<
  HTMLInputElement,
  {
    onAdd: (value: string) => void;
    placeholder: string;
  }
>((props, ref) => {
  const { onAdd, placeholder } = props;

  const handleAdd = () => {
    const inputEl = ref as React.RefObject<HTMLInputElement>;
    const value = inputEl.current?.value.trim();
    if (value) {
      onAdd(value);
      if (inputEl.current) {
        inputEl.current.value = '';
        inputEl.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={ref}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <Button
        type="button"
        size="sm"
        onClick={handleAdd}
      >
        追加
      </Button>
    </div>
  );
});

OtherItemInput.displayName = 'OtherItemInput';

const defaultValues: TalentProfileData = {
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
  bust: 80,
  waist: 60,
  hip: 85,
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
    others: [],
  },
};


export function TalentForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showDraftSavedToast, setShowDraftSavedToast] = useState(false);
  const [draftTimer, setDraftTimer] = useState<NodeJS.Timeout | null>(null);

  const form = useForm<TalentProfileData>({
    resolver: zodResolver(talentProfileSchema),
    mode: "onChange",
    defaultValues,
  });

  // フォームの状態を監視
  useEffect(() => {
    const formState = form.formState;
    const photos = form.getValues().photos || [];
    console.log('Form validation state:', {
      isValid: formState.isValid,
      isDirty: formState.isDirty,
      errors: formState.errors,
      photos: photos,
      hasCurrentHairPhoto: photos.some(photo => photo.tag === "現在の髪色"),
    });
  }, [form.formState]);

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
  const [newNgOption, setNewNgOption] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newSmokingType, setNewSmokingType] = useState("");
  const [newBodyMark, setNewBodyMark] = useState("");
  const [bodyMarks, setBodyMarks] = useState<string[]>([]);
  const [otherEstheNgOptions, setOtherEstheNgOptions] = useState<string[]>([]);


  // 既存のプロフィールデータが取得された時にフォームを更新
  useEffect(() => {
    if (existingProfile) {
      console.log('Loading existing profile bodyMark:', existingProfile.bodyMark);

      form.reset({
        ...existingProfile,
        bust: existingProfile.bust?.toString() ?? "",
        waist: existingProfile.waist?.toString() ?? "",
        hip: existingProfile.hip?.toString() ?? "",
        photos: existingProfile.photos || [],
        bodyMark: {
          hasBodyMark: existingProfile.bodyMark?.hasBodyMark || false,
          details: existingProfile.bodyMark?.details || "",
          others: existingProfile.bodyMark?.others || []
        },
        estheOptions: {
          available: existingProfile.estheOptions?.available || [],
          otherNgOptions: existingProfile.estheOptions?.otherNgOptions || ""
        }
      });

      // stateの更新
      setOtherIds(existingProfile.availableIds?.others || []);
      setOtherNgOptions(existingProfile.ngOptions?.others || []);
      setOtherAllergies(existingProfile.allergies?.others || []);
      setOtherSmokingTypes(existingProfile.smoking?.others || []);
      setBodyMarks(existingProfile.bodyMark?.others || []);
      setBodyMarkDetails(existingProfile.bodyMark?.details || "");
      console.log('Form reset complete, current bodyMark:', form.getValues().bodyMark);
    }
  }, [existingProfile, form]);

  const handleConfirm = async () => {
    if (!formData) return;

    try {
      setIsSubmitting(true);

      // APIリクエストを実行
      await apiRequest(
        existingProfile ? "PUT" : "POST",
        QUERY_KEYS.TALENT_PROFILE,
        formData
      );

      // キャッシュを更新
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

  // 身分証追加ハンドラーの修正
  const handleAddIdType = (value: string) => {
    if (!otherIds.includes(value)) {
      const updated = [...otherIds, value];
      setOtherIds(updated);
      form.setValue("availableIds.others", updated);
    }
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

  const handleUpdatePreviousStore = (index: number, value: string) => {
    const updatedStores = [...form.watch("previousStores") || []];
    updatedStores[index] = { storeName: value };
    form.setValue("previousStores", updatedStores);
  };

  const handleRemovePreviousStore = (index: number) => {
    const updatedStores = [...form.watch("previousStores") || []].filter((_, i) => i !== index);
    form.setValue("previousStores", updatedStores);
  };

  const handleAddPreviousStore = () => {
    form.setValue("previousStores", [...form.watch("previousStores") || [], { storeName: "" }]);
  };

  const handleIdTypeChange = (type: string, checked: boolean) => {
    const current = form.watch("availableIds.types") || [];
    const updated = checked
      ? [...current, type]
      : current.filter((t) => t !== type);
    form.setValue("availableIds.types", updated, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  // 写真の更新処理を修正
  const handlePhotoUpload = (newPhotos: Photo[]) => {
    console.log('Updating photos:', {
      currentPhotos: form.getValues().photos,
      newPhotos,
      hasCurrentHairPhoto: newPhotos.some(photo => photo.tag === "現在の髪色"),
    });

    form.setValue('photos', newPhotos, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    // 写真のバリデーションをトリガー
    form.trigger();
  };

  const saveDraft = useCallback(async () => {
    if (!form.formState.isDirty) return;

    try {
      const formData = form.getValues();
      formData.isDraft = true;

      await apiRequest(
        existingProfile ? "PUT" : "POST",
        QUERY_KEYS.TALENT_PROFILE,
        formData
      );

      setShowDraftSavedToast(true);
      setTimeout(() => setShowDraftSavedToast(false), 3000);
    } catch (error) {
      console.error("下書き保存エラー:", error);
    }
  }, [form, existingProfile]);

  useEffect(() => {
    if (form.formState.isDirty) {
      if (draftTimer) clearTimeout(draftTimer);
      const timer = setTimeout(saveDraft, 30000); // 30秒後に自動保存
      setDraftTimer(timer);
    }
    return () => {
      if (draftTimer) clearTimeout(draftTimer);
    };
  }, [form.formState.isDirty, saveDraft]);


  // フォームのsubmit処理を再実装
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Form submission started');

    try {
      const data = form.getValues();
      data.isDraft = false; // Set as final version
      console.log('Raw form data:', data);

      // 数値型フィールドの変換
      const formData = {
        ...data,
        height: Number(data.height),
        weight: Number(data.weight),
        bust: data.bust === "" ? null : Number(data.bust),
        waist: data.waist === "" ? null : Number(data.waist),
        hip: data.hip === "" ? null : Number(data.hip),
        availableIds: {
          types: data.availableIds?.types || [],
          others: otherIds,
        },
        ngOptions: {
          common: data.ngOptions?.common || [],
          others: otherNgOptions,
        },
        allergies: {
          types: data.allergies?.types || [],
          others: otherAllergies,
          hasAllergy: data.allergies?.hasAllergy || false,
        },
        smoking: {
          enabled: data.smoking?.enabled || false,
          types: data.smoking?.types || [],
          others: otherSmokingTypes,
        },
        bodyMark: {
          hasBodyMark: data.bodyMark?.hasBodyMark || false,
          details: data.bodyMark?.details || "",
          others: bodyMarks
        },
        photos: data.photos || [],
        estheOptions: {
          available: data.estheOptions?.available || [],
          ngOptions: otherEstheNgOptions,
        }
      };

      console.log('Processed form data:', formData);
      setFormData(formData);
      setIsConfirmationOpen(true);

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "フォームの送信に失敗しました",
      });
    }
  };

  // 保存ボタンの状態管理を単純化
  const photos = form.getValues().photos || [];
  const hasCurrentHairPhoto = photos.some(photo => photo.tag === "現在の髪色");
  const isButtonDisabled = photos.length === 0 || !hasCurrentHairPhoto;

  // アレルギー追加ハンドラー
  const handleAddAllergy = (value: string) => {
    if (!otherAllergies.includes(value)) {
      const updated = [...otherAllergies, value];
      setOtherAllergies(updated);
      form.setValue("allergies.others", updated);
    }
  };

  // 喫煙情報追加ハンドラー
  const handleAddSmokingType = (value: string) => {
    if (!otherSmokingTypes.includes(value)) {
      const updated = [...otherSmokingTypes, value];
      setOtherSmokingTypes(updated);
      form.setValue("smoking.others", updated);
        }
  };

  // 傷・タトゥー・アトピー追加ハンドラー
  const handleAddBodyMark = (value: string) => {
    if (!bodyMarks.includes(value)) {
      const updated = [...bodyMarks, value];
      setBodyMarks(updated);

      // フォームの値を更新（他の項目と同じパターンで）
      form.setValue("bodyMark", {
        hasBodyMark: true,
        details: form.getValues().bodyMark?.details || "",
        others: updated
      }, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });

      console.log('bodyMark updated:', {
        value,
        updated,
        formValues: form.getValues().bodyMark      });
    }
  };

  const handleRemoveBodyMark = (index: number) => {
    const updated = bodyMarks.filter((_, i) => i !== index);
    setBodyMarks(updated);

    // フォームの値を更新
    form.setValue("bodyMark", {
      hasBodyMark: updated.length > 0,
      details: form.getValues().bodyMark?.details || "",
      others: updated
    }, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });

    console.log('bodyMark removed:', {
      index,
      updated,
      formValues: form.getValues().bodyMark
    });
  };

  // エステNGオプション追加ハンドラー
  const handleAddEstheNgOption = (value: string) => {
    if (!otherEstheNgOptions.includes(value)) {
      const updated = [...otherEstheNgOptions, value];
      setOtherEstheNgOptions(updated);
      form.setValue("estheOptions.ngOptions", updated);
    }
  };

  const PreviewMode = ({ data }: { data: TalentProfileData }) => (
    <div>
      {/* Display the data in a preview format here */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {existingProfile ? "プロフィール編集" : "プロフィール作成"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isPreviewMode ? "プレビューモード" : "編集モード"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              <Preview className="h-4 w-4 mr-2" />
              {isPreviewMode ? "編集に戻る" : "プレビュー"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
            >
              下書き保存
            </Button>
            <Button
              type="submit"
              disabled={!form.formState.isValid || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 pb-32">
        {isPreviewMode ? (
          <PreviewMode data={form.getValues()} />
        ) : (
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-8">
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
                {/* Location field */}
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

              {/* 身分証セクション */}
              <div>
                <FormFieldWrapper label="持参可能な身分証明書" required>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {idTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            checked={form.watch("availableIds.types")?.includes(type)}
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

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {otherIds.map((id, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {id}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => {
                                const updated = otherIds.filter((_, i) => i !== index);
                                setOtherIds(updated);
                                form.setValue("availableIds.others", updated);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <OtherItemInput
                        onAdd={handleAddIdType}
                        placeholder="その他の身分証明書を入力"
                      />
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
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {otherNgOptions.map((option, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {option}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => {
                              const updated = otherNgOptions.filter((_, i) => i !== index);
                              setOtherNgOptions(updated);
                              form.setValue("ngOptions.others", updated)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <OtherItemInput
                      onAdd={(value: string) => setOtherNgOptions([...otherNgOptions, value])}
                      placeholder="その他のNGオプションを入力"
                    />
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

                      <FormField
                        control={form.control}
                        name="estheOptions.available"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>可能オプション（出来るものだけチェックをつけてください）</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {estheOptions.map((option) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={field.value?.includes(option)}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...(field.value || []), option]
                                        : (field.value || []).filter((value) => value !== option);
                                      field.onChange(newValue);
                                    }}
                                  />
                                  <label className="text-sm">{option}</label>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estheOptions.ngOptions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>その他できないプレイやオプション</FormLabel>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {otherEstheNgOptions.map((option, index) => (
                                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                                    {option}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0 hover:bg-transparent"
                                      onClick={() => {
                                        const updated = otherEstheNgOptions.filter((_, i) => i !== index);
                                        setOtherEstheNgOptions(updated);
                                        form.setValue("estheOptions.ngOptions", updated);
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                              <OtherItemInput
                                onAdd={handleAddEstheNgOption}
                                placeholder="できないプレイやオプションを入力"
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {otherAllergies.map((allergy, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {allergy}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => {
                                const updated = otherAllergies.filter((_, i) => i !== index);
                                setOtherAllergies(updated);
                                form.setValue("allergies.others", updated);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <OtherItemInput
                        onAdd={handleAddAllergy}
                        placeholder="その他のアレルギーを入力"
                      />
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
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {otherSmokingTypes.map((type, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              {type}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => {
                                  const updated = otherSmokingTypes.filter((_, i) => i !== index);
                                  setOtherSmokingTypes(updated);
                                  form.setValue("smoking.others", updated);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <OtherItemInput
                          onAdd={handleAddSmokingType}
                          placeholder="その他の喫煙情報を入力"
                        />
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
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {bodyMarks.map((mark, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {mark}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => handleRemoveBodyMark(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <OtherItemInput
                        onAdd={handleAddBodyMark}
                        placeholder="傷・タトゥー・アトピーの情報を入力"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        ※傷、タトゥー、アトピーなどがある場合、必ずその部位の写真をアップロードしタグ付けしてください。
                      </p>
                    </div>
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
                <div className="space-y-6">
                  <div className="border rounded-lg p-6 bg-muted/5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">現在の勤務先</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCurrentStore}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        店舗を追加
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {form.watch("currentStores")?.map((store, index) => (
                        <div key={index} className="relative border rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-muted-foreground mb-2">店舗名</Label>
                              <Input
                                placeholder="店舗名を入力してください"
                                value={store.storeName}
                                onChange={(e) =>
                                  handleUpdateCurrentStore(index, "storeName", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground mb-2">源氏名</Label>
                              <Input
                                placeholder="源氏名を入力してください"
                                value={store.stageName}
                                onChange={(e) =>
                                  handleUpdateCurrentStore(index, "stageName", e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handleRemoveCurrentStore(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-6 bg-muted/5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">過去の勤務先</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddPreviousStore}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        店舗を追加
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {form.watch("previousStores")?.map((store, index) => (
                        <div key={index} className="relative flex items-center gap-4 border rounded-lg p-4">
                          <div className="flex-1">
                            <Label className="text-sm text-muted-foreground mb-2">店舗名</Label>
                            <Input
                              placeholder="店舗名を入力してください"
                              value={store.storeName}
                              onChange={(e) => handleUpdatePreviousStore(index, e.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handleRemovePreviousStore(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-6 bg-muted/5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">写メ日記が確認できるURL</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => form.setValue("photoDiaryUrls", [...form.watch("photoDiaryUrls") || [], ""])}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        URLを追加
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {form.watch("photoDiaryUrls")?.map((url, index) => (
                        <div key={index} className="relative flex items-center gap-4 border rounded-lg p-4">
                          <div className="flex-1">
                            <Label className="text-sm text-muted-foreground mb-2">URL {index + 1}</Label>
                            <Input
                              placeholder="写メ日記のURLを入力してください"
                              value={url}
                              onChange={(e) => {
                                const updatedUrls = [...form.watch("photoDiaryUrls") || []];
                                updatedUrls[index] = e.target.value;
                                form.setValue("photoDiaryUrls", updatedUrls);
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              const updatedUrls = form.watch("photoDiaryUrls")?.filter((_, i) => i !== index) || [];
                              form.setValue("photoDiaryUrls", updatedUrls);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
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
                        onChange={handlePhotoUpload}
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

              <div className="sticky bottom-0 left-0 right-0 bg-white border-t p-4">
                <div className="container mx-auto max-w-4xl flex justify-end gap-4">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isButtonDisabled}
                    className="min-w-[200px]"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        <span>送信中...</span>
                      </>
                    ) : (
                      "保存"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </main>

      <ProfileConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => {
          console.log('Modal closing');
          setIsConfirmationOpen(false);
          setFormData(null);
        }}
        onConfirm={handleConfirm}
        formData={formData}
        isSubmitting={isSubmitting}
      />
      {showDraftSavedToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          下書きを保存しました
        </div>
      )}
    </div>
  );
}