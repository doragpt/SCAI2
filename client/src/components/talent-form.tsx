import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormItem,
  FormField,
  FormFieldWrapper,
  FormControl,
  FormMessage,
  SwitchField,
  Input,
  Label,
  Button,
  Badge,
  Checkbox,
  Loader2,
  X,
  Collapsible,
} from "@/components/ui";
import { talentProfileSchema, TalentProfileData } from "@/schemas/talent-profile";
import { useState, useEffect, ChangeEvent } from "react";
import { toast } from "@/components/ui/use-toast";
import PhotoUpload from "./photo-upload";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { getProfile } from "@/services/talent";
import { z } from "zod";

export function TalentForm({
  existingProfile,
}: {
  existingProfile?: TalentProfileData;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [formData, setFormData] = useState<TalentProfileData | undefined>(undefined);
  const [otherNgOptions, setOtherNgOptions] = useState<string[]>([]);
  const [otherAllergies, setOtherAllergies] = useState<string[]>([]);
  const [otherSmokingTypes, setOtherSmokingTypes] = useState<string[]>([]);
  const [bodyMarkDetails, setBodyMarkDetails] = useState<string>("");
  const [isEstheOpen, setIsEstheOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const commonNgOptions = ["ヘナタトゥー", "刺青"];
  const estheOptions = [
    "フェイシャル",
    "ボディ",
    "痩身",
    "脱毛",
    "ブライダル",
    "その他",
  ];
  const allergyTypes = [
    "ハウスダスト",
    "花粉",
    "ダニ",
    "ペット",
    "食べ物",
    "金属",
    "薬品",
    "その他",
  ];
  const smokingTypes = ["タバコ", "電子タバコ", "葉巻", "パイプ", "その他"];


  const form = useForm<TalentProfileData>({
    resolver: zodResolver(talentProfileSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      firstNameKana: "",
      lastNameKana: "",
      birthday: null,
      gender: "female",
      phoneNumber: "",
      email: "",
      address: "",
      height: 150,
      weight: 45,
      cupSize: "D",
      bust: null,
      waist: null,
      hip: null,
      ngOptions: {
        common: [],
        others: [],
      },
      hasEstheExperience: false,
      estheExperiencePeriod: "",
      estheOptions: {
        available: [],
        ngOptions: [],
      },
      allergies: {
        hasAllergy: false,
        types: [],
        others: [],
      },
      smoking: {
        enabled: false,
        types: [],
        others: [],
      },
      bodyMark: {
        hasBodyMark: false,
        details: "",
      },
      hasSnsAccount: false,
      snsUrls: [""],
      currentStores: [{ storeName: "", stageName: "" }],
      previousStores: [{ storeName: "", photoDiaryUrls: [""] }],
      photoDiaryUrls: [""],
      photos: [],
      selfIntroduction: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (existingProfile) {
      console.log("Loading existing profile:", existingProfile);
      form.reset({
        ...existingProfile,
        bust: existingProfile.bust?.toString() ?? "",
        waist: existingProfile.waist?.toString() ?? "",
        hip: existingProfile.hip?.toString() ?? "",
      });
    }
  }, [existingProfile, form]);

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

  const handleUpdateCurrentStore = (index: number, key: string, value: string) => {
    const updatedStores = [...form.watch("currentStores") || []];
    updatedStores[index] = { ...updatedStores[index], [key]: value };
    form.setValue("currentStores", updatedStores);
  };

  const handleRemoveCurrentStore = (index: number) => {
    const updatedStores = [...form.watch("currentStores") || []].filter((_, i) => i !== index);
    form.setValue("currentStores", updatedStores);
  };

  const handleAddCurrentStore = () => {
    form.setValue("currentStores", [...form.watch("currentStores") || [], { storeName: "", stageName: "" }]);
  };

  const handleUpdatePreviousStore = (index: number, key: string, value: any) => {
    const updatedStores = [...form.watch("previousStores") || []];
    updatedStores[index] = { ...updatedStores[index], [key]: value };
    form.setValue("previousStores", updatedStores);
  };

  const handleRemovePreviousStore = (index: number) => {
    const updatedStores = [...form.watch("previousStores") || []].filter((_, i) => i !== index);
    form.setValue("previousStores", updatedStores);
  };

  const handleAddPreviousStore = () => {
    form.setValue("previousStores", [...form.watch("previousStores") || [], { storeName: "", photoDiaryUrls: [""] }]);
  };

  const handleRemovePhotoDiaryUrl = (storeIndex: number, urlIndex: number) => {
    const updatedStores = [...form.watch("previousStores") || []];
    updatedStores[storeIndex].photoDiaryUrls = updatedStores[storeIndex].photoDiaryUrls.filter((_, i) => i !== urlIndex);
    form.setValue("previousStores", updatedStores);
  };

  const handleAddPhotoDiaryUrl = (storeIndex: number) => {
    const updatedStores = [...form.watch("previousStores") || []];
    updatedStores[storeIndex].photoDiaryUrls = [...updatedStores[storeIndex].photoDiaryUrls, ""];
    form.setValue("previousStores", updatedStores);
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      // ... (Your existing confirmation logic here)
    } catch (error) {
      console.error("データの保存中にエラーが発生しました:", error);
      toast({
        title: "エラー",
        description: "データの保存中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirmationOpen(false);
    }
  };

  const handleSubmit = async (data: TalentProfileData) => {
    try {
      setIsSubmitting(true);
      const optimizedData = {
        ...data,
        height: Number(data.height),
        weight: Number(data.weight),
        bust: data.bust === "" ? null : data.bust,
        waist: data.waist === "" ? null : data.waist,
        hip: data.hip === "" ? null : data.hip,
        ngOptions: {
          common: data.ngOptions.common,
          others: otherNgOptions,
        },
        estheOptions: {
          available: data.estheOptions.available,
          ngOptions: data.estheOptions.ngOptions,
        },
        allergies: {
          hasAllergy: data.allergies.hasAllergy,
          types: data.allergies.types,
          others: otherAllergies,
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
        snsUrls: data.snsUrls.filter((url) => url !== ""),
        currentStores: data.currentStores.filter((store) => store.storeName !== "" || store.stageName !== ""),
        previousStores: data.previousStores.map((store) => ({
          storeName: store.storeName,
          photoDiaryUrls: store.photoDiaryUrls.filter((url) => url !== ""),
        })),
        photoDiaryUrls: data.photoDiaryUrls.filter((url) => url !== ""),
        photos: data.photos,
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

  return (
    <div className="flex flex-col space-y-8">
      <main className="flex-grow">
        <Form onSubmit={form.handleSubmit(handleSubmit)}>
          <form>
            {/* 1. 名前 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldWrapper label="名前（漢字）">
                      <FormControl>
                        <Input {...field} placeholder="例：山田" />
                      </FormControl>
                    </FormFieldWrapper>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldWrapper label="名前（漢字）">
                      <FormControl>
                        <Input {...field} placeholder="例：太郎" />
                      </FormControl>
                    </FormFieldWrapper>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 2. ふりがな */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstNameKana"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldWrapper label="名前（ふりがな）">
                      <FormControl>
                        <Input {...field} placeholder="例：やまだ" />
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
                    <FormFieldWrapper label="名前（ふりがな）">
                      <FormControl>
                        <Input {...field} placeholder="例：たろう" />
                      </FormControl>
                    </FormFieldWrapper>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 3. 生年月日 */}
            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormFieldWrapper label="生年月日">
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormFieldWrapper>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. 性別 */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormFieldWrapper label="性別">
                    <FormControl>
                      <select {...field} className="w-full">
                        <option value="female">女性</option>
                        <option value="male">男性</option>
                        <option value="other">その他</option>
                      </select>
                    </FormControl>
                  </FormFieldWrapper>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 5. 電話番号 */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormFieldWrapper label="電話番号">
                    <FormControl>
                      <Input {...field} placeholder="例：090-1234-5678" />
                    </FormControl>
                  </FormFieldWrapper>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 6. メールアドレス */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormFieldWrapper label="メールアドレス">
                    <FormControl>
                      <Input type="email" {...field} placeholder="例：test@example.com" />
                    </FormControl>
                  </FormFieldWrapper>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 7. 住所 */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormFieldWrapper label="住所">
                    <FormControl>
                      <Input {...field} placeholder="例：東京都渋谷区…" />
                    </FormControl>
                  </FormFieldWrapper>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 8. 身長・体重 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldWrapper label="身長" description="（cm）">
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          placeholder="例：160"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*$/.test(value)) {
                              field.onChange(value);
                            }
                          }}
                        />
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
                    <FormFieldWrapper label="体重" description="（kg）">
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          placeholder="例：50"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*$/.test(value)) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                    </FormFieldWrapper>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 9. バスト・ウエスト・ヒップ */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bust"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldWrapper label="バスト" description="任意入力（cm）">
                      <FormControl>
                        <Input
                          type="text"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="未入力可"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*$/.test(value)) {
                              field.onChange(value);
                            }
                          }}
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
                    <FormFieldWrapper label="ウエスト" description="任意入力（cm）">
                      <FormControl>
                        <Input
                          type="text"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="未入力可"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*$/.test(value)) {
                              field.onChange(value);
                            }
                          }}
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
                    <FormFieldWrapper label="ヒップ" description="任意入力（cm）">
                      <FormControl>
                        <Input
                          type="text"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="未入力可"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*$/.test(value)) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                    </FormFieldWrapper>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 10. カップサイズ */}
            <FormField
              control={form.control}
              name="cupSize"
              render={({ field }) => (
                <FormItem>
                  <FormFieldWrapper label="カップサイズ">
                    <FormControl>
                      <select {...field} className="w-full">
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                        <option value="F">F</option>
                        <option value="G">G</option>
                        <option value="H">H</option>
                        <option value="I">I</option>
                        <option value="J">J</option>
                        <option value="K">K</option>
                        <option value="L">L</option>
                        <option value="M">M</option>
                        <option value="その他">その他</option>
                      </select>
                    </FormControl>
                  </FormFieldWrapper>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* 19. 写メ日記URL */}
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