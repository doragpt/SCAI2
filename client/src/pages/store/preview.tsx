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

// URLパラメータを取得するヘルパー関数
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    embedded: params.get('embedded') === 'true',
  };
};

/**
 * 店舗デザインプレビューコンポーネント
 * デザイン管理画面から送信される設定を適用してプレビュー表示する
 */
export default function StoreDesignPreview() {
  const [designSettings, setDesignSettings] = useState<DesignSettings | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { embedded } = getUrlParams();

  // 埋め込みモードの場合、専用のAPIからデータを取得
  const previewDataQuery = useQuery({
    queryKey: ['preview_data'],
    queryFn: async () => {
      if (!embedded) return null;
      
      try {
        // 常に最新のデータを取得するためにタイムスタンプを追加
        const response = await apiRequest<any>(`GET`, `/api/preview?embedded=true&t=${Date.now()}`);
        forwardLog('プレビューデータAPI応答:', {
          success: response?.success,
          hasDesignData: !!response?.designData,
          hasStoreProfile: !!response?.storeProfile,
          sectionCount: response?.designData?.sections?.length || 0
        });
        
        // デザイン設定があれば適切なデータ処理を行ってからセット
        if (response?.designData) {
          // デザイン設定の型変換を行う
          try {
            // 特に文字列からのパース処理など、必要に応じて追加の変換処理
            let designData = response.designData;
            
            // 文字列の場合はパースを試みる
            if (typeof designData === 'string') {
              try {
                designData = JSON.parse(designData);
                forwardLog('デザイン設定を文字列からパースしました');
              } catch (parseError) {
                forwardLog('デザイン設定のパースに失敗しました:', parseError);
                // エラー回復: デフォルト設定を使う
                designData = getDefaultDesignSettings();
                forwardLog('パースエラーのためデフォルト設定を使用します');
              }
            }
            
            // セクションが配列であることを確認
            if (!designData.sections || !Array.isArray(designData.sections)) {
              forwardLog('デザイン設定のセクションが無効です。デフォルト配列を使用します');
              designData.sections = [];
            }
            
            // グローバル設定がオブジェクトであることを確認
            if (!designData.globalSettings || typeof designData.globalSettings !== 'object') {
              forwardLog('デザイン設定のグローバル設定が無効です。デフォルト設定を使用します');
              designData.globalSettings = {
                mainColor: '#ff6b81',
                secondaryColor: '#f9f9f9',
                accentColor: '#41a0ff',
                backgroundColor: '#ffffff',
                fontFamily: 'sans-serif',
                borderRadius: 8,
                maxWidth: 1200,
                hideSectionTitles: false
              };
            }
            
            setDesignSettings(designData);
          } catch (processingError) {
            forwardLog('デザイン設定の処理中にエラーが発生しました:', processingError);
            // エラー発生時もできるだけ元のデータを使用
            setDesignSettings(response.designData);
          }
        }
        
        return response;
      } catch (error) {
        forwardLog('プレビューデータ取得エラー:', error);
        return null;
      }
    },
    enabled: embedded,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // 店舗情報を取得（埋め込みモードでない場合のみ）
  const storeProfileQuery = useQuery({
    queryKey: [QUERY_KEYS.STORE_PROFILE],
    queryFn: async () => {
      try {
        const response = await apiRequest<any>("GET", "/api/store/profile");
        forwardLog('店舗プロフィールAPI応答:', response);
        return response;
      } catch (error) {
        forwardLog('店舗プロフィール取得エラー:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !embedded
  });

  // 特別オファー情報を取得（埋め込みモードでない場合のみ）
  const specialOffersQuery = useQuery({
    queryKey: ["special_offers"],
    queryFn: async () => {
      try {
        const response = await apiRequest<any>("GET", "/api/store/special-offers");
        forwardLog('special_offers フィールド値：', response);
        return response;
      } catch (error) {
        forwardLog('special_offers 取得エラー:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !embedded
  });
  
  // 店舗ブログ情報を取得（埋め込みモードでない場合のみ）
  const storeBlogQuery = useQuery({
    queryKey: ["store_blog_posts"],
    queryFn: async () => {
      try {
        const response = await apiRequest<any>("GET", "/api/store/blog?limit=3");
        forwardLog('店舗ブログAPI応答:', response);
        return response;
      } catch (error) {
        forwardLog('店舗ブログ取得エラー:', error);
        console.error('ブログ記事の取得に失敗しました:', error);
        return { posts: [] };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !embedded
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
      try {
        // メッセージの安全性チェック
        if (!event.data) {
          return;
        }
        
        // UPDATE_DESIGNメッセージを受け取った場合
        if (event.data.type === 'UPDATE_DESIGN') {
          // 設定データの存在チェック
          if (!event.data.settings) {
            forwardLog('警告: 受信したメッセージに settings が含まれていません', event.data);
            return;
          }
          
          // 設定データの構造チェック
          const settingsData = event.data.settings;
          if (!settingsData.sections || !Array.isArray(settingsData.sections)) {
            forwardLog('警告: 受信した設定データの sections が無効です', settingsData);
            // 最低限の構造を持つデータを作成
            settingsData.sections = [];
          }
          
          forwardLog('デザイン設定を受信しました:', {
            timestamp: event.data.timestamp,
            sectionsCount: settingsData.sections.length,
            sectionIds: settingsData.sections.map((s: DesignSection) => s.id),
            hasGlobalSettings: !!settingsData.globalSettings
          });
          
          // グローバル設定の存在チェック
          if (!settingsData.globalSettings || typeof settingsData.globalSettings !== 'object') {
            forwardLog('警告: グローバル設定が不足しています。デフォルト値を使用します');
            settingsData.globalSettings = {
              mainColor: '#ff6b81',
              secondaryColor: '#f9f9f9',
              accentColor: '#41a0ff',
              backgroundColor: '#ffffff',
              fontFamily: 'sans-serif',
              borderRadius: 8,
              maxWidth: 1200,
              hideSectionTitles: false
            };
          }
          
          setDesignSettings(settingsData);
          
          // 受信確認を親ウィンドウに送り返す
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'DESIGN_UPDATE_RECEIVED',
              timestamp: new Date().toISOString(),
              sectionsCount: settingsData.sections.length
            }, '*');
          }
        }
      } catch (error) {
        forwardLog('メッセージ処理中にエラーが発生しました:', error);
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
  if (!embedded && storeProfileQuery.isLoading) {
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
  if (!embedded && storeProfileQuery.isError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-500 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">店舗情報の読み込みに失敗しました。再度お試しください。</p>
          <p className="text-sm text-gray-500">{storeProfileQuery.error instanceof Error ? storeProfileQuery.error.message : "不明なエラー"}</p>
        </div>
      </div>
    );
  }

  // 特別オファーデータ
  const specialOffers = specialOffersQuery.data || [];

  // ブログ投稿データ
  const blogPosts = storeBlogQuery.data?.posts || [];
  
  // プレビューデータを取得
  const previewData = previewDataQuery.data;
  
  // 埋め込みモードで取得したデータを使用
  const storeProfile = embedded && previewData ? previewData.storeProfile : storeProfileQuery.data;
  
  // 適切なプロフィールデータを使用
  const defaultProfile = {
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
  
  const profile = storeProfile || defaultProfile;

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
      display: settings.globalSettings.hideSectionTitles ? 'none' : 'block',
    };
  };

  // 埋め込みモードの場合はシンプルなプレビュー表示
  if (embedded) {
    return (
      <div style={globalStyles} className="min-h-screen py-4 px-2">
        <div className="border-2 border-dashed border-primary p-4 rounded-md mb-4 bg-primary/5 text-center">
          <h1 className="font-bold text-lg">プレビューモード</h1>
          <p className="text-sm text-gray-600">以下はプレビュー表示です。実際の表示とは若干異なる場合があります。</p>
        </div>
        
        <div style={{ margin: '0 auto', maxWidth: globalStyles.maxWidth }}>
          {/* ヘッダー */}
          {shouldShowSection('header') && (
            <div style={getSectionStyle('header')} className="mb-6 rounded-xl border border-primary/10 bg-white shadow-md overflow-hidden">
              <div className="p-6 text-center">
                <h1 className="text-2xl font-bold text-primary mb-2">{profile.business_name}</h1>
                <p className="text-gray-600">{profile.location} - {profile.service_type}</p>
                {profile.catch_phrase && (
                  <p className="mt-4 text-lg font-semibold">{profile.catch_phrase}</p>
                )}
              </div>
            </div>
          )}

          {/* メインコンテンツ - セクションの順序に従って表示 */}
          <div className="space-y-4">
            {settings.sections
              .filter(section => section.id !== 'header' && shouldShowSection(section.id))
              .sort((a, b) => a.order - b.order)
              .map(section => (
                <div key={section.id} style={getSectionStyle(section.id)}>
                  <h3 style={getSectionTitleStyle(section.id)} className="text-lg font-bold">
                    {section.title}
                  </h3>
                  <div className="p-2 border border-dashed border-gray-300 rounded bg-gray-50 text-center">
                    <p className="text-gray-500 text-sm">{section.title}セクションの内容がここに表示されます</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  }

  // 通常モードではフル表示
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
                {!settings.globalSettings.hideSectionTitles && (
                  <h3 style={getSectionTitleStyle(section.id)} className="text-xl font-bold mb-4">{section.title}</h3>
                )}
                
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
                        {!settings.globalSettings.hideSectionTitles && (
                          <h3 className="text-xl font-bold text-gray-800">お仕事詳細</h3>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none prose-headings:text-primary prose-img:mx-auto prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: profile.description }} />
                    </div>
                  </div>
                )}
                
                {/* その他のセクション */}
                {section.id !== 'catchphrase' && section.id !== 'header' && (
                  <div className="p-4 border border-dashed border-gray-300 rounded bg-gray-50 text-center">
                    <p className="text-gray-500">{section.title}セクションの内容がここに表示されます</p>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}