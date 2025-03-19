import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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
      console.log('ログイン試行', {
        email: data.email,
        role: data.role,
        timestamp: new Date().toISOString()
      });

      const response = await apiRequest("POST", "/api/login", data);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "ログインに失敗しました");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('ログイン成功', {
        userId: data.id,
        role: data.role,
        timestamp: new Date().toISOString()
      });
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['/api/check'] });
    },
    onError: (error: Error) => {
      console.error('ログインエラー:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      toast({
        variant: "destructive",
        title: "ログインエラー",
        description: error.message,
      });
    }
  });

  const logout = async () => {
    try {
      console.log('ログアウト試行', {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });

      await apiRequest("POST", "/api/logout");
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/check'] });

      console.log('ログアウト成功', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("ログアウトエラー:", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/check");

      if (!response.ok) {
        console.warn('認証チェック失敗', {
          status: response.status,
          timestamp: new Date().toISOString()
        });
        setUser(null);
        return null;
      }

      const userData = await response.json();
      console.log('認証チェック成功', {
        userId: userData.id,
        role: userData.role,
        timestamp: new Date().toISOString()
      });
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("認証チェックエラー:", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
      setUser(null);
      return null;
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