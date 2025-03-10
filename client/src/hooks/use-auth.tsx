import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { baseUserSchema, type SelectUser } from "@shared/schema";
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

type LoginData = {
  username: string;
  password: string;
  role?: "talent" | "store";
};

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
        const accessToken = localStorage.getItem("auth_token");
        if (!accessToken) {
          console.log('No auth token found');
          return null;
        }

        const response = await apiRequest("GET", "/api/auth/check");
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            // アクセストークンが無効な場合、リフレッシュトークンを使用して更新を試みる
            const refreshToken = localStorage.getItem("refresh_token");
            if (refreshToken) {
              try {
                const refreshResponse = await apiRequest("POST", "/api/auth/refresh", {
                  refreshToken
                });
                const refreshData = await refreshResponse.json();

                if (refreshResponse.ok) {
                  localStorage.setItem("auth_token", refreshData.accessToken);
                  // 新しいアクセストークンで再度ユーザー情報を取得
                  const newResponse = await apiRequest("GET", "/api/auth/check");
                  const userData = await newResponse.json();
                  return userData;
                }
              } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                localStorage.removeItem("auth_token");
                localStorage.removeItem("refresh_token");
                return null;
              }
            }
            console.log('Session expired or invalid token');
            localStorage.removeItem("auth_token");
            localStorage.removeItem("refresh_token");
            return null;
          }
          throw new Error(data.message || 'Failed to fetch user data');
        }

        console.log('User data fetched:', {
          userId: data?.id,
          username: data?.username,
          role: data?.role,
          timestamp: new Date().toISOString()
        });
        return data;
      } catch (error) {
        console.error('Auth check error:', error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
    retry: 1
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('Login attempt:', {
        username: credentials.username,
        role: credentials.role,
        timestamp: new Date().toISOString()
      });

      const response = await apiRequest("POST", "/api/auth/login", credentials);
      const result = await response.json();

      if (!response.ok) {
        console.error('Login error response:', {
          status: response.status,
          message: result.message,
          timestamp: new Date().toISOString()
        });
        throw new Error(result.message || "ログインに失敗しました");
      }

      if (!result.accessToken || !result.refreshToken) {
        throw new Error("認証トークンが見つかりません");
      }

      localStorage.setItem("auth_token", result.accessToken);
      localStorage.setItem("refresh_token", result.refreshToken);
      return result.user;
    },
    onSuccess: (user: SelectUser) => {
      console.log('Login successful:', {
        userId: user.id,
        username: user.username,
        role: user.role,
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
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      toast({
        title: "ログインエラー",
        description: error.message || "ログインに失敗しました",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
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
      const response = await apiRequest("POST", "/api/auth/register", credentials);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "登録に失敗しました");
      }

      if (result.accessToken && result.refreshToken) {
        localStorage.setItem("auth_token", result.accessToken);
        localStorage.setItem("refresh_token", result.refreshToken);
      }
      return result.user;
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

  console.log('Auth state:', {
    hasUser: !!user,
    userId: user?.id,
    username: user?.username,
    role: user?.role,
    timestamp: new Date().toISOString()
  });

  return (
    <AuthContext.Provider
      value={{
        user,
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