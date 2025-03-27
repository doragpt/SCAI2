import { DesignSettings } from '@shared/schema';

/**
 * デザイン設定のデフォルト値
 * 他のコンポーネントから参照されるため、共通化
 */
export const getDefaultDesignSettings = (): DesignSettings => {
  return {
    sections: [
      // ヘッダーは常に先頭（特別扱い）
      {
        id: "header",
        title: "ヘッダー",
        visible: true,
        order: 0, // 特別な順序として0を使用
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
      // 以下は店舗情報編集ダイアログのタブ順に合わせる
      // 1. 基本情報
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
      // 2. 給与・待遇
      {
        id: "salary",
        title: "給与情報",
        visible: true,
        order: 2,
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
        order: 3,
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
      // 3. 連絡先
      {
        id: "contact",
        title: "問い合わせ",
        visible: true,
        order: 5,
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
        order: 6,
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
      // 4. アクセス
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
      // 5. 安全対策（安全対策セクションは特にないため、実装なし）
      
      // 6. 写真ギャラリー
      {
        id: "photo_gallery",
        title: "写真ギャラリー",
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
      // 特別オファー（デザイン編集で使用）
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
      // 7. 応募条件
      {
        id: "requirements",
        title: "応募条件",
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
      // ブログ（デザイン編集で使用）
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