import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  baseUserSchema,
  type SelectUser,
  LoginData,
  RegisterFormData
} from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterFormData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
          throw new Error('Authentication check failed');
        }

        const userData = await response.json();
        console.log('User data fetched:', {
          userId: userData?.id,
          username: userData?.username,
          role: userData?.role,
          timestamp: new Date().toISOString()
        });

        return userData;
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
        throw new Error(result.message || "ログインに失敗しました");
      }

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

      if (user.role === "talent") {
        setLocation("/talent/mypage");
      }
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

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterFormData) => {
      const response = await apiRequest("POST", "/api/auth/register", credentials);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "登録に失敗しました");
      }

      return result.user;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "登録完了",
        description: "アカウントが正常に作成されました。",
      });

      // 女性（talent）の新規登録後は /talent/mypage にリダイレクト
      if (user.role === "talent") {
        setLocation("/talent/mypage");
      }
    },
    onError: (error: Error) => {
      console.error('Registration error:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "登録エラー",
        description: error.message || "アカウントの作成に失敗しました",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      if (!response.ok) {
        throw new Error("ログアウトに失敗しました");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear(); // すべてのキャッシュをクリア
      toast({
        title: "ログアウト完了",
        description: "ログアウトしました。",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      console.error('Logout error:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "ログアウトエラー",
        description: error.message || "ログアウトに失敗しました",
        variant: "destructive",
      });
    },
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