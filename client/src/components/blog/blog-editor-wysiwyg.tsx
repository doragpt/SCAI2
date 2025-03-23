import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';
import { format } from "date-fns";
import { apiRequest, uploadPhoto, getSignedPhotoUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QUERY_KEYS } from "@/constants/queryKeys";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Loader2, 
  Save, 
  Calendar, 
  Clock, 
  Eye, 
  PlusCircle, 
  Trash2, 
  UploadCloud,
  Image,
  PenLine,
  Plus,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { FormLabel as Label } from "@/components/ui/form";
import { CalendarIcon } from "lucide-react";

// BlogPost型の定義
interface BlogPost {
  id?: number;
  store_id?: number;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'scheduled';
  published_at?: Date | null;
  scheduled_at?: Date | null;
  thumbnail?: string | null;
  images?: string[] | null;
  created_at?: Date;
  updated_at?: Date;
  category?: string;
  x_share?: boolean;
}

/**
 * Quillエディターのツールバーオプション
 * 直感的な操作のために必要な編集ツールを設定
 */
const toolbarOptions = [
  [{ 'font': [] }],
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'align': [] }],
  ['link', 'image'],
  [{ 'indent': '-1'}, { 'indent': '+1' }],
  ['blockquote', 'code-block'],
  ['clean']
];

/**
 * Quillエディターのモジュール設定
 */
const modules = {
  toolbar: toolbarOptions,
};

interface BlogEditorProps {
  postId?: number;
  initialData?: BlogPost;
}

