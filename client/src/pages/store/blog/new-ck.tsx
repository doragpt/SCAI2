import { BlogEditor } from "@/components/blog/blog-editor-ck";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function NewBlogPost() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }
  
  if (!user || user.role !== "store") {
    return (
      <div className="container py-10">
        <div className="rounded-md bg-red-50 p-6 text-center">
          <h2 className="mb-4 text-xl font-semibold text-red-800">アクセス権限がありません</h2>
          <p className="text-red-600">このページにアクセスするには、店舗アカウントでログインする必要があります。</p>
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
      <BlogEditor />
    </div>
  );
}