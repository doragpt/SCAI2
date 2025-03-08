import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { blogPostSchema, type BlogPost } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ImageIcon,
  Loader2,
  Save,
  Eye,
  ArrowLeft,
  Upload,
} from "lucide-react";

// 画像のリサイズハンドルのスタイル
const imageResizeCSS = `
.ql-editor {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.ql-editor img {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.ql-editor img:hover {
  outline: 2px solid #4299e1;
}

.ql-editor img.resizing {
  user-select: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  border: 1px solid #4299e1;
  border-radius: 50%;
  z-index: 100;
}

.resize-handle.se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}
`;

// カスタムスタイルを追加
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = imageResizeCSS;
  document.head.appendChild(style);
}

// Quillエディターを動的にインポート
const ReactQuill = dynamic(async () => {
  const { default: RQ } = await import("react-quill");

  // Quillインスタンスとモジュールを取得
  const Quill = RQ.Quill;

  // カスタムモジュールを追加
  Quill.register('modules/imageResize', function(quill: any) {
    quill.on('editor-change', function() {
      const editor = quill.root;
      const images = editor.getElementsByTagName('img');

      Array.from(images).forEach((img: HTMLImageElement) => {
        if (!img.parentElement || img.getAttribute('data-resize-initialized')) return;

        img.setAttribute('data-resize-initialized', 'true');

        // リサイズハンドルを追加
        const handle = document.createElement('div');
        handle.className = 'resize-handle se';
        img.parentElement.style.position = 'relative';
        img.parentElement.appendChild(handle);

        let isResizing = false;
        let startX = 0;
        let startY = 0;
        let startWidth = 0;
        let startHeight = 0;

        handle.addEventListener('mousedown', (e) => {
          isResizing = true;
          startX = e.clientX;
          startY = e.clientY;
          startWidth = img.offsetWidth;
          startHeight = img.offsetHeight;
          img.classList.add('resizing');

          const onMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // アスペクト比を維持しながらリサイズ
            const aspectRatio = startWidth / startHeight;
            const width = Math.max(50, startWidth + deltaX);
            const height = width / aspectRatio;

            img.style.width = `${width}px`;
            img.style.height = `${height}px`;
          };

          const onMouseUp = () => {
            isResizing = false;
            img.classList.remove('resizing');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
          e.preventDefault();
        });
      });
    });
  });

  return function wrap(props: any) {
    return <RQ {...props} ref={props.forwardedRef} />;
  };
}, {
  ssr: false,
  loading: () => <div className="h-[400px] w-full animate-pulse bg-muted" />
});

// エディタのツールバー設定
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: ["", "center", "right", "justify"] }],
    ["link"],
    ["clean"]
  ],
  imageResize: true
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "bullet",
  "align",
  "link",
  "image"
];

interface BlogEditorProps {
  postId?: number;
  initialData?: BlogPost;
}

export function BlogEditor({ postId, initialData }: BlogEditorProps) {
  const { user } = useAuth();
  const [isPreview, setIsPreview] = useState(false);
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData?.images || []);
  const quillRef = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 店舗の画像を取得
  const { data: storeImages, isLoading: isLoadingImages } = useQuery({
    queryKey: [QUERY_KEYS.STORE_IMAGES],
    queryFn: async () => {
      const response = await apiRequest<string[]>("GET", QUERY_KEYS.STORE_IMAGES);
      console.log('Store images response:', response); // Added for debugging
      return response || [];
    },
    enabled: !!user?.id,
  });

  const form = useForm({
    resolver: zodResolver(blogPostSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      status: "draft",
      images: [],
    },
  });

  const insertImage = useCallback((imageUrl: string) => {
    try {
      const quill = quillRef.current?.getEditor();
      if (!quill) {
        throw new Error("エディタが見つかりません");
      }

      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, "image", imageUrl);
      quill.setSelection(range.index + 1);
      setIsImageLibraryOpen(false);

      // アップロード済み画像リストを更新
      setUploadedImages(prev => [...prev, imageUrl]);
      form.setValue("images", [...uploadedImages, imageUrl]);
    } catch (error) {
      console.error('Image insertion error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "画像の挿入に失敗しました",
      });
    }
  }, [quillRef, toast, form, uploadedImages]);

  // フォームの送信処理
  const onSubmit = async (data: typeof form.getValues) => {
    try {
      // 本文内の画像URLを収集
      const editor = document.querySelector('.ql-editor');
      const images = editor?.getElementsByTagName('img') || [];
      const imageUrls = Array.from(images).map(img => img.getAttribute('src')).filter(Boolean) as string[];

      // フォームデータを更新
      const formData = {
        ...data,
        images: imageUrls
      };

      if (postId) {
        await updateMutation.mutateAsync(formData);
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "保存に失敗しました",
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form.getValues) =>
      apiRequest("POST", "/api/blog/posts", data),
    onSuccess: () => {
      toast({
        title: "記事を作成しました",
        description: "ブログ記事の作成が完了しました。",
      });
      window.location.href = "/store/dashboard";
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "記事の作成に失敗しました",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form.getValues) =>
      apiRequest("PUT", `/api/blog/posts/${postId}`, data),
    onSuccess: () => {
      toast({
        title: "記事を更新しました",
        description: "ブログ記事の更新が完了しました。",
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "記事の更新に失敗しました",
      });
    },
  });

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
              <h1>{form.watch("title")}</h1>
              <div dangerouslySetInnerHTML={{ __html: form.watch("content") }} />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>本文</FormLabel>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsImageLibraryOpen(true)}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        画像を挿入
                      </Button>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="border rounded-md">
                            <ReactQuill
                              forwardedRef={quillRef}
                              theme="snow"
                              modules={modules}
                              formats={formats}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="記事の本文を入力"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>公開設定</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="公開設定を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">下書き</SelectItem>
                          <SelectItem value="published">公開</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => {
            form.setValue("status", "draft");
            form.handleSubmit(onSubmit)();
          }}>
            下書き保存
          </Button>
          <Button onClick={() => {
            form.setValue("status", "published");
            form.handleSubmit(onSubmit)();
          }}>
            <Save className="h-4 w-4 mr-2" />
            公開する
          </Button>
        </CardFooter>
      </Card>
      <ImageLibraryModal
        isOpen={isImageLibraryOpen}
        onClose={() => setIsImageLibraryOpen(false)}
        onSelect={insertImage}
        images={storeImages || []}
        isLoading={isLoadingImages}
      />
    </div>
  );
}