import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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

// スタイル定義
const editorStyles = `
.ql-editor {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto !important;
  padding: 1rem;
}

.ql-container {
  height: auto !important;
}

.ql-editor img {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
}

.ql-editor p {
  margin: 1rem 0;
}
`;

// スタイルの適用
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = editorStyles;
  document.head.appendChild(style);
}

// 画像ライブラリモーダル
const ImageLibraryModal = ({ isOpen, onClose, onSelect, images = [], isLoading }: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  images: string[];
  isLoading: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return apiRequest<{ url: string; key: string }>(
        "POST",
        "/api/blog/upload-image",
        formData,
        { rawFormData: true }
      );
    },
    onMutate: () => {
      setIsUploading(true);
    },
    onSuccess: async (data) => {
      try {
        // 成功トースト表示
        toast({
          title: "成功",
          description: "画像がアップロードされました",
        });

        // キャッシュを完全にクリアして強制的に再取得
        await queryClient.resetQueries({ queryKey: [QUERY_KEYS.STORE_IMAGES] });

        // データを即座に再取得
        await queryClient.prefetchQuery({
          queryKey: [QUERY_KEYS.STORE_IMAGES],
          queryFn: async () => {
            const response = await apiRequest<string[]>("GET", QUERY_KEYS.STORE_IMAGES);
            return response || [];
          }
        });

        // アップロードした画像を自動選択してモーダルを閉じる
        if (data?.url) {
          onSelect(data.url);
          onClose();
        }
      } catch (error) {
        console.error('Cache update error:', error);
        toast({
          variant: "destructive",
          title: "エラー",
          description: "画像の更新に失敗しました",
        });
      }
    },
    onError: (error) => {
      console.error('Image upload error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "画像のアップロードに失敗しました",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const handleUpload = (file: File) => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <DialogTitle>画像選択</DialogTitle>
            <DialogDescription>
              残り {100 - (images?.length || 0)}/100
            </DialogDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            アップロード
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleUpload(file);
              }
              e.target.value = "";
            }}
          />
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {isLoading ? (
            <div className="col-span-3 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !images || images.length === 0 ? (
            <div className="col-span-3 text-center text-muted-foreground">
              アップロード済みの画像がありません
            </div>
          ) : (
            images.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="relative aspect-square cursor-pointer group overflow-hidden rounded-md"
                onClick={() => onSelect(image)}
              >
                <img
                  src={image}
                  alt={`ライブラリ画像 ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm">
                    選択
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Quillエディター
const ReactQuill = dynamic(async () => {
  const { default: RQ } = await import("react-quill");
  return function wrap(props: any) {
    return <RQ {...props} ref={props.forwardedRef} />;
  };
}, {
  ssr: false,
  loading: () => <div className="h-[400px] w-full animate-pulse bg-muted" />
});

// エディタ設定
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: ["", "center", "right", "justify"] }],
    ["link"],
    ["clean"]
  ]
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

export function BlogEditor({ postId, initialData }: { postId?: number; initialData?: BlogPost }) {
  const { user } = useAuth();
  const [isPreview, setIsPreview] = useState(false);
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  const quillRef = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 店舗の画像を取得するクエリを最適化
  const { data: storeImages, isLoading: isLoadingImages } = useQuery({
    queryKey: [QUERY_KEYS.STORE_IMAGES],
    queryFn: async () => {
      const response = await apiRequest<string[]>("GET", QUERY_KEYS.STORE_IMAGES);
      console.log('Store images response:', response);
      return response || [];
    },
    enabled: !!user?.id,
    refetchInterval: 1000, // 1秒ごとに再取得
    refetchOnWindowFocus: true, // ウィンドウフォーカス時に再取得
    staleTime: 0, // データを常に最新とみなす
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
    } catch (error) {
      console.error('Image insertion error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "画像の挿入に失敗しました",
      });
    }
  }, [quillRef, toast]);

  const onSubmit = async (data: typeof form.getValues) => {
    try {
      // 本文内の画像URLを収集
      const editor = document.querySelector('.ql-editor');
      const images = editor?.getElementsByTagName('img') || [];
      const imageUrls = Array.from(images).map(img => img.getAttribute('src')).filter(Boolean) as string[];

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
      <Card>
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
              <Button variant="outline" onClick={() => setIsPreview(!isPreview)}>
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