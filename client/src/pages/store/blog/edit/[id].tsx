import { useQuery } from "@tanstack/react-query";
import { useParams, Redirect } from "wouter";
import { BlogEditor } from "@/components/blog/blog-editor";
import { useAuth } from "@/hooks/use-auth";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { type BlogPost } from "@shared/schema";
import { AlertCircle, Loader2 } from "lucide-react";

export default function EditBlogPost() {
  const { user, isLoading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id);

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: [QUERY_KEYS.BLOG_POST_DETAIL(id)],
    queryFn: () => apiRequest("GET", `/api/blog/${id}`),
    enabled: !!user?.id && !isNaN(postId),
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 店舗ユーザー以外はダッシュボードにリダイレクト
  if (!user || user.role !== "store") {
    return <Redirect to="/store/dashboard" />;
  }

  // 記事が見つからない場合
  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium">記事が見つかりません</p>
          <p className="mt-2 text-sm text-muted-foreground">
            指定された記事は存在しないか、アクセス権限がありません
          </p>
        </div>
      </div>
    );
  }

  return <BlogEditor postId={postId} initialData={post} />;
}