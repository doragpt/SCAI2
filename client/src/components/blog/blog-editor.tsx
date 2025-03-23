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

  // 送信前に画像サイズ属性を復元・強化する関数
  const restoreImageSizes = (content: string): string => {
    if (!content) return '';
    
    try {
      // 正規表現を使って画像タグを直接操作（より確実）
      const imgRegex = /<img[^>]*>/gi;
      
      return content.replace(imgRegex, (imgTag) => {
        // 各種属性から情報を取得
        const widthAttrMatch = imgTag.match(/width=["'](\d+)["']/i);
        const heightAttrMatch = imgTag.match(/height=["'](\d+)["']/i);
        const dataWidthMatch = imgTag.match(/data-width=["'](\d+)["']/i);
        const dataHeightMatch = imgTag.match(/data-height=["'](\d+)["']/i);
        const styleMatch = imgTag.match(/style=["']([^"']*)["']/i);
        
        let style = styleMatch ? styleMatch[1] : '';
        const widthStyleMatch = style.match(/width:\s*(\d+)px/i);
        const heightStyleMatch = style.match(/height:\s*(\d+)px/i);
        
        // 利用可能なすべてのソースから最も信頼性の高いサイズ情報を取得
        const width = dataWidthMatch ? dataWidthMatch[1] : 
                      widthAttrMatch ? widthAttrMatch[1] : 
                      widthStyleMatch ? widthStyleMatch[1] : null;
                      
        const height = dataHeightMatch ? dataHeightMatch[1] : 
                       heightAttrMatch ? heightAttrMatch[1] : 
                       heightStyleMatch ? heightStyleMatch[1] : null;
        
        if (width || height) {
          let newTag = imgTag;
          
          // 強制的にすべての属性を一度に追加（重複しても良い）
          if (width) {
            // width属性が存在するか確認し、なければ追加
            if (!newTag.match(/\swidth=["']/i)) {
              newTag = newTag.replace('<img', `<img width="${width}"`);
            } else {
              newTag = newTag.replace(/width=["'][^"']*["']/i, `width="${width}"`);
            }
            
            // data-width属性も設定
            if (!newTag.match(/\sdata-width=["']/i)) {
              newTag = newTag.replace('<img', `<img data-width="${width}"`);
            } else {
              newTag = newTag.replace(/data-width=["'][^"']*["']/i, `data-width="${width}"`);
            }
          }
          
          if (height) {
            // height属性が存在するか確認し、なければ追加
            if (!newTag.match(/\sheight=["']/i)) {
              newTag = newTag.replace('<img', `<img height="${height}"`);
            } else {
              newTag = newTag.replace(/height=["'][^"']*["']/i, `height="${height}"`);
            }
            
            // data-height属性も設定
            if (!newTag.match(/\sdata-height=["']/i)) {
              newTag = newTag.replace('<img', `<img data-height="${height}"`);
            } else {
              newTag = newTag.replace(/data-height=["'][^"']*["']/i, `data-height="${height}"`);
            }
          }
          
          // スタイル属性を設定
          let newStyle = style;
          
          // width をスタイルに追加
          if (width) {
            if (!newStyle.includes('width:')) {
              newStyle += (newStyle ? '; ' : '') + `width: ${width}px`;
            } else {
              newStyle = newStyle.replace(/width:\s*\d+px/i, `width: ${width}px`);
            }
          }
          
          // height をスタイルに追加
          if (height) {
            if (!newStyle.includes('height:')) {
              newStyle += (newStyle ? '; ' : '') + `height: ${height}px`;
            } else {
              newStyle = newStyle.replace(/height:\s*\d+px/i, `height: ${height}px`);
            }
          }
          
          // style属性を更新
          if (styleMatch) {
            newTag = newTag.replace(/style=["'][^"']*["']/i, `style="${newStyle}"`);
          } else {
            newTag = newTag.replace('<img', `<img style="${newStyle}"`);
          }
          
          return newTag;
        }
        
        return imgTag;
      });
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
                              try {
                                // まず、画像サイズ情報を保持する処理を適用
                                const processedContent = preserveImageSizes(content);
                                
                                // 処理済みのコンテンツでフォームを更新
                                field.onChange(processedContent);
                                
                                // 画像サイズの変更を監視してDOMにも直接反映
                                if (quillRef.current) {
                                  const quill = quillRef.current.getEditor();
                                  const editorContainer = quill.root;
                                  
                                  // すべての画像を処理
                                  setTimeout(() => {
                                    const images = editorContainer.querySelectorAll('img');
                                    
                                    images.forEach((img: HTMLImageElement) => {
                                      // data-属性からサイズ情報を取得
                                      const dataWidth = img.getAttribute('data-width');
                                      const dataHeight = img.getAttribute('data-height');
                                      
                                      // style属性から直接サイズを抽出
                                      const style = img.getAttribute('style') || '';
                                      const widthStyleMatch = style.match(/width:\s*(\d+)px/i);
                                      const heightStyleMatch = style.match(/height:\s*(\d+)px/i);
                                      
                                      // width/height属性を取得
                                      const width = img.getAttribute('width');
                                      const height = img.getAttribute('height');
                                      
                                      // 最も信頼性の高い情報源からサイズを決定
                                      const finalWidth = dataWidth || 
                                                         (widthStyleMatch ? widthStyleMatch[1] : null) || 
                                                         width;
                                      
                                      const finalHeight = dataHeight || 
                                                          (heightStyleMatch ? heightStyleMatch[1] : null) || 
                                                          height;
                                      
                                      // 確実にすべての属性とスタイルを設定
                                      if (finalWidth) {
                                        img.setAttribute('width', finalWidth);
                                        img.setAttribute('data-width', finalWidth);
                                        
                                        // style属性を更新
                                        let newStyle = img.getAttribute('style') || '';
                                        if (!newStyle.includes('width:')) {
                                          newStyle += `${newStyle ? '; ' : ''}width: ${finalWidth}px`;
                                        } else {
                                          newStyle = newStyle.replace(/width:\s*\d+px/i, `width: ${finalWidth}px`);
                                        }
                                        img.setAttribute('style', newStyle);
                                      }
                                      
                                      if (finalHeight) {
                                        img.setAttribute('height', finalHeight);
                                        img.setAttribute('data-height', finalHeight);
                                        
                                        // style属性を更新
                                        let newStyle = img.getAttribute('style') || '';
                                        if (!newStyle.includes('height:')) {
                                          newStyle += `${newStyle ? '; ' : ''}height: ${finalHeight}px`;
                                        } else {
                                          newStyle = newStyle.replace(/height:\s*\d+px/i, `height: ${finalHeight}px`);
                                        }
                                        img.setAttribute('style', newStyle);
                                      }
                                    });
                                    
                                    // Quillが画像を処理し直した後にフォーム値を更新
                                    field.onChange(editorContainer.innerHTML);
                                  }, 10);
                                }
                              } catch (error) {
                                console.error('画像サイズ保持処理エラー:', error);
                                // エラー時は通常の処理のみ
                                field.onChange(content);
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