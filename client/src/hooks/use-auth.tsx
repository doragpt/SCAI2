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

function useLoginMutation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('ログイン試行:', {
        email: credentials.email,
        timestamp: new Date().toISOString()
      });

      const response = await apiRequest("POST", "/api/auth/login", credentials);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "ログインに失敗しました");
      }
      const data = await response.json();
      return data;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "ログイン成功",
        description: "ログインしました。",
      });

      // ユーザーの役割に基づいてリダイレクト
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
      const response = await apiRequest("POST", "/api/auth/logout");
      if (!response.ok) {
        throw new Error("ログアウトに失敗しました");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      toast({
        title: "ログアウト完了",
        description: "ログアウトしました。",
      });
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
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "登録に失敗しました");
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "登録完了",
        description: "アカウントが正常に作成されました。",
      });

      // ユーザーの役割に基づいてリダイレクト
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
  const { toast } = useToast();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        console.log('認証状態確認...'); // デバッグログ
        const response = await apiRequest("GET", "/api/auth/check");
        console.log('認証確認レスポンス:', response); // デバッグログ

        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error('認証確認に失敗しました');
        }

        const data = await response.json();
        console.log('認証確認データ:', data); // デバッグログ
        return data;
      } catch (error) {
        console.error('認証確認エラー:', error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
    retry: 1,
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

export const AuthContext = createContext<AuthContextType | null>(null);