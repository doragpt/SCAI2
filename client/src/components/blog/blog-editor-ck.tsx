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
// @ts-ignore - ClassicEditorのtsエラーを回避
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

/**
 * CKEditorのカスタム設定
 * エディター全体の振る舞いを制御します
 * Classic buildのデフォルト機能に合わせて最適化
 */
const editorConfig = {
  // 基本ツールバー - ClassicEditorのビルドに含まれる機能のみ使用
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
      'undo',
      'redo'
    ]
  },
  // 言語設定
  language: 'ja',
  // 画像関連設定 - ClassicEditorのデフォルトスタイルに合わせる
  image: {
    styles: {
      // ClassicEditorが対応している画像スタイル
      options: [
        'default', // デフォルト（フル幅）
        'alignLeft', // 左寄せ
        'alignCenter', // 中央寄せ
        'alignRight' // 右寄せ
      ]
    },
    toolbar: [
      'imageStyle:alignLeft',
      'imageStyle:alignCenter',
      'imageStyle:alignRight',
      '|',
      'imageTextAlternative'
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
 * マークダウンをHTMLに変換する関数
 * シンプルなマークダウン記法をサポート
 */
const markdownToHtml = (markdown: string): string => {
  if (!markdown) {
    return '';
  }
  
  console.log('マークダウン処理開始:', markdown.substring(0, 100) + '...');
  
  try {
    let html = markdown;
    
    // 見出し変換 (## 見出し -> <h2>見出し</h2>)
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    
    // 太字変換 (**太字** -> <strong>太字</strong>)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 斜体変換 (*斜体* -> <em>斜体</em>)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // 箇条書きリスト変換
    // 箇条書きブロックを検出
    const ulBlocks = markdown.match(/(?:^\s*-\s+.+\n?)+/gm);
    if (ulBlocks) {
      ulBlocks.forEach(block => {
        const listItems = block
          .split('\n')
          .filter(line => line.trim().startsWith('- '))
          .map(line => {
            const content = line.trim().substring(2);
            return `<li>${content}</li>`;
          })
          .join('');
        
        html = html.replace(block, `<ul>${listItems}</ul>`);
      });
    }
    
    // 番号付きリスト変換
    // 番号付きリストブロックを検出
    const olBlocks = markdown.match(/(?:^\s*\d+\.\s+.+\n?)+/gm);
    if (olBlocks) {
      olBlocks.forEach(block => {
        const listItems = block
          .split('\n')
          .filter(line => /^\s*\d+\.\s+/.test(line))
          .map(line => {
            const content = line.trim().replace(/^\d+\.\s+/, '');
            return `<li>${content}</li>`;
          })
          .join('');
        
        html = html.replace(block, `<ol>${listItems}</ol>`);
      });
    }
    
    // リンク変換 ([リンクテキスト](URL) -> <a href="URL">リンクテキスト</a>)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // 画像変換 (![代替テキスト](画像URL) -> <img src="画像URL" alt="代替テキスト" />)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" width="100%" />');
    
    // 水平線変換 (--- -> <hr />)
    html = html.replace(/^---+$/gm, '<hr />');
    
    // 引用変換 (> 引用テキスト -> <blockquote>引用テキスト</blockquote>)
    // 引用ブロックを検出
    const quoteBlocks = markdown.match(/(?:^\s*>\s+.+\n?)+/gm);
    if (quoteBlocks) {
      quoteBlocks.forEach(block => {
        const content = block
          .split('\n')
          .filter(line => line.trim().startsWith('> '))
          .map(line => line.trim().substring(2))
          .join('<br>');
        
        html = html.replace(block, `<blockquote>${content}</blockquote>`);
      });
    }
    
    // 段落変換（空行で区切られた部分）
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
      const trimmed = p.trim();
      // すでにHTMLタグで囲まれていないテキストのみ段落タグで囲む
      if (!trimmed.startsWith('<') || !trimmed.endsWith('>')) {
        // すでに対応済みの要素（見出し、リスト、引用など）でなければ段落にする
        if (!/^<(h[1-6]|ul|ol|li|blockquote|hr)/.test(trimmed)) {
          return `<p>${p}</p>`;
        }
      }
      return p;
    }).join('\n');
    
    // 改行をHTMLの改行に変換（マークダウンでは単一の改行は無視される仕様だが、ここでは見やすさのために変換）
    // ES2018の後方否定先読みを使用しない方法で実装
    html = html.replace(/([^\n])\n([^\n])/g, '$1<br>$2');
    
    return html;
  } catch (error) {
    console.error('マークダウン変換中にエラーが発生しました:', error);
    return markdown; // エラーの場合は元のマークダウンを返す
  }
};

