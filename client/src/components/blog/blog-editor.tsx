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

  // 画像リサイズハンドラを設定する関数
  const setupImageResizingHandlers = useCallback(() => {
    if (!quillRef.current) return;
    
    const editorRoot = quillRef.current.getEditor().root;
    const images = editorRoot.querySelectorAll('img');
    
    console.log(`画像リサイズハンドラを設定: ${images.length}枚の画像を検出`);
    
    images.forEach((img: HTMLImageElement) => {
      // すでにリサイズ可能なクラスを持っていなければ追加
      if (!img.classList.contains('resizable-image')) {
        img.classList.add('resizable-image');
      }
      
      // クリックイベントを追加
      img.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 他の選択済み画像からアクティブクラスを削除
        editorRoot.querySelectorAll('img.active').forEach((activeImg: Element) => {
          if (activeImg !== img) {
            activeImg.classList.remove('active');
          }
        });
        
        // この画像をアクティブにする
        img.classList.add('active');
        
        // 既存のリサイズハンドルを削除
        document.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
        
        // リサイズハンドルを追加
        const imgRect = img.getBoundingClientRect();
        
        // 4つの角にハンドルを追加
        ['se', 'sw', 'ne', 'nw'].forEach(pos => {
          const handle = document.createElement('div');
          handle.className = 'resize-handle ' + pos;
          document.body.appendChild(handle);
          
          // ハンドルの位置を設定
          if (pos === 'se') {
            handle.style.top = `${imgRect.bottom}px`;
            handle.style.left = `${imgRect.right}px`;
          } else if (pos === 'sw') {
            handle.style.top = `${imgRect.bottom}px`;
            handle.style.left = `${imgRect.left}px`;
          } else if (pos === 'ne') {
            handle.style.top = `${imgRect.top}px`;
            handle.style.left = `${imgRect.right}px`;
          } else if (pos === 'nw') {
            handle.style.top = `${imgRect.top}px`;
            handle.style.left = `${imgRect.left}px`;
          }
          
          // リサイズハンドルのマウスイベント
          handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            // 初期位置とサイズを記録
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = img.width;
            const startHeight = img.height;
            const aspectRatio = startWidth / startHeight;
            
            // ドキュメント全体のマウス移動を追跡
            const handleMouseMove = (moveEvent: MouseEvent) => {
              moveEvent.preventDefault();
              
              // マウスの移動量を計算
              let deltaX = moveEvent.clientX - startX;
              let deltaY = moveEvent.clientY - startY;
              
              // マウスの移動量からサイズ変更を計算
              let newWidth = startWidth;
              let newHeight = startHeight;
              
              // Shiftキーが押されている場合はアスペクト比を保持
              const maintainAspectRatio = moveEvent.shiftKey;
              
              // ハンドル位置に基づいてサイズ調整
              if (pos === 'se') {
                newWidth = startWidth + deltaX;
                if (maintainAspectRatio) {
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = startHeight + deltaY;
                }
              } else if (pos === 'sw') {
                newWidth = startWidth - deltaX;
                if (maintainAspectRatio) {
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = startHeight + deltaY;
                }
              } else if (pos === 'ne') {
                newWidth = startWidth + deltaX;
                if (maintainAspectRatio) {
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = startHeight - deltaY;
                }
              } else if (pos === 'nw') {
                newWidth = startWidth - deltaX;
                if (maintainAspectRatio) {
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = startHeight - deltaY;
                }
              }
              
              // 最小サイズを設定
              newWidth = Math.max(50, newWidth);
              newHeight = Math.max(50, newHeight);
              
              // 画像のサイズを更新
              img.style.width = `${newWidth}px`;
              img.style.height = `${newHeight}px`;
              img.width = newWidth;
              img.height = newHeight;
              
              // リサイズハンドルの位置を更新
              const newRect = img.getBoundingClientRect();
              document.querySelectorAll('.resize-handle').forEach((h: Element) => {
                const handleElem = h as HTMLElement;
                const handlePos = handleElem.classList.contains('se') ? 'se' :
                                  handleElem.classList.contains('sw') ? 'sw' :
                                  handleElem.classList.contains('ne') ? 'ne' : 'nw';
                                  
                if (handlePos === 'se') {
                  handleElem.style.top = `${newRect.bottom}px`;
                  handleElem.style.left = `${newRect.right}px`;
                } else if (handlePos === 'sw') {
                  handleElem.style.top = `${newRect.bottom}px`;
                  handleElem.style.left = `${newRect.left}px`;
                } else if (handlePos === 'ne') {
                  handleElem.style.top = `${newRect.top}px`;
                  handleElem.style.left = `${newRect.right}px`;
                } else if (handlePos === 'nw') {
                  handleElem.style.top = `${newRect.top}px`;
                  handleElem.style.left = `${newRect.left}px`;
                }
              });
            };
            
            // マウスボタンを離した時の処理
            const handleMouseUp = () => {
              // イベントリスナーを削除
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
              
              // 最終サイズを保存
              const finalWidth = img.width;
              const finalHeight = img.height;
              
              // 画像の属性を更新
              img.setAttribute('width', finalWidth.toString());
              img.setAttribute('height', finalHeight.toString());
              img.setAttribute('data-width', finalWidth.toString());
              img.setAttribute('data-height', finalHeight.toString());
              
              // エディタの内容を更新してフォームに反映
              setTimeout(() => {
                if (quillRef.current) {
                  const content = quillRef.current.getEditor().root.innerHTML;
                  const processedContent = processQuillContent(content);
                  form.setValue('content', processedContent, { shouldDirty: true });
                }
              }, 100);
            };
            
            // ドキュメント全体にイベントリスナーを追加
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          });
        });
      };
    });
  }, [form]);

  // エディタ外クリック時にリサイズハンドルを削除
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // クリックされた要素がエディタ内の要素でなく、ハンドルでもない場合
      if (quillRef.current) {
        const quillElement = quillRef.current.getEditor().root;
        
        if (!quillElement.contains(target) && 
            !target.classList.contains('resize-handle')) {
          // ハンドルを削除
          document.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
          
          // アクティブな画像の選択を解除
          quillElement.querySelectorAll('img.active').forEach((img: Element) => {
            img.classList.remove('active');
          });
        }
      }
    };
    
    // ドキュメント全体にクリックイベントリスナーを追加
    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      
      // クリーンアップ - ハンドルを削除
      document.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
    };
  }, []);

  // サムネイル画像アップロード
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

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

  // 記事作成
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

  // 記事更新
  const updateMutation = useMutation({
    mutationFn: (data: BlogPost) =>
      apiRequest("PUT", `/api/blog/${postId}`, data),
    onSuccess: () => {
      toast({
        title: "記事を更新しました",
      });
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS_STORE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POST_DETAIL(postId?.toString() || '')] });
      
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

  // 現在の状態を返す
  const isDraft = form.watch('status') === 'draft';

  // フォーム送信ハンドラ
  const onSubmit = (values: BlogPost) => {
    // フォームのバリデーションチェック
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

    // 明示的にステータスを設定
    const newStatus = isDraft ? "draft" : isScheduling ? "scheduled" : "published";
    const newPublishedAt = !isDraft && !isScheduling ? new Date() : null;
    const newScheduledAt = isScheduling && values.scheduled_at ? new Date(values.scheduled_at) : null;
    
    // 画像サイズ属性を保持したコンテンツを作成
    const processedContent = processQuillContent(values.content);

    // 送信用データを準備
    const submissionData = {
      ...values,
      content: processedContent,
      status: newStatus as "draft" | "published" | "scheduled",
      published_at: newPublishedAt,
      scheduled_at: newScheduledAt,
    };

    // 既存の記事の更新か新規作成かを判断
    if (postId) {
      updateMutation.mutate(submissionData);
    } else {
      createMutation.mutate(submissionData);
    }
  };

  // プレビューモードの切り替え
  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  // ファイル選択ハンドラ
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // ファイルタイプの確認
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "画像ファイルを選択してください",
      });
      return;
    }
    
    // ファイルサイズの確認 (5MB以下)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "ファイルサイズは5MB以下にしてください",
      });
      return;
    }
    
    // アップロード実行
    uploadMutation.mutate(file);
  };

  // 戻るボタンのハンドラ
  const handleBack = () => {
    window.history.back();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                戻る
              </Button>
              <CardTitle>{postId ? "記事の編集" : "新規記事作成"}</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={togglePreview}
              >
                <Eye className="mr-1 h-4 w-4" />
                {isPreview ? "編集" : "プレビュー"}
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending}
              >
                {(form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-1 h-4 w-4" />
                保存
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* タイトル入力 */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タイトル</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* 投稿状態選択 */}
            <div className="flex items-center space-x-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="radio"
                        id="status-draft"
                        checked={field.value === "draft"}
                        onChange={() => {
                          field.onChange("draft");
                          setIsScheduling(false);
                        }}
                      />
                    </FormControl>
                    <FormLabel htmlFor="status-draft" className="mb-0">下書き</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="radio"
                        id="status-published"
                        checked={field.value === "published" && !isScheduling}
                        onChange={() => {
                          field.onChange("published");
                          setIsScheduling(false);
                        }}
                      />
                    </FormControl>
                    <FormLabel htmlFor="status-published" className="mb-0">公開</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="radio"
                        id="status-scheduled"
                        checked={isScheduling}
                        onChange={() => {
                          field.onChange("scheduled");
                          setIsScheduling(true);
                        }}
                      />
                    </FormControl>
                    <FormLabel htmlFor="status-scheduled" className="mb-0">予約投稿</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            {/* 予約投稿日時 */}
            {isScheduling && (
              <FormField
                control={form.control}
                name="scheduled_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>予約投稿日時</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          field.onChange(date);
                        }}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* サムネイル画像 */}
            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>サムネイル画像</FormLabel>
                  <div className="flex items-start space-x-4">
                    <FormControl>
                      <Input
                        type="text"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="画像URL (自動設定されます)"
                        className="flex-1"
                      />
                    </FormControl>
                    <div className="relative">
                      <Input
                        id="thumbnail-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('thumbnail-upload')?.click()}
                        disabled={uploadMutation.isPending}
                        className="whitespace-nowrap"
                      >
                        {uploadMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="mr-2 h-4 w-4" />
                        )}
                        画像を選択
                      </Button>
                    </div>
                  </div>
                  {field.value && (
                    <div className="mt-2">
                      <ThumbnailImage
                        src={field.value}
                        alt="サムネイル"
                        className="h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* エディタ/プレビュー */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>本文</FormLabel>
                  <FormControl>
                    <div className="min-h-[400px] border rounded-md">
                      {isPreview ? (
                        <div 
                          className="p-4 prose prose-sm max-w-none min-h-[400px] h-full overflow-auto"
                          dangerouslySetInnerHTML={{ __html: field.value || '' }}
                        />
                      ) : (
                        <ReactQuill 
                          ref={quillRef}
                          theme="snow" 
                          value={field.value || ''}
                          onChange={(content) => {
                            field.onChange(content);
                            // エディタ内容が変更されたら画像リサイズハンドラを再設定
                            setTimeout(() => {
                              setupImageResizingHandlers();
                            }, 200);
                          }}
                          modules={modules}
                          formats={formats}
                          className="min-h-[370px]"
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
            >
              キャンセル
            </Button>
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="ml-auto"
            >
              {(form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {postId ? "更新" : "作成"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}