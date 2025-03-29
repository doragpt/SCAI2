import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * 従来のデザイン管理画面から新しいコンポーネントベースのデザイン管理画面にリダイレクトするコンポーネント
 */
export default function DesignManagerRedirect() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // リダイレクト先のパス
    const newPath = '/store/design-manager-direct';
    
    // リダイレクトの旨をログに出力
    console.log(`デザイン管理画面を新しい実装にリダイレクトします: ${newPath}`);
    
    // 新しいパスに移動
    navigate(newPath, { replace: true });
  }, [navigate]);

  // リダイレクト中の表示
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-muted-foreground">リダイレクト中...</p>
      </div>
    </div>
  );
}