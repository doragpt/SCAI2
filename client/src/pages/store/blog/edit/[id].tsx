import { useParams, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function EditBlogPost() {
  const { user, isLoading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();

  if (authLoading) {
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

  // CKEditorを使用する編集ページにリダイレクト
  return <Redirect to={`/store/blog/edit-ck/${id}`} />;
}