import { type DesignSettings } from '@shared/schema';

/**
 * デフォルトのデザイン設定を取得する関数
 * @returns デフォルトのデザイン設定
 */
export function getDefaultDesignSettings(): DesignSettings {
  return {
    globalSettings: {
      primaryColor: '#ff4d7d',
      secondaryColor: '#7c40ff',
      backgroundColor: '#ffffff',
      fontFamily: 'sans-serif',
      containerMaxWidth: 1200
    },
    sections: [
      {
        id: 'header',
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