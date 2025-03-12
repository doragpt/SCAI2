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

const AuthContext = createContext<AuthContextType | null>(null);

function useLoginMutation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log('Login attempt:', credentials);
        const response = await apiRequest("POST", "/api/auth/login", credentials);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Login error response:', errorText);
          let errorMessage;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message;
          } catch (e) {
            errorMessage = 'ログインに失敗しました';
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        console.log('Login success:', data);
        return data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
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
      try {
        console.log('Logout attempt');
        const response = await apiRequest("POST", "/api/auth/logout");
        if (!response.ok) {
          throw new Error("ログアウトに失敗しました");
        }
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
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
      try {
        console.log('Register attempt:', data);
        const response = await apiRequest("POST", "/api/auth/register", data);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Register error response:', errorText);
          let errorMessage;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message;
          } catch (e) {
            errorMessage = '登録に失敗しました';
          }
          throw new Error(errorMessage);
        }
        const result = await response.json();
        console.log('Register success:', result);
        return result.user;
      } catch (error) {
        console.error('Register error:', error);
        throw error;
      }
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
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        console.log('Checking auth status...'); 
        const response = await apiRequest("GET", "/api/auth/check");

        if (!response.ok) {
          if (response.status === 401) {
            console.log('Not authenticated');
            return null;
          }
          const errorText = await response.text();
          console.error('Auth check error response:', errorText);
          throw new Error('認証確認に失敗しました');
        }

        try {
          const data = await response.json();
          console.log('Auth check success:', data);
          return data;
        } catch (e) {
          console.error('Failed to parse auth check response:', e);
          return null;
        }
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}