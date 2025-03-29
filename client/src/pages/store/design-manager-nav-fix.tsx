import { useEffect } from 'react';

/**
 * ブラウザの問題を解決するためのナビゲーション補助コンポーネント
 */
export default function DesignManagerNavFix() {
  useEffect(() => {
    // 正しいURLへのリダイレクト
    window.location.href = '/store/design-manager-direct';
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-muted-foreground">リダイレクト中...</p>
      </div>
    </div>
  );
}