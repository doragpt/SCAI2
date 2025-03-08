import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import dynamic from "next/dynamic";
import imageCompression from "browser-image-compression";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

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

interface BlogEditorProps {
  postId?: number;
  initialData?: BlogPost;
}

export function BlogEditor({ postId, initialData }: BlogEditorProps) {
  const { user } = useAuth();
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData?.images || []);
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  const [isResizeDialogOpen, setIsResizeDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resizeOptions, setResizeOptions] = useState({
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1024
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<any>(null);
  const { toast } = useToast();

  // 店舗の全画像を取得
  const { data: storeImages, isLoading: isLoadingImages } = useQuery({
    queryKey: [QUERY_KEYS.STORE_IMAGES],
    queryFn: () => apiRequest("GET", "/api/store/images"),
    enabled: !!user?.id
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
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "記事の更新に失敗しました",
      });
    },
  });

  const handleFileSelect = async (file: File) => {
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

    setSelectedFile(file);
    setIsResizeDialogOpen(true);
  };

  const handleImageResize = async () => {
    try {
      if (!selectedFile) return;

      setIsUploading(true);

      // 画像を圧縮
      const compressedFile = await imageCompression(selectedFile, {
        maxSizeMB: resizeOptions.maxSizeMB,
        maxWidthOrHeight: resizeOptions.maxWidthOrHeight,
        useWebWorker: true
      });

      // FormDataの作成とアップロード
      const formData = new FormData();
      formData.append("image", compressedFile);

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
      quill.setSelection(range.index + 1);

      // アップロード済み画像リストとフォームの値を更新
      const newImages = [...uploadedImages, response.url];
      setUploadedImages(newImages);
      form.setValue("images", newImages);

      toast({
        title: "成功",
        description: "画像がアップロードされました",
      });

      setIsResizeDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Image upload error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        file: selectedFile?.name,
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


  const insertImage = (imageUrl: string) => {
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
  };

  const onSubmit = (data: typeof form.getValues) => {
    if (postId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

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
                              storeImages.map((image: string) => (
                                <div
                                  key={image}
                                  className="relative aspect-square cursor-pointer group"
                                  onClick={() => insertImage(image)}
                                >
                                  <img
                                    src={image}
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
                            handleFileSelect(file);
                          }
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>

                  {/* リサイズダイアログ */}
                  <Dialog open={isResizeDialogOpen} onOpenChange={setIsResizeDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>画像のリサイズ</DialogTitle>
                        <DialogDescription>
                          アップロードする画像のサイズを調整できます
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">最大サイズ (MB)</label>
                          <Input
                            type="number"
                            value={resizeOptions.maxSizeMB}
                            onChange={(e) => setResizeOptions(prev => ({
                              ...prev,
                              maxSizeMB: parseFloat(e.target.value)
                            }))}
                            min={0.1}
                            max={2}
                            step={0.1}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">最大幅/高さ (px)</label>
                          <Input
                            type="number"
                            value={resizeOptions.maxWidthOrHeight}
                            onChange={(e) => setResizeOptions(prev => ({
                              ...prev,
                              maxWidthOrHeight: parseInt(e.target.value)
                            }))}
                            min={100}
                            max={2048}
                            step={100}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsResizeDialogOpen(false);
                              setSelectedFile(null);
                            }}
                          >
                            キャンセル
                          </Button>
                          <Button
                            onClick={handleImageResize}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            アップロード
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="border rounded-md overflow-hidden">
                            <ReactQuill
                              forwardedRef={quillRef}
                              theme="snow"
                              modules={modules}
                              formats={formats}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="記事の本文を入力"
                              className="min-h-[400px]"
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
                      <FormItem>
                        <FormLabel>公開予定日時</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="datetime-local"
                              value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                            />
                          </div>
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
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
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
    </div>
  );
}