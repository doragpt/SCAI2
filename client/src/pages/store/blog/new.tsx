import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function NewBlogPost() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 店舗ユーザー以外はダッシュボードにリダイレクト
  if (!user || user.role !== "store") {
    return <Redirect to="/store/dashboard" />;
  }

  // CKEditorを使用する新しい記事作成ページにリダイレクト
  return <Redirect to="/store/blog/new-ck" />;
}