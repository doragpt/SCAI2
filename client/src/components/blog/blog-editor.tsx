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
import Quill from 'quill';
// カスタム画像リサイザー機能用CSS
import './image-resize-simple.css';
import { ThumbnailImage } from "./thumbnail-image";
import { showImagePropertiesDialog } from "./image-property-dialog";
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

// HTMLの解析関数を追加
const parseHtml = (html: string) => {
  if (typeof document === 'undefined') return null;
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
};

// QuillコンテンツのDOM操作用の関数
const processQuillContent = (content: string): string => {
  // 内容が空の場合は空文字を返す
  if (!content) {
    console.log('processQuillContent: 空のコンテンツを処理しようとしました');
    return '';
  }
  
  console.log('processQuillContent: 処理開始', content.substring(0, 100) + '...');
  
  try {
    // HTML解析のための一時的な要素を作成
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // 全ての画像を処理
    const images = tempDiv.querySelectorAll('img');
    console.log(`processQuillContent: ${images.length}枚の画像を検出`);
    
    images.forEach((img, index) => {
      // サイズ情報を取得
      const width = img.getAttribute('width');
      const height = img.getAttribute('height');
      const style = img.getAttribute('style') || '';
      
      // サイズ情報があれば、それを保存
      if (width || height || style.includes('width') || style.includes('height')) {
        // リサイズ可能なクラスを追加
        if (!img.classList.contains('resizable-image')) {
          img.classList.add('resizable-image');
        }
        
        // data属性として保存
        if (width) {
          img.setAttribute('data-width', width);
        }
        if (height) {
          img.setAttribute('data-height', height);
        }
      }
    });
    
    // 最終的なHTMLを返す
    return tempDiv.innerHTML;
  } catch (error) {
    console.error('processQuillContent処理中にエラーが発生しました:', error);
    return content; // エラーの場合は元のコンテンツを返す
  }
};

