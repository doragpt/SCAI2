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
import { Image, UploadCloud } from "lucide-react";

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
}

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
import { Loader2, Save, Calendar, Clock, Eye } from "lucide-react";
import { FormLabel as Label } from "@/components/ui/form";
import { CalendarIcon } from "lucide-react";

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
  });
  
  const form = useForm<BlogPost>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      status: "draft",
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
    // サムネイル画像のURLをフォーム値に含める
    publishMutation.mutate({
      ...values,
      thumbnail: thumbnailUrl
    });
  };

  const toggleSchedulingModal = () => {
    setIsScheduling(!isScheduling);
  };

  const handleSchedule = (date: Date) => {
    const values = form.getValues();
    
    apiRequest(
      postId ? "PUT" : "POST",
      `/api/blog/posts${postId ? `/${postId}` : ""}`,
      { 
        ...values, 
        status: "scheduled",
        scheduled_at: date.toISOString(),
        thumbnail: thumbnailUrl
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

  return (
    <div className="container mx-auto py-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>
                {postId ? "ブログ記事を編集" : "新規ブログ記事"}
              </CardTitle>
              <CardDescription>
                店舗のブログ記事を{postId ? "編集" : "作成"}します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タイトル</FormLabel>
                    <FormControl>
                      <Input placeholder="記事のタイトルを入力" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>サムネイル画像</FormLabel>
                    <FormControl>
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
                            className="w-full md:w-auto"
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
                              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              削除
                            </Button>
                          )}
                        </div>
                        
                        {thumbnailUrl && (
                          <div className="relative border rounded-md p-2 max-w-md">
                            <div className="text-sm text-muted-foreground mb-2">プレビュー:</div>
                            <img 
                              src={thumbnailUrl} 
                              alt="サムネイル画像" 
                              className="max-h-48 object-contain" 
                            />
                          </div>
                        )}
                        
                        {!thumbnailUrl && (
                          <div className="border rounded-md p-4 text-center text-muted-foreground">
                            <Image className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p>サムネイル画像がありません</p>
                            <p className="text-xs mt-1">記事一覧やSNS共有時に表示される画像です</p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>本文</FormLabel>
                    <FormControl>
                      <div className="min-h-[400px] border rounded-md">
                        <ReactQuill 
                          theme="snow"
                          value={field.value || ''} 
                          onChange={field.onChange}
                          modules={modules}
                          placeholder="ここに記事を入力してください..."
                          className="h-[350px] overflow-y-auto"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  下書き保存
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleSchedulingModal}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  予約投稿
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handlePublish}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                公開する
              </Button>
            </CardFooter>
          </Card>
          
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