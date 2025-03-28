import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import PreviewRenderer from '@/components/store/PreviewRenderer';
import { getDefaultDesignSettings } from '@/shared/defaultDesignSettings';

/**
 * 店舗プレビューページ（新バージョン）
 * iframeに依存せず安定した挙動を目指す
 */
export default function StorePreviewNewPage() {
  const [deviceView, setDeviceView] = useState<'pc' | 'smartphone'>('pc');
  const [loading, setLoading] = useState(true);

  // プレビューデータを取得
  const previewQuery = useQuery({
    queryKey: [QUERY_KEYS.DESIGN_PREVIEW],
    queryFn: async () => {
      try {
        console.log('プレビューデータを取得しています...');
        const response = await apiRequest<any>('GET', '/api/design/preview');
        
        // 成功/データの検証
        if (!response || !response.success) {
          console.warn('プレビューデータのレスポンスが不正です。', { response });
          return {
            storeProfile: null,
            designData: getDefaultDesignSettings()
          };
        }
        
        // レスポンス内容をログ出力
        console.log('プレビューデータの取得に成功しました', {
          hasStoreProfile: !!response.storeProfile,
          hasDesignData: !!response.designData,
          responseType: typeof response,
          designDataType: typeof response.designData,
          timestamp: response.timestamp
        });
        
        // designDataが文字列の場合はパースを試みる
        let parsedDesignData = response.designData;
        if (typeof parsedDesignData === 'string') {
          try {
            parsedDesignData = JSON.parse(parsedDesignData);
            console.log('文字列形式のデザインデータをJSONに変換しました');
          } catch (parseError) {
            console.error('デザインデータのJSONパースに失敗しました:', parseError);
            parsedDesignData = getDefaultDesignSettings();
          }
        }
        
        return {
          storeProfile: response.storeProfile,
          designData: parsedDesignData || getDefaultDesignSettings()
        };
      } catch (error) {
        console.error('プレビューデータの取得エラー:', error);
        // エラー時はデフォルト設定を返す
        return {
          storeProfile: null,
          designData: getDefaultDesignSettings()
        };
      } finally {
        setLoading(false);
      }
    },
    staleTime: 30 * 1000 // 30秒間キャッシュ
  });

  // 通信状態のハンドラ
  const handleMessage = (event: MessageEvent) => {
    // ここでは何もしない（コードの互換性のため残す）
    console.log('プレビューメッセージを受信しました。', event.data);
  };

  // メッセージイベントリスナーを設定
  useEffect(() => {
    // 互換性のためにイベントリスナーを残す（操作はしない）
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">プレビューデータを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (previewQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-destructive mb-4">読み込みエラー</h2>
          <p className="mb-6">プレビューデータの取得中にエラーが発生しました。しばらく経ってからもう一度お試しください。</p>
          <Link href="/store/dashboard">
            <Button className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ダッシュボードに戻る
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { storeProfile, designData } = previewQuery.data || {};

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* コントロールバー */}
      <div className="p-4 border-b bg-card flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/store/dashboard">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              戻る
            </Button>
          </Link>
          <h1 className="text-xl font-bold">店舗ページプレビュー</h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-muted p-1 rounded-md">
            <Button 
              variant={deviceView === 'pc' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setDeviceView('pc')}
            >
              <Monitor className="h-4 w-4 mr-1" />
              PC
            </Button>
            <Button 
              variant={deviceView === 'smartphone' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setDeviceView('smartphone')}
            >
              <Smartphone className="h-4 w-4 mr-1" />
              スマホ
            </Button>
          </div>
          <Link href="/store/design-manager-new">
            <Button variant="default" size="sm">
              デザイン編集
            </Button>
          </Link>
        </div>
      </div>

      {/* プレビュー表示部分 */}
      <div className="flex-1 overflow-auto p-6 bg-muted/50">
        <div 
          className={`mx-auto transition-all duration-300 bg-background shadow-lg rounded-md overflow-hidden ${
            deviceView === 'smartphone' ? 'max-w-[390px]' : 'max-w-[1200px]'
          }`}
        >
          {/* インラインプレビュー - 新方式 */}
          <PreviewRenderer
            settings={designData || getDefaultDesignSettings()}
            storeProfile={storeProfile}
            deviceView={deviceView}
          />
        </div>
      </div>
    </div>
  );
}