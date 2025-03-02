import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTalentProfileSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Loader2, Upload } from "lucide-react";
import { useState } from "react";

const cupSizes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

export function TalentForm() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm({
    resolver: zodResolver(insertTalentProfileSchema),
    defaultValues: {
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
    },
  });

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("POST", "/api/talent/profile", formData);
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

  const onSubmit = (values: any) => {
    if (selectedFiles.length < 5) {
      toast({
        title: "エラー",
        description: "写真を最低5枚アップロードしてください",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("photos", file);
    });

    // 数値フィールドを変換
    const numericFields = ['age', 'guaranteeAmount', 'height', 'weight'];
    numericFields.forEach(field => {
      if (values[field]) {
        formData.append(field, String(parseInt(values[field], 10)));
      }
    });

    // 任意の数値フィールドを変換
    const optionalNumericFields = ['bust', 'waist', 'hip'];
    optionalNumericFields.forEach(field => {
      if (values[field]) {
        formData.append(field, String(parseInt(values[field], 10)));
      }
    });

    // 日付フィールドを変換
    if (values.availableFrom) {
      formData.append('availableFrom', new Date(values.availableFrom).toISOString());
    }
    if (values.availableTo) {
      formData.append('availableTo', new Date(values.availableTo).toISOString());
    }

    // その他のフィールドを追加
    formData.append('sameDay', String(values.sameDay));
    formData.append('location', values.location);
    formData.append('cupSize', values.cupSize);
    formData.append('serviceTypes', JSON.stringify(values.serviceTypes));

    mutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files].slice(0, 30));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="age"
            render={({ field: { onChange, ...field } }) => (
              <FormItem>
                <FormLabel>年齢</FormLabel>
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

        <div>
          <Label>写真 ({selectedFiles.length}/30)</Label>
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
                  className="aspect-square bg-muted rounded-lg overflow-hidden"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`プレビュー ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

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