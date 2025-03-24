import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storeProfileSchema, type StoreProfile, type JobStatus, benefitTypes, benefitCategories } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Image } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { CKEditor } from "@ckeditor/ckeditor5-react";
// @ts-ignore - ClassicEditorのtsエラーを回避
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CustomUploadAdapterPlugin } from "@/components/blog/custom-upload-adapter";
import { ThumbnailImage } from "@/components/blog/thumbnail-image";
import "@/components/blog/ckeditor-custom.css";

type JobFormProps = {
  initialData?: StoreProfile;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function JobForm({ initialData, onSuccess, onCancel }: JobFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [catchPhraseLength, setCatchPhraseLength] = useState(initialData?.catch_phrase?.length || 0);
  const [descriptionLength, setDescriptionLength] = useState(initialData?.description?.length || 0);
  const [isUploadingTopImage, setIsUploadingTopImage] = useState(false);

  const form = useForm<StoreProfile>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      ...initialData,
      catch_phrase: initialData?.catch_phrase || "",
      description: initialData?.description || "",
      top_image: initialData?.top_image || "",
      benefits: initialData?.benefits || [],
      minimum_guarantee: initialData?.minimum_guarantee || 0,
      maximum_guarantee: initialData?.maximum_guarantee || 0,
      working_time_hours: initialData?.working_time_hours || 0,
      average_hourly_pay: initialData?.average_hourly_pay || 0,
      status: initialData?.status || "draft",
    }
  });
  
  // TOP画像アップロード処理
  const handleTopImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 画像サイズチェック - クライアント側で事前検証
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
      // メモリリーク防止のためにURL解放
      URL.revokeObjectURL(objectUrl);
      
      try {
        setIsUploadingTopImage(true);
        
        // FormDataを準備
        const formData = new FormData();
        formData.append('file', file);
        
        // ファイルをアップロード
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || '画像のアップロードに失敗しました');
        }
        
        const data = await response.json();
        form.setValue('top_image', data.url);
        
        toast({
          title: "店舗TOP画像をアップロードしました",
          description: "画像が正常にアップロードされました。"
        });
      } catch (error) {
        console.error('TOP画像アップロードエラー:', error);
        toast({
          variant: "destructive",
          title: "エラーが発生しました",
          description: error instanceof Error ? error.message : "画像のアップロードに失敗しました"
        });
      } finally {
        setIsUploadingTopImage(false);
      }
    };
    
    img.src = objectUrl;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: StoreProfile) => {
      const formattedData = {
        ...data,
        minimum_guarantee: Number(data.minimum_guarantee) || 0,
        maximum_guarantee: Number(data.maximum_guarantee) || 0,
        working_time_hours: Number(data.working_time_hours) || 0,
        average_hourly_pay: Number(data.average_hourly_pay) || 0,
        status: data.status || "draft",
        benefits: data.benefits || [],
      };

      // apiRequest関数は既にJSONレスポンスを返すため、直接返せる
      return await apiRequest("PATCH", "/api/store/profile", formattedData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.STORE_PROFILE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STORE_STATS],
      });

      toast({
        title: "店舗情報を保存しました",
        description: "変更内容が保存されました。",
      });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error.message || "店舗情報の保存に失敗しました",
      });
    },
  });

  const onSubmit = (data: StoreProfile) => {
    mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="catch_phrase"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">キャッチコピー</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="キャッチコピーを入力してください（300文字以内）"
                  className="min-h-[100px]"
                  onChange={(e) => {
                    field.onChange(e);
                    setCatchPhraseLength(e.target.value.length);
                  }}
                />
              </FormControl>
              <div className="text-sm text-muted-foreground">
                {catchPhraseLength}/300文字
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TOP画像アップロード */}
        <FormField
          control={form.control}
          name="top_image"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">店舗TOP画像（640×640px推奨）</FormLabel>
              <div className="flex items-center gap-6">
                {field.value && (
                  <div className="relative h-64 w-64 overflow-hidden rounded-md border">
                    <ThumbnailImage
                      src={field.value}
                      alt="店舗TOP画像"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="top-image-upload"
                        className="flex h-10 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <Image className="mr-2 h-4 w-4" />
                        {field.value
                          ? "TOP画像を変更"
                          : "TOP画像をアップロード"}
                        <input
                          id="top-image-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleTopImageUpload}
                          disabled={isUploadingTopImage}
                        />
                      </label>
                      {isUploadingTopImage && (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground ml-2" />
                      )}
                    </div>
                  </FormControl>
                  {field.value && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.setValue('top_image', '')}
                    >
                      TOP画像を削除
                    </Button>
                  )}
                  <p className="text-sm text-muted-foreground">
                    店舗TOP画像は640×640pxのサイズで表示されます
                  </p>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 店舗説明 - CKEditor */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">お仕事の内容</FormLabel>
              <FormControl>
                <div className="border rounded-md overflow-hidden">
                  <CKEditor
                    editor={ClassicEditor}
                    data={field.value}
                    config={{
                      language: 'ja',
                      toolbar: [
                        'heading', '|',
                        'bold', 'italic', 'link', '|',
                        'bulletedList', 'numberedList', '|',
                        'insertTable', '|',
                        'uploadImage', '|',
                        'undo', 'redo'
                      ],
                      extraPlugins: [(editor) => {
                        CustomUploadAdapterPlugin(editor);
                      }],
                    }}
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      field.onChange(data);
                      setDescriptionLength(data.length);
                    }}
                  />
                </div>
              </FormControl>
              <div className="flex justify-between text-sm mt-2">
                <div className="text-muted-foreground">
                  {descriptionLength}/9000文字
                </div>
                <div className="text-muted-foreground italic">
                  リッチテキストエディタで店舗の魅力を表現できます
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-6">
          <div className="p-5 border border-amber-200 bg-amber-50 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-3">時給換算で表示</h3>
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="working_time_hours"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-medium">勤務時間（時間）</FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        value={field.value === 0 ? "" : field.value?.toString()}
                        placeholder="例：6"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="average_hourly_pay"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-medium">平均給与（円）</FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        value={field.value === 0 ? "" : field.value?.toString()}
                        placeholder="例：5000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-sm text-amber-700 mt-2">※ この情報を入力すると「〇時間勤務で平均給与〇円」という形式で表示されます</p>
            <p className="text-sm text-gray-500">※ 最低給与・最高給与の入力がある場合は従来の表示形式も併用されます</p>
          </div>
          
          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="minimum_guarantee"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="font-medium">最低給与（円）</FormLabel>
                  <FormControl>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      value={field.value === 0 ? "" : field.value?.toString()}
                      placeholder="例：30000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maximum_guarantee"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="font-medium">最高給与（円）</FormLabel>
                  <FormControl>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      value={field.value === 0 ? "" : field.value?.toString()}
                      placeholder="例：50000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="benefits"
          render={() => (
            <FormItem>
              <div className="space-y-8">
                {Object.entries(benefitTypes).map(([category, benefits]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-4">
                      {benefitCategories[category as keyof typeof benefitCategories]}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {benefits.map((benefit) => (
                        <FormField
                          key={benefit}
                          control={form.control}
                          name="benefits"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={benefit}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(benefit)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      const newValue = checked
                                        ? [...currentValue, benefit]
                                        : currentValue.filter((value) => value !== benefit);
                                      field.onChange(newValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {benefit}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    {category !== Object.keys(benefitTypes).slice(-1)[0] && (
                      <Separator className="my-6" />
                    )}
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存する
          </Button>
        </div>
      </form>
    </Form>
  );
}