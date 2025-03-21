import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import {
  type SelectUser,
  type LoginData,
  type RegisterFormData
} from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function useLoginMutation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginData & { role?: string }) => {
      const currentPath = window.location.pathname;
      const expectedRole = currentPath.includes('manager') ? 'store' : 'talent';
      credentials.role = expectedRole;

      // パスを修正: /api/login → /auth/login
      const response = await apiRequest("POST", "/auth/login", credentials);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "ログインに失敗しました");
      }
      return response.json();
    },
    onSuccess: (user: SelectUser) => {
      // ユーザーデータをキャッシュにセット
      queryClient.setQueryData(["/api/user"], user);

      // 全ての関連クエリを無効化して再取得を強制
      queryClient.invalidateQueries({ queryKey: ["/api"] });

      toast({
        title: "ログイン成功",
        description: "ログインしました。",
      });

      if (user.role === "talent") {
        setLocation("/talent/mypage");
      } else if (user.role === "store") {
        setLocation("/store/dashboard");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "ログインエラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

function useLogoutMutation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      // パスを修正: /api/logout → /auth/logout
      const response = await apiRequest("POST", "/auth/logout");
      if (!response.ok) {
        throw new Error("ログアウトに失敗しました");
      }
      return response.json();
    },
    onSuccess: (data: { role?: string }) => {
      // キャッシュを完全にクリア
      queryClient.clear();

      // ユーザーデータを明示的に削除
      queryClient.setQueryData(["/api/user"], null);

      toast({
        title: "ログアウト完了",
        description: "ログアウトしました。",
      });

      if (data?.role === "store") {
        setLocation("/manager/login");
      } else {
        setLocation("/auth");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "ログアウトエラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

function useRegisterMutation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RegisterFormData) => {
      // パスを修正: /api/auth/register → /auth/register
      const response = await apiRequest("POST", "/auth/register", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "登録に失敗しました");
      }
      const result = await response.json();
      return result.user;
    },
    onSuccess: (user: SelectUser) => {
      // ユーザーデータをキャッシュにセット
      queryClient.setQueryData(["/api/user"], user);

      // 全ての関連クエリを無効化して再取得を強制
      queryClient.invalidateQueries({ queryKey: ["/api"] });

      toast({
        title: "登録完了",
        description: "アカウントが正常に作成されました。",
      });

      if (user.role === "talent") {
        setLocation("/talent/mypage");
      } else if (user.role === "store") {
        setLocation("/store/dashboard");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "登録エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        // パスを修正: /api/check → /check
        const response = await apiRequest("GET", "/check");
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error('認証確認に失敗しました');
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Auth check error:', error);
        return null;
      }
    },
    staleTime: 0, // キャッシュを無効化
    refetchOnMount: true, // マウント時に必ず再取得
    refetchOnWindowFocus: true, // ウィンドウフォーカス時に再取得
  });

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const registerMutation = useRegisterMutation();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: error as Error | null,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}