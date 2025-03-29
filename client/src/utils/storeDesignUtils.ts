import { type DesignSettings, type DesignSection } from '@shared/schema';
import { getDefaultDesignSettings } from '@/shared/defaultDesignSettings';

/**
 * セクションIDからセクションタイトルを取得する関数
 * @param id セクションID
 * @returns セクション表示名
 */
export function getSectionTitle(id: string): string {
  const titles: Record<string, string> = {
    header: 'ヘッダー',
    main_visual: 'メインビジュアル',
    intro: '店舗紹介',
    benefits: '待遇',
    requirements: '応募条件',
    work_environment: '働く環境',
    application_info: '応募方法',
    faq: 'よくある質問',
    news: 'お知らせ',
    blog: 'ブログ',
    campaign: 'キャンペーン',
    experience: '体験入店情報',
    gallery: 'ギャラリー',
    footer: 'フッター'
  };
  
  return titles[id] || id;
}

/**
 * デザイン設定に必要なセクションが含まれていることを確認する関数
 * @param settings デザイン設定
 * @returns 有効なデザイン設定
 */
export function ensureRequiredSections(settings: DesignSettings): DesignSettings {
  // デフォルト設定
  const defaultSettings = getDefaultDesignSettings();
  
  // 設定がない場合はデフォルト設定を返す
  if (!settings || !settings.sections || !Array.isArray(settings.sections)) {
    console.warn('デザイン設定が不正です。デフォルト設定を使用します。');
    return defaultSettings;
  }
  
  // 必須セクションのリスト
  const requiredSectionIds = ['header', 'main_visual', 'intro', 'footer'];
  
  // 存在するセクションIDのリスト
  const existingSectionIds = settings.sections.map(section => section.id);
  
  // 足りないセクションがあれば追加
  let updatedSections = [...settings.sections];
  for (const requiredId of requiredSectionIds) {
    if (!existingSectionIds.includes(requiredId)) {
      console.warn(`必須セクション: ${requiredId} が見つかりません。デフォルト設定を追加します。`);
      
      // デフォルト設定から必要なセクションを取得
      const defaultSection = defaultSettings.sections.find(s => s.id === requiredId);
      if (defaultSection) {
        updatedSections.push(defaultSection);
      }
    }
  }
  
  // セクションの順序を正規化
  normalizeOrders(updatedSections);
  
  // グローバル設定がない場合はデフォルト設定を使用
  const globalSettings = settings.globalSettings || defaultSettings.globalSettings;
  
  return {
    ...settings,
    sections: updatedSections,
    globalSettings
  };
}

/**
 * セクションの順序を正規化する関数
 * @param sections セクションリスト
 */
function normalizeOrders(sections: DesignSection[]): void {
  // headerは常に0
  const headerSection = sections.find(s => s.id === 'header');
  if (headerSection) {
    headerSection.order = 0;
  }
  
  // footerは常に最後
  const footerSection = sections.find(s => s.id === 'footer');
  if (footerSection) {
    footerSection.order = sections.length;
  }
  
  // ヘッダーとフッター以外のセクションを順序でソート
  const otherSections = sections
    .filter(s => s.id !== 'header' && s.id !== 'footer')
    .sort((a, b) => (a.order || 999) - (b.order || 999));
  
  // 順序を1から順番に振り直す
  otherSections.forEach((section, index) => {
    section.order = index + 1; // headerが0なので1から始める
  });
}