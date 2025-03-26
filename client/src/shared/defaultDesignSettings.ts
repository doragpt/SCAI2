import { DesignSettings } from '@shared/schema';

/**
 * デザイン設定のデフォルト値
 * 他のコンポーネントから参照されるため、共通化
 */
export const getDefaultDesignSettings = (): DesignSettings => {
  return {
    sections: [
      {
        id: "catchphrase",
        title: "キャッチコピー・仕事内容",
        visible: true,
        order: 1,
        settings: {
          backgroundColor: "#ffffff",
          textColor: "#333333",
          borderColor: "#e0e0e0",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: "photo_gallery",
        title: "写真ギャラリー",
        visible: true,
        order: 2,
        settings: {
          backgroundColor: "#fff9fa",
          textColor: "#333333",
          borderColor: "#e0e0e0",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: "benefits",
        title: "待遇・環境",
        visible: true,
        order: 3,
        settings: {
          backgroundColor: "#ffffff",
          textColor: "#333333",
          borderColor: "#e0e0e0",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: "requirements",
        title: "応募条件",
        visible: true,
        order: 4,
        settings: {
          backgroundColor: "#ffffff",
          textColor: "#333333",
          borderColor: "#e0e0e0",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: "salary",
        title: "給与情報",
        visible: true,
        order: 5,
        settings: {
          backgroundColor: "#ffffff",
          textColor: "#333333",
          borderColor: "#ffd6dd",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: "schedule",
        title: "勤務時間",
        visible: true,
        order: 6,
        settings: {
          backgroundColor: "#fff9fa",
          textColor: "#333333",
          borderColor: "#e0e0e0",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: "access",
        title: "アクセス情報",
        visible: true,
        order: 7,
        settings: {
          backgroundColor: "#ffffff",
          textColor: "#333333",
          borderColor: "#e0e0e0",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: "contact",
        title: "問い合わせ",
        visible: true,
        order: 8,
        settings: {
          backgroundColor: "#fff9fa",
          textColor: "#333333",
          borderColor: "#e0e0e0",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: "header",
        title: "ヘッダー",
        visible: true,
        order: 0,
        settings: {
          backgroundColor: "#ffffff",
          textColor: "#333333",
          borderColor: "#e0e0e0",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: "special_offers",
        title: "特別オファー",
        visible: true,
        order: 9,
        settings: {
          backgroundColor: "#fff9fa",
          textColor: "#333333",
          borderColor: "#e0e0e0",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: "sns_links",
        title: "SNSリンク",
        visible: true,
        order: 10,
        settings: {
          backgroundColor: "#ffffff",
          textColor: "#333333",
          borderColor: "#e0e0e0",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      },
      {
        id: "blog",
        title: "店舗ブログ",
        visible: true,
        order: 11,
        settings: {
          backgroundColor: "#ffffff",
          textColor: "#333333",
          borderColor: "#e0e0e0",
          titleColor: "#ff4d7d",
          fontSize: 16,
          padding: 20,
          borderRadius: 8,
          borderWidth: 1
        }
      }
    ],
    globalSettings: {
      mainColor: "#ff4d7d",
      secondaryColor: "#ffc7d8",
      accentColor: "#ff9eb8",
      backgroundColor: "#fff5f9",
      fontFamily: "sans-serif",
      borderRadius: 8,
      maxWidth: 1200
    }
  };
};