import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import type { UserResponse, LoginCredentials } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: UserResponse | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
};

function useLoginMutation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "ログインに失敗しました");
      }

      return response.json();
    },
    onSuccess: (user: UserResponse) => {
      queryClient.setQueryData(["/api/auth/session"], user);

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
      const response = await apiRequest("POST", "/api/auth/logout");
      if (!response.ok) {
        throw new Error("ログアウトに失敗しました");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/session"], null);
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserResponse | null>({
    queryKey: ["/api/auth/session"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/session");
        if (response.status === 401) {
          return null;
        }
        if (!response.ok) {
          throw new Error('認証確認に失敗しました');
        }
        return response.json();
      } catch (error) {
        console.error('Auth check error:', error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: error as Error | null,
        loginMutation,
        logoutMutation,
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