import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  bodyTypes,
  cupSizes,
  photoTags,
  prefectures,
  idTypes,
  allergyTypes,
  smokingTypes,
  commonNgOptions,
  estheOptions,
  serviceTypes,
  type ServiceType,
  talentProfileUpdateSchema,
} from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Tag } from "lucide-react";
import { z } from "zod";

type TalentProfileFormData = z.infer<typeof talentProfileUpdateSchema>;

interface PhotoWithTags {
  file: File;
  tags: string[];
}

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  deriheru: "デリヘル",
  hoteheru: "ホテヘル",
  hakoheru: "箱ヘル",
  esthe: "風俗エステ",
  onakura: "オナクラ",
  mseikan: "M性感",
};

export function TalentForm() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoWithTags[]>([]);
  const [isEstheSelected, setIsEstheSelected] = useState(false);

  const form = useForm<TalentProfileFormData>({
    resolver: zodResolver(talentProfileUpdateSchema),
    defaultValues: {
      lastName: "",
      firstName: "",
      lastNameKana: "",
      firstNameKana: "",
      birthDate: "",
      age: "",
      height: undefined,
      weight: undefined,
      bust: undefined,
      waist: undefined,
      hip: undefined,
      cupSize: undefined,
      bodyType: undefined,
      photoUrls: {
        urls: [],
        tags: {},
      },
      faceVisibility: "全出し",
      hasResidenceCard: false,
      availableIds: [],
      ngAreas: [],
      preferredAreas: [],
      residence: "",
      smoking: false,
      smokingTypes: [],
      tattoo: false,
      piercing: false,
      allergies: {
        types: [],
        others: [],
      },
      canPhotoDiary: false,
      hasSnsAccount: false,
      snsUrls: [],
      hasCurrentStore: false,
      currentStores: [],
      serviceTypes: [],
      canHomeDelivery: false,
      canForeign: false,
      canNonJapanese: false,
      ngOptions: {
        common: [],
        others: [],
      },
      estheOptions: {
        available: [],
        ngOptions: [],
        hasExperience: false,
        experienceMonths: undefined,
      },
      previousStores: [],
      selfIntroduction: "",
      notes: "",
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map((file) => ({
      file,
      tags: [] as string[],
    }));

    setPhotos((prev) => {
      const combined = [...prev, ...newPhotos];
      return combined.slice(0, 30); // 30枚までに制限
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePhotoTag = (photoIndex: number, tag: string) => {
    setPhotos((prev) => {
      const updated = [...prev];
      const photo = updated[photoIndex];
      if (photo.tags.includes(tag)) {
        photo.tags = photo.tags.filter((t) => t !== tag);
      } else {
        photo.tags = [...photo.tags, tag];
      }
      return updated;
    });
  };

  const handleServiceTypeChange = (checked: boolean, type: ServiceType) => {
    const currentTypes = form.getValues("serviceTypes");
    let newTypes: ServiceType[];
    if (checked) {
      newTypes = [...currentTypes, type];
    } else {
      newTypes = currentTypes.filter((t) => t !== type);
    }
    form.setValue("serviceTypes", newTypes);
    setIsEstheSelected(newTypes.includes("esthe"));
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthDate = e.target.value;
    form.setValue("birthDate", birthDate);
    const age = calculateAge(birthDate);
    if (age < 18) {
      form.setError("birthDate", {
        type: "manual",
        message: "18歳未満の方は登録できません",
      });
    } else {
      form.clearErrors("birthDate");
      form.setValue("age", age.toString());
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/talent/profile", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "プロフィールの作成に失敗しました");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "プロフィール作成完了",
        description: "プロフィールが正常に作成されました。",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: TalentProfileFormData) => {
    try {
      if (photos.length < 5) {
        toast({
          title: "エラー",
          description: "写真を5枚以上アップロードしてください",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();

      // 写真とタグの追加
      photos.forEach((photo, index) => {
        formData.append("photos", photo.file);
        formData.append(`photoTags_${index}`, JSON.stringify(photo.tags));
      });

      // その他のデータを追加
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : String(value)
          );
        }
      });

      await mutation.mutateAsync(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "プロフィールの作成に失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 名前入力 */}
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>姓</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="山田" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>名</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="花子" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastNameKana"
            render={({ field }) => (
              <FormItem>
                <FormLabel>姓（カナ）</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ヤマダ" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firstNameKana"
            render={({ field }) => (
              <FormItem>
                <FormLabel>名（カナ）</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ハナコ" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 生年月日・年齢 */}
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>生年月日</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    onChange={handleBirthDateChange}
                    max={new Date(
                      Date.now() - 18 * 365 * 24 * 60 * 60 * 1000
                    ).toISOString().split("T")[0]}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-sm text-muted-foreground">
                  ※18歳未満の方は登録できません
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>年齢</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                    disabled
                    className="bg-muted"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 写真アップロード */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <Label>写真アップロード</Label>
              <p className="text-sm text-muted-foreground">
                アップロード済み: {photos.length}/30枚（最低5枚必要）
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("photo-upload")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              写真を追加
            </Button>
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* 写真プレビューとタグ付け */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(photo.file)}
                      alt={`写真 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label className="text-sm mb-1 block">タグ付け</Label>
                    <div className="flex flex-wrap gap-1">
                      {photoTags.map((tag) => (
                        <Button
                          key={tag}
                          type="button"
                          variant={photo.tags.includes(tag) ? "default" : "outline"}
                          size="sm"
                          className="text-xs py-1 px-2 h-auto"
                          onClick={() => togglePhotoTag(index, tag)}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {photos.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                写真をアップロードしてください
              </p>
            </div>
          )}
        </div>

        {/* 身体的特徴 */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "height", label: "身長", min: 140, max: 180, step: 1, unit: "cm" },
            { name: "weight", label: "体重", min: 35, max: 100, step: 1, unit: "kg" },
            { name: "bust", label: "バスト", min: 65, max: 120, step: 1, unit: "cm" },
            { name: "waist", label: "ウエスト", min: 50, max: 100, step: 1, unit: "cm" },
            { name: "hip", label: "ヒップ", min: 65, max: 120, step: 1, unit: "cm" },
          ].map(({ name, label, min, max, step, unit }) => (
            <FormField
              key={name}
              control={form.control}
              name={name as keyof TalentProfileFormData}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label} ({unit})</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: (max - min) / step + 1 }, (_, i) => {
                        const value = min + i * step;
                        return (
                          <SelectItem key={value} value={value.toString()}>
                            {value}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <FormField
            control={form.control}
            name="cupSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>カップサイズ</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cupSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}カップ
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-muted p-4 rounded-lg mb-6">
          <p className="text-sm text-muted-foreground">
            ※ 身長・体重などの数値は実物との差異があると保証条件見直しや受け入れ不可になる可能性もあるので実際の数値を入力してください。
          </p>
        </div>

        {/* 希望業種 */}
        <div className="space-y-4">
          <Label>希望業種</Label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(SERVICE_TYPE_LABELS).map(([type, label]) => (
              <FormField
                key={type}
                control={form.control}
                name="serviceTypes"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(type as ServiceType)}
                        onCheckedChange={(checked) => {
                          handleServiceTypeChange(checked === true, type as ServiceType);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">{label}</FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* NGオプション（エステ以外の業種選択時） */}
        {form.watch("serviceTypes")?.some((type) => type !== "esthe") && (
          <FormField
            control={form.control}
            name="ngOptions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NGオプション（複数選択可）</FormLabel>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {commonNgOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value.common.includes(option)}
                          onCheckedChange={(checked) => {
                            const newOptions = checked
                              ? [...field.value.common, option]
                              : field.value.common.filter((o) => o !== option);
                            field.onChange({ ...field.value, common: newOptions });
                          }}
                        />
                        <label className="text-sm">{option}</label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>その他のNGオプション</Label>
                    <Input
                      placeholder="カンマ区切りで入力（例：オプション1, オプション2）"
                      value={field.value.others.join(", ")}
                      onChange={(e) => {
                        const others = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        field.onChange({ ...field.value, others });
                      }}
                    />
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* エステ専用オプション */}
        {isEstheSelected && (
          <FormField
            control={form.control}
            name="estheOptions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>エステオプション</FormLabel>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {estheOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value.available.includes(option)}
                          onCheckedChange={(checked) => {
                            const newOptions = checked
                              ? [...field.value.available, option]
                              : field.value.available.filter((o) => o !== option);
                            field.onChange({ ...field.value, available: newOptions });
                          }}
                        />
                        <label className="text-sm">{option}</label>
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label>その他のNGオプション</Label>
                    <Input
                      placeholder="カンマ区切りで入力"
                      value={field.value.ngOptions.join(", ")}
                      onChange={(e) => {
                        const ngOptions = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        field.onChange({ ...field.value, ngOptions });
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value.hasExperience}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            hasExperience: checked === true,
                          });
                        }}
                      />
                      <Label>エステ経験あり</Label>
                    </div>

                    {field.value.hasExperience && (
                      <div>
                        <Label>経験期間（月）</Label>
                        <Input
                          type="number"
                          min={0}
                          value={field.value.experienceMonths || ""}
                          onChange={(e) => {
                            field.onChange({
                              ...field.value,
                              experienceMonths: e.target.valueAsNumber,
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* 外国人対応 */}
        <FormField
          control={form.control}
          name="canForeign"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>外国人対応</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("canForeign") && (
          <FormField
            control={form.control}
            name="canNonJapanese"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 ml-4">
                <div className="space-y-0.5">
                  <FormLabel>日本語を話せない外国人のお客様も対応可能</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* 過去経験店舗 */}
        <FormField
          control={form.control}
          name="previousStores"
          render={({ field }) => (
            <FormItem>
              <FormLabel>過去経験店舗</FormLabel>
              <div className="space-y-4">
                {field.value.map((_, index) => (
                  <div key={index} className="grid gap-4 p-4 border rounded-lg">
                    <Input
                      placeholder="店舗名"
                      value={field.value[index].storeName}
                      onChange={(e) => {
                        const newStores = [...field.value];
                        newStores[index] = {
                          ...newStores[index],
                          storeName: e.target.value,
                        };
                        field.onChange(newStores);
                      }}
                    />
                    <Input
                      placeholder="期間（例：2023年4月～2023年12月）"
                      value={field.value[index].period || ""}
                      onChange={(e) => {
                        const newStores = [...field.value];
                        newStores[index] = {
                          ...newStores[index],
                          period: e.target.value,
                        };
                        field.onChange(newStores);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newStores = field.value.filter((_, i) => i !== index);
                        field.onChange(newStores);
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
                    field.onChange([
                      ...field.value,
                      { storeName: "", period: "" },
                    ]);
                  }}
                >
                  店舗を追加
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 自己PR */}
        <FormField
          control={form.control}
          name="selfIntroduction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>自己PR</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  className="w-full h-32 p-2 border rounded-md"
                  placeholder="自己PRを入力してください（1000文字以内）"
                />
              </FormControl>
              <p className="text-sm text-muted-foreground mt-2">
                自己PRを記入すると店舗様もどのように売り出せばいいかわかりやすいです。
                過去の実績やお客様からよく褒められる点を記入するといいでしょう。
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 備考 */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>その他備考や希望</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  className="w-full h-24 p-2 border rounded-md"
                  placeholder="その他の要望がありましたらご記入ください"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          プロフィールを作成
        </Button>
      </form>
    </Form>
  );
}