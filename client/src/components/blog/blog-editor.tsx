import { useState, useRef, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Image as ImageIcon,
  Loader2,
  Save,
  Eye,
  ArrowLeft,
  Upload,
  Image,
  Plus,
  X,
  Copy,
  Trash,
  Info,
  Link,
  Edit,
} from "lucide-react";
import { Label } from "@/components/ui/label";

// Quillエディターを動的にインポート
const ReactQuill = dynamic(async () => {
  const { default: RQ } = await import("react-quill");
  return function wrap(props: any) {
    return <RQ {...props} ref={props.forwardedRef} />;
  };
}, {
  ssr: false,
  loading: () => <div className="h-[400px] w-full animate-pulse bg-muted" />
});

// Quillツールバーの設定
const modules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: ["", "center", "right", "justify"] }],
      ["link"],
      ["clean"]
    ],
  }
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

interface StoreImage {
  id: number;
  url: string;
  key: string;
  createdAt: string;
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  image?: {
    url: string;
    width: number;
    height: number;
    element?: HTMLImageElement;
  };
}

interface ImageEditDialogState {
  show: boolean;
  width: number;
  height: number;
  aspectRatio: number;
  element?: HTMLImageElement;
}

// コンテキストメニューの位置調整関数
const adjustMenuPosition = (x: number, y: number, menuWidth: number, menuHeight: number) => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let adjustedX = x;
  let adjustedY = y;

  if (x + menuWidth > windowWidth) {
    adjustedX = x - menuWidth;
  }

  if (y + menuHeight > windowHeight) {
    adjustedY = y - menuHeight;
  }

  return { x: adjustedX, y: adjustedY };
};

