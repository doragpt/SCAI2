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
    queryKey: ["special_offers"],
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
    queryKey: ["store_blog_posts"],
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
    color: '#333333',
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
          <div style={getSectionStyle('header')} className="flex flex-col items-center text-center mb-8 p-6 rounded-lg border border-primary/20 bg-gradient-to-b from-white to-primary/5 shadow-sm">
            <h1 style={{ color: settings.globalSettings.mainColor }} className="text-3xl md:text-4xl font-bold mb-3">
              {profile.business_name}
            </h1>
            <div className="flex items-center space-x-3 text-gray-600 mb-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {profile.location}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                {profile.service_type}
              </span>
            </div>
            <div className="bg-primary/10 rounded-full px-4 py-1.5 text-sm font-medium text-primary">
              採用情報掲載中
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
                    <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-md border border-green-100 dark:border-green-800/30">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">参考給与例</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">日給</div>
                      <div className="text-xl font-bold text-green-700 dark:text-green-400">
                        {profile.minimum_guarantee && profile.maximum_guarantee ? 
                          `${profile.minimum_guarantee.toLocaleString()}円〜${profile.maximum_guarantee.toLocaleString()}円` : 
                          '応相談'}
                      </div>
                      
                      {profile.average_hourly_pay > 0 && profile.working_time_hours > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">平均給与</div>
                          <div className="font-medium text-green-700 dark:text-green-400">
                            {profile.working_time_hours}時間勤務　{profile.average_hourly_pay.toLocaleString()}円
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            （時給換算：{Math.round(profile.average_hourly_pay / profile.working_time_hours).toLocaleString()}円）
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 待遇アイコン */}
                    <div className="flex flex-wrap gap-2">
                      {profile.transportation_support && (
                        <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">交通費支給</span>
                        </div>
                      )}
                      
                      {profile.housing_support && (
                        <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">寮完備</span>
                        </div>
                      )}
                    </div>
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
                    {Array.isArray(profile.benefits) && profile.benefits.length > 0 ? (
                      profile.benefits.map((benefit: string, index: number) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-md text-center shadow-sm border border-primary/10 hover:border-primary/30 transition-all duration-300">
                          <span className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                            <svg className="w-4 h-4 mr-1.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            {benefit}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center p-8 bg-muted/10 rounded-md">
                        <p className="text-muted-foreground">待遇情報が登録されていません</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 特別オファー */}
                {section.id === 'special_offers' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.isArray(specialOffers) && specialOffers.map((offer: any, index: number) => (
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
                        {profile.phone_numbers.map((phone: string, index: number) => (
                          <div key={index} className="font-medium">{phone}</div>
                        ))}
                      </div>
                    )}
                    
                    {Array.isArray(profile.email_addresses) && profile.email_addresses.length > 0 && (
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground mb-1">メールアドレス</div>
                        {profile.email_addresses.map((email: string, index: number) => (
                          <div key={index} className="font-medium">{email}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* SNSリンク */}
                {section.id === 'sns_links' && (
                  <div className="space-y-4">
                    {/* 通常のSNSリンク */}
                    {Array.isArray(profile.sns_urls) && profile.sns_urls.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.sns_urls.map((sns: string, index: number) => (
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

                    {/* LINE情報 */}
                    {(profile.sns_id || profile.sns_url) && (
                      <div className="bg-[#06c755]/10 p-4 rounded-md">
                        <div className="flex items-center mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#06c755] flex items-center justify-center mr-3 text-white font-bold">
                            LINE
                          </div>
                          <div className="font-medium">公式LINE</div>
                        </div>
                        
                        {profile.sns_text && (
                          <p className="mb-3 text-sm">{profile.sns_text}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {profile.sns_id && (
                            <div className="flex items-center text-sm bg-white px-3 py-2 rounded-lg">
                              <span className="font-bold mr-2">ID:</span>
                              <span>{profile.sns_id}</span>
                            </div>
                          )}
                          
                          {profile.sns_url && (
                            <a
                              href={profile.sns_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center p-2 rounded-md bg-[#06C755] hover:bg-[#05b64d] text-white text-sm font-medium"
                            >
                              <span>友だち追加</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 写真ギャラリー */}
                {section.id === 'photo_gallery' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.isArray(profile.gallery_photos) && profile.gallery_photos.length > 0 ? (
                      profile.gallery_photos.map((photo: any, index: number) => (
                        <div key={index} className="aspect-[4/3] overflow-hidden rounded-md shadow-sm hover:shadow-md transition-all duration-300">
                          <img 
                            src={typeof photo === 'string' ? photo : photo.url} 
                            alt={`ギャラリー画像 ${index + 1}`} 
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center p-8 bg-muted/10 rounded-md">
                        <p className="text-muted-foreground">写真が登録されていません</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 店舗ブログ */}
                {section.id === 'blog' && (
                  <div className="space-y-4">
                    {Array.isArray(blogPosts) && blogPosts.length > 0 ? (
                      blogPosts.map((post: any) => (
                        <div key={post.id} className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            {post.thumbnail && (
                              <div className="shrink-0 w-full sm:w-32 h-32 rounded-md overflow-hidden">
                                <img 
                                  src={post.thumbnail} 
                                  alt={post.title} 
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="text-lg font-bold mb-1 text-primary">{post.title}</h3>
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                                <span className="inline-block px-2 py-1 bg-primary/10 rounded-full mr-2">
                                  {new Date(post.published_at || post.created_at).toLocaleDateString('ja-JP')}
                                </span>
                                {post.status === 'published' && (
                                  <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                                    公開中
                                  </span>
                                )}
                              </div>
                              <div className="text-sm line-clamp-3 text-gray-600 dark:text-gray-300 leading-relaxed">
                                {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                              </div>
                              <div className="mt-3">
                                <span className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80">
                                  続きを読む
                                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                  </svg>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-8 bg-muted/10 rounded-md">
                        <p className="text-muted-foreground">ブログ記事が登録されていません</p>
                      </div>
                    )}
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