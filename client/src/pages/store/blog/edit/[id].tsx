import { useQuery } from "@tanstack/react-query";
import { useParams, Redirect } from "wouter";
import { BlogEditor } from "@/components/blog/blog-editor-wysiwyg";
import { useAuth } from "@/hooks/use-auth";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Loader2 } from "lucide-react";

// BlogPost型の定義
interface BlogPost {
  id?: number;
  store_id?: number;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'scheduled';
  published_at?: Date | null;
  scheduled_at?: Date | null;
  thumbnail?: string | null;
  images?: string[] | null;
  created_at?: Date;
  updated_at?: Date;
}

export default function EditBlogPost() {
  const { user, isLoading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id);

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: [QUERY_KEYS.BLOG_POST_DETAIL(id)],
    queryFn: async () => {
      console.log(`Fetching blog post with ID: ${id}`);
      const data = await apiRequest("GET", `/api/blog/${id}`);
      console.log('Blog post data received:', data);
      return data;
    },
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

  // WYSIWYGエディターを使用
  return <BlogEditor postId={postId} initialData={post} />;
}