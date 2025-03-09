import { useState, useRef } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
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
import { ArrowLeft, Save, Eye, Plus, X, Calendar } from "lucide-react";

const ReactQuill = dynamic(async () => {
  const { default: RQ } = await import("react-quill");
  return React.forwardRef((props: any, ref) => <RQ ref={ref} {...props} />);
}, {
  ssr: false,
  loading: () => <div className="h-[400px] w-full animate-pulse bg-muted" />
});

interface BlogEditorProps {
  postId?: string | number | null;
  initialData?: BlogPost | null;
}

export function BlogEditor({ postId, initialData }: BlogEditorProps) {
  const { user } = useAuth();
  const [isPreview, setIsPreview] = useState(false);
  const quillRef = useRef<any>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.thumbnail || null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [scheduledDateTime, setScheduledDateTime] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(blogPostSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      status: "draft",
      thumbnail: null,
      scheduledAt: null,
    },
  });

  const handleSubmit = async (data: any, status: "draft" | "published" | "scheduled") => {
    try {
      console.log("Submitting with status:", status);
      console.log("scheduledDateTime:", scheduledDateTime);

      if (status === "scheduled" && !scheduledDateTime) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "公開予定日時を選択してください",
        });
        return;
      }

      let formattedScheduledAt = null;
      if (status === "scheduled") {
        try {
          const scheduledDate = new Date(scheduledDateTime);
          if (isNaN(scheduledDate.getTime())) {
            toast({
              variant: "destructive",
              title: "エラー",
              description: "無効な日時形式です",
            });
            return;
          }
          if (scheduledDate <= new Date()) {
            toast({
              variant: "destructive",
              title: "エラー",
              description: "予約日時は現在より後の日時を指定してください",
            });
            return;
          }
          formattedScheduledAt = scheduledDate.toISOString();
        } catch (error) {
          toast({
            variant: "destructive",
            title: "エラー",
            description: "日時の形式が正しくありません",
          });
          return;
        }
      }

      const formData = {
        title: data.title,
        content: data.content,
        status: status,
        thumbnail: data.thumbnail,
        scheduledAt: formattedScheduledAt,
        storeId: user?.userId
      };

      console.log("Submitting form data:", formData);

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
        description: "フォームの送信に失敗しました",
      });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      window.location.href = "/store/dashboard";
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "記事の更新に失敗しました",
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOG_POSTS] });
      window.location.href = "/store/dashboard";
    },
    onError: (error) => {
      console.error('Create mutation error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "記事の作成に失敗しました",
      });
    },
  });

  const handleThumbnailUpload = async (file: File) => {
    try {
      if (file.size > 500 * 1024) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "ファイルサイズは500KB以下にしてください",
        });
        return;
      }

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

      const response = await apiRequest<{ url: string; key: string }>(
        "POST",
        "/api/blog/upload-image",
        formData,
        { rawFormData: true }
      );

      if (!response?.url) {
        throw new Error("アップロードされた画像のURLが取得できません");
      }

      setThumbnailPreview(response.url);
      form.setValue("thumbnail", response.url);

      toast({
        title: "成功",
        description: "サムネイル画像がアップロードされました",
      });
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "サムネイル画像のアップロードに失敗しました",
      });
    } finally {
      setIsUploading(false);
    }
  };

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
              <form onSubmit={(e) => { e.preventDefault(); }}>
                <div className="space-y-6">
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

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>本文</FormLabel>
                        <FormControl>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-10 mt-8 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">下書き保存</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>下書き保存の確認</AlertDialogTitle>
                <AlertDialogDescription>
                  現在の内容を下書きとして保存します。後でいつでも編集できます。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleSubmit(form.getValues(), "draft")}
                >
                  保存する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                予約投稿
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>予約投稿の設定</AlertDialogTitle>
                <AlertDialogDescription>
                  記事を指定した日時に自動で公開します。予約日時を選択してください。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">公開予定日時</label>
                  <Input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleSubmit(form.getValues(), "scheduled")}
                >
                  予約する
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
                  記事を公開します。公開後は一般に公開され、誰でも閲覧できるようになります。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleSubmit(form.getValues(), "published")}
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