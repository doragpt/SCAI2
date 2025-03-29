import React from 'react';
import { getDefaultDesignSettings } from '@/shared/defaultDesignSettings';
import { type DesignSettings, type DesignSection } from '@shared/schema';
import { dataUtils } from '@/shared/utils/dataTypeUtils';

interface PreviewRendererProps {
  settings: DesignSettings;
  storeProfile: any; // 店舗プロフィールデータ
  deviceView?: 'pc' | 'smartphone';
}

/**
 * プレビューコンポーネント
 * iframeに依存せず、Reactコンポーネントとして店舗ページをレンダリング
 */
const PreviewRenderer: React.FC<PreviewRendererProps> = ({ 
  settings, 
  storeProfile, 
  deviceView = 'pc' 
}) => {
  // 設定が無効な場合はデフォルト設定を使用
  const designSettings = settings && Object.keys(settings).length > 0 
    ? settings 
    : getDefaultDesignSettings();
  
  // グローバル設定の取得
  const { 
    mainColor = '#ff6b81', 
    secondaryColor = '#f9f9f9', 
    accentColor = '#41a0ff',
    backgroundColor = '#ffffff',
    fontFamily = 'sans-serif',
    borderRadius = 8,
    maxWidth = 1200,
    hideSectionTitles = false
  } = designSettings.globalSettings || {};

  // セクションは表示順に並べる
  const sortedSections = [...designSettings.sections]
    .sort((a, b) => a.order - b.order)
    .filter(section => section.visible);

  // 店舗情報のデータフォーマットを確認し、安全にアクセスする
  let profile;
  
  // storeProfileデータを適切に解析
  if (storeProfile) {
    console.log('PreviewRenderer: storeProfile型とデータ', {
      type: typeof storeProfile,
      isObject: typeof storeProfile === 'object',
      hasData: !!storeProfile.data,
      keys: storeProfile ? Object.keys(storeProfile) : []
    });
    
    // データがネストされている場合（{ data: {...} }形式）
    if (storeProfile.data) {
      profile = dataUtils.processStoreProfile(storeProfile.data);
      console.log('PreviewRenderer: ネストデータを処理', { 
        dataType: typeof profile, 
        keys: Object.keys(profile)
      });
    } 
    // 直接データが格納されている場合（APIレスポンスによる違い）
    else if (typeof storeProfile === 'object') {
      profile = dataUtils.processStoreProfile(storeProfile);
      console.log('PreviewRenderer: 直接オブジェクトを処理', { 
        keys: Object.keys(profile)
      });
    }
  }
  
  // どの形式でもなければフォールバック
  if (!profile) {
    profile = {
      business_name: '店舗情報が読み込めません',
      catch_phrase: 'プレビュー表示中',
      description: '店舗情報の取得に失敗しました。ページをリロードしてください。',
      service_type: 'エステ',
      location: '東京都',
      access_info: '最寄り駅から徒歩5分',
      business_hours: '10:00〜22:00',
      contact_email: 'contact@example.com',
      benefits: []
    };
  }

  // セクションの内容をレンダリングするヘルパー関数
  const renderSectionContent = (section: DesignSection) => {
    const { id, settings: sectionSettings = {} } = section;
    const sectionStyle = {
      backgroundColor: sectionSettings.backgroundColor || '#ffffff',
      color: sectionSettings.textColor || '#333333',
      padding: `${sectionSettings.padding || 20}px`,
      borderRadius: `${sectionSettings.borderRadius || borderRadius}px`,
      border: `${sectionSettings.borderWidth || 1}px solid ${sectionSettings.borderColor || '#e0e0e0'}`,
      fontSize: `${sectionSettings.fontSize || 16}px`,
      marginBottom: '20px'
    };

    const titleStyle = {
      color: sectionSettings.titleColor || mainColor,
      fontSize: `${(sectionSettings.fontSize || 16) + 4}px`,
      marginBottom: '15px',
      fontWeight: 'bold' as const
    };

    // セクションタイプに応じてコンテンツをレンダリング
    switch (id) {
      case 'header':
        return (
          <div className="text-center p-4">
            <h1 style={{ fontSize: '28px', color: mainColor, fontWeight: 'bold' }}>
              {profile.business_name}
            </h1>
            <p className="mt-2 text-lg" style={{ color: sectionSettings.textColor || '#666' }}>
              {profile.service_type}
            </p>
          </div>
        );

      case 'catchphrase':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>お仕事詳細</h2>}
            <div className="mb-4">
              <h3 style={{ fontSize: '22px', color: accentColor, fontWeight: 'bold' }}>
                {profile.catch_phrase || 'お仕事のキャッチフレーズ'}
              </h3>
              <div className="mt-4" style={{ whiteSpace: 'pre-wrap' }}>
                {profile.description || '仕事内容の詳細説明がここに表示されます。'}
              </div>
            </div>
          </div>
        );

      case 'photo_gallery':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>写真ギャラリー</h2>}
            <div className="grid grid-cols-2 gap-4">
              {profile.gallery_images && profile.gallery_images.length > 0 ? (
                profile.gallery_images.map((image: string, index: number) => (
                  <div key={index} className="overflow-hidden rounded" style={{ aspectRatio: '3/4' }}>
                    <img 
                      src={image} 
                      alt={`ギャラリー画像 ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))
              ) : (
                // ダミー画像
                Array.from({ length: 4 }).map((_, index) => (
                  <div 
                    key={index} 
                    className="overflow-hidden rounded bg-gray-200 flex items-center justify-center"
                    style={{ aspectRatio: '3/4' }}
                  >
                    <span className="text-gray-400">画像 {index + 1}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'benefits':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>待遇・環境</h2>}
            <ul className="list-disc pl-5 space-y-2">
              {profile.benefits && profile.benefits.length > 0 ? (
                profile.benefits.map((benefit: string, index: number) => (
                  <li key={index}>{benefit}</li>
                ))
              ) : (
                <>
                  <li>未経験者歓迎</li>
                  <li>日払い可能</li>
                  <li>自由出勤</li>
                  <li>寮完備</li>
                </>
              )}
            </ul>
          </div>
        );

      case 'salary':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>給与情報</h2>}
            <div className="space-y-2">
              <p>
                <strong>給与体系:</strong> {profile.salary_system || '日払い制'}
              </p>
              <p>
                <strong>給与目安:</strong> {profile.salary_range || '日給35,000円〜80,000円'}
              </p>
              <p>
                <strong>ボーナス:</strong> {profile.bonus_system || 'あり（業績による）'}
              </p>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>勤務時間</h2>}
            <div className="space-y-2">
              <p>
                <strong>営業時間:</strong> {profile.business_hours || '10:00〜22:00'}
              </p>
              <p>
                <strong>シフト:</strong> {profile.shift_system || '自由出勤制'}
              </p>
              <p>
                <strong>休日:</strong> {profile.holidays || '自由（週1日以上の出勤をお願いしています）'}
              </p>
            </div>
          </div>
        );

      case 'special_offers':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>特別オファー</h2>}
            <div className="bg-opacity-10" style={{ backgroundColor: `${accentColor}20`, padding: '15px', borderRadius: '8px' }}>
              {profile.special_offers && profile.special_offers.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                  {profile.special_offers.map((offer: any, index: number) => (
                    <li key={index}>
                      <strong>{offer.title}</strong>: {offer.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <div>
                  <p className="font-bold">期間限定キャンペーン実施中!</p>
                  <p className="mt-2">入店祝い金最大10万円プレゼント</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'access':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>アクセス情報</h2>}
            <div className="space-y-2">
              <p>
                <strong>所在地:</strong> {profile.location || '東京都新宿区'}
              </p>
              <p>
                <strong>アクセス:</strong> {profile.access_info || '最寄り駅から徒歩5分'}
              </p>
              <div className="mt-4 bg-gray-200 h-48 flex items-center justify-center">
                <span className="text-gray-500">地図がここに表示されます</span>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>お問い合わせ</h2>}
            <div className="space-y-2">
              <p>
                <strong>メール:</strong> {profile.contact_email || 'contact@example.com'}
              </p>
              <p>
                <strong>電話:</strong> {profile.contact_phone || '03-xxxx-xxxx'}
              </p>
              <p>
                <strong>受付時間:</strong> {profile.contact_hours || '10:00〜20:00（年中無休）'}
              </p>
            </div>
          </div>
        );

      case 'sns_links':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>SNS</h2>}
            <div className="flex gap-4">
              {profile.sns_links && profile.sns_links.length > 0 ? (
                profile.sns_links.map((sns: any, index: number) => (
                  <div key={index} className="text-center">
                    <a 
                      href={sns.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block p-3 rounded-full"
                      style={{ backgroundColor: mainColor, color: 'white' }}
                    >
                      {sns.platform}
                    </a>
                    <p className="mt-1 text-sm">{sns.platform}</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="text-center">
                    <span
                      className="inline-block p-3 rounded-full"
                      style={{ backgroundColor: mainColor, color: 'white' }}
                    >
                      Twitter
                    </span>
                    <p className="mt-1 text-sm">Twitter</p>
                  </div>
                  <div className="text-center">
                    <span
                      className="inline-block p-3 rounded-full"
                      style={{ backgroundColor: mainColor, color: 'white' }}
                    >
                      Instagram
                    </span>
                    <p className="mt-1 text-sm">Instagram</p>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'security_measures':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>安全対策</h2>}
            <div>
              {profile.security_measures && profile.security_measures.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                  {profile.security_measures.map((measure: any, index: number) => (
                    <li key={index}>{measure}</li>
                  ))}
                </ul>
              ) : (
                <ul className="list-disc pl-5 space-y-2">
                  <li>定期的な健康チェック実施</li>
                  <li>安全対策研修あり</li>
                  <li>警備スタッフ常駐</li>
                  <li>24時間サポート体制</li>
                </ul>
              )}
            </div>
          </div>
        );

      case 'requirements':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>応募条件</h2>}
            <div>
              {profile.requirements && profile.requirements.items && profile.requirements.items.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                  {profile.requirements.items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <>
                  <p>
                    <strong>年齢:</strong> 18歳以上 (高校生不可)
                  </p>
                  <ul className="list-disc pl-5 mt-3 space-y-2">
                    <li>未経験者歓迎</li>
                    <li>経験者優遇</li>
                    <li>容姿端麗な方歓迎</li>
                    <li>日本語での会話が可能な方</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        );

      case 'blog':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>店舗ブログ</h2>}
            <div className="grid grid-cols-1 gap-4">
              {profile.recent_blog_posts && profile.recent_blog_posts.length > 0 ? (
                profile.recent_blog_posts.map((post: any, index: number) => (
                  <div key={index} className="border p-3 rounded">
                    <h3 className="font-bold">{post.title}</h3>
                    <p className="text-sm text-gray-500">{post.publishedAt}</p>
                    <p className="mt-2">{post.excerpt}</p>
                  </div>
                ))
              ) : (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="border p-3 rounded">
                    <h3 className="font-bold">ブログタイトル {index + 1}</h3>
                    <p className="text-sm text-gray-500">2025年3月{index + 1}日</p>
                    <p className="mt-2">これはブログ記事のサンプルテキストです。実際の記事はデータベースから取得されます。</p>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      default:
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>{section.title || `セクション: ${id}`}</h2>}
            <div className="italic text-gray-500">
              このセクションの内容はプレビューできません
            </div>
          </div>
        );
    }
  };

  // グローバルスタイル
  const globalStyle = {
    fontFamily,
    backgroundColor,
    color: '#333333',
    maxWidth: deviceView === 'pc' ? `${maxWidth}px` : '100%',
    margin: '0 auto',
    padding: deviceView === 'pc' ? '30px' : '15px'
  };

  return (
    <div style={globalStyle} className="preview-container">
      {/* 店舗ページコンテンツ */}
      <div className="space-y-6">
        {sortedSections.map((section) => (
          <div key={section.id} style={section.settings}>
            {renderSectionContent(section)}
          </div>
        ))}

        {/* 応募ボタン */}
        <div className="mt-8 text-center">
          <button
            style={{
              backgroundColor: mainColor,
              color: 'white',
              padding: '12px 30px',
              borderRadius: `${borderRadius}px`,
              fontWeight: 'bold',
              fontSize: '18px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            応募する
          </button>
        </div>

        {/* フッター */}
        <div className="mt-10 pt-6 border-t text-center text-sm text-gray-500">
          <p>© 2025 {profile.business_name || '店舗名'} All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PreviewRenderer;