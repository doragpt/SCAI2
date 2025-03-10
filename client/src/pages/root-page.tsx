import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // ユーザーの役割に基づいてリダイレクト
  if (user.role === "talent") {
    return <Redirect to="/talent/mypage" />;
  } else if (user.role === "store") {
    return <Redirect to="/store/dashboard" />;
  }

  // デフォルトのリダイレクト（通常はここには到達しない）
  return <Redirect to="/auth" />;
}