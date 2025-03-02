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
  talentProfileUpdateSchema,
} from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

type TalentProfileFormData = z.infer<typeof talentProfileUpdateSchema>;

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
  const [facePhotos, setFacePhotos] = useState<File[]>([]);
  const [fullBodyPhotos, setFullBodyPhotos] = useState<File[]>([]);
  const [otherPhotos, setOtherPhotos] = useState<File[]>([]);

  const form = useForm<TalentProfileFormData>({
    resolver: zodResolver(talentProfileUpdateSchema),
    defaultValues: {
      height: undefined,
      weight: undefined,
      bust: undefined,
      waist: undefined,
      hip: undefined,
      cupSize: undefined,
      bodyType: undefined,
      smoking: false,
      tattoo: false,
      piercing: false,
      selfIntroduction: "",
      serviceTypes: [],
      photoUrls: {
        face: [],
        fullBody: [],
        other: [],
      },
    },
  });

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
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: TalentProfileFormData) => {
    try {
      if (facePhotos.length < 3) {
        toast({
          title: "エラー",
          description: "顔写真を3枚以上アップロードしてください",
          variant: "destructive",
        });
        return;
      }

      if (fullBodyPhotos.length < 2) {
        toast({
          title: "エラー",
          description: "全身写真を2枚以上アップロードしてください",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();

      // 写真のアップロード
      facePhotos.forEach((file) => {
        formData.append("facePhotos", file);
      });
      fullBodyPhotos.forEach((file) => {
        formData.append("fullBodyPhotos", file);
      });
      otherPhotos.forEach((file) => {
        formData.append("otherPhotos", file);
      });

      // その他のデータを追加
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 写真アップロード */}
        <div className="space-y-4">
          <div>
            <Label>顔写真 (3枚以上必須)</Label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFacePhotos(Array.from(e.target.files || []))}
              className="mt-2"
            />
          </div>
          <div>
            <Label>全身写真 (2枚以上必須)</Label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFullBodyPhotos(Array.from(e.target.files || []))}
              className="mt-2"
            />
          </div>
          <div>
            <Label>その他の写真 (任意)</Label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setOtherPhotos(Array.from(e.target.files || []))}
              className="mt-2"
            />
          </div>
        </div>

        {/* 基本情報 */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'height', label: '身長 (cm)' },
            { name: 'weight', label: '体重 (kg)' },
            { name: 'bust', label: 'バスト (cm)' },
            { name: 'waist', label: 'ウエスト (cm)' },
            { name: 'hip', label: 'ヒップ (cm)' },
          ].map(({ name, label }) => (
            <FormField
              key={name}
              control={form.control}
              name={name as keyof TalentProfileFormData}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
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

        {/* 体型 */}
        <FormField
          control={form.control}
          name="bodyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>体型</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bodyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 特記事項 */}
        <div className="space-y-4">
          <Label>特記事項</Label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'smoking', label: '喫煙する' },
              { name: 'tattoo', label: 'タトゥーあり' },
              { name: 'piercing', label: 'ピアスあり' },
            ].map(({ name, label }) => (
              <FormField
                key={name}
                control={form.control}
                name={name as keyof TalentProfileFormData}
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">{label}</FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* 希望業種 */}
        <div className="space-y-4">
          <Label>希望業種</Label>
          <div className="grid grid-cols-2 gap-4">
            {serviceTypes.map((type) => (
              <FormField
                key={type.id}
                control={form.control}
                name="serviceTypes"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(type.id)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value || []), type.id]
                            : (field.value || []).filter((value) => value !== type.id);
                          field.onChange(newValue);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">{type.label}</FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

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