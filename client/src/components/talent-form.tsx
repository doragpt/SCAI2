import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, X, ChevronDown, Camera } from "lucide-react";
import { Link } from "wouter";
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

// 必要なインポートを追加
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

// SwitchFieldコンポーネント
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

// PhotoUploadコンポーネント
const PhotoUpload = ({
  photos,
  onChange,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = async (file: File): Promise<string | null> => {
    try {
      // ファイルサイズチェック（2MB以下）
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

      // 画像の圧縮処理
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

      // 圧縮品質を0.5に設定
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);

      // Base64データのサイズをチェック
      const base64Size = compressedDataUrl.length * 0.75;
      if (base64Size > 512 * 1024) { // 512KB以上の場合はスキップ
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
          tag: photoTags[0],
        });
      }
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasHairColorPhoto = photos.some((photo) => photo.tag === "現在の髪色");

  return (
    <div className="space-y-6">
      {/* 既存の写真一覧 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
              <img
                src={photo.url}
                alt={`プロフィール写真 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
              <Select
                value={photo.tag}
                onValueChange={(tag) => {
                  const updatedPhotos = [...photos];
                  updatedPhotos[index] = { ...photo, tag: tag as typeof photoTags[number] };
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
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const updatedPhotos = photos.filter((_, i) => i !== index);
                  onChange(updatedPhotos);
                }}
              >
                削除
              </Button>
            </div>
            <Badge
              className={`absolute top-2 right-2 ${
                photo.tag === "現在の髪色" ? "bg-primary text-primary-foreground" : "bg-white/90 text-black"
              }`}
            >
              {photo.tag}
            </Badge>
          </div>
        ))}
      </div>

      {/* 新規アップロード */}
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

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>※最大20枚までアップロード可能です（1枚あたり2MBまで）</p>
        <p className="font-medium text-primary">※現在の髪色の写真は必須です。</p>
        <p>※傷、タトゥー、アトピーがある場合は、該当部位の写真を必ずアップロードしタグ付けしてください。</p>
      </div>
    </div>
  );
};

// メインのTalentFormコンポーネント
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
  const [newIdType, setNewIdType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 既存のプロフィールデータが取得された時にフォームを更新
  useEffect(() => {
    if (existingProfile) {
      console.log("Loading existing profile:", existingProfile);

      // フォームの値を更新
      form.reset({
        ...existingProfile,
        // 数値フィールドを文字列に変換
        bust: existingProfile.bust?.toString() ?? "",
        waist: existingProfile.waist?.toString() ?? "",
        hip: existingProfile.hip?.toString() ?? "",
        photos: existingProfile.photos || [],
        bodyMark: existingProfile.bodyMark || {
          hasBodyMark: false,
          details: "",
        },
      });

      // その他のフィールドの初期化
      setOtherIds(existingProfile.availableIds?.others || []);
      setOtherNgOptions(existingProfile.ngOptions?.others || []);
      setOtherAllergies(existingProfile.allergies?.others || []);
      setOtherSmokingTypes(existingProfile.smoking?.others || []);
      setIsEstheOpen(existingProfile.hasEstheExperience || false);
      setBodyMarkDetails(existingProfile.bodyMark?.details || "");
    }
  }, [existingProfile, form]);

  // フォーム送信前の確認
  const handleSubmit = async (data: TalentProfileData) => {
    try {
      setIsSubmitting(true);
      // データの最適化
      const optimizedData = {
        ...data,
        height: Number(data.height),
        weight: Number(data.weight),
        // 文字列からnumber | nullに変換
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

  // 確認後の送信処理
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            {/* 1.氏名 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormFieldWrapper label="姓" required>
                    <FormControl>
                      <Input {...field} placeholder="例：山田" />
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
                      <Input {...field} placeholder="例：太郎" />
                    </FormControl>
                  </FormFieldWrapper>
                )}
              />
            </div>

            {/* 2.氏名（かな） */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastNameKana"
                render={({ field }) => (
                  <FormFieldWrapper label="セイ（かな）" required>
                    <FormControl>
                      <Input {...field} placeholder="例：ヤマダ" />
                    </FormControl>
                  </FormFieldWrapper>
                )}
              />
              <FormField
                control={form.control}
                name="firstNameKana"
                render={({ field }) => (
                  <FormFieldWrapper label="メイ（かな）" required>
                    <FormControl>
                      <Input {...field} placeholder="例：タロウ" />
                    </FormControl>
                  </FormFieldWrapper>
                )}
              />
            </div>

            {/* 3.所在地 */}
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

            {/* 4.身分証明書 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">身分証明書</h3>
              <FormFieldWrapper label="持参可能な身分証明書" required>
                <div className="space-y-4">
                  {/* 既存の身分証明書チェックボックス */}
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

                  {/* その他の身分証明書 */}
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

            {/* 5. 身長・体重 */}
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
            {/* 6. カップサイズ */}
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
            {/* 7. バスト・ウエスト・ヒップ */}
            <div className="grid grid-cols-3 gap-4">
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
            {/* 8. 顔出し */}
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

            {/* 9. 写メ日記の投稿可否 */}
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

            {/* 10. 自宅派遣可否 */}
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

            {/* 11. NGオプション */}
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
                <div className="mt4">
                  <Label>その他のNGオプション</Label>
                  <div className="flex flex-wrap gap-2 mt2">
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

            {/* 12. エステオプション */}
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

            {/* 13. アレルギー */}
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

            {/* 14. 喫煙 */}
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

            {/* 15. 傷・タトゥー・アトピー */}
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

            {/* 16. SNSアカウント */}
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

            {/* 17. 現在の勤務先 */}
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

            {/* 18. 過去の勤務先 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">過去の勤務先</h3>
              <div className="space-y-6">
                {form.watch("previousStores")?.map((store, storeIndex) => (
                  <div key={storeIndex} className="space-y-4 border p-4 rounded-lg">
                    <div className="flex gap-2">
                      <Input
                        placeholder="店名"
                        value={store.storeName}
                        onChange={(e) =>
                          handleUpdatePreviousStore(storeIndex, "storeName", e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemovePreviousStore(storeIndex)}
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
                                handleUpdatePreviousStore(storeIndex, "photoDiaryUrls", updatedUrls);
                              }}
                              placeholder="写メ日記のURLを入力"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemovePhotoDiaryUrl(storeIndex, urlIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAddPhotoDiaryUrl(storeIndex)}
                      >
                        写メ日記URLを追加
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

            {/* 19. 写メ日記URL */}
            {/* This section is now handled within the "過去の勤務先" section above */}

            {/* 20. プロフィール写真 */}
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

            {/* 21. 自己紹介 */}
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

            {/* 22. 備考 */}
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

            {/* 送信ボタン */}
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