// エディタのモジュール設定
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ]
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
  
  const form = useForm<BlogPost>({
    resolver: zodResolver(blogPostSchema),
    defaultValues,
  });
  
  // 記事の内容が読み込まれたかどうかのフラグ
  const [contentLoaded, setContentLoaded] = useState(false);

  // 初期データをコンソールに出力（デバッグ用）
  useEffect(() => {
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
      
      // フォームをリセット
      form.reset(resetData);
      
      // コンテンツが正しく読み込まれたことを示すフラグをセット
      setContentLoaded(true);
    }
  }, [initialData, form]);

  // ReactQuillの内容を更新（コンポーネントが完全に初期化された後）
  useEffect(() => {
    if (contentLoaded && initialData?.content) {
      console.log('ReactQuill のコンテンツを更新します');
      
      setTimeout(() => {
        // 画像サイズ属性を保持したHTMLを処理
        const processedContent = processQuillContent(initialData.content);
        
        if (quillRef.current) {
          const quill = quillRef.current.getEditor();
          // HTMLを直接インポート
          quill.clipboard.dangerouslyPasteHTML(processedContent);
          // フォーム値も同期
          form.setValue('content', processedContent, { shouldDirty: true });
          
          // エディタの準備完了後、画像にクリックイベントを追加
          setTimeout(() => {
            setupImageResizingHandlers();
          }, 500);
        }
      }, 300);
    }
  }, [contentLoaded, initialData, form]);

  // 画像リサイズ機能の設定関数
  const setupImageResizingHandlers = useCallback(() => {
    if (!quillRef.current) return;
    
    const editorRoot = quillRef.current.getEditor().root;
    const images = editorRoot.querySelectorAll('img');
    
    console.log(`画像リサイズ機能を設定: ${images.length}枚の画像を検出`);
    
    images.forEach((img: HTMLImageElement) => {
      // すでにリサイズ可能なクラスを持っていなければ追加
      if (!img.classList.contains('resizable-image')) {
        img.classList.add('resizable-image');
      }
      
      // クリックイベントを追加（シングルクリック）
      img.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('画像がクリックされました', img.src.substring(0, 30) + '...');
        
        // 他の選択済み画像からアクティブクラスを削除
        editorRoot.querySelectorAll('img.active').forEach((activeImg: Element) => {
          if (activeImg !== img) {
            activeImg.classList.remove('active');
          }
        });
        
        // この画像をアクティブにする
        img.classList.add('active');
        console.log('アクティブクラスを追加しました');
      };
      
      // ダブルクリックイベントを追加（画像プロパティダイアログを表示）
      img.ondblclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('画像がダブルクリックされました', img.src.substring(0, 30) + '...');
        
        // 画像プロパティダイアログを表示
        showImagePropertiesDialog(img, (width, height) => {
          // 新しいサイズで画像を更新
          img.width = width;
          img.height = height;
          img.style.width = `${width}px`;
          img.style.height = `${height}px`;
          img.setAttribute('width', width.toString());
          img.setAttribute('height', height.toString());
          
          // エディタの内容を更新してフォームに反映
          if (quillRef.current) {
            const content = quillRef.current.getEditor().root.innerHTML;
            const processedContent = processQuillContent(content);
            form.setValue('content', processedContent, { shouldDirty: true });
          }
        });
      };
    });
  }, [form]);

  // エディタ外クリック時にアクティブクラスを削除
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      console.log('ドキュメントクリック:', target.tagName, target.className);
      
      // クリックされた要素がエディタ内の要素でなく、ダイアログでもない場合
      if (quillRef.current) {
        const editorElement = quillRef.current.getEditor().root;
        const isClickInEditor = editorElement.contains(target);
        const isClickOnDialog = target.closest('.image-properties-dialog') !== null;
        
        if (!isClickInEditor && !isClickOnDialog) {
          // 全ての画像からアクティブクラスを削除
          const activeImages = editorElement.querySelectorAll('img.active');
          activeImages.forEach((img: Element) => {
            img.classList.remove('active');
          });
        }
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  // 画像のアップロード機能
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('画像のアップロードに失敗しました');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (quillRef.current) {
        // 画像URLをエディタに挿入
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection(true);
        
        // クリックされた位置（またはカーソル位置）に画像を挿入
        editor.insertEmbed(range.index, 'image', data.url);
        
        // 画像の後に空白を挿入してカーソルを移動
        editor.setSelection(range.index + 1, 0);
        
        // フォームの値も更新
        const content = editor.root.innerHTML;
        form.setValue('content', content, { shouldDirty: true });
        
        // 画像リサイズハンドラを再セットアップ
        setTimeout(() => {
          setupImageResizingHandlers();
        }, 200);
      }
      
      toast({
        title: '画像をアップロードしました',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      console.error('画像アップロードエラー:', error);
      toast({
        title: '画像のアップロードに失敗しました',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 記事の保存（新規作成または更新）
  const saveMutation = useMutation({
    mutationFn: (data: BlogPost) =>
      apiRequest(postId ? "PATCH" : "POST", postId ? `/api/blog/${postId}` : "/api/blog", data),
    onSuccess: () => {
      toast({
        title: postId ? "記事を更新しました" : "記事を作成しました",
        variant: "default",
      });
      
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POST_DETAIL(postId?.toString() || '')] });
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
      apiRequest(postId ? "PATCH" : "POST", postId ? `/api/blog/${postId}` : "/api/blog", data),
    onSuccess: () => {
      toast({
        title: "記事を公開しました",
        variant: "default",
      });
      
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POST_DETAIL(postId?.toString() || '')] });
      queryClient.invalidateQueries({ queryKey: ['blog-management'] }); // 店舗ブログ一覧のキャッシュを無効化
      
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

    // 下書き保存の場合（status='draft'）
    saveMutation.mutate(values);
  };

  // 公開ボタン押下時の処理
  const handlePublish = () => {
    const values = form.getValues();
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

  // エディター内容の変更イベント
  const handleEditorChange = (content: string) => {
    form.setValue("content", content, { shouldDirty: true });
    console.log('エディタ内容更新:', content.length, 'バイト');
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
                            className="flex h-10 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            サムネイル画像を選択
                          </label>
                          <input
                            type="file"
                            id="thumbnail-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleThumbnailUpload}
                          />
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                form.setValue("thumbnail", "", { shouldDirty: true })
                              }
                            >
                              削除
                            </Button>
                          )}
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>記事の内容</CardTitle>
              <CardDescription>
                記事の本文を入力してください。画像はファイルから挿入できます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`${isPreview ? 'hidden' : 'block'}`}>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={form.getValues().content}
                  onChange={handleEditorChange}
                  modules={modules}
                  formats={formats}
                  className="min-h-[400px]"
                />
              </div>
              
              <div className={`${isPreview ? 'block' : 'hidden'} prose max-w-none pt-4`}>
                <div dangerouslySetInnerHTML={{ __html: form.getValues().content || '' }} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={togglePreview}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {isPreview ? 'エディターを表示' : 'プレビュー'}
                </Button>
              </div>
              
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className={`${saveMutation.isPending ? 'opacity-0' : 'opacity-100'} mr-2 h-4 w-4`} />
                  下書き保存
                </Button>
                
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  公開する
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleSchedulingModal}
                  disabled={isScheduling}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  予約投稿
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
      
      {/* 予約投稿モーダル（この部分は簡略化しています - 実際には日時選択用のカレンダーUI等が必要） */}
      {isScheduling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>予約投稿</CardTitle>
              <CardDescription>
                記事を公開する日時を選択してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  選択した日時になると、記事が自動的に公開されます。
                </p>
                {/* ここに日時選択UIを配置 */}
                <div className="flex justify-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={toggleSchedulingModal}
              >
                キャンセル
              </Button>
              <Button
                onClick={() => handleSchedule(new Date(Date.now() + 24 * 60 * 60 * 1000))}
              >
                <Calendar className="mr-2 h-4 w-4" />
                予約設定
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}