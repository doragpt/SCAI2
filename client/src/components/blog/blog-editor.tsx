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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Image as ImageIcon, ArrowLeft, Upload, Plus, X, Edit, Save, Eye } from "lucide-react";
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

interface StoreImage {
  id: number;
  url: string;
  key: string;
  createdAt: string;
}

interface ImageResizeDialogProps {
  image: StoreImage;
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, width: number, height: number) => void;
}

function ImageResizeDialog({ image, isOpen, onClose, onInsert }: ImageResizeDialogProps) {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [originalSize, setOriginalSize] = useState<{ width: number; height: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.onload = () => {
        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;
        setOriginalSize({ width: originalWidth, height: originalHeight });
        setWidth(Math.min(Math.max(50, originalWidth), 10000));
        setHeight(Math.min(Math.max(50, originalHeight), 10000));
      };
      img.onerror = () => {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "画像サイズの取得に失敗しました",
        });
      };
      img.src = image.url;
    }
  }, [image, toast]);

  const handleWidthChange = (value: number) => {
    const clampedValue = Math.min(Math.max(50, Math.round(value)), 10000);
    setWidth(clampedValue);
    if (aspectLocked && originalSize) {
      const aspectRatio = originalSize.width / originalSize.height;
      const newHeight = Math.round(clampedValue / aspectRatio);
      setHeight(Math.min(Math.max(50, newHeight), 10000));
    }
  };

  const handleHeightChange = (value: number) => {
    const clampedValue = Math.min(Math.max(50, Math.round(value)), 10000);
    setHeight(clampedValue);
    if (aspectLocked && originalSize) {
      const aspectRatio = originalSize.width / originalSize.height;
      const newWidth = Math.round(clampedValue * aspectRatio);
      setWidth(Math.min(Math.max(50, newWidth), 10000));
    }
  };

  const handleInsert = () => {
    try {
      onInsert(image.url, width, height);
      onClose();
    } catch (error) {
      console.error('Image insertion error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "画像の挿入に失敗しました",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>画像サイズの調整</DialogTitle>
          <DialogDescription>
            元のサイズ: {originalSize?.width}x{originalSize?.height}px
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <label className="w-16">幅:</label>
              <Slider
                value={[width]}
                onValueChange={([value]) => handleWidthChange(value)}
                min={50}
                max={10000}
                step={1}
              />
              <Input
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                className="w-20"
              />
              <span>px</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-16">高さ:</label>
              <Slider
                value={[height]}
                onValueChange={([value]) => handleHeightChange(value)}
                min={50}
                max={10000}
                step={1}
              />
              <Input
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
                className="w-20"
              />
              <span>px</span>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="aspect-ratio"
                checked={aspectLocked}
                onCheckedChange={(checked) => setAspectLocked(checked as boolean)}
              />
              <label htmlFor="aspect-ratio">アスペクト比を維持</label>
            </div>
          </div>

          <div className="relative aspect-square border rounded-md overflow-hidden">
            <img
              src={image.url}
              alt="プレビュー"
              style={{
                width: `${width}px`,
                height: `${height}px`,
                maxWidth: "none",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)"
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleInsert}>
            この設定で挿入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Quillエディタを動的にインポート
const ReactQuill = dynamic(async () => {
  const { default: RQ } = await import("react-quill");
  return function wrap(props: any) {
    return <RQ {...props} ref={props.forwardedRef} />;
  };
}, {
  ssr: false,
  loading: () => <div className="h-[400px] w-full animate-pulse bg-muted" />
});

export function BlogEditor({ postId, initialData }: { postId?: string | number | null; initialData?: BlogPost | null }) {
  const { user } = useAuth();
  const [isPreview, setIsPreview] = useState(false);
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<StoreImage | null>(null);
  const [isResizeDialogOpen, setIsResizeDialogOpen] = useState(false);
  const quillRef = useRef<any>(null);
  const { toast } = useToast();
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.thumbnail || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

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

  // Quillエディタの設定
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: ["", "center", "right", "justify"] }],
        ["link", "image"],
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

  const handleImageClick = (image: StoreImage) => {
    setSelectedImage(image);
    setIsResizeDialogOpen(true);
  };

  const handleImageInsert = (url: string, width: number, height: number) => {
    try {
      const quill = quillRef.current?.getEditor();
      if (!quill) {
        throw new Error("エディタが見つかりません");
      }

      // スタイル付きの画像HTMLを作成
      const imageHtml = `<img src="${url}" style="width: ${width}px; height: ${height}px;" alt="ブログ画像"/>`;

      // 現在のカーソル位置を取得
      const range = quill.getSelection(true);

      // HTMLとして画像を挿入
      quill.clipboard.dangerouslyPasteHTML(range.index, imageHtml);

      // 画像の後ろにカーソルを移動
      quill.setSelection(range.index + 1);

      toast({
        title: "成功",
        description: "画像を挿入しました",
      });

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

  // 店舗の全画像を取得
  const { data: storeImages, isLoading: isLoadingImages } = useQuery<StoreImage[]>({
    queryKey: [QUERY_KEYS.STORE_IMAGES],
    queryFn: () => apiRequest("GET", "/api/store/images"),
  });

  const onSubmit = async (data: any) => {
    try {
      if (postId) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
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
    mutationFn: (data: any) =>
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
                            <ImageIcon className="h-4 w-4 mr-2" />
                            画像ライブラリ
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
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
                                >
                                  <img
                                    src={image.url}
                                    alt="ライブラリの画像"
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleImageClick(image)}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      サイズ調整
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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

      {selectedImage && (
        <ImageResizeDialog
          image={selectedImage}
          isOpen={isResizeDialogOpen}
          onClose={() => {
            setIsResizeDialogOpen(false);
            setSelectedImage(null);
          }}
          onInsert={handleImageInsert}
        />
      )}
    </div>
  );
}