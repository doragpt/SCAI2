import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { type DesignSettings, type DesignSection } from '@shared/schema';
import { getDefaultDesignSettings } from '@/shared/defaultDesignSettings';

// コンソールログを親ウィンドウに転送するヘルパー関数
const forwardLog = (...args: any[]) => {
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'forward-log',
      args,
      timestamp: new Date().toISOString()
    }, '*');
  }
  console.log(...args);
};

/**
 * 店舗デザインプレビューコンポーネント
 * デザイン管理画面から送信される設定を適用してプレビュー表示する
 */
export default function StoreDesignPreview() {
  const [designSettings, setDesignSettings] = useState<DesignSettings | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 店舗情報を取得
  const storeProfileQuery = useQuery({
    queryKey: [QUERY_KEYS.STORE_PROFILE],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/store/profile");
        forwardLog('店舗プロフィールAPI応答:', response);
        return response;
      } catch (error) {
        forwardLog('店舗プロフィール取得エラー:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // 特別オファー情報を取得
  const specialOffersQuery = useQuery({
    queryKey: [QUERY_KEYS.SPECIAL_OFFERS],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/store/special-offers");
        forwardLog('special_offers フィールド値：', response);
        return response;
      } catch (error) {
        forwardLog('special_offers 取得エラー:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1
  });
  
  // 店舗ブログ情報を取得
  const storeBlogQuery = useQuery({
    queryKey: [QUERY_KEYS.STORE_BLOG_POSTS],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/store/blog?limit=3");
        forwardLog('店舗ブログAPI応答:', response);
        return response;
      } catch (error) {
        forwardLog('店舗ブログ取得エラー:', error);
        return { posts: [] };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // ページロード時に親ウィンドウに準備完了を通知
  useEffect(() => {
    if (!isReady) {
      forwardLog('プレビューページがロードされました');
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
        setIsReady(true);
      }
    }
  }, [isReady]);

  // 親ウィンドウからのメッセージを受け取る
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // UPDATE_DESIGNメッセージを受け取った場合
      if (event.data && event.data.type === 'UPDATE_DESIGN') {
        forwardLog('デザイン設定を受信しました:', {
          timestamp: event.data.timestamp,
          sectionsCount: event.data.settings.sections.length,
          sectionIds: event.data.settings.sections.map((s: DesignSection) => s.id)
        });
        
        setDesignSettings(event.data.settings);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // デザイン設定が受信されていない場合はデフォルト設定を使用
  const settings = designSettings || getDefaultDesignSettings();

  // グローバル設定を適用したスタイル
  const globalStyles = {
    fontFamily: settings.globalSettings.fontFamily || 'sans-serif',
    backgroundColor: settings.globalSettings.backgroundColor || '#fff5f9',
    '--main-color': settings.globalSettings.mainColor || '#ff4d7d',
    '--secondary-color': settings.globalSettings.secondaryColor || '#ffc7d8',
    '--accent-color': settings.globalSettings.accentColor || '#ff9eb8',
    '--border-radius': `${settings.globalSettings.borderRadius || 8}px`,
    maxWidth: `${settings.globalSettings.maxWidth || 1200}px`,
  } as React.CSSProperties;

  // データ読み込み中の表示
  if (storeProfileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">プレビューを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  // エラー時の表示
  if (storeProfileQuery.isError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-500 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">店舗情報の読み込みに失敗しました。再度お試しください。</p>
          <p className="text-sm text-gray-500">{storeProfileQuery.error?.message}</p>
        </div>
      </div>
    );
  }

  // 店舗プロフィールデータ
  const profile = storeProfileQuery.data || {
    business_name: 'サンプル店舗',
    location: '東京都',
    service_type: 'デリヘル',
    catch_phrase: 'サンプルキャッチコピー',
    description: '<p>サンプル説明文</p>',
    gallery_photos: [],
    benefits: [],
    minimum_guarantee: 0,
    maximum_guarantee: 0,
    working_hours: '',
    average_hourly_pay: 0,
    address: '',
    access_info: '',
    recruiter_name: '',
    phone_numbers: [],
    email_addresses: [],
    sns_urls: []
  };

  // 特別オファーデータ
  const specialOffers = specialOffersQuery.data || [];

  // ブログ投稿データ
  const blogPosts = storeBlogQuery.data?.posts || [];

  // セクションIDを指定して該当するセクションを取得する関数
  const getSection = (sectionId: string): DesignSection | undefined => {
    return settings.sections.find(section => section.id === sectionId);
  };

  // セクションの表示条件を確認
  const shouldShowSection = (sectionId: string): boolean => {
    const section = getSection(sectionId);
    
    // セクションが存在しないか、非表示設定の場合は表示しない
    if (!section || !section.visible) return false;
    
    // 以下、特定セクションの追加条件
    switch (sectionId) {
      case 'special_offers':
        // 特別オファーデータが空の場合は表示しない
        return Array.isArray(specialOffers) && specialOffers.length > 0;
      
      case 'blog':
        // ブログ投稿が空の場合は表示しない
        return Array.isArray(blogPosts) && blogPosts.length > 0;
        
      case 'photo_gallery':
        // ギャラリー写真が空の場合は表示しない
        return Array.isArray(profile.gallery_photos) && profile.gallery_photos.length > 0;
        
      default:
        return true;
    }
  };

  // セクションのスタイルを生成
  const getSectionStyle = (sectionId: string): React.CSSProperties => {
    const section = getSection(sectionId);
    if (!section) return {};
    
    return {
      backgroundColor: section.settings?.backgroundColor || '#ffffff',
      color: section.settings?.textColor || '#333333',
      padding: `${section.settings?.padding || 20}px`,
      borderRadius: `${section.settings?.borderRadius || 8}px`,
      borderWidth: `${section.settings?.borderWidth || 1}px`,
      borderStyle: 'solid',
      borderColor: section.settings?.borderColor || '#e0e0e0',
      fontSize: `${section.settings?.fontSize || 16}px`,
      marginBottom: '24px',
    };
  };

  // セクション見出しスタイルを生成
  const getSectionTitleStyle = (sectionId: string): React.CSSProperties => {
    const section = getSection(sectionId);
    if (!section) return {};
    
    return {
      color: section.settings?.titleColor || '#ff4d7d',
      fontSize: `${(section.settings?.fontSize || 16) + 4}px`,
      fontWeight: 'bold',
      marginBottom: '16px',
    };
  };

  return (
    <div style={globalStyles} className="min-h-screen py-8 px-4">
      <div style={{ margin: '0 auto', maxWidth: globalStyles.maxWidth }}>
        {/* ヘッダー */}
        {shouldShowSection('header') && (
          <div style={getSectionStyle('header')} className="flex flex-col items-center text-center mb-8">
            <h1 style={{ color: settings.globalSettings.mainColor }} className="text-3xl font-bold mb-2">
              {profile.business_name}
            </h1>
            <div className="flex items-center space-x-2 text-gray-600 mb-2">
              <span>{profile.location}</span>
              <span>•</span>
              <span>{profile.service_type}</span>
            </div>
          </div>
        )}

        {/* メインコンテンツ - セクションの順序に従って表示 */}
        <div className="space-y-6">
          {settings.sections
            .filter(section => section.id !== 'header' && shouldShowSection(section.id))
            .sort((a, b) => a.order - b.order)
            .map(section => (
              <div key={section.id} style={getSectionStyle(section.id)}>
                <h2 style={getSectionTitleStyle(section.id)}>
                  {section.title || section.id}
                </h2>
                
                {/* キャッチコピー・仕事内容 */}
                {section.id === 'catchphrase' && (
                  <div className="space-y-4">
                    <div className="text-lg font-medium">{profile.catch_phrase}</div>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: profile.description }} />
                  </div>
                )}
                
                {/* 給与情報 */}
                {section.id === 'salary' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground">最低保証</div>
                        <div className="text-xl font-bold">{profile.minimum_guarantee?.toLocaleString()}円〜</div>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground">最高給与</div>
                        <div className="text-xl font-bold">{profile.maximum_guarantee?.toLocaleString()}円</div>
                      </div>
                    </div>
                    {profile.average_hourly_pay > 0 && (
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground">平均時給</div>
                        <div className="text-xl font-bold">{profile.average_hourly_pay?.toLocaleString()}円</div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 勤務時間 */}
                {section.id === 'schedule' && (
                  <div className="space-y-4">
                    <div className="bg-muted/20 p-4 rounded-md">
                      <div className="whitespace-pre-line">{profile.working_hours}</div>
                    </div>
                  </div>
                )}
                
                {/* 待遇・環境 */}
                {section.id === 'benefits' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.isArray(profile.benefits) && profile.benefits.map((benefit, index) => (
                      <div key={index} className="bg-muted/20 p-3 rounded-md text-center">
                        {benefit}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 特別オファー */}
                {section.id === 'special_offers' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.isArray(specialOffers) && specialOffers.map((offer, index) => (
                      <div
                        key={offer.id || index}
                        className={`p-4 rounded-md bg-gradient-to-br ${offer.backgroundColor}`}
                      >
                        <div className={`text-lg font-bold ${offer.textColor} mb-1`}>{offer.title}</div>
                        <div className="text-sm">{offer.description}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* アクセス情報 */}
                {section.id === 'access' && (
                  <div className="space-y-4">
                    {profile.address && (
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground mb-1">住所</div>
                        <div>{profile.address}</div>
                      </div>
                    )}
                    
                    {profile.access_info && (
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground mb-1">アクセス方法</div>
                        <div className="whitespace-pre-line">{profile.access_info}</div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 連絡先情報 */}
                {section.id === 'contact' && (
                  <div className="space-y-4">
                    {profile.recruiter_name && (
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground mb-1">採用担当</div>
                        <div>{profile.recruiter_name}</div>
                      </div>
                    )}
                    
                    {Array.isArray(profile.phone_numbers) && profile.phone_numbers.length > 0 && (
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground mb-1">電話番号</div>
                        {profile.phone_numbers.map((phone, index) => (
                          <div key={index} className="font-medium">{phone}</div>
                        ))}
                      </div>
                    )}
                    
                    {Array.isArray(profile.email_addresses) && profile.email_addresses.length > 0 && (
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground mb-1">メールアドレス</div>
                        {profile.email_addresses.map((email, index) => (
                          <div key={index} className="font-medium">{email}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* SNSリンク */}
                {section.id === 'sns_links' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.isArray(profile.sns_urls) && profile.sns_urls.map((sns, index) => (
                      <div key={index} className="bg-muted/20 p-4 rounded-md flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                          <span className="text-primary">SNS</span>
                        </div>
                        <div>
                          <div className="font-medium truncate">{sns}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 写真ギャラリー */}
                {section.id === 'photo_gallery' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.isArray(profile.gallery_photos) && profile.gallery_photos.map((photo, index) => (
                      <div key={index} className="aspect-[4/3] overflow-hidden rounded-md bg-muted/20">
                        <img 
                          src={photo} 
                          alt={`ギャラリー画像 ${index + 1}`} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 店舗ブログ */}
                {section.id === 'blog' && (
                  <div className="space-y-4">
                    {blogPosts.map((post: any) => (
                      <div key={post.id} className="bg-muted/20 p-4 rounded-md">
                        <div className="flex items-start">
                          {post.thumbnail && (
                            <div className="shrink-0 w-24 h-24 mr-4 rounded-md overflow-hidden">
                              <img 
                                src={post.thumbnail} 
                                alt={post.title} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold mb-1">{post.title}</h3>
                            <div className="text-sm text-muted-foreground mb-2">
                              {new Date(post.published_at || post.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm line-clamp-2">
                              {post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
        
        {/* フッター */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>このページはプレビューです。実際の表示とは異なる場合があります。</p>
        </div>
      </div>
    </div>
  );
}