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
      console.log('Login attempt:', {
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
        throw new Error(error.message || "ログインに失敗しました");
      }

      return await response.json();
    },
    onSuccess: (user: SelectUser) => {
      // クエリキャッシュを更新
      queryClient.setQueryData(["/api/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      console.log('Login successful:', {
        userId: user.id,
        role: user.role,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "ログイン成功",
        description: "ログインしました。",
      });

      // ユーザーの役割に基づいてリダイレクト
      if (user.role === "talent") {
        setTimeout(() => setLocation("/talent/mypage"), 100);
      } else if (user.role === "store") {
        setTimeout(() => setLocation("/store/dashboard"), 100);
      }
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
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
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "登録に失敗しました");
      }
      return await response.json();
    },
    onSuccess: (user: SelectUser) => {
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
        console.log('Auth check response:', response);

        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error('認証確認に失敗しました');
        }

        const data = await response.json();
        console.log('Auth check data:', data);
        return data;
      } catch (error) {
        console.error('Auth check error:', error);
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

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}