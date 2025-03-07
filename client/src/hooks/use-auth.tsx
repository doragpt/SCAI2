import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { baseUserSchema, User as SelectUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

// ログイン用のデータ型
type LoginData = {
  username: string;
  password: string;
};

// 登録用のデータ型
type RegisterData = z.infer<typeof baseUserSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

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
        console.log('Fetching user data...');
        const response = await apiRequest<SelectUser>("GET", "/api/user");
        console.log('User data fetched:', {
          userId: response?.id,
          username: response?.username,
          timestamp: new Date().toISOString()
        });
        return response;
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          console.log('Not authenticated, returning null');
          return null;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
    retry: 2
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('Login attempt:', {
        username: credentials.username,
        timestamp: new Date().toISOString()
      });

      const user = await apiRequest<{ user: SelectUser; token: string }>("POST", "/api/login", credentials);
      localStorage.setItem("auth_token", user.token);
      return user.user;
    },
    onSuccess: (user: SelectUser) => {
      console.log('Login successful:', {
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString()
      });
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "ログイン成功",
        description: "ログインしました。",
      });
    },
    onError: (error: Error) => {
      console.error('Login error:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "ログインエラー",
        description: error.message || "ログインに失敗しました",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest<void>("POST", "/api/logout");
      localStorage.removeItem("auth_token");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "ログアウト完了",
        description: "ログアウトしました。",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ログアウトエラー",
        description: error.message || "ログアウトに失敗しました",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const user = await apiRequest<{ user: SelectUser; token: string }>("POST", "/api/register", credentials);
      localStorage.setItem("auth_token", user.token);
      return user.user;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "登録完了",
        description: "アカウントが正常に作成されました。",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "登録エラー",
        description: error.message || "アカウントの作成に失敗しました",
        variant: "destructive",
      });
    },
  });

  // ログ出力を追加
  console.log('Auth state:', {
    hasUser: !!user,
    userId: user?.id,
    username: user?.username,
    timestamp: new Date().toISOString()
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
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