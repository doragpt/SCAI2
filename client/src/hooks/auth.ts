import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { QUERY_KEYS } from '@/constants/queryKeys';

interface AuthState {
  user: any | null;
  setUser: (user: any | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export const useAuth = () => {
  const { user, setUser, isLoading, setIsLoading } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; role?: string }) => {
      try {
        // 正しいAPIエンドポイントを使用
        return await apiRequest("POST", "/api/auth/login", data);
      } catch (error) {
        console.error("ログイン処理エラー:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['/api/check'] });
    },
    onError: (error: Error) => {
      console.error('ログインエラー:', error);
      toast({
        variant: "destructive",
        title: "ログインエラー",
        description: error.message,
      });
    }
  });

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/check'] });
    } catch (error) {
      console.error("ログアウトエラー:", error);
      throw error;
    }
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      try {
        // クエリキー定数を使用
        const userData = await apiRequest("GET", QUERY_KEYS.AUTH_CHECK);
        console.log("認証チェック成功:", userData);
        setUser(userData);
        return userData;
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    loginMutation,
    logout,
    checkAuth,
    isLoading,
  };
};