export function BlogEditor({ postId, initialData }: BlogEditorProps) {
  console.log("BlogEditor初期化: initialData=", initialData);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScheduling, setIsScheduling] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialData?.thumbnail || null);
  const [isUploading, setIsUploading] = useState(false);
  // 複数の投稿日時を管理
  const [scheduleDates, setScheduleDates] = useState<Date[]>([]);
  // スケジュールの表示/非表示状態を管理
  const [showScheduleSection, setShowScheduleSection] = useState(false);

  // サムネイル画像のアップロード処理
  const uploadThumbnail = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `thumbnail_${Date.now()}.${fileExt}`;
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const result = await uploadPhoto(base64Data, fileName);
          console.log("Thumbnail uploaded:", result);
          setThumbnailUrl(result.url);
          form.setValue('thumbnail', result.url);
          toast({
            title: "サムネイル画像をアップロードしました",
            description: "ブログのサムネイル画像を設定しました。",
          });
        } catch (error) {
          console.error("Error uploading thumbnail:", error);
          toast({
            title: "エラー",
            description: `サムネイル画像のアップロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing thumbnail:", error);
      toast({
        title: "エラー",
        description: `サムネイル画像の処理に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  // サムネイル画像のURLが有効期限切れの場合に再取得
  useEffect(() => {
    const loadThumbnail = async () => {
      if (initialData?.thumbnail) {
        try {
          // キーを抽出（URLからファイル名部分を取得）
          const key = initialData.thumbnail.split('/').pop();
          if (key) {
            const signedUrl = await getSignedPhotoUrl(key);
            setThumbnailUrl(signedUrl);
          }
        } catch (error) {
          console.error("Error loading thumbnail:", error);
        }
      }
    };
    
    loadThumbnail();
  }, [initialData?.thumbnail]);

  // 下書き保存のミューテーション
  const saveMutation = useMutation({
    mutationFn: (data: BlogPost) =>
      apiRequest(
        postId ? "PUT" : "POST",
        `/api/blog/posts${postId ? `/${postId}` : ""}`,
        { ...data, status: "draft" }
      ),
    onSuccess: (data) => {
      toast({
        title: "下書きを保存しました",
        description: "ブログ記事を下書き保存しました。",
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      if (!postId && data.id) {
        window.history.replaceState(null, "", `/store/blog/edit/${data.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: `保存中にエラーが発生しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // 公開のミューテーション
  const publishMutation = useMutation({
    mutationFn: (data: BlogPost) => 
      apiRequest(
        postId ? "PUT" : "POST",
        `/api/blog/posts${postId ? `/${postId}` : ""}`,
        { ...data, status: "published" }
      ),
    onSuccess: () => {
      toast({
        title: "記事を公開しました",
        description: "ブログ記事を公開しました。",
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      window.location.href = "/store/blog";
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: `公開中にエラーが発生しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // フォーム定義
  const formSchema = z.object({
    title: z.string().min(1, "タイトルは必須です"),
    content: z.string(),
    status: z.enum(["draft", "published", "scheduled"]),
    category: z.string().optional(),
    x_share: z.boolean().optional(),
  });
  
  const form = useForm<BlogPost>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      status: "draft",
      x_share: true,
    },
  });

  const onSubmit = (values: BlogPost) => {
    // サムネイル画像のURLをフォーム値に含める
    const formValues = {
      ...values,
      thumbnail: thumbnailUrl
    };
    saveMutation.mutate(formValues);
  };

  const handlePublish = () => {
    const values = form.getValues();
    // サムネイル画像のURLとX共有設定をフォーム値に含める
    publishMutation.mutate({
      ...values,
      thumbnail: thumbnailUrl,
      x_share: values.x_share
    });
  };

  // 予約投稿モーダルの表示切替
  const toggleSchedulingModal = () => {
    setIsScheduling(!isScheduling);
  };

  // 日時表示切替
  const toggleScheduleSection = () => {
    setShowScheduleSection(!showScheduleSection);
  };

  // 日時追加
  const addScheduleDate = () => {
    // 現在時刻の24時間後をデフォルトに設定
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 1);
    
    setScheduleDates([...scheduleDates, newDate]);
  };
  
  // 日時削除
  const removeScheduleDate = (index: number) => {
    setScheduleDates(scheduleDates.filter((_, i) => i !== index));
  };
  
  // 日時更新
  const updateScheduleDate = (index: number, newDate: Date) => {
    const newDates = [...scheduleDates];
    newDates[index] = newDate;
    setScheduleDates(newDates);
  };

  // 予約投稿（単一の日時）
  const handleSchedule = (date: Date) => {
    const values = form.getValues();
    
    apiRequest(
      postId ? "PUT" : "POST",
      `/api/blog/posts${postId ? `/${postId}` : ""}`,
      { 
        ...values, 
        status: "scheduled",
        scheduled_at: date.toISOString(),
        thumbnail: thumbnailUrl,
        x_share: values.x_share
      }
    ).then(() => {
      setIsScheduling(false);
      toast({
        title: "予約投稿を設定しました",
        description: `${format(date, "yyyy/MM/dd HH:mm")}に公開されます。`,
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      window.location.href = "/store/blog";
    }).catch((error) => {
      toast({
        title: "エラー",
        description: `予約投稿の設定中にエラーが発生しました: ${error.message}`,
        variant: "destructive",
      });
    });
  };
  
  // 複数の日時での予約投稿
  const handleMultiSchedule = async () => {
    if (scheduleDates.length === 0) {
      toast({
        title: "日時が指定されていません",
        description: "少なくとも1つの投稿日時を追加してください。",
        variant: "destructive",
      });
      return;
    }
    
    const values = form.getValues();
    const basePost = {
      ...values,
      thumbnail: thumbnailUrl,
      status: "scheduled",
      x_share: values.x_share
    };
    
    try {
      // 投稿が既存のものか新規作成かで処理を分ける
      if (postId) {
        // 最初の日時は既存の投稿を更新
        await apiRequest(
          "PUT",
          `/api/blog/posts/${postId}`,
          { 
            ...basePost, 
            scheduled_at: scheduleDates[0].toISOString()
          }
        );
        
        // 2つ目以降は新規投稿として作成（コピー）
        for (let i = 1; i < scheduleDates.length; i++) {
          await apiRequest(
            "POST",
            "/api/blog/posts",
            { 
              ...basePost, 
              scheduled_at: scheduleDates[i].toISOString()
            }
          );
        }
      } else {
        // すべて新規投稿として作成
        for (let i = 0; i < scheduleDates.length; i++) {
          await apiRequest(
            "POST",
            "/api/blog/posts",
            { 
              ...basePost, 
              scheduled_at: scheduleDates[i].toISOString()
            }
          );
        }
      }
      
      toast({
        title: "複数の予約投稿を設定しました",
        description: `${scheduleDates.length}件の投稿スケジュールを作成しました。`,
      });
      
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      window.location.href = "/store/blog";
    } catch (error) {
      toast({
        title: "エラー",
        description: `予約投稿の設定中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="pb-2 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold">
                    {postId ? "ブログ記事を編集" : "新規ブログ記事"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    店舗のブログ記事を{postId ? "編集" : "作成"}します。
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleScheduleSection}
                    className={`h-9 ${showScheduleSection ? 'bg-primary/10 border-primary text-primary' : ''}`}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    予約投稿日時設定
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {/* 予約投稿日時設定 - ガールズヘブン風ドロップダウン方式 (ヘッダー直下に配置) */}
            {showScheduleSection && (
              <div className="border-b border-primary/20 bg-primary/5 px-6 py-4">
                <div className="mb-3">
                  <h3 className="text-base font-medium flex items-center mb-1">
                    <Calendar className="mr-2 h-4 w-4 text-primary" />
                    予約投稿日時設定
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    設定した日時に自動で公開されます
                  </p>
                </div>
                
                <div className="space-y-3 mb-3">
                  {/* 日時リスト */}
                  {scheduleDates.map((date, index) => (
                    <div key={index} className="flex items-center bg-white border rounded-md overflow-hidden">
                      <div className="p-2 bg-muted/10 border-r flex-shrink-0 w-8 flex justify-center">
                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                          {index + 1}
                        </span>
                      </div>
                      <div className="p-2 flex-grow flex items-center">
                        <input
                          type="datetime-local"
                          className="flex-grow border rounded px-2 py-1 text-sm"
                          min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                          value={format(date, "yyyy-MM-dd'T'HH:mm")}
                          onChange={(e) => {
                            if (e.target.value) {
                              updateScheduleDate(index, new Date(e.target.value));
                            }
                          }}
                        />
                        <span className="mx-2 text-xs text-muted-foreground hidden sm:inline">
                          {format(date, "yyyy年MM月dd日 HH:mm")}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScheduleDate(index)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">削除</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addScheduleDate}
                      className="h-8 border-primary/30 text-primary hover:bg-primary/5"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      日時追加
                    </Button>
                    
                    <Button
                      type="button" 
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowScheduleSection(false)}
                      className="h-8 text-muted-foreground"
                    >
                      閉じる
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                      {scheduleDates.length} 件設定中
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={handleMultiSchedule}
                      disabled={scheduleDates.length === 0}
                      className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Calendar className="mr-1 h-3.5 w-3.5" />
                      予約投稿を確定
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <CardContent className="space-y-6 pt-5">
              {/* カテゴリと記事タイトル */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <div className="space-y-2">
                    <Label>カテゴリ</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.watch("category") || ""}
                      onChange={(e) => form.setValue("category", e.target.value)}
                    >
                      <option value="">カテゴリを選択</option>
                      <option value="1">収入・待遇</option>
                      <option value="2">スタッフ紹介</option>
                      <option value="3">店舗の特徴</option>
                      <option value="4">福利厚生</option>
                      <option value="5">キャストさん募集</option>
                      <option value="6">採用条件</option>
                      <option value="7">お客様について</option>
                      <option value="8">お仕事内容</option>
                      <option value="9">日常の出来事</option>
                    </select>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>記事タイトル</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ここに記事のタイトルを入力してください (150文字以内)" 
                          {...field} 
                          className="h-10"
                        />
                      </FormControl>
                      <div className="flex justify-between mt-1">
                        <FormMessage />
                        <div className="text-xs text-muted-foreground">
                          {field.value ? `あと${150 - field.value.length}文字` : "あと150文字"}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* サムネイル画像 */}
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Image size={16} className="opacity-70" />
                      サムネイル画像
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) {
                                    uploadThumbnail(file);
                                  }
                                };
                                input.click();
                              }}
                              disabled={isUploading}
                              className="w-full"
                            >
                              {isUploading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <UploadCloud className="mr-2 h-4 w-4" />
                              )}
                              サムネイル画像をアップロード
                            </Button>
                            {thumbnailUrl && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setThumbnailUrl(null);
                                  form.setValue('thumbnail', null);
                                }}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                削除
                              </Button>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            サムネイル画像は記事一覧に表示されます。
                            <br />
                            最適なサイズは 240×320px です。
                          </div>
                        </div>
                        {thumbnailUrl && (
                          <div className="border rounded-md overflow-hidden h-40 flex items-center justify-center bg-muted/20">
                            <img 
                              src={thumbnailUrl} 
                              alt="サムネイル画像" 
                              className="max-h-full max-w-full object-contain" 
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* X（旧Twitter）での共有設定 */}
              <FormField
                control={form.control}
                name="x_share"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>X（旧Twitter）で共有</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        投稿と同時にX（旧Twitter）でも記事を共有します
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* エディタ */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>記事内容</FormLabel>
                    <FormControl>
                      <div className="border rounded-md overflow-hidden min-h-[400px]">
                        <ReactQuill
                          theme="snow"
                          value={field.value}
                          onChange={field.onChange}
                          modules={modules}
                          placeholder="ここに記事の内容を入力してください..."
                          className="h-[360px] overflow-y-auto"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex justify-between pt-2 border-t">
              <Button
                type="submit"
                variant="outline"
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                下書き保存
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleSchedulingModal}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  予約投稿
                </Button>
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishMutation.isPending}
                  className="gap-2"
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  公開する
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* 以前の予約投稿日時設定セクションは上部に移動しました */}
          
          {/* 従来の単一予約投稿モーダル */}
          {isScheduling && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>予約投稿設定</CardTitle>
                  <CardDescription>
                    記事を公開する日時を選択してください。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label>公開日時</Label>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                        <input
                          type="datetime-local"
                          className="w-full rounded-md border px-3 py-2"
                          min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                          defaultValue={format(
                            new Date(
                              new Date().getTime() + 24 * 60 * 60 * 1000
                            ),
                            "yyyy-MM-dd'T'HH:mm"
                          )}
                          id="schedule-date"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsScheduling(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const dateInput = document.getElementById(
                        "schedule-date"
                      ) as HTMLInputElement;
                      if (dateInput && dateInput.value) {
                        handleSchedule(new Date(dateInput.value));
                      }
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    予約する
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}