import { type DesignSettings } from '@shared/schema';

/**
 * デフォルトのデザイン設定を取得する関数
 * @returns デフォルトのデザイン設定
 */
export function getDefaultDesignSettings(): DesignSettings {
  return {
    globalSettings: {
      mainColor: '#ff4d7d',
      secondaryColor: '#7c40ff',
      accentColor: '#ff1493',
      backgroundColor: '#ffffff',
      fontFamily: 'sans-serif',
      borderRadius: 8,
      maxWidth: 1200,
      hideSectionTitles: false
    },
    sections: [
      {
        id: 'header',
        title: 'ヘッダー',
        order: 0,
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          accentColor: '#ff4d7d',
          logoWidth: 240,
          fixed: true
        }
      },
      {
        id: 'main_visual',
        title: 'メインビジュアル',
        order: 1,
        visible: true,
        settings: {
          backgroundColor: '#f9f9f9',
          textColor: '#ffffff',
          titleColor: '#ffffff',
          overlayColor: 'rgba(0,0,0,0.3)',
          height: 500,
          imageUrl: '',
          titleText: '当店の魅力'
        }
      },
      {
        id: 'intro',
        title: '店舗紹介',
        order: 2,
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff4d7d',
          borderColor: '#e0e0e0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'benefits',
        title: '待遇・福利厚生',
        order: 3,
        visible: true,
        settings: {
          backgroundColor: '#f9f9f9',
          textColor: '#333333',
          titleColor: '#ff4d7d',
          borderColor: '#e0e0e0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'work_environment',
        title: '働く環境',
        order: 4,
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff4d7d',
          borderColor: '#e0e0e0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'requirements',
        title: '応募条件',
        order: 5,
        visible: true,
        settings: {
          backgroundColor: '#f9f9f9',
          textColor: '#333333',
          titleColor: '#ff4d7d',
          borderColor: '#e0e0e0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'application_info',
        title: '応募情報',
        order: 6,
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff4d7d',
          borderColor: '#e0e0e0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'faq',
        title: 'よくある質問',
        order: 7,
        visible: true,
        settings: {
          backgroundColor: '#f9f9f9',
          textColor: '#333333',
          titleColor: '#ff4d7d',
          borderColor: '#e0e0e0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'gallery',
        title: '写真ギャラリー',
        order: 8,
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff4d7d',
          borderColor: '#e0e0e0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1,
          columnCount: 3
        }
      },
      {
        id: 'blog',
        title: 'ブログ',
        order: 9,
        visible: true,
        settings: {
          backgroundColor: '#f9f9f9',
          textColor: '#333333',
          titleColor: '#ff4d7d',
          borderColor: '#e0e0e0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1,
          postsToShow: 3
        }
      },
      {
        id: 'news',
        title: 'お知らせ',
        order: 10,
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff4d7d',
          borderColor: '#e0e0e0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1,
          itemsToShow: 5
        }
      },
      {
        id: 'campaign',
        title: 'キャンペーン',
        order: 11,
        visible: false,
        settings: {
          backgroundColor: '#fff2f6',
          textColor: '#333333',
          titleColor: '#ff4d7d',
          borderColor: '#e0e0e0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'experience',
        title: '体験談',
        order: 12,
        visible: false,
        settings: {
          backgroundColor: '#f0f8ff',
          textColor: '#333333',
          titleColor: '#ff4d7d',
          borderColor: '#e0e0e0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'footer',
        title: 'フッター',
        order: 13,
        visible: true,
        settings: {
          backgroundColor: '#333333',
          textColor: '#ffffff',
          accentColor: '#ff4d7d',
          fontSize: 14
        }
      }
    ]
  };
}