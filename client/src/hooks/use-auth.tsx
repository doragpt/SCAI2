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
import { QUERY_KEYS } from "@/constants/queryKeys";

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

      // QUERY_KEYSからログインエンドポイントを取得
      try {
        return await apiRequest("POST", QUERY_KEYS.AUTH_LOGIN, credentials);
      } catch (error) {
        console.error('店舗ログインエラー:', error);
        throw new Error(error instanceof Error ? error.message : "ログインに失敗しました");
      }
    },
    onSuccess: (user: SelectUser) => {
      // ユーザーデータをキャッシュにセット
      queryClient.setQueryData([QUERY_KEYS.AUTH_CHECK], user);

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
      // QUERY_KEYSからログアウトエンドポイントを取得
      try {
        return await apiRequest("POST", QUERY_KEYS.AUTH_LOGOUT);
      } catch (error) {
        console.error('ログアウトエラー:', error);
        throw new Error("ログアウトに失敗しました");
      }
    },
    onSuccess: (data: { role?: string }) => {
      // キャッシュを完全にクリア
      queryClient.clear();

      // ユーザーデータを明示的に削除
      queryClient.setQueryData([QUERY_KEYS.AUTH_CHECK], null);

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
      // QUERY_KEYSから登録エンドポイントを取得
      try {
        return await apiRequest("POST", QUERY_KEYS.AUTH_REGISTER, data);
      } catch (error) {
        console.error('登録エラー:', error);
        // APIからのエラーメッセージを処理
        const message = error instanceof Error ? error.message : "登録に失敗しました";
        
        // エラーコードに基づいてメッセージをカスタマイズ 
        if (message.includes("EMAIL_ALREADY_EXISTS") || message.includes("既に使用されています")) {
          throw new Error("このメールアドレスは既に使用されています。別のメールアドレスを使用してください。");
        }
        
        throw new Error(message);
      }
    },
    onSuccess: (userData: SelectUser) => {
      // ユーザーデータをキャッシュにセット
      queryClient.setQueryData([QUERY_KEYS.AUTH_CHECK], userData);

      // 全ての関連クエリを無効化して再取得を強制
      queryClient.invalidateQueries({ queryKey: ["/api"] });

      toast({
        title: "登録完了",
        description: "アカウントが正常に作成されました。",
      });

      if (userData.role === "talent") {
        setLocation("/talent/mypage");
      } else if (userData.role === "store") {
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
    queryKey: [QUERY_KEYS.AUTH_CHECK],
    queryFn: async () => {
      try {
        // QUERY_KEYSから認証チェックエンドポイントを取得
        return await apiRequest("GET", QUERY_KEYS.AUTH_CHECK);
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