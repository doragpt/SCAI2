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
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

// フォームのスキーマを定義
const talentProfileSchema = z.object({
  birthDate: z.string().min(1, "生年月日を入力してください"),
  age: z.number().optional(),
  guaranteeAmount: z.number().min(0, "日給保証額を入力してください"),
  availableFrom: z.string().min(1, "開始可能日を入力してください"),
  availableTo: z.string().min(1, "終了予定日を入力してください"),
  sameDay: z.boolean(),
  height: z.number().min(100, "身長を入力してください"),
  weight: z.number().min(30, "体重を入力してください"),
  bust: z.number().optional(),
  waist: z.number().optional(),
  hip: z.number().optional(),
  cupSize: z.string().min(1, "カップサイズを選択してください"),
  serviceTypes: z.array(z.string()).min(1, "希望業種を選択してください"),
  location: z.string().min(1, "希望エリアを入力してください"),
  employmentType: z.enum(["dispatch", "resident"]),
  photos: z.array(z.any()).optional(), // Add photos to the schema
});

type TalentProfileFormData = z.infer<typeof talentProfileSchema>;

const cupSizes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
const serviceTypes = [
  { id: "deriheru", label: "デリヘル" },
  { id: "hoteheru", label: "ホテヘル" },
  { id: "hakoheru", label: "箱ヘル" },
  { id: "esthe", label: "風俗エステ" },
  { id: "onakura", label: "オナクラ" },
  { id: "mseikan", label: "M性感" },
];

export function TalentForm() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [calculatedAge, setCalculatedAge] = useState<number | undefined>();
  const [isEstheSelected, setIsEstheSelected] = useState(false);

  const form = useForm({
    resolver: zodResolver(talentProfileSchema),
    defaultValues: {
      birthDate: "",
      age: undefined,
      guaranteeAmount: undefined,
      availableFrom: "",
      availableTo: "",
      sameDay: false,
      height: undefined,
      weight: undefined,
      bust: undefined,
      waist: undefined,
      hip: undefined,
      cupSize: "",
      photos: [],
      serviceTypes: [],
      location: "",
      employmentType: "dispatch", // 出稼ぎをデフォルトに
    },
  });

  const calculateAge = (birthDate: string) => {
    const birthday = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthDate = e.target.value;
    form.setValue("birthDate", birthDate);
    const age = calculateAge(birthDate);
    setCalculatedAge(age);
    form.setValue("age", age);
  };

  const handleServiceTypeChange = (checked: boolean, type: string) => {
    const currentTypes = form.getValues("serviceTypes") || [];
    let newTypes;
    if (checked) {
      newTypes = [...currentTypes, type];
    } else {
      newTypes = currentTypes.filter(t => t !== type);
    }
    form.setValue("serviceTypes", newTypes);
    setIsEstheSelected(newTypes.includes("esthe"));
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/talent/profile", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
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
      console.error('Mutation error:', error);
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: TalentProfileFormData) => {
    try {
      console.log('Form values:', values);

      if (selectedFiles.length < 5) {
        toast({
          title: "エラー",
          description: "写真を最低でも5枚アップロードしてください",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("photos", file);
      });

      // 数値フィールドを変換
      ['age', 'guaranteeAmount', 'height', 'weight'].forEach(field => {
        if (values[field] !== undefined) {
          formData.append(field, values[field].toString());
        }
      });

      // 任意の数値フィールドを変換
      ['bust', 'waist', 'hip'].forEach(field => {
        if (values[field]) {
          formData.append(field, values[field].toString());
        }
      });

      // その他のフィールドを追加
      formData.append('sameDay', String(values.sameDay));
      formData.append('cupSize', values.cupSize);
      formData.append('location', values.location);
      formData.append('birthDate', values.birthDate);
      formData.append('availableFrom', values.availableFrom);
      formData.append('availableTo', values.availableTo);
      formData.append('serviceTypes', JSON.stringify(values.serviceTypes || []));
      formData.append('employmentType', values.employmentType);

      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      await mutation.mutateAsync(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "プロフィールの作成に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files].slice(0, 30));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>希望形態</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="dispatch">出稼ぎ</SelectItem>
                  <SelectItem value="resident">在籍</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Label>写真 ({selectedFiles.length}/30)</Label>
          <p className="text-sm text-muted-foreground mb-2">
            最低でも5枚の写真が必要です（顔写真3枚、全身写真2枚）
          </p>
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("photo-upload")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              写真をアップロード
            </Button>
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {selectedFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="group relative aspect-square bg-muted rounded-lg overflow-hidden"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`プレビュー ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleBirthDateChange}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>年齢</FormLabel>
            <FormControl>
              <Input
                type="number"
                value={calculatedAge}
                disabled
                className="bg-muted"
              />
            </FormControl>
          </FormItem>
        </div>

        <div className="space-y-4">
          <Label>希望業種</Label>
          <div className="grid grid-cols-2 gap-4">
            {serviceTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  onCheckedChange={(checked) => {
                    handleServiceTypeChange(checked === true, type.id);
                  }}
                />
                <Label htmlFor={type.id}>{type.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="guaranteeAmount"
            render={({ field: { onChange, ...field } }) => (
              <FormItem>
                <FormLabel>日給保証（円）</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="availableFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>開始可能日</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="availableTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>終了予定日</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sameDay"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">当日の勤務も可能</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'height', label: '身長' },
            { name: 'weight', label: '体重' }
          ].map(({ name, label }) => (
            <FormField
              key={name}
              control={form.control}
              name={name as any}
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>{label} (cm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
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

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'bust', label: 'バスト' },
            { name: 'waist', label: 'ウエスト' },
            { name: 'hip', label: 'ヒップ' }
          ].map(({ name, label }) => (
            <FormField
              key={name}
              control={form.control}
              name={name as any}
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>{label} (cm) - 任意</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>希望エリア</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例: 東京都渋谷区" />
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