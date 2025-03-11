import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { SelectUser, LoginData, RegisterFormData } from "@shared/schema";

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
      const response = await apiRequest("POST", "/api/login", credentials);
      return response.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);

      toast({
        title: "ログイン成功",
        description: "ログインしました。",
      });

      // ユーザーの役割に基づいてリダイレクト
      if (user.role === "talent") {
        window.location.href = "/talent/mypage";
      } else if (user.role === "store") {
        window.location.href = "/store/dashboard";
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
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();

      toast({
        title: "ログアウト完了",
        description: "ログアウトしました。",
      });

      window.location.href = "/auth";
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
      const response = await apiRequest("POST", "/api/auth/register", data);
      const result = await response.json();
      return result.user;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);

      toast({
        title: "登録完了",
        description: "アカウントが正常に作成されました。",
      });

      // ユーザーの役割に基づいてリダイレクト
      if (user.role === "talent") {
        window.location.href = "/talent/mypage";
      } else if (user.role === "store") {
        window.location.href = "/store/dashboard";
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
        const response = await apiRequest("GET", "/api/check");
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error('認証確認に失敗しました');
        }
        return response.json();
      } catch (error) {
        if (error instanceof Error && error.message === "認証されていません") {
          return null;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
    retry: 1,
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: error as Error | null,
        loginMutation: useLoginMutation(),
        logoutMutation: useLogoutMutation(),
        registerMutation: useRegisterMutation(),
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