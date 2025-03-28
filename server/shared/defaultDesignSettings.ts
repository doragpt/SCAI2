/**
 * デフォルトのデザイン設定を取得する関数（サーバー側）
 * ユーザーが設定を保存していない場合や、エラー時に使用
 */
export function getDefaultDesignSettings(): any {
  const defaultSettings = {
    globalSettings: {
      mainColor: '#ff6b81',
      secondaryColor: '#f9f9f9',
      accentColor: '#41a0ff',
      backgroundColor: '#ffffff',
      fontFamily: 'sans-serif',
      borderRadius: 8,
      maxWidth: 1200,
      hideSectionTitles: false
    },
    sections: [
      {
        id: 'header',
        order: 0,
        title: 'ヘッダー',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'catchphrase',
        order: 1,
        title: 'お仕事詳細',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'photo_gallery',
        order: 2,
        title: '写真ギャラリー',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'benefits',
        order: 3,
        title: '待遇・環境',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'salary',
        order: 4,
        title: '給与情報',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'schedule',
        order: 5,
        title: '勤務時間',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'special_offers',
        order: 6,
        title: '特別オファー',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'access',
        order: 7,
        title: 'アクセス情報',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'contact',
        order: 8,
        title: 'お問い合わせ',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'sns_links',
        order: 9,
        title: 'SNSリンク',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'security_measures',
        order: 10,
        title: '安全対策',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'requirements',
        order: 11,
        title: '応募条件',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: 'blog',
        order: 12,
        title: '店舗ブログ',
        visible: true,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          titleColor: '#ff6b81',
          borderColor: '#f0f0f0',
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      }
    ]
  };

  return defaultSettings;
}