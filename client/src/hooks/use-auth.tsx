import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { type SelectUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

type LoginCredentials = {
  email: string;
  password: string;
  role: "talent" | "store";
};

function useLoginMutation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest("POST", `/api/auth/login/${credentials.role}`, {
        email: credentials.email,
        password: credentials.password
      });

      const data = await response.json();
      return data;
    },
    onSuccess: (user: SelectUser) => {
      // ユーザーデータをキャッシュに保存
      queryClient.setQueryData(["/api/user"], user);

      // 成功メッセージを表示
      toast({
        title: "ログイン成功",
        description: "ログインしました。",
      });

      // リダイレクト
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
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // キャッシュをクリア
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();

      // ログアウト成功メッセージ
      toast({
        title: "ログアウト完了",
        description: "ログアウトしました。",
      });

      // ログインページへリダイレクト
      setLocation("/auth");
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
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return await response.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
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
        const response = await apiRequest("GET", "/api/auth/check");
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error('認証確認に失敗しました');
        }
        return await response.json();
      } catch (error) {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
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

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}