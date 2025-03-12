import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { type SelectUser } from "@shared/schema";
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
      try {
        console.log('ログイン試行:', {
          email: credentials.email,
          role: credentials.role,
          timestamp: new Date().toISOString()
        });

        const response = await apiRequest("POST", `/api/auth/login/${credentials.role}`, {
          email: credentials.email,
          password: credentials.password
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('ログインエラーレスポンス:', {
            status: response.status,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          throw new Error(error.message || "ログインに失敗しました");
        }

        const userData = await response.json();
        return userData;
      } catch (error) {
        console.error('ログインエラー:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      console.log('ログイン成功:', {
        userId: user.id,
        role: user.role,
        timestamp: new Date().toISOString()
      });

      if (user.role === "store") {
        console.log('店舗ダッシュボードへリダイレクト');
        setLocation("/store/dashboard");
      } else if (user.role === "talent") {
        console.log('タレントマイページへリダイレクト');
        setLocation("/talent/mypage");
      }

      toast({
        title: "ログイン成功",
        description: "ログインしました。",
      });
    },
    onError: (error: Error) => {
      console.error('ログインエラー:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
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
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      toast({
        title: "ログアウト完了",
        description: "ログアウトしました。",
      });
      setLocation("/auth");
    },
    onError: (error: Error) => {
      console.error('ログアウトエラー:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
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
      console.log('新規登録試行:', {
        email: data.email,
        role: data.role,
        timestamp: new Date().toISOString()
      });

      const response = await apiRequest("POST", "/api/auth/register", data);
      if (!response.ok) {
        const error = await response.json();
        console.error('新規登録エラー:', {
          status: response.status,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw new Error(error.message || "登録に失敗しました");
      }
      return await response.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      console.log('新規登録成功:', {
        userId: user.id,
        role: user.role,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "登録完了",
        description: "アカウントが正常に作成されました。",
      });

      if (user.role === "store") {
        setLocation("/store/dashboard");
      } else if (user.role === "talent") {
        setLocation("/talent/mypage");
      }
    },
    onError: (error: Error) => {
      console.error('新規登録エラー:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
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
        console.log('認証チェックレスポンス:', {
          status: response.status,
          ok: response.ok,
          timestamp: new Date().toISOString()
        });

        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error('認証確認に失敗しました');
        }

        const data = await response.json();
        console.log('認証チェックデータ:', {
          userId: data?.id,
          role: data?.role,
          timestamp: new Date().toISOString()
        });
        return data;
      } catch (error) {
        console.error('認証チェックエラー:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
    retry: false,
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