export function BlogEditor({ postId, initialData }: BlogEditorProps) {
  const { user } = useAuth();
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData?.images || []);
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.thumbnail || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ show: false, x: 0, y: 0 });
  const [imageEditDialog, setImageEditDialog] = useState<ImageEditDialogState>({
    show: false,
    width: 0,
    height: 0,
    aspectRatio: 1,
  });

  // 店舗の全画像を取得
  const { data: storeImages, isLoading: isLoadingImages } = useQuery<StoreImage[]>({
    queryKey: [QUERY_KEYS.STORE_IMAGES],
    queryFn: () => apiRequest("GET", "/api/store/images"),
  });

  const form = useForm({
    resolver: zodResolver(blogPostSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      status: "draft",
      images: [],
      thumbnail: null,
    },
  });

  // Quillエディタのコンテキストメニュー処理を設定
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handleEditorContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 右クリックした要素が画像の場合のみ処理
      if (target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();

        const img = target as HTMLImageElement;
        const menuWidth = 200;
        const menuHeight = 200;
        const { x, y } = adjustMenuPosition(e.clientX, e.clientY, menuWidth, menuHeight);

        setContextMenu({
          show: true,
          x,
          y,
          image: {
            url: img.src,
            width: img.naturalWidth,
            height: img.naturalHeight,
            element: img,
          }
        });
      }
    };

    // Quillエディタのルート要素にイベントリスナーを追加
    quill.root.addEventListener('contextmenu', handleEditorContextMenu);

    // クリーンアップ関数
    return () => {
      if (quill && quill.root) {
        quill.root.removeEventListener('contextmenu', handleEditorContextMenu);
      }
    };
  }, []);

  // 画像ライブラリのコンテキストメニュー処理
  const handleLibraryImageContextMenu = (e: React.MouseEvent, image: StoreImage, imgElement: HTMLImageElement) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 200;
    const menuHeight = 200;
    const { x, y } = adjustMenuPosition(e.clientX, e.clientY, menuWidth, menuHeight);

    setContextMenu({
      show: true,
      x,
      y,
      image: {
        url: image.url,
        width: imgElement.naturalWidth,
        height: imgElement.naturalHeight,
        element: imgElement,
      }
    });
  };

  // コンテキストメニューを閉じる
  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, show: false }));
  };

  // 画像サイズ変更ダイアログを開く
  const openImageEditDialog = () => {
    if (contextMenu.image?.element) {
      const width = contextMenu.image.width;
      const height = contextMenu.image.height;
      setImageEditDialog({
        show: true,
        width,
        height,
        aspectRatio: width / height,
        element: contextMenu.image.element,
      });
      hideContextMenu();
    }
  };

  // 画像サイズを更新
  const updateImageSize = (width: number, height: number) => {
    if (imageEditDialog.element) {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection();
        if (range) {
          // 画像のDOM要素を更新
          imageEditDialog.element.style.width = `${width}px`;
          imageEditDialog.element.style.height = `${height}px`;

          // Quillの内部状態を更新
          const [blot] = quill.getLeaf(range.index);
          if (blot && blot.domNode) {
            const format = quill.getFormat(range.index);
            quill.formatText(range.index, 1, {
              ...format,
              width: `${width}px`,
              height: `${height}px`,
            }, 'user');
          }
        }
      }
      setImageEditDialog(prev => ({ ...prev, show: false }));
    }
  };

  // 画像を削除
  const deleteImage = () => {
    if (contextMenu.image?.element) {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const [leaf, offset] = quill.getLeaf(quill.getSelection()?.index || 0);
        if (leaf) {
          quill.deleteText(offset, 1);
        }
      }
      contextMenu.image.element.remove();
      hideContextMenu();
    }
  };

  // コンテキストメニューの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.getElementById('context-menu');
      if (menu && !menu.contains(e.target as Node)) {
        hideContextMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESCキーでメニューを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideContextMenu();
        setImageEditDialog(prev => ({ ...prev, show: false }));
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // ルートコンテナのコンテキストメニューを抑制
  const preventDefaultContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageUpload = async (file: File) => {
    try {
      // ファイルサイズのチェック（500KB）
      if (file.size > 500 * 1024) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "ファイルサイズは500KB以下にしてください",
        });
        return;
      }

      // ファイル形式のチェック
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "JPG、PNG、GIF形式のファイルのみアップロード可能です",
        });
        return;
      }

      // 画像数の制限チェック
      if (uploadedImages.length >= 50) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "画像は最大50枚までアップロード可能です",
        });
        return;
      }

      if (!user) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "ログインが必要です",
        });
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await apiRequest<{ url: string; key: string }>(
          "POST",
          "/api/blog/upload-image",
          formData,
          {
            rawFormData: true
          }
        );

        if (!response?.url) {
          throw new Error("アップロードされた画像のURLが取得できません");
        }

        // Quillエディタのインスタンスを取得
        const quill = quillRef.current?.getEditor();
        if (!quill) {
          throw new Error("エディタが見つかりません");
        }

        // 現在のカーソル位置を取得
        const range = quill.getSelection(true);

        // 画像を挿入
        quill.insertEmbed(range.index, "image", response.url);

        // カーソルを画像の後ろに移動し、スクロールして表示
        quill.setSelection(range.index + 1);
        const [leaf] = quill.getLeaf(range.index);
        const domNode = leaf.domNode;
        if (domNode) {
          domNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // アップロード済み画像リストを更新
        setUploadedImages(prev => [...prev, response.url]);
        form.setValue("images", [...uploadedImages, response.url]);

        // 画像ライブラリのキャッシュを更新
        queryClient.setQueryData<StoreImage[]>([QUERY_KEYS.STORE_IMAGES], (oldData = []) => {
          return [
            ...oldData,
            {
              id: Date.now(), // 一時的なID
              url: response.url,
              key: response.key,
              createdAt: new Date().toISOString()
            }
          ];
        });

        toast({
          title: "成功",
          description: "画像がアップロードされました",
        });
      } catch (uploadError) {
        console.error('Image upload request error:', uploadError);
        throw uploadError;
      }
    } catch (error) {
      console.error('Image upload error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        file: file.name,
      });
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "画像のアップロードに失敗しました",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    try {
      // ファイルサイズのチェック（500KB）
      if (file.size > 500 * 1024) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "ファイルサイズは500KB以下にしてください",
        });
        return;
      }

      // ファイル形式のチェック
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "JPG、PNG、GIF形式のファイルのみアップロード可能です",
        });
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await apiRequest<{ url: string; key: string }>(
          "POST",
          "/api/blog/upload-image",
          formData,
          {
            rawFormData: true
          }
        );

        if (!response?.url) {
          throw new Error("アップロードされた画像のURLが取得できません");
        }

        // サムネイル画像を設定
        setThumbnailPreview(response.url);
        form.setValue("thumbnail", response.url);

        toast({
          title: "成功",
          description: "サムネイル画像がアップロードされました",
        });
      } catch (uploadError) {
        console.error('Thumbnail upload error:', uploadError);
        throw uploadError;
      }
    } catch (error) {
      console.error('Thumbnail upload error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        file: file.name,
      });
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "サムネイル画像のアップロードに失敗しました",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const insertImage = (imageUrl: string) => {
    try {
      const quill = quillRef.current?.getEditor();
      if (!quill) {
        throw new Error("エディタが見つかりません");
      }

      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, "image", imageUrl);

      // カーソルを画像の後ろに移動し、スクロールして表示
      quill.setSelection(range.index + 1);
      const [leaf] = quill.getLeaf(range.index);
      const domNode = leaf.domNode;
      if (domNode) {
        domNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      setIsImageLibraryOpen(false);
    } catch (error) {
      console.error('Image insertion error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "画像の挿入に失敗しました",
      });
    }
  };

  const onSubmit = (data: typeof form.getValues) => {
    if (postId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: typeof form.getValues) =>
      apiRequest("PUT", `/api/blog/posts/${postId}`, data),
    onSuccess: () => {
      toast({
        title: "記事を更新しました",
        description: "ブログ記事の更新が完了しました。",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "記事の更新に失敗しました",
      });
    },
  });

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


  return (
    <div className="container mx-auto px-4 py-8" onContextMenu={e => e.preventDefault()}>
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
            <div className="prose prose-sm max-w-none ql-editor">
              <h1>{form.watch("title")}</h1>
              {thumbnailPreview && (
                <img src={thumbnailPreview} alt="サムネイル" className="max-w-full h-auto mb-4" />
              )}
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

                <FormField
                  control={form.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>サムネイル画像</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <div
                            className={`relative w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors ${
                              thumbnailPreview ? 'border-0' : 'border-gray-300'
                            }`}
                            onClick={() => thumbnailInputRef.current?.click()}
                          >
                            {thumbnailPreview ? (
                              <>
                                <img
                                  src={thumbnailPreview}
                                  alt="サムネイル"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setThumbnailPreview(null);
                                    field.onChange(null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <div className="text-center">
                                <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <span className="text-sm text-gray-500">画像を選択</span>
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            ref={thumbnailInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleThumbnailUpload(file);
                              }
                              e.target.value = "";
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>本文</FormLabel>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>画像: {uploadedImages.length}/50</span>
                      <Dialog open={isImageLibraryOpen} onOpenChange={setIsImageLibraryOpen}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mr-2"
                          >
                            <Image className="h-4 w-4 mr-2" />
                            画像ライブラリ
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>画像ライブラリ</DialogTitle>
                            <DialogDescription>
                              アップロード済みの画像から選択して挿入できます
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-3 gap-4 py-4">
                            {isLoadingImages ? (
                              <div className="col-span-3 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin" />
                              </div>
                            ) : !storeImages || storeImages.length === 0 ? (
                              <div className="col-span-3 text-center text-muted-foreground">
                                アップロード済みの画像がありません
                              </div>
                            ) : (
                              storeImages.map((image) => (
                                <div
                                  key={image.id}
                                  className="relative aspect-square cursor-pointer group"
                                  onClick={() => insertImage(image.url)}
                                  onContextMenu={(e) => {
                                    const img = e.currentTarget.querySelector('img');
                                    if (img) {
                                      handleLibraryImageContextMenu(e, image, img as HTMLImageElement);
                                    }
                                  }}
                                >
                                  <img
                                    src={image.url}
                                    alt="ライブラリの画像"
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || uploadedImages.length >= 50}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        新規アップロード
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative border rounded-md">
                            <ReactQuill
                              forwardedRef={quillRef}
                              theme="snow"
                              modules={modules}
                              formats={formats}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="記事の本文を入力"
                              className="h-[400px]"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-8 pt-6 border-t">
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
                            <SelectItem value="scheduled">予約投稿</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("status") === "scheduled" && (
                    <FormField
                      control={form.control}
                      name="scheduledAt"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>公開予定日時</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="datetime-local"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                                min={new Date().toISOString().slice(0, 16)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">下書き保存</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>下書き保存の確認</AlertDialogTitle>
                <AlertDialogDescription>
                  現在の内容を下書きとして保存します。
                  後でいつでも編集できます。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    form.setValue("status", "draft");
                    form.handleSubmit(onSubmit)();
                  }}
                >
                  保存する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                公開する
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>公開の確認</AlertDialogTitle>
                <AlertDialogDescription>
                  記事を公開します。公開後は一般に公開され、
                  誰でも閲覧できるようになります。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    form.setValue("status", "published");
                    form.handleSubmit(onSubmit)();
                  }}
                >
                  公開する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
      {/* カスタムコンテキストメニュー */}
      {contextMenu.show && (
        <div
          id="context-menu"
          className="fixed z-[100] bg-white rounded-lg shadow-lg py-1 min-w-[200px] border"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-sm font-medium text-gray-500 bg-gray-50">
            画像オプション
          </div>

          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
            onClick={async () => {
              if (contextMenu.image) {
                try {
                  const response = await fetch(contextMenu.image.url);
                  const blob = await response.blob();
                  await navigator.clipboard.write([
                    new ClipboardItem({
                      [blob.type]: blob
                    })
                  ]);
                  toast({
                    title: "成功",
                    description: "画像をクリップボードにコピーしました",
                  });
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "エラー",
                    description: "画像のコピーに失敗しました",
                  });
                }
              }
              hideContextMenu();
            }}
          >
            <Copy className="h-4 w-4" />
            コピー
          </button>

          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              if (contextMenu.image) {
                navigator.clipboard.writeText(contextMenu.image.url);
                toast({
                  title: "成功",
                  description: "画像URLをコピーしました",
                });
              }
              hideContextMenu();
            }}
          >
            <Link className="h-4 w-4" />
            URLをコピー
          </button>

          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
            onClick={openImageEditDialog}
          >
            <Edit className="h-4 w-4" />
            サイズ変更
          </button>

          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
            onClick={deleteImage}
          >
            <Trash className="h-4 w-4" />
            削除
          </button>

          <Separator className="my-1" />

          <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
            <Info className="h-4 w-4" />
            <div>
              <div>サイズ: {contextMenu.image?.width || 0} x {contextMenu.image?.height || 0} px</div>
              <div className="text-xs text-gray-400">
                {((contextMenu.image?.width || 0) * (contextMenu.image?.height || 0) / 1000000).toFixed(2)} MP
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 画像サイズ編集ダイアログ */}
      <Dialog 
        open={imageEditDialog.show} 
        onOpenChange={(show) => setImageEditDialog(prev => ({ ...prev, show }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>画像サイズの変更</DialogTitle>
            <DialogDescription>
              新しい画像サイズを入力してください
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">幅 (px)</Label>
                <Input
                  id="width"
                  type="number"
                  value={imageEditDialog.width}
                  onChange={(e) => {
                    const width = parseInt(e.target.value);
                    setImageEditDialog(prev => ({
                      ...prev,
                      width,
                      height: Math.round(width / prev.aspectRatio),
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">高さ (px)</Label>
                <Input
                  id="height"
                  type="number"
                  value={imageEditDialog.height}
                  onChange={(e) => {
                    const height = parseInt(e.target.value);
                    setImageEditDialog(prev => ({
                      ...prev,
                      height,
                      width: Math.round(height * prev.aspectRatio),
                    }));
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImageEditDialog(prev => ({ ...prev, show: false }))}
            >
              キャンセル
            </Button>
            <Button
              onClick={() => updateImageSize(imageEditDialog.width, imageEditDialog.height)}
            >
              適用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}