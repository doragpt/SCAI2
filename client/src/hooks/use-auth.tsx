import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  QueryClient
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { SelectUser, LoginData, RegisterFormData } from "@shared/schema";

// クエリクライアントのインスタンスをエクスポート
export const queryClient = new QueryClient();

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
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log('Login attempt:', { email: credentials.email });
        const response = await apiRequest("POST", "/api/login", credentials);
        const data = await response.json();
        console.log('Login response:', data);
        return data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log('Login successful:', { userId: user.id, role: user.role });
      queryClient.setQueryData(["/api/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

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
        description: error.message || "ログインに失敗しました",
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
      try {
        console.log('Logout attempt');
        const response = await apiRequest("POST", "/api/logout");
        await response.json();
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Logout successful');
      queryClient.setQueryData(["/api/user"], null);
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
        description: error.message || "ログアウトに失敗しました",
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
      try {
        console.log('Registration attempt:', { email: data.email });
        const response = await apiRequest("POST", "/api/auth/register", data);
        const result = await response.json();
        console.log('Registration response:', result);
        return result.user;
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log('Registration successful:', { userId: user.id, role: user.role });
      queryClient.setQueryData(["/api/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

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
        description: error.message || "登録に失敗しました",
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
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        console.log('Checking auth status...');
        const response = await apiRequest("GET", "/api/check");

        if (!response.ok) {
          if (response.status === 401) {
            console.log('User not authenticated');
            return null;
          }
          throw new Error('認証確認に失敗しました');
        }

        const data = await response.json();
        console.log('Auth check successful:', data);
        return data;
      } catch (error) {
        console.error('Auth check error:', error);
        if (error instanceof Error && error.message === "認証されていません") {
          return null;
        }
        throw error;
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