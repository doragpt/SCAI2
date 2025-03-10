// Add type declaration for quill-image-resize-module-react
declare module 'quill-image-resize-module-react';

import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { blogPostSchema, type BlogPost, type ImageMetadata } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';
import Quill from 'quill';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Image as ImageIcon, 
  Loader2, 
  Save, 
  Eye, 
  ArrowLeft, 
  Calendar,
  X as CloseIcon
} from "lucide-react";

// APIレスポンスの型定義を追加
interface UploadResponse {
  url: string;
  metadata?: ImageMetadata;
}

// Quillの設定
Quill.register('modules/imageResize', ImageResize);

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ],
  imageResize: {
    parchment: Quill.import('parchment'),
    modules: ['Resize', 'DisplaySize']
  }
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'align',
  'list', 'bullet',
  'link', 'image'
];

interface BlogEditorProps {
  postId?: number;
  initialData?: BlogPost;
}

// サムネイル画像のスタイル
const THUMBNAIL_STYLE = "w-full aspect-[4/3] object-cover rounded-lg bg-muted";

export function BlogEditor({ postId, initialData }: BlogEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);
  const { toast } = useToast();
  const quillRef = useRef<ReactQuill>(null);
  const queryClient = useQueryClient();

  const form = useForm<BlogPost>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      status: "draft",
      thumbnail: "",
      images: [],
    },
  });

  const uploadMutation = useMutation<UploadResponse, Error, File>({
    mutationFn: async (file: File) => {
      try {
        // ファイルサイズと形式のチェックを厳密化
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("ファイルサイズは5MB以下にしてください");
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error("JPG、PNG、WebP形式の画像のみアップロード可能です");
        }

        const formData = new FormData();
        formData.append('file', file);

        // アップロード進捗の模擬
        setUploadProgress(0);
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        const response = await apiRequest<UploadResponse>(
          "POST", 
          "/api/upload", 
          formData,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);

        return response;
      } catch (error) {
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data?.url) {
        form.setValue("thumbnail", data.url);
        if (data.metadata) {
          setImageMetadata(data.metadata);
          toast({
            title: "サムネイル画像をアップロードしました",
            description: `画像を最適化しました（${data.metadata.width}x${data.metadata.height}）`,
          });
        }
      } else {
          toast({
            variant: "destructive",
            title: "エラー",
            description: "アップロード結果のURLが見つかりません"
          });
      }
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "画像のアップロードに失敗しました",
      });
    },
  });

  const handleThumbnailUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "ファイルサイズは5MB以下にしてください",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "画像ファイルのみアップロード可能です",
        });
        return;
      }

      uploadMutation.mutate(file);
    }
  }, [uploadMutation, toast]);

  const handleThumbnailRemove = useCallback(() => {
    form.setValue("thumbnail", "");
    setImageMetadata(null);
    toast({
      title: "サムネイル画像を削除しました",
    });
  }, [form, toast]);

  const createMutation = useMutation({
    mutationFn: (data: BlogPost) =>
      apiRequest("POST", "/api/blog/posts", data),
    onSuccess: () => {
      toast({
        title: "記事を作成しました",
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      window.history.back();
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "記事の作成に失敗しました",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BlogPost) =>
      apiRequest("PUT", `/api/blog/posts/${postId}`, data),
    onSuccess: () => {
      toast({
        title: "記事を更新しました",
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      window.history.back();
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "記事の更新に失敗しました",
      });
    },
  });

  const handleSubmit = useCallback(async (isDraft: boolean = false) => {
    try {
      const values = form.getValues();

      // 必須フィールドのチェック
      if (!values.title.trim() || !values.content.trim()) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "タイトルと本文は必須です",
        });
        return;
      }

      // 予約投稿時の日時チェック
      if (isScheduling && (!values.scheduledAt || new Date(values.scheduledAt) <= new Date())) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "予約日時は現在時刻より後に設定してください",
        });
        return;
      }

      const submissionData: BlogPost = {
        ...values,
        title: values.title.trim(),
        content: values.content.trim(),
        status: isDraft ? "draft" : isScheduling ? "scheduled" : "published",
        scheduledAt: isScheduling && values.scheduledAt ? new Date(values.scheduledAt) : null,
        publishedAt: !isDraft && !isScheduling ? new Date() : null,
      };

      if (postId) {
        await updateMutation.mutateAsync(submissionData);
      } else {
        await createMutation.mutateAsync(submissionData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "投稿に失敗しました",
      });
    }
  }, [form, isScheduling, postId, createMutation, updateMutation, toast]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{postId ? "ブログ記事の編集" : "新規記事作成"}</CardTitle>
              <CardDescription>
                記事の内容を入力し、プレビューで確認してから公開できます
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsPreview(!isPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreview ? "編集に戻る" : "プレビュー"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPreview ? (
            <div className="prose prose-sm max-w-none">
              {form.watch("thumbnail") && (
                <div className="relative w-full mb-6">
                  <img 
                    src={form.watch("thumbnail")} 
                    alt="サムネイル画像"
                    className={THUMBNAIL_STYLE}
                  />
                </div>
              )}
              <h1>{form.watch("title")}</h1>
              <div dangerouslySetInnerHTML={{ __html: form.watch("content") }} />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
                      <FormDescription>
                        4:3の比率で表示されます。推奨サイズ: 800x600ピクセル
                      </FormDescription>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleThumbnailUpload}
                              className="flex-1"
                              disabled={uploadMutation.isPending}
                            />
                            {uploadMutation.isPending && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>

                          {uploadProgress > 0 && (
                            <div className="space-y-2">
                              <Progress value={uploadProgress} />
                              <p className="text-sm text-muted-foreground">
                                アップロード中... {uploadProgress}%
                              </p>
                            </div>
                          )}

                          {field.value && (
                            <div className="relative w-full">
                              <img
                                src={field.value}
                                alt="サムネイル"
                                className={THUMBNAIL_STYLE}
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={handleThumbnailRemove}
                              >
                                <CloseIcon className="h-4 w-4" />
                              </Button>
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
                        <div className="border rounded-md">
                          <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            modules={modules}
                            formats={formats}
                            value={field.value}
                            onChange={field.onChange}
                            className="min-h-[400px]"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isScheduling && (
                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>公開予定日時</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              field.onChange(date);
                            }}
                            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            下書き保存
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsScheduling(!isScheduling)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            予約投稿
          </Button>

          <Button
            onClick={() => handleSubmit(false)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isScheduling ? "予約を確定" : "公開する"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}