import { useState, useRef } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Image as ImageIcon, Loader2, Save, Eye, ArrowLeft, Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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

  const form = useForm({
    resolver: zodResolver(blogPostSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      status: "draft",
      thumbnail: "",
      images: [],
    },
  });

  // サムネイル画像アップロード用のMutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest("POST", "/api/upload", formData);
    },
    onSuccess: (data) => {
      form.setValue("thumbnail", data.url);
      toast({
        title: "サムネイル画像をアップロードしました",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "画像のアップロードに失敗しました",
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
      // ブログ一覧を更新
      window.history.back();
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

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
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
            <div className="prose prose-sm max-w-none">
              {form.watch("thumbnail") && (
                <img 
                  src={form.watch("thumbnail")} 
                  alt="サムネイル"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
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
                            <img
                              src={field.value}
                              alt="サムネイル"
                              className="w-full h-48 object-cover rounded-lg"
                            />
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
                            onChange={field.onChange}
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
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>公開予定日時</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="datetime-local"
                              {...field}
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
          <Button
            variant="outline"
            onClick={() => {
              form.setValue("status", "draft");
              form.handleSubmit(onSubmit)();
            }}
          >
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
            onClick={() => {
              if (isScheduling && form.getValues("scheduledAt")) {
                form.setValue("status", "scheduled");
              } else {
                form.setValue("status", "published");
              }
              form.handleSubmit(onSubmit)();
            }}
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