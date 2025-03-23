import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { blogPostSchema, type BlogPost } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CustomUploadAdapterPlugin } from "./custom-upload-adapter";

// CKEditor用のカスタムスタイル
import "./ckeditor-custom.css";
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

// CKEditorの設定
const editorConfig = {
  // 基本ツールバー
  toolbar: {
    items: [
      'heading',
      '|',
      'bold',
      'italic',
      'link',
      'bulletedList',
      'numberedList',
      '|',
      'indent',
      'outdent',
      '|',
      'imageUpload',
      'blockQuote',
      'insertTable',
      'mediaEmbed',
      'undo',
      'redo'
    ]
  },
  // 言語設定
  language: 'ja',
  // 画像関連設定
  image: {
    // 画像スタイル
    styles: [
      'alignLeft', 
      'alignCenter', 
      'alignRight'
    ],
    // 画像ツールバー
    toolbar: [
      'imageStyle:alignLeft', 
      'imageStyle:alignCenter', 
      'imageStyle:alignRight',
      '|',
      'imageTextAlternative',
      '|',
      'resizeImage'
    ],
    resizeOptions: [
      {
        name: 'resizeImage:original',
        label: 'オリジナル',
        value: null
      },
      {
        name: 'resizeImage:50',
        label: '50%',
        value: '50'
      },
      {
        name: 'resizeImage:75',
        label: '75%',
        value: '75'
      }
    ]
  },
  // テーブル設定
  table: {
    contentToolbar: [
      'tableColumn', 
      'tableRow', 
      'mergeTableCells'
    ]
  },
  // プレースホルダーテキスト
  placeholder: 'ここに記事を入力してください...'
};

/**
 * CKEditorの内容を処理する関数
 * 画像のサイズやスタイルを保持する
 */
const processEditorContent = (content: string): string => {
  if (!content) {
    console.log('processEditorContent: 空のコンテンツを処理しようとしました');
    return '';
  }
  
  console.log('processEditorContent: 処理開始', content.substring(0, 100) + '...');
  
  try {
    // HTML解析のための一時的な要素を作成
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // 全ての画像を処理
    const images = tempDiv.querySelectorAll('img');
    console.log(`processEditorContent: ${images.length}枚の画像を検出`);
    
    images.forEach((img) => {
      // CKEditorの図形コンテナ内にある可能性があるので確認
      const figure = img.closest('figure');
      
      // すでにwidth/heightが指定されていればそれを維持、そうでなければstyle属性から抽出
      const width = img.getAttribute('width');
      const height = img.getAttribute('height');
      const style = img.getAttribute('style') || '';
      
      // styleからwidth/heightを抽出
      let styleWidth = null;
      let styleHeight = null;
      
      if (style.includes('width')) {
        const widthMatch = style.match(/width:\s*(\d+)px/);
        if (widthMatch && widthMatch[1]) {
          styleWidth = widthMatch[1];
        }
      }
      
      if (style.includes('height')) {
        const heightMatch = style.match(/height:\s*(\d+)px/);
        if (heightMatch && heightMatch[1]) {
          styleHeight = heightMatch[1];
        }
      }
      
      // 最終的な幅と高さを決定
      const finalWidth = width || styleWidth;
      const finalHeight = height || styleHeight;
      
      // 属性を設定
      if (finalWidth) {
        img.setAttribute('width', finalWidth);
        // styleにも設定
        if (!style.includes('width')) {
          img.style.width = `${finalWidth}px`;
        }
      }
      
      if (finalHeight) {
        img.setAttribute('height', finalHeight);
        // styleにも設定
        if (!style.includes('height')) {
          img.style.height = `${finalHeight}px`;
        }
      }
      
      // figureにもサイズ情報を伝播（CKEditorの動作をサポート）
      if (figure && (finalWidth || finalHeight)) {
        const figStyle = figure.getAttribute('style') || '';
        let newFigStyle = figStyle;
        
        if (finalWidth && !figStyle.includes('width')) {
          newFigStyle += `width: ${finalWidth}px;`;
        }
        
        if (newFigStyle !== figStyle) {
          figure.setAttribute('style', newFigStyle);
        }
      }
    });
    
    return tempDiv.innerHTML;
  } catch (error) {
    console.error('processEditorContent処理中にエラーが発生しました:', error);
    return content; // エラーの場合は元のコンテンツを返す
  }
};

interface BlogEditorProps {
  postId?: number;
  initialData?: BlogPost;
}

