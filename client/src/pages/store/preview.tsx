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
        const response = await apiRequest("GET", "/store/blog?limit=3");
        forwardLog('店舗ブログAPI応答:', response);
        return response;
      } catch (error) {
        forwardLog('店舗ブログ取得エラー:', error);
        console.error('ブログ記事の取得に失敗しました:', error);
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
    fontFamily: settings.globalSettings.fontFamily || '"Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif',
    backgroundColor: settings.globalSettings.backgroundColor || '#fff5f9',
    '--main-color': settings.globalSettings.mainColor || '#ff4d7d',
    '--secondary-color': settings.globalSettings.secondaryColor || '#ffc7d8',
    '--accent-color': settings.globalSettings.accentColor || '#ff9eb8',
    '--border-radius': `${settings.globalSettings.borderRadius || 8}px`,
    maxWidth: `${settings.globalSettings.maxWidth || 1200}px`,
    color: '#333333',
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
    '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
    '--gradient-primary': 'linear-gradient(135deg, var(--main-color) 0%, #ff8fa3 100%)',
    '--animation-duration': '0.3s',
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
    top_image: '', // TOP画像URL
    gallery_photos: [],
    benefits: [],
    minimum_guarantee: 0,
    maximum_guarantee: 0,
    working_hours: '',
    average_hourly_pay: 0,
    working_time_hours: 0, // 稼働時間
    address: '',
    access_info: '',
    recruiter_name: '',
    phone_numbers: [],
    email_addresses: [],
    sns_urls: [],
    transportation_support: false, // 交通費サポート
    housing_support: false // 寮完備
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
          <div style={getSectionStyle('header')} className="mb-12 rounded-xl border border-primary/10 bg-white shadow-md overflow-hidden">
            {/* TOP画像表示 - 640×640推奨サイズ */}
            {profile.top_image ? (
              <div className="relative w-full bg-gray-100 flex justify-center">
                <div className="relative w-[640px] h-[640px] overflow-hidden">
                  <img 
                    src={profile.top_image} 
                    alt={profile.business_name || 'ショップ画像'} 
                    className="w-full h-full object-cover"
                  />
                  {/* 画像の上に重ねるグラデーション */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                  
                  {/* ショップ名と場所を表示 */}
                  <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-md">
                      {profile.business_name}
                    </h1>
                    <div className="flex items-center text-white/90 space-x-3">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span className="text-sm font-medium">{profile.location}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        <span className="text-sm font-medium">{profile.service_type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* TOP画像がない場合のフォールバック */
              <div className="flex flex-col items-center text-center p-8 bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center mb-4 shadow-lg" style={{ background: 'var(--gradient-primary)' }}>
                  <span className="text-2xl font-bold text-white">{profile.business_name.substring(0, 1)}</span>
                </div>
                
                <h1 style={{ color: settings.globalSettings.mainColor }} className="text-3xl md:text-4xl font-bold mb-3 tracking-tight relative">
                  {profile.business_name}
                  <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 rounded-full" style={{ background: 'var(--gradient-primary)' }}></span>
                </h1>
                
                <div className="flex items-center justify-center flex-wrap space-x-3 text-gray-600 my-4">
                  <span className="flex items-center bg-white/80 px-3 py-1.5 rounded-full shadow-sm border border-gray-100 backdrop-blur-sm">
                    <svg className="w-4 h-4 mr-1.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span className="font-medium">{profile.location}</span>
                  </span>
                  
                  <span className="flex items-center bg-white/80 px-3 py-1.5 rounded-full shadow-sm border border-gray-100 backdrop-blur-sm">
                    <svg className="w-4 h-4 mr-1.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <span className="font-medium">{profile.service_type}</span>
                  </span>
                </div>
              </div>
            )}
            
            {/* キャッチフレーズ部分 */}
            {profile.catch_phrase && (
              <div className="p-5 bg-white border-t border-gray-200">
                <h2 className="text-lg md:text-xl font-bold text-primary">{profile.catch_phrase}</h2>
              </div>
            )}
          </div>
        )}

        {/* メインコンテンツ - セクションの順序に従って表示 */}
        <div className="space-y-6">
          {settings.sections
            .filter(section => section.id !== 'header' && shouldShowSection(section.id))
            .sort((a, b) => a.order - b.order)
            .map(section => (
              <div key={section.id} style={getSectionStyle(section.id)}>
                {/* セクションタイトルを非表示にする */}
                
                {/* お仕事詳細 */}
                {section.id === 'catchphrase' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/90 to-primary-light flex items-center justify-center text-white shadow-md mr-3">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">お仕事詳細</h3>
                      </div>
                      <div className="prose prose-sm max-w-none prose-headings:text-primary prose-img:mx-auto prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: profile.description }} />
                    </div>
                  </div>
                )}
                
                {/* 給与情報 */}
                {section.id === 'salary' && (
                  <div className="space-y-6 relative">
                    {/* 給与ハイライト */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-800/10 p-6 rounded-xl border border-green-100 dark:border-green-800/30 shadow-md">
                      <div className="absolute -top-4 left-4 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        参考給与
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6 mt-2">
                        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-green-100 dark:border-green-800/20">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">日給</div>
                          </div>
                          <div className="text-2xl font-extrabold text-green-600 dark:text-green-400 tracking-tight">
                            {profile.minimum_guarantee && profile.maximum_guarantee ? 
                              <>
                                <span className="text-3xl">{profile.minimum_guarantee.toLocaleString()}</span>
                                <span className="text-lg mx-1">〜</span>
                                <span className="text-3xl">{profile.maximum_guarantee.toLocaleString()}</span>
                                <span className="text-lg ml-1">円</span>
                              </> : 
                              <span className="text-xl">応相談</span>
                            }
                          </div>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            ※経験・スキルに応じて変動
                          </div>
                        </div>
                        
                        {profile.average_hourly_pay > 0 && profile.working_time_hours > 0 && (
                          <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-green-100 dark:border-green-800/20">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">平均給与（{profile.working_time_hours}時間勤務）</div>
                            </div>
                            <div className="text-2xl font-extrabold text-green-600 dark:text-green-400 tracking-tight">
                              <span className="text-3xl">{profile.average_hourly_pay.toLocaleString()}</span>
                              <span className="text-lg ml-1">円</span>
                            </div>
                            <div className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                              時給換算: <span className="text-green-500 dark:text-green-400">{Math.round(profile.average_hourly_pay / profile.working_time_hours).toLocaleString()}円</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 待遇アイコン */}
                    <div className="flex flex-wrap gap-3">
                      {profile.transportation_support && (
                        <div className="group flex items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer">
                          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-800/30 flex items-center justify-center mr-2">
                            <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">交通費支給</span>
                        </div>
                      )}
                      
                      {profile.housing_support && (
                        <div className="group flex items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer">
                          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-800/30 flex items-center justify-center mr-2">
                            <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">寮完備</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 勤務時間 */}
                {section.id === 'schedule' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-800/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30 shadow-md relative">
                      <div className="absolute -top-4 left-4 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        勤務時間
                      </div>
                      <div className="mt-2 flex items-start">
                        <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">
                          {profile.working_hours || '勤務時間情報が登録されていません。詳細はお問い合わせください。'}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/30 flex justify-between items-center">
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          ご希望の時間帯でのシフト相談も可能です
                        </div>
                        <div className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                          面接時にご相談ください
                        </div>
                      </div>
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
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute -top-4 left-4 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        限定特典
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
                        {Array.isArray(specialOffers) && specialOffers.map((offer: any, index: number) => (
                          <div
                            key={offer.id || index}
                            className={`p-6 rounded-xl bg-gradient-to-br ${offer.backgroundColor} shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300`}
                          >
                            <div className="flex items-center mb-3">
                              {offer.icon && (
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm">
                                  <svg className={`w-5 h-5 ${offer.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    {offer.icon === 'Gift' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112.83 1.83l-2.83 2.83m-2.83-2.83a2 2 0 112.83-1.83V8m-9 3h4.09l-2.3 2.29a1 1 0 000 1.42l5.5 5.5a1 1 0 001.42 0l5.5-5.5a1 1 0 000-1.42L18.9 11H23m-9 0h4.09l-2.3-2.29a1 1 0 010-1.42l5.5-5.5a1 1 0 011.42 0l5.5 5.5a1 1 0 010 1.42L18.91 11H23"></path>}
                                    {offer.icon === 'Car' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1V6a1 1 0 011-1h6a1 1 0 011 1v10a1 1 0 01-1 1h-1"></path>}
                                    {offer.icon === 'DollarSign' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>}
                                  </svg>
                                </div>
                              )}
                              <div className={`text-xl font-bold ${offer.textColor}`}>{offer.title}</div>
                            </div>
                            <div className={`text-base font-medium ${offer.textColor.replace('700', '600')} pl-1`}>{offer.description}</div>
                            
                            <div className="mt-4 pt-3 border-t border-white/20 flex justify-end">
                              <span className="inline-flex items-center text-xs font-medium text-gray-600">
                                <span className="bg-white/70 px-2 py-1 rounded-full">詳細はお問い合わせください</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {Array.isArray(specialOffers) && specialOffers.length > 0 && (
                      <div className="flex justify-end">
                        <p className="text-sm text-gray-500 italic">※特典内容は変更になる場合があります</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 安全対策 */}
                {section.id === 'security_measures' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute -top-4 left-4 bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        安全対策
                      </div>
                      <div className="bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-900/10 dark:to-green-900/10 p-6 rounded-xl border border-teal-100 dark:border-teal-800/30 shadow-md">
                        <div className="grid md:grid-cols-2 gap-6 mt-2">
                          <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-teal-100 dark:border-teal-800/20">
                            <div className="flex items-center mb-3">
                              <svg className="w-6 h-6 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                              </svg>
                              <div className="text-base font-bold text-gray-700 dark:text-gray-200">安全への取り組み</div>
                            </div>
                            <div className="text-gray-600 dark:text-gray-300 space-y-2">
                              <p>すべての女性が安心して働けるよう、以下の対策を徹底しています：</p>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>身分証明書による年齢確認</li>
                                <li>マネージャー常駐によるサポート体制</li>
                                <li>24時間相談窓口の設置</li>
                                <li>勤務時間の柔軟な調整</li>
                              </ul>
                            </div>
                          </div>
                        
                          <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-teal-100 dark:border-teal-800/20">
                            <div className="flex items-center mb-3">
                              <svg className="w-6 h-6 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                              </svg>
                              <div className="text-base font-bold text-gray-700 dark:text-gray-200">プライバシー保護</div>
                            </div>
                            <div className="text-gray-600 dark:text-gray-300 space-y-2">
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>個人情報の厳重な管理と保護</li>
                                <li>SNSやメディア露出の自己選択制</li>
                                <li>顧客情報のデータベース管理</li>
                                <li>勤務地域の選択が可能</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-teal-100 dark:border-teal-800/20">
                          <div className="flex items-center mb-3">
                            <svg className="w-6 h-6 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                            </svg>
                            <div className="text-base font-bold text-gray-700 dark:text-gray-200">コミットメント</div>
                          </div>
                          <div className="text-gray-600 dark:text-gray-300">
                            <p>当店は女性スタッフの安全と働きやすさを最優先に考え、常に環境改善に取り組んでいます。不安なことや質問があれば、いつでもお気軽にご相談ください。あなたのプライバシーと安全を守りながら、充実した職場環境を提供いたします。</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 応募条件 */}
                {section.id === 'requirements' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute -top-4 left-4 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        応募条件
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-4">
                        {profile.requirements ? (
                          <div>
                            <ul className="space-y-3">
                              {profile.requirements.age_min && (
                                <li className="flex items-center">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                  </div>
                                  <span className="text-gray-700">年齢: {profile.requirements.age_min}歳以上</span>
                                </li>
                              )}
                              {profile.requirements.tattoo_acceptance && (
                                <li className="flex items-center">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                    </svg>
                                  </div>
                                  <span className="text-gray-700">タトゥー: {profile.requirements.tattoo_acceptance}</span>
                                </li>
                              )}
                              {profile.requirements.preferred_hair_colors && profile.requirements.preferred_hair_colors.length > 0 && (
                                <li className="flex items-center">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                                    </svg>
                                  </div>
                                  <span className="text-gray-700">ヘアカラー: {profile.requirements.preferred_hair_colors.join('、')}</span>
                                </li>
                              )}
                              {profile.requirements.other_conditions && profile.requirements.other_conditions.length > 0 && (
                                <li className="flex items-center">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                  </div>
                                  <span className="text-gray-700">その他: {profile.requirements.other_conditions.join('、')}</span>
                                </li>
                              )}
                            </ul>
                            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                              <p className="text-sm text-gray-600">※ 応募条件についてご不明な点があれば、お気軽にお問い合わせください。条件を満たしていない場合でもご相談可能です。</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-gray-500">応募条件は登録されていません</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* アクセス情報 */}
                {section.id === 'access' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute -top-4 left-4 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        アクセス情報
                      </div>
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-md">
                        <div className="grid md:grid-cols-2 gap-6 mt-2">
                          {profile.address && (
                            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-800/20">
                              <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">住所</div>
                              </div>
                              <div className="mt-1 text-gray-700 dark:text-gray-300">
                                {profile.address}
                              </div>
                            </div>
                          )}
                          
                          <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-800/20">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                              </svg>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">面接について</div>
                            </div>
                            <div className="mt-1 text-gray-700 dark:text-gray-300">
                              採用担当が丁寧にご案内します。ご不明点はお気軽にお問い合わせください。
                            </div>
                          </div>
                        </div>
                        
                        {profile.access_info && (
                          <div className="mt-6 bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-800/20">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                              </svg>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">アクセス方法</div>
                            </div>
                            <div className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-line">
                              {profile.access_info}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-6 flex justify-center">
                          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            面接時に詳細をご案内します
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 連絡先情報 */}
                {section.id === 'contact' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute -top-4 left-4 bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        お問い合わせ
                      </div>
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 p-6 rounded-xl border border-teal-100 dark:border-teal-800/30 shadow-md">
                        <div className="grid md:grid-cols-2 gap-6 mt-2">
                          {profile.recruiter_name && (
                            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-teal-100 dark:border-teal-800/20">
                              <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">採用担当</div>
                              </div>
                              <div className="mt-1 text-lg font-medium text-teal-700 dark:text-teal-400">
                                {profile.recruiter_name}
                              </div>
                            </div>
                          )}
                          
                          {/* 電話番号 */}
                          {Array.isArray(profile.phone_numbers) && profile.phone_numbers.length > 0 && (
                            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-teal-100 dark:border-teal-800/20">
                              <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                </svg>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">電話番号</div>
                              </div>
                              <div className="mt-1">
                                {profile.phone_numbers.map((phone: string, index: number) => (
                                  <div key={index} className="text-lg font-bold text-teal-700 dark:text-teal-400 flex items-center mt-1 first:mt-0">
                                    <a 
                                      href={`tel:${phone.replace(/[^0-9]/g, '')}`} 
                                      className="flex items-center group hover:text-teal-600 transition-colors duration-200"
                                    >
                                      <span className="inline-flex items-center justify-center w-5 h-5 bg-teal-100 text-teal-500 rounded-full mr-2 text-xs group-hover:bg-teal-200 transition-colors duration-200">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                      </span>
                                      {phone}
                                    </a>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                お気軽にお電話ください 24時間受付中
                              </div>
                            </div>
                          )}
                          
                          {/* メールアドレス */}
                          {Array.isArray(profile.email_addresses) && profile.email_addresses.length > 0 && (
                            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-teal-100 dark:border-teal-800/20">
                              <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">メールアドレス</div>
                              </div>
                              <div className="mt-1">
                                {profile.email_addresses.map((email: string, index: number) => (
                                  <div key={index} className="text-base font-medium text-teal-700 dark:text-teal-400 mt-1 first:mt-0 break-all">
                                    <a 
                                      href={`mailto:${email}`} 
                                      className="hover:underline hover:text-teal-600 transition-colors duration-200"
                                    >
                                      {email}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-6 bg-white/70 dark:bg-gray-800/30 p-4 rounded-lg border border-teal-100 dark:border-teal-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="text-gray-700 dark:text-gray-300 text-sm">
                            <span className="font-medium text-teal-700 dark:text-teal-400">面接のご予約・ご質問</span>は、お電話またはメールにてお気軽にどうぞ。
                          </div>
                          <button className="inline-flex items-center px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg text-sm shadow-sm transition-colors duration-300">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                            </svg>
                            今すぐ応募する
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* SNSリンク */}
                {section.id === 'sns_links' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute -top-4 left-4 bg-violet-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        SNS
                      </div>
                      
                      <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/10 dark:to-fuchsia-900/10 p-6 rounded-xl border border-violet-100 dark:border-violet-800/30 shadow-md">
                        <div className="flex flex-col space-y-6">
                          {/* LINE情報 */}
                          {(profile.sns_id || profile.sns_url) && (
                            <div className="bg-white dark:bg-gray-800/50 p-5 rounded-lg shadow-sm border border-[#06c755]/20">
                              <div className="flex items-center">
                                <div className="w-12 h-12 rounded-xl bg-[#06c755] flex items-center justify-center mr-4 text-white font-bold shadow-sm">
                                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"></path>
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">公式LINE</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">24時間受付中・お問い合わせはこちら</p>
                                </div>
                              </div>
                              
                              {profile.sns_text && (
                                <div className="mt-4 p-3 bg-[#06c755]/10 rounded-lg text-gray-700 dark:text-gray-300 text-sm">
                                  {profile.sns_text}
                                </div>
                              )}
                              
                              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                {profile.sns_id && (
                                  <div className="flex items-center text-sm">
                                    <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-l-lg font-bold text-gray-700 dark:text-gray-300">LINE ID</span>
                                    <span className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-r-lg font-medium text-gray-800 dark:text-gray-200">
                                      {profile.sns_id}
                                    </span>
                                  </div>
                                )}
                                
                                {profile.sns_url && (
                                  <a
                                    href={profile.sns_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 bg-[#06C755] hover:bg-[#05b64d] text-white font-medium rounded-lg text-sm shadow-sm transition-colors duration-300"
                                  >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"></path>
                                    </svg>
                                    友だち追加
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* 通常のSNSリンク */}
                          {Array.isArray(profile.sns_urls) && profile.sns_urls.length > 0 && (
                            <div>
                              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">その他のSNS</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile.sns_urls.map((sns: string, index: number) => {
                                  // SNSタイプを判定（URLの文字列に基づく簡易判定）
                                  const snsType = sns.includes('twitter.com') || sns.includes('x.com') ? 'Twitter' : 
                                                sns.includes('instagram.com') ? 'Instagram' : 
                                                sns.includes('facebook.com') ? 'Facebook' : 
                                                sns.includes('tiktok.com') ? 'TikTok' : 'その他';
                                  
                                  // SNSタイプに基づいた背景色を設定
                                  const bgColor = snsType === 'Twitter' ? 'bg-[#1DA1F2]/10 border-[#1DA1F2]/20' : 
                                                snsType === 'Instagram' ? 'bg-gradient-to-br from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#FCAF45]/10 border-purple-200' :
                                                snsType === 'Facebook' ? 'bg-[#1877F2]/10 border-[#1877F2]/20' :
                                                snsType === 'TikTok' ? 'bg-[#000000]/10 border-gray-300' :
                                                'bg-gray-100 border-gray-200';
                                  
                                  // SNSアイコンの色
                                  const iconColor = snsType === 'Twitter' ? 'text-[#1DA1F2]' : 
                                                 snsType === 'Instagram' ? 'text-[#E1306C]' :
                                                 snsType === 'Facebook' ? 'text-[#1877F2]' :
                                                 snsType === 'TikTok' ? 'text-black' :
                                                 'text-primary';
                                  
                                  return (
                                    <a 
                                      key={index} 
                                      href={sns}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`p-4 rounded-lg flex items-center ${bgColor} hover:shadow-md transition-all duration-300`}
                                    >
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${iconColor} bg-white shadow-sm`}>
                                        {snsType === 'Twitter' && (
                                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                          </svg>
                                        )}
                                        {snsType === 'Instagram' && (
                                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                                          </svg>
                                        )}
                                        {snsType === 'Facebook' && (
                                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                          </svg>
                                        )}
                                        {snsType === 'TikTok' && (
                                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                          </svg>
                                        )}
                                        {snsType === 'その他' && (
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                                          </svg>
                                        )}
                                      </div>
                                      <div>
                                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-0.5">{snsType}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate w-36 sm:w-48 md:w-28 lg:w-48">
                                          {sns.replace(/https?:\/\/(www\.)?/i, '')}
                                        </div>
                                      </div>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* SNSリンクが存在しない場合 */}
                          {(!Array.isArray(profile.sns_urls) || profile.sns_urls.length === 0) && 
                           !profile.sns_id && !profile.sns_url && (
                            <div className="text-center p-8 bg-white/50 dark:bg-gray-800/20 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <p className="text-gray-500 dark:text-gray-400">SNS情報が登録されていません</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 写真ギャラリー */}
                {section.id === 'photo_gallery' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute -top-4 left-4 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        店内写真
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
                        {Array.isArray(profile.gallery_photos) && profile.gallery_photos.length > 0 ? (
                          profile.gallery_photos.map((photo: any, index: number) => (
                            <div 
                              key={index} 
                              className="group relative aspect-[4/3] overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                            >
                              <img 
                                src={typeof photo === 'string' ? photo : photo.url} 
                                alt={`ギャラリー画像 ${index + 1}`} 
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-3 text-white font-medium text-center text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                  写真を拡大
                                </div>
                              </div>
                              <div className="absolute top-2 right-2 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                </svg>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-muted/5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400 text-center">写真が登録されていません</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 text-center">店舗の雰囲気がわかる写真をアップロードしましょう</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {Array.isArray(profile.gallery_photos) && profile.gallery_photos.length > 0 && (
                      <div className="flex justify-center">
                        <button className="inline-flex items-center px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-full transition-colors duration-300">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          すべての写真を見る
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 店舗ブログ */}
                {section.id === 'blog' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute -top-4 left-4 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        店舗ブログ
                      </div>
                      
                      {Array.isArray(blogPosts) && blogPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          {blogPosts.map((post: any) => (
                            <div 
                              key={post.id} 
                              className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                            >
                              <div className="relative">
                                {post.thumbnail ? (
                                  <div className="w-full h-48 relative overflow-hidden">
                                    <img 
                                      src={post.thumbnail} 
                                      alt={post.title} 
                                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-70"></div>
                                  </div>
                                ) : (
                                  <div className="w-full h-48 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center text-primary">
                                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                
                                {/* 公開状態とタイムスタンプ */}
                                <div className="absolute top-3 left-3 flex space-x-2">
                                  <span className="px-2.5 py-1 bg-white/90 dark:bg-gray-800/90 text-xs font-medium rounded-full shadow-sm backdrop-blur-sm text-gray-700 dark:text-gray-300 flex items-center">
                                    <svg className="w-3.5 h-3.5 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    {new Date(post.published_at || post.created_at).toLocaleDateString('ja-JP')}
                                  </span>
                                  
                                  {post.status === 'published' && (
                                    <span className="inline-flex items-center px-2.5 py-1 bg-green-500/90 text-xs font-medium text-white rounded-full shadow-sm backdrop-blur-sm">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                      </svg>
                                      公開中
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="p-5">
                                <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-800 dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                                  {post.title}
                                </h3>
                                
                                <div className="text-sm line-clamp-3 text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                  {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                                </div>
                                
                                <div className="flex justify-end">
                                  <span className="inline-flex items-center text-sm font-medium text-primary">
                                    続きを読む
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-gray-800/50 p-8 rounded-xl text-center shadow-sm border border-gray-100 dark:border-gray-700">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                            </svg>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400">ブログ記事が登録されていません</p>
                        </div>
                      )}
                    </div>
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