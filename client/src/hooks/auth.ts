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
      const response = await apiRequest("POST", "/api/login", data);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "ログインに失敗しました");
      }

      return response.json();
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
      await apiRequest("POST", "/api/logout");
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
      const response = await apiRequest("GET", "/api/check");

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("認証チェックエラー:", error);
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