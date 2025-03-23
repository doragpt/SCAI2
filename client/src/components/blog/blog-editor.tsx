import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { blogPostSchema, type BlogPost } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';
import Quill from 'quill';
import { ThumbnailImage } from "./thumbnail-image";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, Image as ImageIcon, Loader2, Save, Eye, ArrowLeft, Calendar } from "lucide-react";

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

export function BlogEditor({ postId, initialData }: BlogEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const { toast } = useToast();
  const quillRef = useRef<ReactQuill>(null);
  const queryClient = useQueryClient();

  // デフォルト値を設定
  const defaultValues = initialData ? {
    ...initialData,
    scheduled_at: initialData.scheduled_at ? new Date(initialData.scheduled_at) : null,
    published_at: initialData.published_at ? new Date(initialData.published_at) : null,
    status: initialData.status || "draft",
  } : {
    title: "",
    content: "",
    status: "draft" as const,
    thumbnail: "",
    images: [],
  };
  
  console.log('BlogEditor初期化: initialData=', initialData);
  console.log('BlogEditor初期化: defaultValues=', defaultValues);
  
  const form = useForm<BlogPost>({
    resolver: zodResolver(blogPostSchema),
    defaultValues,
  });
  
  // 記事の内容が読み込まれたかどうかのフラグ
  const [contentLoaded, setContentLoaded] = useState(false);

  // 初期データをコンソールに出力（デバッグ用）
  useEffect(() => {
    console.log('BlogEditor: initialData更新', initialData);
    
    // 初期データがある場合にフォームの値を明示的に設定
    if (initialData) {
      console.log('BlogEditor: フォーム値を再設定します');
      const resetData = {
        ...initialData,
        content: initialData.content || '',
        title: initialData.title || '',
        scheduled_at: initialData.scheduled_at ? new Date(initialData.scheduled_at) : null,
        published_at: initialData.published_at ? new Date(initialData.published_at) : null,
        status: initialData.status || "draft",
      };
      console.log('BlogEditor: 設定するフォームデータ', resetData);
      
      // フォームをリセット
      form.reset(resetData);
      
      // コンテンツが正しく読み込まれたことを示すフラグをセット
      setContentLoaded(true);
    }
  }, [initialData, form]);
  
  // HTML内の画像サイズ属性を保持する機能
  const preserveImageSizes = (html: string): string => {
    // img要素のwidth/height属性またはstyle属性を保持する処理
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.getElementsByTagName('img');
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      // 元の属性を保持
      const width = img.getAttribute('width');
      const height = img.getAttribute('height');
      const style = img.getAttribute('style');
      
      // 属性が存在する場合、data-属性として保存
      if (width) img.setAttribute('data-width', width);
      if (height) img.setAttribute('data-height', height);
      if (style) img.setAttribute('data-style', style);
    }
    
    // HTML文字列に変換して返す
    return doc.body.innerHTML;
  };
  
  // ReactQuillの内容を更新（コンポーネントが完全に初期化された後）
  useEffect(() => {
    if (contentLoaded && initialData?.content) {
      console.log('ReactQuill のコンテンツを強制的に更新します');
      
      // ReactQuillにコンテンツを強制的に設定
      setTimeout(() => {
        // 画像サイズ属性を保持したHTMLを設定
        const processedContent = preserveImageSizes(initialData.content);
        
        if (quillRef.current) {
          const quill = quillRef.current.getEditor();
          // HTMLを直接インポート
          quill.clipboard.dangerouslyPasteHTML(processedContent);
          // フォーム値も同期
          form.setValue('content', quill.root.innerHTML, { shouldDirty: true });
        } else {
          // フォールバック
          form.setValue('content', processedContent, { shouldDirty: true });
        }
        
        console.log('ReactQuill コンテンツ更新完了');
      }, 300);
    }
  }, [contentLoaded, initialData, form]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // 通常のfetchを使用してContent-Typeを自動設定させる
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ファイルのアップロードに失敗しました');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data?.url) {
        form.setValue("thumbnail", data.url);
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
      apiRequest("POST", "/api/blog", data),
    onSuccess: () => {
      toast({
        title: "記事を作成しました",
      });
      // すべてのブログ記事関連のキャッシュを無効化する
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS_STORE] });
      
      // キャッシュ更新について明示的にログ出力
      console.log('ブログ記事キャッシュを無効化しました:', QUERY_KEYS.BLOG_POSTS, QUERY_KEYS.BLOG_POSTS_STORE);
      
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
      apiRequest("PUT", `/api/blog/${postId}`, data),
    onSuccess: () => {
      toast({
        title: "記事を更新しました",
      });
      // すべてのブログ記事関連のキャッシュを無効化する
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS_STORE] });
      
      // キャッシュ更新について明示的にログ出力
      console.log('ブログ記事キャッシュを無効化しました:', QUERY_KEYS.BLOG_POSTS, QUERY_KEYS.BLOG_POSTS_STORE);
      
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
  };

  // 画像サイズ属性を復元する関数
  const restoreImageSizes = (content: string): string => {
    if (!content) return '';
    
    // HTMLをパース
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const images = doc.getElementsByTagName('img');
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      
      // data-属性から元のサイズを取得して復元
      const dataWidth = img.getAttribute('data-width');
      const dataHeight = img.getAttribute('data-height');
      const dataStyle = img.getAttribute('data-style');
      
      // width/height属性の復元
      if (dataWidth) img.setAttribute('width', dataWidth);
      if (dataHeight) img.setAttribute('height', dataHeight);
      if (dataStyle) img.setAttribute('style', dataStyle);
      
      // img要素のstyle属性に直接サイズ情報を追加
      const style = img.getAttribute('style') || '';
      const widthMatch = style.match(/width:\s*(\d+)px/);
      const heightMatch = style.match(/height:\s*(\d+)px/);
      
      if (widthMatch && heightMatch) {
        const width = widthMatch[1];
        const height = heightMatch[1];
        
        // width/height属性も設定
        img.setAttribute('width', width);
        img.setAttribute('height', height);
      }
    }
    
    return doc.body.innerHTML;
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
      if (isScheduling && (!values.scheduled_at || new Date(values.scheduled_at) <= new Date())) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "予約日時は現在時刻より後に設定してください",
        });
        return;
      }

      // 明示的にステータスを設定し、日付は必ずDate型で送信するように修正
      const newStatus = isDraft ? "draft" : isScheduling ? "scheduled" : "published";
      const newPublishedAt = !isDraft && !isScheduling ? new Date() : null;
      const newScheduledAt = isScheduling && values.scheduled_at ? new Date(values.scheduled_at) : null;
      
      // 画像サイズ属性を保持したコンテンツを作成
      const processedContent = restoreImageSizes(values.content);
      console.log('画像サイズ属性を保持したコンテンツを処理しました');

      // 型アノテーションを使用してnewStatusを列挙型として明示的に型付け
      const submissionData: Omit<BlogPost, 'status'> & { status: "draft" | "published" | "scheduled" } = {
        ...values,
        title: values.title.trim(),
        content: processedContent.trim(), // 処理済みのコンテンツを使用
        status: newStatus as "draft" | "published" | "scheduled",
        scheduled_at: newScheduledAt,
        published_at: newPublishedAt,
      };

      console.log('Submission data:', submissionData);
      console.log('送信先URL:', postId ? `/api/blog/${postId}` : "/api/blog");
      console.log('送信メソッド:', postId ? "PUT" : "POST");
      console.log('ステータス:', newStatus);
      console.log('公開日時:', newPublishedAt);
      console.log('予約日時:', newScheduledAt);

      try {
        if (postId) {
          await updateMutation.mutateAsync(submissionData);
          // 成功したらローカルのステータスも更新
          form.setValue("status", newStatus as "draft" | "published" | "scheduled");
          form.setValue("published_at", newPublishedAt);
          form.setValue("scheduled_at", newScheduledAt);
        } else {
          await createMutation.mutateAsync(submissionData);
        }
      } catch (submitError) {
        console.error('Submit mutation error details:', submitError);
        throw submitError; // エラーを上位ハンドラに伝播させる
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
                  <ThumbnailImage 
                    src={form.watch("thumbnail") || ''} 
                    alt="サムネイル画像"
                    className="w-full h-auto max-h-[400px] object-contain mx-auto rounded-lg"
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
                            <div className="relative w-full">
                              <ThumbnailImage
                                src={field.value || ''}
                                alt="サムネイル"
                                className="w-full h-auto max-h-[400px] object-contain mx-auto rounded-lg"
                              />
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
                            onChange={(content) => {
                              // Quillエディタの変更を処理
                              field.onChange(content);
                              
                              // 画像サイズの変更を監視して保存
                              if (quillRef.current) {
                                const quill = quillRef.current.getEditor();
                                const editorContainer = quill.root;
                                
                                // 画像要素にサイズ情報を保存
                                const images = editorContainer.querySelectorAll('img');
                                images.forEach((img: HTMLImageElement) => {
                                  if (img.style.width || img.style.height) {
                                    // width/height属性も設定
                                    if (img.style.width) {
                                      img.setAttribute('width', img.style.width.replace('px', ''));
                                    }
                                    if (img.style.height) {
                                      img.setAttribute('height', img.style.height.replace('px', ''));
                                    }
                                    
                                    // data-属性にも保存
                                    if (img.style.width) {
                                      img.setAttribute('data-width', img.style.width.replace('px', ''));
                                    }
                                    if (img.style.height) {
                                      img.setAttribute('data-height', img.style.height.replace('px', ''));
                                    }
                                    if (img.getAttribute('style')) {
                                      img.setAttribute('data-style', img.getAttribute('style') || '');
                                    }
                                  }
                                });
                              }
                            }}
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
                    name="scheduled_at"
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