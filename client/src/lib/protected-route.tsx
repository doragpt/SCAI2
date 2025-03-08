import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  roleRequired
}: {
  path: string;
  component: () => React.JSX.Element;
  roleRequired?: "store" | "talent";
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        if (!user) {
          // 未認証の場合、store roleが必要なパスは店舗管理ログインページへ、
          // それ以外は通常のログインページへリダイレクト
          return <Redirect to={roleRequired === "store" ? "/manager/login" : "/auth"} />;
        }

        // ロールチェック
        if (roleRequired && user.role !== roleRequired) {
          return <Redirect to="/" />;
        }

        return <Component />;
      }}
    </Route>
  );
}