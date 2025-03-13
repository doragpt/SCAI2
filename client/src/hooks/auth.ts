import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';

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

  const login = async (email: string, password: string) => {
    try {
      console.log('ログイン試行:', {
        email,
        timestamp: new Date().toISOString()
      });

      const response = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "ログインに失敗しました");
      }

      const userData = await response.json();
      console.log('ログイン成功:', {
        userId: userData.id,
        role: userData.role,
        timestamp: new Date().toISOString()
      });

      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/auth/check");

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    login,
    logout,
    checkAuth,
    isLoading,
  };
};