import { useRoute, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function EditBlogPostRedirect() {
  const [, params] = useRoute("/store/blog/edit-ck/:id");
  const { user, isLoading } = useAuth();
  
  // 記事IDの取得
  const postId = params?.id;
  
  if (isLoading) {
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

  // IDが見つからない場合はブログ一覧に戻る
  if (!postId) {
    return <Redirect to="/store/blog" />;
  }

  // 新しいURLパスにリダイレクト
  return <Redirect to={`/store/blog/edit/${postId}`} />;
}