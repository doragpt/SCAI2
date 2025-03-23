import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { type BlogPost } from "@shared/schema";
import { BlogEditor } from "@/components/blog/blog-editor-ck";
import { Loader2 } from "lucide-react";

export default function EditBlogPost() {
  const [, params] = useRoute("/store/blog/edit-ck/:id");
  const [error, setError] = useState<string | null>(null);
  
  // 記事IDの取得
  const postId = params?.id ? parseInt(params.id) : undefined;
  
  // 記事データの取得
  const { data, isLoading, isError } = useQuery({
    queryKey: [QUERY_KEYS.BLOG_POST_DETAIL(params?.id || '')],
    queryFn: async () => {
      if (!postId) throw new Error("記事IDが見つかりません");
      return apiRequest<BlogPost>("GET", `/api/blog/${postId}`);
    },
    enabled: !!postId,
    refetchOnWindowFocus: false
  });
  
  useEffect(() => {
    if (isError) {
      setError("記事の読み込みに失敗しました。権限がないか、記事が存在しない可能性があります。");
    }
  }, [isError]);
  
  console.log("Blog post data received:", data);
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">記事を読み込み中...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-10">
        <div className="rounded-md bg-red-50 p-6 text-center">
          <h2 className="mb-4 text-xl font-semibold text-red-800">エラー</h2>
          <p className="text-red-600">{error}</p>
          <button 
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
            onClick={() => window.history.back()}
          >
            戻る
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <BlogEditor postId={postId} initialData={data} />
    </div>
  );
}