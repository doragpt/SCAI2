import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiRequest('POST', '/auth/login', { email, password });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'ログインに失敗しました');
      }

      // トークンの保存
      localStorage.setItem('auth_token', data.token);
      set({ user: data.user, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'ログインに失敗しました',
        isLoading: false
      });
      throw error;
    }
  },
  logout: async () => {
    localStorage.removeItem('auth_token');
    set({ user: null, error: null });
  },
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        set({ user: null, isLoading: false });
        return;
      }

      const response = await apiRequest('GET', '/auth/check');
      
      if (!response.ok) {
        localStorage.removeItem('auth_token');
        set({ user: null, isLoading: false });
        return;
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '認証チェックに失敗しました',
        isLoading: false
      });
    }
  }
}));

export function useAuth() {
  const auth = useAuthStore();
  const { toast } = useToast();

  const login = async (email: string, password: string) => {
    try {
      await auth.login(email, password);
      toast({
        title: "ログイン成功",
        description: "ようこそ！",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "ログインに失敗しました",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
      toast({
        title: "ログアウト",
        description: "ログアウトしました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      });
    }
  };

  return {
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
    login,
    logout,
    checkAuth: auth.checkAuth,
  };
}
