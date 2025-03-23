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

// クライアントサイドのみでモジュールを登録（サーバーサイドレンダリングを避ける）
if (typeof window !== 'undefined') {
  try {
    // 登録の前にモジュールが正しいかチェック
    if (!ImageResize || typeof ImageResize !== 'function') {
      console.error('ImageResizeモジュールが正しくインポートされていません');
    } else {
      // 明示的にモジュールとして登録
      Quill.register('modules/imageResize', ImageResize);
      console.log('ImageResizeモジュールを登録しました');
    }
  } catch (err) {
    console.error('ImageResizeモジュール登録エラー:', err);
  }
}

// HTMLの解析関数を追加
const parseHtml = (html: string) => {
  if (typeof document === 'undefined') return null;
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
};

// QuillコンテンツのDOM操作用の統合関数（改善版）
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
      // すべての可能性のある属性からサイズ情報を取得
      const dataWidth = img.getAttribute('data-width');
      const width = img.getAttribute('width');
      const dataHeight = img.getAttribute('data-height');
      const height = img.getAttribute('height');
      
      // スタイル属性からの情報取得
      const style = img.getAttribute('style') || '';
      const styleWidthMatch = style.match(/width:\s*(\d+)px/);
      const styleHeightMatch = style.match(/height:\s*(\d+)px/);
      
      console.log(`画像[${index}]の属性 - data-width: ${dataWidth}, width: ${width}, style-width: ${styleWidthMatch ? styleWidthMatch[1] : 'なし'}`);
      
      // サイズ情報の優先順位付け
      const finalWidth = dataWidth || width || (styleWidthMatch ? styleWidthMatch[1] : null);
      const finalHeight = dataHeight || height || (styleHeightMatch ? styleHeightMatch[1] : null);
      
      if (finalWidth) {
        // 全ての場所に幅を設定（冗長に）
        img.setAttribute('width', finalWidth);
        img.setAttribute('data-width', finalWidth);
        
        // スタイル属性にも設定
        img.style.width = `${finalWidth}px`;
      }
      
      if (finalHeight) {
        // 全ての場所に高さを設定（冗長に）
        img.setAttribute('height', finalHeight);
        img.setAttribute('data-height', finalHeight);
        
        // スタイル属性にも設定
        img.style.height = `${finalHeight}px`;
      }
      
      // リサイズ可能なクラスを追加
      if (!img.classList.contains('resizable-image')) {
        img.classList.add('resizable-image');
      }
    });
    
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
  ],
  imageResize: {
    // 利用するモジュール（すべてのモジュールを有効化）
    modules: ['Resize', 'DisplaySize', 'Toolbar', 'BaseModule'],
    // 画像のリサイズハンドル設定
    handleStyles: {
      // 許可する最小・最大サイズ
      minWidth: 50,
      maxWidth: 1200,
      // サイズ表示オプション
      displaySize: true,
      // 属性の保存方法を指定（すべての属性を保存）
      attributors: {
        // 標準のHTML属性
        width: 'width',
        height: 'height',
        // カスタムデータ属性（バックアップ用）
        dataWidth: 'data-width',
        dataHeight: 'data-height',
        // クラス名も設定
        class: 'resizable-image'
      },
      // サイズ変更後は即座に適用
      autoApply: true
    }
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
    try {
      // 正規表現を使って画像タグを探し、サイズ情報を直接埋め込む
      const imgPattern = /<img[^>]*>/gi;
      
      return html.replace(imgPattern, (imgTag) => {
        // style属性からサイズ情報を抽出
        const styleMatch = imgTag.match(/style="([^"]*?)"/i);
        let style = styleMatch ? styleMatch[1] : '';
        
        // width/heightスタイルを抽出
        const widthStyleMatch = style.match(/width:\s*(\d+)px/i);
        const heightStyleMatch = style.match(/height:\s*(\d+)px/i);
        
        // width/height属性を抽出
        const widthAttrMatch = imgTag.match(/width="(\d+)"/i);
        const heightAttrMatch = imgTag.match(/height="(\d+)"/i);
        
        // サイズ情報を決定（スタイルか属性から）
        const width = widthStyleMatch ? widthStyleMatch[1] : (widthAttrMatch ? widthAttrMatch[1] : null);
        const height = heightStyleMatch ? heightStyleMatch[1] : (heightAttrMatch ? heightAttrMatch[1] : null);
        
        if (width || height) {
          // サイズ情報をdata属性としてタグに追加
          let newImgTag = imgTag;
          
          // すでにdata属性がある場合は置き換え、なければ追加
          if (width) {
            if (newImgTag.includes('data-width=')) {
              newImgTag = newImgTag.replace(/data-width="[^"]*"/, `data-width="${width}"`);
            } else {
              newImgTag = newImgTag.replace(/<img/, `<img data-width="${width}"`);
            }
            
            // width属性も必ず設定
            if (newImgTag.includes('width=')) {
              newImgTag = newImgTag.replace(/width="[^"]*"/, `width="${width}"`);
            } else {
              newImgTag = newImgTag.replace(/<img/, `<img width="${width}"`);
            }
          }
          
          if (height) {
            if (newImgTag.includes('data-height=')) {
              newImgTag = newImgTag.replace(/data-height="[^"]*"/, `data-height="${height}"`);
            } else {
              newImgTag = newImgTag.replace(/<img/, `<img data-height="${height}"`);
            }
            
            // height属性も必ず設定
            if (newImgTag.includes('height=')) {
              newImgTag = newImgTag.replace(/height="[^"]*"/, `height="${height}"`);
            } else {
              newImgTag = newImgTag.replace(/<img/, `<img height="${height}"`);
            }
          }
          
          // style属性にもサイズを確実に含める
          let newStyle = style;
          if (width && !newStyle.includes('width:')) {
            newStyle += `; width: ${width}px`;
          }
          if (height && !newStyle.includes('height:')) {
            newStyle += `; height: ${height}px`;
          }
          
          if (newStyle !== style) {
            if (styleMatch) {
              newImgTag = newImgTag.replace(/style="[^"]*"/, `style="${newStyle}"`);
            } else {
              newImgTag = newImgTag.replace(/<img/, `<img style="${newStyle}"`);
            }
          }
          
          return newImgTag;
        }
        
        return imgTag;
      });
    } catch (error) {
      console.error('画像サイズ保持処理でエラーが発生しました:', error);
      return html; // エラー時は元のHTMLをそのまま返す
    }
  };
  
  // ReactQuillの内容を更新（コンポーネントが完全に初期化された後）
  useEffect(() => {
    if (contentLoaded && initialData?.content) {
      console.log('ReactQuill のコンテンツを強制的に更新します');
      
      // ReactQuillにコンテンツを強制的に設定（画像サイズを復元）
      setTimeout(() => {
        // 画像サイズ属性を保持したHTMLを処理 (両方の処理方法を適用)
        // 新しい処理関数で前処理
        let processedContent = processQuillContent(initialData.content);
        // 既存の処理関数でさらに処理
        processedContent = preserveImageSizes(processedContent);
        
        if (quillRef.current) {
          const quill = quillRef.current.getEditor();
          // HTMLを直接インポート
          quill.clipboard.dangerouslyPasteHTML(processedContent);
          // フォーム値も同期 (処理済みコンテンツを直接使用)
          form.setValue('content', processedContent, { shouldDirty: true });
          
          // 画像の幅と高さを設定するための追加処理
          setTimeout(() => {
            try {
              // quillRefが存在するかチェック
              if (!quillRef.current) {
                console.warn('quillRefがnullです');
                return;
              }
              
              // DOM内の画像を探して直接サイズを設定
              const quillElement = quillRef.current.getEditor().root;
              const images = quillElement.querySelectorAll('img');
              
              images.forEach((img: HTMLImageElement) => {
                // さまざまな属性から幅を取得（特にdata-width属性を優先）
                const widthFromData = img.getAttribute('data-width');
                const widthFromAttr = img.getAttribute('width');
                const heightFromData = img.getAttribute('data-height');
                const heightFromAttr = img.getAttribute('height');
                
                // スタイル属性からも取得を試みる
                const style = img.getAttribute('style') || '';
                const styleWidthMatch = style.match(/width:\s*(\d+)px/);
                const styleHeightMatch = style.match(/height:\s*(\d+)px/);
                
                // 優先順位を付けて幅と高さを決定
                const width = widthFromData || widthFromAttr || (styleWidthMatch ? styleWidthMatch[1] : null);
                const height = heightFromData || heightFromAttr || (styleHeightMatch ? styleHeightMatch[1] : null);
                
                console.log(`検出された画像サイズ: data-width=${widthFromData}, width=${widthFromAttr}, style width=${styleWidthMatch ? styleWidthMatch[1] : 'なし'}`);
                
                if (width) {
                  const numWidth = parseInt(width);
                  // DOM要素に直接設定
                  img.width = numWidth;
                  img.setAttribute('width', width);
                  img.setAttribute('data-width', width);
                  
                  // インラインスタイルにも設定
                  if (style.includes('width:')) {
                    img.style.cssText = style.replace(/width:\s*\d+px/, `width: ${width}px`);
                  } else {
                    img.style.cssText = `${style}; width: ${width}px;`;
                  }
                  
                  console.log(`画像の幅を設定: ${width}px`);
                }
                
                if (height) {
                  const numHeight = parseInt(height);
                  // DOM要素に直接設定
                  img.height = numHeight;
                  img.setAttribute('height', height);
                  img.setAttribute('data-height', height);
                  
                  // インラインスタイルにも設定
                  if (style.includes('height:')) {
                    img.style.cssText = img.style.cssText.replace(/height:\s*\d+px/, `height: ${height}px`);
                  } else {
                    img.style.cssText = `${img.style.cssText}; height: ${height}px;`;
                  }
                  
                  console.log(`画像の高さを設定: ${height}px`);
                }
              });
            } catch (error) {
              console.error('画像サイズ復元に失敗しました:', error);
            }
          }, 500);
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

  // 送信前に画像サイズ属性を復元・強化する関数（簡素化版）
  const restoreImageSizes = (content: string): string => {
    // 内容が空の場合は空文字を返す
    if (!content) return '';
    
    try {
      // 処理中のエラーを防ぐためにDOMParserを使用せず、単純な文字列処理のみに依存する
      const imgTagRegex = /<img\s[^>]*>/g;
      
      // 全ての画像タグを処理
      const processedContent = content.replace(imgTagRegex, (imgTag) => {
        try {
          // 各種属性を探す
          const widthMatch = imgTag.match(/width=["'](\d+)["']/);
          const heightMatch = imgTag.match(/height=["'](\d+)["']/);
          const dataWidthMatch = imgTag.match(/data-width=["'](\d+)["']/);
          const dataHeightMatch = imgTag.match(/data-height=["'](\d+)["']/);
          
          // スタイル属性を解析
          const styleMatch = imgTag.match(/style=["']([^"']*)["']/);
          const styleValue = styleMatch ? styleMatch[1] : '';
          const styleWidthMatch = styleValue.match(/width:\s*(\d+)px/);
          const styleHeightMatch = styleValue.match(/height:\s*(\d+)px/);
          
          // 優先順位に従ってサイズを決定
          const width = dataWidthMatch?.[1] || widthMatch?.[1] || styleWidthMatch?.[1] || null;
          const height = dataHeightMatch?.[1] || heightMatch?.[1] || styleHeightMatch?.[1] || null;
          
          // サイズ情報がない場合は元のタグを返す
          if (!width && !height) return imgTag;
          
          // 修正したタグを構築
          let result = imgTag;
          
          // width属性を設定
          if (width) {
            if (result.includes(' width=')) {
              result = result.replace(/width=["'][^"']*["']/i, `width="${width}"`);
            } else {
              result = result.replace('<img ', `<img width="${width}" `);
            }
            
            // data-width属性も設定
            if (result.includes(' data-width=')) {
              result = result.replace(/data-width=["'][^"']*["']/i, `data-width="${width}"`);
            } else {
              result = result.replace('<img ', `<img data-width="${width}" `);
            }
          }
          
          // height属性を設定
          if (height) {
            if (result.includes(' height=')) {
              result = result.replace(/height=["'][^"']*["']/i, `height="${height}"`);
            } else {
              result = result.replace('<img ', `<img height="${height}" `);
            }
            
            // data-height属性も設定
            if (result.includes(' data-height=')) {
              result = result.replace(/data-height=["'][^"']*["']/i, `data-height="${height}"`);
            } else {
              result = result.replace('<img ', `<img data-height="${height}" `);
            }
          }
          
          // スタイル属性を構築
          let newStyle = styleValue || '';
          
          if (width) {
            if (newStyle.includes('width:')) {
              newStyle = newStyle.replace(/width:\s*\d+px/i, `width: ${width}px`);
            } else {
              newStyle += (newStyle ? '; ' : '') + `width: ${width}px`;
            }
          }
          
          if (height) {
            if (newStyle.includes('height:')) {
              newStyle = newStyle.replace(/height:\s*\d+px/i, `height: ${height}px`);
            } else {
              newStyle += (newStyle ? '; ' : '') + `height: ${height}px`;
            }
          }
          
          // スタイル属性を設定
          if (styleMatch) {
            result = result.replace(/style=["'][^"']*["']/i, `style="${newStyle}"`);
          } else {
            result = result.replace('<img ', `<img style="${newStyle}" `);
          }
          
          // class属性を追加（リサイズ可能な画像として識別）
          if (!result.includes(' class=')) {
            result = result.replace('<img ', '<img class="resizable-image" ');
          } else if (!result.includes('resizable-image')) {
            result = result.replace(/class=["']([^"']*)["']/i, 'class="$1 resizable-image"');
          }
          
          return result;
        } catch (tagError) {
          console.error('画像タグ処理中のエラー:', tagError);
          return imgTag; // エラーが発生した場合は元のタグを返す
        }
      });
      
      return processedContent;
    } catch (error) {
      console.error('画像サイズ復元処理でエラーが発生しました:', error);
      return content; // エラーの場合は元のコンテンツを返す
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
      // 新しい統合関数とレガシー関数の両方を実行し、確実にサイズが保持されるようにする
      const processedContent = processQuillContent(values.content);
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
                              // 基本的な変更を反映する前に画像サイズを処理
                              // コンテンツを直接処理して画像サイズ属性を保持
                              const processedContent = processQuillContent(content);
                              field.onChange(processedContent);
                              
                              // 画像サイズはQuillのimageResizeモジュールとカスタム処理の両方で対応
                              console.log('エディタコンテンツ変更 - 画像サイズを処理しました');
                              
                              // エディタが変更された後、画像にリサイズ機能を確実に適用
                              setTimeout(() => {
                                try {
                                  if (quillRef.current) {
                                    const editor = quillRef.current.getEditor();
                                    const images = editor.root.querySelectorAll('img');
                                    
                                    // 各画像にリサイズ用のクラスを追加
                                    images.forEach((img: HTMLImageElement) => {
                                      if (!img.classList.contains('resizable-image')) {
                                        img.classList.add('resizable-image');
                                      }
                                    });
                                    
                                    console.log(`エディタ内の${images.length}枚の画像にリサイズクラスを適用しました`);
                                  }
                                } catch (err) {
                                  console.error('画像リサイズクラス適用エラー:', err);
                                }
                              }, 100);
                            }}
                            className="min-h-[400px]"
                            onFocus={() => {
                              // エディタがフォーカスを受け取ったときに画像のスタイルを直接適用する
                              try {
                                if (quillRef.current) {
                                  const editor = quillRef.current.getEditor();
                                  const images = editor.root.querySelectorAll('img');
                                  
                                  // 各画像に直接スタイルを設定 (リサイズできるように)
                                  images.forEach((img: HTMLImageElement) => {
                                    // リサイズ可能なクラスを追加
                                    if (!img.classList.contains('resizable-image')) {
                                      img.classList.add('resizable-image');
                                    }
                                    
                                    // カーソルスタイルを設定（リサイズカーソルを表示）
                                    if (!img.style.cursor || img.style.cursor === 'default') {
                                      img.style.cursor = 'nwse-resize';
                                    }
                                    
                                    // リサイズハンドル用のスタイルを追加
                                    img.style.boxSizing = 'border-box';
                                    img.style.border = '1px solid transparent';
                                    
                                    // ホバー時に境界線を表示
                                    img.onmouseover = () => {
                                      img.style.border = '1px dashed #999';
                                    };
                                    
                                    img.onmouseout = () => {
                                      img.style.border = '1px solid transparent';
                                    };
                                  });
                                  
                                  console.log(`${images.length}枚の画像にリサイズスタイルを適用しました`);
                                }
                              } catch (err) {
                                console.error('画像スタイル適用エラー:', err);
                              }
                            }}
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