/**
 * HTMLを処理する関数
 * 必要に応じて画像サイズなどを調整
 */
const processEditorContent = (content: string): string => {
  if (!content) {
    console.log('processEditorContent: 空のコンテンツを処理しようとしました');
    return '';
  }
  
  // 既にHTMLの場合は処理
  if (content.includes('<') && content.includes('>')) {
    return content;
  }
  
  // マークダウンとして処理
  return markdownToHtml(content);
};

interface BlogEditorProps {
  postId?: number;
  initialData?: BlogPost;
}

export function BlogEditor({ postId, initialData }: BlogEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const { toast } = useToast();
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

    // HTMLコンテンツの簡易処理（必要に応じて）
    values.content = processEditorContent(values.content || '');

    // 下書き保存の場合（status='draft'）
    saveMutation.mutate(values);
  };

  // 公開ボタン押下時の処理
  const handlePublish = () => {
    const values = form.getValues();
    
    // HTMLコンテンツの簡易処理（必要に応じて）
    values.content = processEditorContent(values.content || '');
    
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
    
    // HTMLコンテンツの簡易処理（必要に応じて）
    values.content = processEditorContent(values.content || '');
    
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
                        {/* CKEditorの代わりにシンプルなテキストエリアを使用 */}
                        <div className="border rounded-md">
                          <div className="bg-muted p-2 border-b flex flex-wrap items-center gap-2">
                            {/* スタイルグループ */}
                            <div className="flex items-center border-r pr-2">
                              <button 
                                type="button"
                                className="p-1 hover:bg-muted-foreground/20 rounded"
                                onClick={() => {
                                  const textArea = document.getElementById('simple-editor') as HTMLTextAreaElement;
                                  if (textArea) {
                                    const start = textArea.selectionStart;
                                    const end = textArea.selectionEnd;
                                    const text = textArea.value;
                                    const beforeText = text.substring(0, start);
                                    const selectedText = text.substring(start, end);
                                    const afterText = text.substring(end);
                                    
                                    const newText = beforeText + '**' + selectedText + '**' + afterText;
                                    field.onChange(newText);
                                    
                                    // カーソル位置を調整
                                    setTimeout(() => {
                                      textArea.focus();
                                      textArea.setSelectionRange(start + 2, end + 2);
                                    }, 0);
                                  }
                                }}
                                title="太字 (**テキスト**)"
                              >
                                <strong>B</strong>
                              </button>
                              <button 
                                type="button"
                                className="p-1 hover:bg-muted-foreground/20 rounded"
                                onClick={() => {
                                  const textArea = document.getElementById('simple-editor') as HTMLTextAreaElement;
                                  if (textArea) {
                                    const start = textArea.selectionStart;
                                    const end = textArea.selectionEnd;
                                    const text = textArea.value;
                                    const beforeText = text.substring(0, start);
                                    const selectedText = text.substring(start, end);
                                    const afterText = text.substring(end);
                                    
                                    const newText = beforeText + '*' + selectedText + '*' + afterText;
                                    field.onChange(newText);
                                    
                                    // カーソル位置を調整
                                    setTimeout(() => {
                                      textArea.focus();
                                      textArea.setSelectionRange(start + 1, end + 1);
                                    }, 0);
                                  }
                                }}
                                title="斜体 (*テキスト*)"
                              >
                                <em>I</em>
                              </button>
                              <button 
                                type="button"
                                className="p-1 hover:bg-muted-foreground/20 rounded flex items-center"
                                onClick={() => {
                                  const textArea = document.getElementById('simple-editor') as HTMLTextAreaElement;
                                  if (textArea) {
                                    const start = textArea.selectionStart;
                                    const end = textArea.selectionEnd;
                                    const text = textArea.value;
                                    const lines = text.substring(0, start).split("\n");
                                    const currentLineStart = start - (lines[lines.length - 1] || "").length;
                                    const beforeText = text.substring(0, currentLineStart);
                                    const currentLine = text.substring(currentLineStart, end);
                                    const afterText = text.substring(end);
                                    
                                    const newLineStart = text.substring(0, start).lastIndexOf("\n") + 1;
                                    const indentation = " ".repeat(start - newLineStart);
                                    const newText = beforeText + "~~" + currentLine + "~~" + afterText;
                                    field.onChange(newText);
                                    
                                    // カーソル位置を調整
                                    setTimeout(() => {
                                      textArea.focus();
                                      textArea.setSelectionRange(start + 2, end + 2);
                                    }, 0);
                                  }
                                }}
                                title="取り消し線 (~~テキスト~~)"
                              >
                                <s>S</s>
                              </button>
                            </div>
                            
                            {/* 見出しグループ */}
                            <div className="flex items-center border-r pr-2">
                              <button 
                                type="button"
                                className="p-1 hover:bg-muted-foreground/20 rounded"
                                onClick={() => {
                                  const textArea = document.getElementById('simple-editor') as HTMLTextAreaElement;
                                  if (textArea) {
                                    const start = textArea.selectionStart;
                                    const end = textArea.selectionEnd;
                                    const text = textArea.value;
                                    const lines = text.substring(0, start).split("\n");
                                    const currentLineStart = start - (lines[lines.length - 1] || "").length;
                                    const beforeText = text.substring(0, currentLineStart);
                                    const currentLine = text.substring(currentLineStart, end);
                                    const afterText = text.substring(end);
                                    
                                    const newText = beforeText + "## " + currentLine + afterText;
                                    field.onChange(newText);
                                    
                                    // カーソル位置を調整
                                    setTimeout(() => {
                                      textArea.focus();
                                      textArea.setSelectionRange(start + 3, end + 3);
                                    }, 0);
                                  }
                                }}
                                title="見出し2 (## 見出し)"
                              >
                                <span className="font-bold text-sm">H2</span>
                              </button>
                              <button 
                                type="button"
                                className="p-1 hover:bg-muted-foreground/20 rounded"
                                onClick={() => {
                                  const textArea = document.getElementById('simple-editor') as HTMLTextAreaElement;
                                  if (textArea) {
                                    const start = textArea.selectionStart;
                                    const end = textArea.selectionEnd;
                                    const text = textArea.value;
                                    const lines = text.substring(0, start).split("\n");
                                    const currentLineStart = start - (lines[lines.length - 1] || "").length;
                                    const beforeText = text.substring(0, currentLineStart);
                                    const currentLine = text.substring(currentLineStart, end);
                                    const afterText = text.substring(end);
                                    
                                    const newText = beforeText + "### " + currentLine + afterText;
                                    field.onChange(newText);
                                    
                                    // カーソル位置を調整
                                    setTimeout(() => {
                                      textArea.focus();
                                      textArea.setSelectionRange(start + 4, end + 4);
                                    }, 0);
                                  }
                                }}
                                title="見出し3 (### 見出し)"
                              >
                                <span className="font-bold text-sm">H3</span>
                              </button>
                            </div>
                            
                            {/* リストグループ */}
                            <div className="flex items-center border-r pr-2">
                              <button 
                                type="button"
                                className="p-1 hover:bg-muted-foreground/20 rounded"
                                onClick={() => {
                                  const textArea = document.getElementById('simple-editor') as HTMLTextAreaElement;
                                  if (textArea) {
                                    const start = textArea.selectionStart;
                                    const end = textArea.selectionEnd;
                                    const text = textArea.value;
                                    
                                    // 選択範囲の各行に「- 」を追加
                                    const selectedText = text.substring(start, end);
                                    const lines = selectedText.split('\n');
                                    const processedLines = lines.map(line => `- ${line}`).join('\n');
                                    
                                    const beforeText = text.substring(0, start);
                                    const afterText = text.substring(end);
                                    const newText = beforeText + processedLines + afterText;
                                    
                                    field.onChange(newText);
                                    
                                    // カーソル位置を調整
                                    setTimeout(() => {
                                      textArea.focus();
                                      textArea.setSelectionRange(start + 2, start + processedLines.length);
                                    }, 0);
                                  }
                                }}
                                title="箇条書きリスト (- 項目)"
                              >
                                <span className="font-bold">•</span>
                              </button>
                              <button 
                                type="button"
                                className="p-1 hover:bg-muted-foreground/20 rounded"
                                onClick={() => {
                                  const textArea = document.getElementById('simple-editor') as HTMLTextAreaElement;
                                  if (textArea) {
                                    const start = textArea.selectionStart;
                                    const end = textArea.selectionEnd;
                                    const text = textArea.value;
                                    
                                    // 選択範囲の各行に番号を追加
                                    const selectedText = text.substring(start, end);
                                    const lines = selectedText.split('\n');
                                    const processedLines = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
                                    
                                    const beforeText = text.substring(0, start);
                                    const afterText = text.substring(end);
                                    const newText = beforeText + processedLines + afterText;
                                    
                                    field.onChange(newText);
                                    
                                    // カーソル位置を調整
                                    setTimeout(() => {
                                      textArea.focus();
                                      textArea.setSelectionRange(start + 3, start + processedLines.length);
                                    }, 0);
                                  }
                                }}
                                title="番号付きリスト (1. 項目)"
                              >
                                <span className="font-bold">1.</span>
                              </button>
                            </div>
                            
                            {/* メディアグループ */}
                            <div className="flex items-center border-r pr-2">
                              <button 
                                type="button"
                                className="p-1 hover:bg-muted-foreground/20 rounded"
                                onClick={() => {
                                  const textArea = document.getElementById('simple-editor') as HTMLTextAreaElement;
                                  if (textArea) {
                                    const start = textArea.selectionStart;
                                    const text = textArea.value;
                                    const beforeText = text.substring(0, start);
                                    const afterText = text.substring(start);
                                    
                                    const newText = beforeText + '![画像の説明](画像URL)' + afterText;
                                    field.onChange(newText);
                                    
                                    // カーソル位置を調整（URL部分にカーソルを置く）
                                    setTimeout(() => {
                                      textArea.focus();
                                      textArea.setSelectionRange(start + 8, start + 13);
                                    }, 0);
                                  }
                                }}
                                title="画像挿入 (![説明](URL))"
                              >
                                <ImageIcon className="h-4 w-4" />
                              </button>
                              <button 
                                type="button"
                                className="p-1 hover:bg-muted-foreground/20 rounded"
                                onClick={() => {
                                  const textArea = document.getElementById('simple-editor') as HTMLTextAreaElement;
                                  if (textArea) {
                                    const start = textArea.selectionStart;
                                    const end = textArea.selectionEnd;
                                    const text = textArea.value;
                                    const beforeText = text.substring(0, start);
                                    const selectedText = text.substring(start, end) || 'リンクテキスト';
                                    const afterText = text.substring(end);
                                    
                                    const newText = beforeText + '[' + selectedText + '](URL)' + afterText;
                                    field.onChange(newText);
                                    
                                    // カーソル位置を調整（URL部分にカーソルを置く）
                                    setTimeout(() => {
                                      textArea.focus();
                                      textArea.setSelectionRange(start + selectedText.length + 3, start + selectedText.length + 6);
                                    }, 0);
                                  }
                                }}
                                title="リンク挿入 ([テキスト](URL))"
                              >
                                <span className="underline">URL</span>
                              </button>
                            </div>
                            
                            {/* 装飾グループ */}
                            <div className="flex items-center">
                              <button 
                                type="button"
                                className="p-1 hover:bg-muted-foreground/20 rounded"
                                onClick={() => {
                                  const textArea = document.getElementById('simple-editor') as HTMLTextAreaElement;
                                  if (textArea) {
                                    const start = textArea.selectionStart;
                                    const end = textArea.selectionEnd;
                                    const text = textArea.value;
                                    const lines = text.substring(0, start).split("\n");
                                    const currentLineStart = start - (lines[lines.length - 1] || "").length;
                                    const beforeText = text.substring(0, currentLineStart);
                                    const selectedText = text.substring(start, end);
                                    const afterText = text.substring(end);
                                    
                                    // 選択範囲の各行に「> 」を追加
                                    const blockLines = selectedText.split('\n');
                                    const processedLines = blockLines.map(line => `> ${line}`).join('\n');
                                    
                                    const newText = beforeText + processedLines + afterText;
                                    field.onChange(newText);
                                    
                                    // カーソル位置を調整
                                    setTimeout(() => {
                                      textArea.focus();
                                      textArea.setSelectionRange(beforeText.length + 2, beforeText.length + processedLines.length);
                                    }, 0);
                                  }
                                }}
                                title="引用 (> 引用文)"
                              >
                                <span className="font-bold text-sm">""</span>
                              </button>
                              <button 
                                type="button"
                                className="p-1 hover:bg-muted-foreground/20 rounded"
                                onClick={() => {
                                  const textArea = document.getElementById('simple-editor') as HTMLTextAreaElement;
                                  if (textArea) {
                                    const start = textArea.selectionStart;
                                    const text = textArea.value;
                                    const beforeText = text.substring(0, start);
                                    const afterText = text.substring(start);
                                    
                                    // 前後に改行を追加して区切る
                                    const newText = beforeText + '\n---\n' + afterText;
                                    field.onChange(newText);
                                    
                                    // カーソル位置を調整
                                    setTimeout(() => {
                                      textArea.focus();
                                      textArea.setSelectionRange(start + 5, start + 5);
                                    }, 0);
                                  }
                                }}
                                title="水平線 (---)"
                              >
                                <span className="font-bold text-sm">—</span>
                              </button>
                            </div>

                            <span className="text-xs text-muted-foreground ml-2">マークダウン記法が使用できます</span>
                          </div>
                          <textarea
                            id="simple-editor"
                            className="w-full min-h-[400px] p-4 outline-none resize-y"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="ここに記事を入力してください..."
                          />
                        </div>
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