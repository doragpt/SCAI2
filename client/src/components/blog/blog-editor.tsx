import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Image as ImageIcon,
  Loader2,
  Save,
  Eye,
  ArrowLeft,
  Upload,
} from "lucide-react";

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
  const { toast } = useToast();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.thumbnail || null);

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

  // サムネイル画像のアップロード処理
  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイル形式のチェック
    const allowedTypes = ['image/gif', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "アップロードできるファイル形式は gif, jpg, png のみです",
      });
      return;
    }

    // ファイルサイズのチェック (1MB = 1024 * 1024 bytes)
    if (file.size > 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "ファイルサイズは1MB以下にしてください",
      });
      return;
    }

    // 画像サイズのチェック
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    if (img.width !== 240 || img.height !== 320) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "画像サイズは横240px × 縦320pxにしてください",
      });
      URL.revokeObjectURL(img.src);
      return;
    }

    try {
      // AWS S3の署名付きURLを取得
      const { url, key } = await apiRequest("GET", QUERY_KEYS.SIGNED_URL);

      // S3にアップロード
      await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // プレビューを更新
      setThumbnailPreview(img.src);

      // フォームの値を更新
      form.setValue("thumbnail", key);

      toast({
        title: "アップロード完了",
        description: "サムネイル画像をアップロードしました",
      });
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "サムネイル画像のアップロードに失敗しました",
      });
    } finally {
      URL.revokeObjectURL(img.src);
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
      // ブログ一覧を更新
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
            <div className="space-y-6">
              {thumbnailPreview && (
                <div
                  className="w-full h-[300px] bg-cover bg-center rounded-lg"
                  style={{ backgroundImage: `url(${thumbnailPreview})` }}
                />
              )}
              <div className="prose prose-sm max-w-none">
                <h1>{form.watch("title")}</h1>
                <div dangerouslySetInnerHTML={{ __html: form.watch("content") }} />
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>サムネイル画像</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {thumbnailPreview ? (
                            <div className="relative">
                              <img
                                src={thumbnailPreview}
                                alt="サムネイルプレビュー"
                                className="w-full h-[200px] object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  setThumbnailPreview(null);
                                  field.onChange(null);
                                }}
                              >
                                変更
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed rounded-lg p-8 text-center">
                              <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="thumbnail-upload"
                                onChange={handleThumbnailChange}
                              />
                              <label
                                htmlFor="thumbnail-upload"
                                className="cursor-pointer"
                              >
                                <div className="space-y-2">
                                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                                  <div className="text-sm text-muted-foreground">
                                    クリックしてサムネイル画像をアップロード
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    推奨サイズ: 横240px × 縦320px<br />
                                    ファイル形式: gif, jpg, png<br />
                                    容量: 1MB以下
                                  </div>
                                </div>
                              </label>
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
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>本文</FormLabel>
                      <FormControl>
                        <div className="border rounded-md">
                          <ReactQuill
                            theme="snow"
                            modules={modules}
                            formats={formats}
                            value={field.value}
                            onChange={field.onChange}
                            className="min-h-[400px]"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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