export function BlogEditor({ postId, initialData }: BlogEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editorRef = useRef<any>(null);

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
  
  const form = useForm<BlogPost>({
    resolver: zodResolver(blogPostSchema),
    defaultValues,
  });
  
  // 初期データをコンソールに出力（デバッグ用）
  useEffect(() => {
    if (initialData) {
      console.log('BlogEditor: フォーム値を設定');
      const resetData = {
        ...initialData,
        content: initialData.content || '',
        title: initialData.title || '',
        scheduled_at: initialData.scheduled_at ? new Date(initialData.scheduled_at) : null,
        published_at: initialData.published_at ? new Date(initialData.published_at) : null,
        status: initialData.status || "draft",
      };
      
      // フォームをリセット
      form.reset(resetData);
    }
  }, [initialData, form]);
  
  // 記事の保存（新規作成または更新）
  const saveMutation = useMutation({
    mutationFn: (data: BlogPost) =>
      apiRequest(postId ? "PATCH" : "POST", postId ? `/api/blog/post/${postId}` : "/api/blog/post", data),
    onSuccess: () => {
      toast({
        title: postId ? "記事を更新しました" : "記事を作成しました",
        variant: "default",
      });
      
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POST_DETAIL(postId?.toString() || '')] });
      queryClient.invalidateQueries({ queryKey: ["blog-management"] });
    },
    onError: (error: Error) => {
      console.error('保存エラー:', error);
      toast({
        title: "保存に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 記事の公開（公開/予約/下書き保存）
  const publishMutation = useMutation({
    mutationFn: (data: BlogPost) => 
      apiRequest(postId ? "PATCH" : "POST", postId ? `/api/blog/post/${postId}` : "/api/blog/post", data),
    onSuccess: () => {
      toast({
        title: "記事を公開しました",
        variant: "default",
      });
      
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POST_DETAIL(postId?.toString() || '')] });
      queryClient.invalidateQueries({ queryKey: ['blog-management'] }); // 店舗ブログ一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS_STORE] }); // 店舗ブログ一覧のキャッシュを無効化
      
      // 公開後は下書き一覧に戻る
      window.location.href = "/store/blog";
    },
    onError: (error: Error) => {
      console.error('公開エラー:', error);
      toast({
        title: "公開に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // フォーム送信ハンドラ
  const onSubmit = (values: BlogPost) => {
    console.log('送信データ:', values);

    // 最新のエディタ内容を取得して処理
    if (editorInstance) {
      const content = editorInstance.getData();
      const processedContent = processEditorContent(content);
      values.content = processedContent;
    }

    // 下書き保存の場合（status='draft'）
    saveMutation.mutate(values);
  };

  // 公開ボタン押下時の処理
  const handlePublish = () => {
    const values = form.getValues();
    
    // 最新のエディタ内容を取得して処理
    if (editorInstance) {
      const content = editorInstance.getData();
      const processedContent = processEditorContent(content);
      values.content = processedContent;
    }
    
    const data = { ...values, status: "published" as const };
    
    console.log('公開データ:', data);
    toast({
      title: "記事を公開しています...",
      variant: "default",
    });
    
    publishMutation.mutate(data);
  };

  // 予約投稿ボタン押下時の処理
  const handleSchedule = (date: Date) => {
    const values = form.getValues();
    
    // 最新のエディタ内容を取得して処理
    if (editorInstance) {
      const content = editorInstance.getData();
      const processedContent = processEditorContent(content);
      values.content = processedContent;
    }
    
    const data = {
      ...values,
      status: "scheduled" as const,
      scheduled_at: date,
    };
    
    console.log('予約投稿データ:', data);
    toast({
      title: `${format(date, 'yyyy年MM月dd日 HH:mm', { locale: ja })}に公開予約しました`,
      variant: "default",
    });
    
    setIsScheduling(false);
    publishMutation.mutate(data);
  };
  
  // 予約投稿モーダル切り替え
  const toggleSchedulingModal = () => {
    setIsScheduling(!isScheduling);
  };
  
  // プレビュー切り替え
  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  // サムネイル画像アップロード処理
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('サムネイル画像のアップロードに失敗しました');
      }
      
      const data = await response.json();
      console.log('サムネイルアップロード結果:', data);
      
      // フォームにサムネイルURLを設定
      form.setValue('thumbnail', data.url, { shouldDirty: true });
      
      toast({
        title: 'サムネイル画像をアップロードしました',
        variant: 'default',
      });
    } catch (error) {
      console.error('サムネイルアップロードエラー:', error);
      toast({
        title: 'サムネイル画像のアップロードに失敗しました',
        description: error instanceof Error ? error.message : '不明なエラー',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">
          {postId ? "ブログ記事を編集" : "新規ブログ記事"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>記事の基本情報</CardTitle>
              <CardDescription>
                タイトルやサムネイルなど、記事の基本情報を入力してください。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* タイトル */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タイトル</FormLabel>
                    <FormControl>
                      <Input placeholder="記事のタイトル" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* サムネイル */}
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>サムネイル画像</FormLabel>
                    <div className="flex items-center gap-4">
                      {field.value && (
                        <div className="relative h-24 w-44 overflow-hidden rounded-md border">
                          <ThumbnailImage
                            src={field.value}
                            alt="サムネイル"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="thumbnail-upload"
                            className="flex h-10 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? "サムネイルを変更"
                              : "サムネイルをアップロード"}
                            <input
                              id="thumbnail-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleThumbnailUpload}
                            />
                          </label>
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                form.setValue("thumbnail", "", {
                                  shouldDirty: true,
                                });
                              }}
                            >
                              削除
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>記事の内容</CardTitle>
              <CardDescription>
                記事の内容を入力してください。画像や装飾を追加できます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>内容</FormLabel>
                    <FormControl>
                      <div className={isPreview ? "hidden" : ""}>
                        <CKEditor
                          editor={ClassicEditor}
                          config={{
                            ...editorConfig,
                            extraPlugins: [CustomUploadAdapterPlugin]
                          }}
                          data={field.value || ''}
                          onReady={(editor) => {
                            editorRef.current = editor;
                            setEditorInstance(editor);
                            console.log('CKEditor準備完了:', editor);
                          }}
                          onChange={(event, editor) => {
                            const data = editor.getData();
                            console.log('エディタ内容更新:', data.length, 'バイト');
                            field.onChange(data);
                          }}
                        />
                      </div>
                    </FormControl>
                    {isPreview && (
                      <div className="prose max-w-none rounded-md border p-4">
                        <div dangerouslySetInnerHTML={{ __html: field.value || '' }} />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={togglePreview}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {isPreview ? "編集モードに戻る" : "プレビュー"}
                </Button>
              </div>
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
                      <FormLabel>公開日時</FormLabel>
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