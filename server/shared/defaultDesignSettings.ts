/**
 * デフォルトデザイン設定モジュール
 * 
 * クライアントとサーバー間で一貫したデフォルトデザイン設定を提供します
 * @shared/defaultDesignSettings と同じ内容を保持
 */

import { DesignSettings } from '@shared/schema';

/**
 * デフォルトのデザイン設定を取得
 * @returns デフォルトのデザイン設定
 */
export function getDefaultDesignSettings(): DesignSettings {
  return {
    sections: [
      {
        id: 'header',
        title: 'ヘッダー',
        visible: true,
        order: 0,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          borderColor: '#e0e0e0',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'catchphrase',
        title: 'キャッチコピー・仕事内容',
        visible: true,
        order: 1,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          borderColor: '#e0e0e0',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'benefits',
        title: '待遇・環境',
        visible: true,
        order: 2,
        settings: {
          backgroundColor: '#fafafa',
          textColor: '#333333',
          borderColor: '#e0e0e0',
          titleColor: '#ff6b81',
          fontSize: 16, 
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'salary',
        title: '給与情報',
        visible: true,
        order: 3,
        settings: {
          backgroundColor: '#fff9fa',
          textColor: '#333333',
          borderColor: '#ffd6dd',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'requirements',
        title: '応募条件',
        visible: true,
        order: 4,
        settings: {
          backgroundColor: '#f8faff',
          textColor: '#333333',
          borderColor: '#dde6ff',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'schedule',
        title: '勤務時間',
        visible: true,
        order: 5,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          borderColor: '#e0e0e0',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'access',
        title: 'アクセス・住所',
        visible: true,
        order: 6,
        settings: {
          backgroundColor: '#f8f8f8',
          textColor: '#333333',
          borderColor: '#e0e0e0',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'contact',
        title: '応募方法・連絡先',
        visible: true,
        order: 7,
        settings: {
          backgroundColor: '#fff9fa',
          textColor: '#333333',
          borderColor: '#ffd6dd',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'special_offers',
        title: '特別オファー',
        visible: true,
        order: 8,
        settings: {
          backgroundColor: '#fffdf5',
          textColor: '#333333',
          borderColor: '#ffecb3',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'security_measures',
        title: '安全対策',
        visible: true,
        order: 9,
        settings: {
          backgroundColor: '#f7fff7',
          textColor: '#333333',
          borderColor: '#d1e8d1',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'sns_links',
        title: 'SNSリンク',
        visible: true,
        order: 10,
        settings: {
          backgroundColor: '#fbfbfb',
          textColor: '#333333',
          borderColor: '#e0e0e0',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'photo_gallery',
        title: '写真ギャラリー',
        visible: true,
        order: 11,
        settings: {
          backgroundColor: '#fff9fa',
          textColor: '#333333',
          borderColor: '#e0e0e0',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'blog',
        title: '店舗ブログ',
        visible: true,
        order: 12,
        settings: {
          backgroundColor: '#fcfcfc',
          textColor: '#333333',
          borderColor: '#e6e6e6',
          titleColor: '#ff6b81',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      }
    ],
    globalSettings: {
      mainColor: '#ff6b81',
      secondaryColor: '#f9f9f9',
      accentColor: '#41a0ff',
      backgroundColor: '#ffffff',
      fontFamily: 'sans-serif',
      borderRadius: 8,
      maxWidth: 1200,
      hideSectionTitles: false
    }
  };
}