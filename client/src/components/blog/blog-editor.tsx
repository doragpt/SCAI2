import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { blogPostSchema, type BlogPost, type ImageMetadata } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';
import Quill from 'quill';

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

const THUMBNAIL_ASPECT_RATIO = 4 / 3; // 4:3のアスペクト比
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function BlogEditor({ postId, initialData }: BlogEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const { toast } = useToast();
  const quillRef = useRef<ReactQuill>(null);
  const queryClient = useQueryClient();

  const form = useForm<BlogPost>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      ...initialData,
      scheduledAt: initialData?.scheduledAt ? new Date(initialData.scheduledAt) : undefined,
      publishedAt: initialData?.publishedAt ? new Date(initialData.publishedAt) : undefined,
      status: initialData?.status || "draft",
      thumbnail: initialData?.thumbnail || "",
      thumbnailMetadata: initialData?.thumbnailMetadata || null,
    } || {
      title: "",
      content: "",
      status: "draft",
      thumbnail: "",
      thumbnailMetadata: null,
      images: [],
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("ファイルサイズは5MB以下にしてください");
      }

      if (!file.type.startsWith('image/')) {
        throw new Error("画像ファイルのみアップロード可能です");
      }

      const formData = new FormData();
      formData.append('file', file);

      return apiRequest(
        "POST",
        "/api/upload",
        formData,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
    },
    onSuccess: (data) => {
      if (data?.url) {
        // サムネイルURLとメタデータを更新
        form.setValue("thumbnail", data.url);
        form.setValue("thumbnailMetadata", {
          url: data.url,
          width: data.dimensions ? parseInt(data.dimensions.split('x')[0]) : undefined,
          height: data.dimensions ? parseInt(data.dimensions.split('x')[1]) : undefined,
          type: data.contentType,
          createdAt: data.timestamp,
        });

        toast({
          title: "サムネイル画像をアップロードしました",
        });
      } else {
        throw new Error("アップロード結果のURLが見つかりません");
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

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleSubmit = useCallback(async (isDraft: boolean = false) => {
    try {
      const values = form.getValues();
      console.log('Form values:', values);

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

      const submissionData = {
        ...values,
        title: values.title.trim(),
        content: values.content.trim(),
        status: isDraft ? "draft" : isScheduling ? "scheduled" : "published",
        scheduledAt: isScheduling && values.scheduledAt ? new Date(values.scheduledAt) : null,
        publishedAt: !isDraft && !isScheduling ? new Date() : null,
      };

      console.log('Submission data:', submissionData);

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

  // サムネイル表示用のスタイルを定義
  const thumbnailContainerStyle = {
    position: 'relative' as const,
    width: '100%',
    paddingTop: `${(1 / THUMBNAIL_ASPECT_RATIO) * 100}%`, // 4:3のアスペクト比を維持
    backgroundColor: '#f1f5f9', // Tailwind の slate-100 相当
    borderRadius: '0.5rem',
    overflow: 'hidden'
  };

  const thumbnailImageStyle = {
    position: 'absolute' as const,
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  };

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
                <div style={thumbnailContainerStyle}>
                  <img
                    src={form.watch("thumbnail")}
                    alt="サムネイル画像"
                    style={thumbnailImageStyle}
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
                      <FormLabel>サムネイル画像（4:3）</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailUpload}
                              className="flex-1"
                            />
                            {uploadMutation.isPending && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>
                          {field.value && (
                            <div style={thumbnailContainerStyle}>
                              <img
                                src={field.value}
                                alt="サムネイル"
                                style={thumbnailImageStyle}
                              />
                              {form.watch("thumbnailMetadata") && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <p>サイズ: {form.watch("thumbnailMetadata")?.width}x{form.watch("thumbnailMetadata")?.height}</p>
                                  <p>タイプ: {form.watch("thumbnailMetadata")?.type}</p>
                                </div>
                              )}
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