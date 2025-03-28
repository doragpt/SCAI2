import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Save, RefreshCw, Settings, Palette, Layout, Eye, EyeOff, ArrowUp, ArrowDown, Monitor, Smartphone, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type DesignSettings, type SectionSettings, type GlobalDesignSettings, type DesignSection } from '@shared/schema';
import { getDefaultDesignSettings } from '@/shared/defaultDesignSettings';
// デフォルト設定のインポートの検証
console.log('getDefaultDesignSettings関数の検証:', {
  isFunction: typeof getDefaultDesignSettings === 'function',
  import: '@/shared/defaultDesignSettings'
});

/**
 * 店舗デザイン管理コンポーネント
 * 店舗情報ページのデザインをカスタマイズするための管理画面
 */
// 初期設定を関数コンポーネントの外部で取得（初期化の順序問題を回避）
const initialDesignSettings = getDefaultDesignSettings();

export default function StoreDesignManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<DesignSettings>(initialDesignSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [deviceView, setDeviceView] = useState<'pc' | 'smartphone'>('pc');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 店舗情報の各タブに対応するセクションID - サイドバーでの表示順序に影響
  const SECTION_IDS = {
    // 基本情報タブ
    BASIC_INFO: ['catchphrase'],
    // 給与情報タブ
    SALARY_BENEFITS: ['salary', 'schedule'],
    // 安全対策タブ
    SECURITY: ['security_measures'],
    // 写真ギャラリータブ
    GALLERY: ['photo_gallery'],
    // 特別オファーと待遇・環境
    ADDITIONAL_1: ['special_offers', 'benefits'],
    // 応募条件タブ
    REQUIREMENTS: ['requirements'],
    // 連絡先タブ
    CONTACT: ['contact', 'sns_links'],
    // アクセスタブ
    ACCESS: ['access'],
    // ブログ
    BLOG: ['blog']
  };

  // 削除対象のセクションID（体験入店情報とキャンペーンは除外）
  const REMOVED_SECTION_IDS = ['trial_entry', 'campaign', 'campaigns'];

  // セクションIDから表示名を取得する関数
  const getSectionTitle = (id: string): string => {
    switch(id) {
      case 'header': return 'ヘッダー';
      case 'catchphrase': return 'お仕事詳細';
      case 'photo_gallery': return '写真ギャラリー';
      case 'benefits': return '待遇・環境';
      case 'salary': return '給与情報';
      case 'schedule': return '勤務時間';
      case 'special_offers': return '特別オファー';
      case 'access': return 'アクセス情報';
      case 'contact': return '問い合わせ';
      case 'sns_links': return 'SNSリンク';
      case 'security_measures': return '安全対策';
      case 'requirements': return '応募条件';
      case 'blog': return '店舗ブログ';
      case 'gallery': return '写真ギャラリー'; // 互換性のために追加
      case 'description': return '仕事内容'; // 互換性のために追加
      default: return `セクション: ${id}`;
    }
  };

  // APIからデザイン設定を取得するクエリ
  const designSettingsQuery = useQuery<DesignSettings, Error>({
    queryKey: [QUERY_KEYS.DESIGN_SETTINGS],
    queryFn: async () => {
      try {
        console.log('デザイン設定を取得しています...');
        const response = await apiRequest<{success: boolean, data: DesignSettings, isDefault?: boolean}>("GET", "/api/design");
        
        // 成功/データの検証
        if (!response || !response.success || !response.data) {
          console.warn('デザイン設定のレスポンスが不正です。デフォルト設定を使用します。', { response });
          return getDefaultDesignSettings();
        }
        
        const designSettings = response.data;
        
        // 応答データの構造検証
        if (!designSettings || typeof designSettings !== 'object') {
          console.warn('デザイン設定データの形式が不正です。デフォルト設定を使用します。', { designSettings });
          return getDefaultDesignSettings();
        }
        
        // sectionsが存在しない、または配列でない場合は修正
        if (!designSettings.sections || !Array.isArray(designSettings.sections)) {
          console.warn('デザイン設定のsectionsが不正です。空配列で初期化します。', { 
            hasSection: 'sections' in designSettings,
            sectionsType: designSettings.sections ? typeof designSettings.sections : 'undefined'
          });
          designSettings.sections = [];
        }
        
        // globalSettingsが存在しない場合は初期化
        if (!designSettings.globalSettings || typeof designSettings.globalSettings !== 'object') {
          console.warn('デザイン設定のglobalSettingsが不正です。デフォルト設定を使用します。');
          designSettings.globalSettings = getDefaultDesignSettings().globalSettings;
        }
        
        console.log('デザイン設定の取得に成功しました', { 
          isDefault: response.isDefault || false,
          sectionsCount: designSettings.sections.length,
          hasGlobalSettings: !!designSettings.globalSettings,
          sectionIds: designSettings.sections.map((s: DesignSection) => s.id)
        });
        
        return designSettings;
      } catch (error) {
        console.error('デザイン設定の取得に失敗しました:', error);
        
        // 認証エラーの場合は特別なメッセージを表示
        if (error instanceof Error && error.message.includes('401')) {
          toast({
            title: '認証エラー',
            description: 'セッションが期限切れになりました。再ログインしてください。',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'データ取得エラー',
            description: 'デザイン設定の取得に失敗しました。デフォルト設定を使用します。',
            variant: 'destructive',
          });
        }
        
        // デフォルト設定を返す
        return getDefaultDesignSettings();
      }
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    retry: 2, // リトライ回数を増やす
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // 指数バックオフ
  });

  // getDefaultDesignSettings は @shared/defaultDesignSettings からインポート済み

  // デザイン設定を保存するミューテーション
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: DesignSettings) => {
      try {
        // データの整合性チェック
        if (!data.sections) {
          console.warn('保存前のデータにsectionsがありません。空配列で初期化します。');
          data.sections = [];
        }
        
        if (!data.globalSettings) {
          console.warn('保存前のデータにglobalSettingsがありません。デフォルト値で初期化します。');
          data.globalSettings = getDefaultDesignSettings().globalSettings;
        }
        
        console.log('デザイン設定を保存しています...', {
          sectionsCount: data.sections.length,
          hasGlobalSettings: !!data.globalSettings,
          sectionIds: data.sections.map((s: DesignSection) => s.id)
        });
        
        // APIにリクエスト送信
        const response = await apiRequest<{success: boolean, message: string, data: DesignSettings}>("POST", "/api/design", data);
        
        // 成功レスポンスの検証
        if (!response || !response.success) {
          throw new Error(response?.message || 'デザイン設定の保存に失敗しました');
        }
        
        console.log('デザイン設定の保存に成功しました', {
          success: response.success,
          message: response.message
        });
        
        return response.data;
      } catch (error) {
        console.error('デザイン設定の保存に失敗しました:', error);
        
        // 認証エラーの場合は特別なメッセージを表示
        if (error instanceof Error) {
          if (error.message.includes('401')) {
            toast({
              title: '認証エラー',
              description: 'セッションが期限切れになりました。再ログインしてください。',
              variant: 'destructive',
            });
          } else if (error.message.includes('404')) {
            toast({
              title: 'プロフィールが見つかりません',
              description: '店舗プロフィールが見つからないため、設定を保存できませんでした。',
              variant: 'destructive',
            });
          }
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: '設定が保存されました',
        description: 'デザイン設定が正常に保存されました。',
      });
      setIsDirty(false);
    },
    onError: (error: Error) => {
      toast({
        title: '保存に失敗しました',
        description: `エラー: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // デフォルト設定と必須セクションを確保するための処理
  const ensureRequiredSections = (currentSettings: DesignSettings): DesignSettings => {
    // デフォルト設定を取得
    const defaultSettings = getDefaultDesignSettings();
    
    // 必須セクションのリスト（全てのセクションを含む）- 正確な順序を定義
    const requiredSectionIds = [
      'header', // ヘッダー（常に最初）
      'catchphrase', // 基本情報
      'salary', 'schedule', // 給与情報
      'security_measures', // 安全対策
      'photo_gallery', // 写真ギャラリー
      'special_offers', // 特別オファー
      'benefits', // 待遇・環境
      'requirements', // 応募条件
      'contact', 'sns_links', // 連絡先
      'access', // アクセス
      'blog', // 店舗ブログ
    ];

    // 既存のセクションを保持（削除対象以外）
    const existingSections = currentSettings.sections.filter(
      section => !REMOVED_SECTION_IDS.includes(section.id)
    );
    
    // 最終的なセクションリスト
    let finalSections: DesignSection[] = [];
    
    // ヘッダーは特別扱い
    const headerSection = existingSections.find(s => s.id === 'header');
    if (headerSection) {
      finalSections.push({
        ...headerSection,
        order: 0,
        visible: true
      });
    } else {
      // ヘッダーがなければデフォルトから追加
      const defaultHeader = defaultSettings.sections.find(s => s.id === 'header');
      if (defaultHeader) {
        finalSections.push({
          ...defaultHeader,
          order: 0,
          visible: true
        });
      }
    }
    
    // 残りのセクションを追加 - 必須セクションの順序で追加
    let orderIndex = 1; // ヘッダーは0なので1から開始
    
    // 必須セクションの順序でセクションを追加
    for (const id of requiredSectionIds) {
      // ヘッダーはすでに追加済みなのでスキップ
      if (id === 'header') continue;
      
      // 既存のセクションを検索
      const existingSection = existingSections.find(s => s.id === id);
      
      if (existingSection) {
        // 既存のセクションがあれば追加（順序は上書き）
        finalSections.push({
          ...existingSection,
          order: orderIndex++
        });
      } else {
        // なければデフォルトから追加
        const defaultSection = defaultSettings.sections.find(s => s.id === id);
        if (defaultSection) {
          console.log(`セクション "${id}" を追加します`);
          finalSections.push({
            ...defaultSection,
            order: orderIndex++
          });
        }
      }
    }

    console.log('最終セクション構成:', finalSections.map(s => s.id));
    
    // 更新した設定を返す
    return {
      ...currentSettings,
      sections: finalSections
    };
  };

  // APIから取得したデータを適用
  useEffect(() => {
    if (designSettingsQuery.isSuccess && designSettingsQuery.data) {
      console.log('デザイン設定データを適用します');
      
      // 必須セクションを確保した設定を適用
      const completeSettings = ensureRequiredSections(designSettingsQuery.data);
      setSettings(completeSettings);
    } 
    else if (designSettingsQuery.isError) {
      console.error('デザイン設定の読み込みエラー:', designSettingsQuery.error);
      toast({
        title: 'データの読み込みに失敗しました',
        description: '初期設定を適用します。',
        variant: 'destructive',
      });
      // エラーの場合はデフォルト設定を適用
      const defaultSettings = ensureRequiredSections(getDefaultDesignSettings());
      setSettings(defaultSettings);
    }
  }, [designSettingsQuery.isSuccess, designSettingsQuery.data, designSettingsQuery.isError, designSettingsQuery.error, toast]);

  // セクションの表示/非表示を切り替える
  const toggleSectionVisibility = (id: string) => {
    setSettings(prev => {
      const newSections = prev.sections.map(section => {
        if (section.id === id) {
          return { ...section, visible: !section.visible };
        }
        return section;
      });
      return { ...prev, sections: newSections };
    });
    setIsDirty(true);
  };

  // セクション設定の更新
  const updateSectionSettings = (id: string, newSettings: Partial<SectionSettings>) => {
    setSettings(prev => {
      const newSections = prev.sections.map(section => {
        if (section.id === id) {
          return { 
            ...section, 
            settings: { 
              ...section.settings, 
              ...newSettings 
            } 
          };
        }
        return section;
      });
      return { ...prev, sections: newSections };
    });
    setIsDirty(true);
  };

  // グローバル設定の更新
  const updateGlobalSettings = (newSettings: Partial<GlobalDesignSettings>) => {
    setSettings(prev => ({
      ...prev,
      globalSettings: {
        ...prev.globalSettings,
        ...newSettings
      }
    }));
    setIsDirty(true);
  };

  // セクションの順序を変更する（上へ/下へボタン）
  const changeOrder = (id: string, direction: 'up' | 'down') => {
    setSettings(prev => {
      // セクションのコピーを作成
      const sections = [...prev.sections];
      
      // 対象セクションのインデックスを取得
      const currentIndex = sections.findIndex(s => s.id === id);
      if (currentIndex === -1) return prev;
      
      // 対象セクションの情報
      const currentSection = sections[currentIndex];
      
      // 新しい順序を計算（上へ/下へ）
      const newOrder = direction === 'up' 
        ? Math.max(1, currentSection.order - 1)  // headerは0なので最小は1
        : Math.min(sections.length, currentSection.order + 1);
      
      // 同じ順序なら変更なし
      if (newOrder === currentSection.order) return prev;
      
      // 入れ替え対象のセクションを取得
      const swapSection = sections.find(s => s.order === newOrder);
      if (swapSection) {
        swapSection.order = currentSection.order;
      }
      
      // 対象セクションの順序を更新
      currentSection.order = newOrder;
      
      return { ...prev, sections: sections };
    });
    setIsDirty(true);
  };

  // ドラッグ&ドロップによる順序変更
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // ドロップ先がない場合は何もしない
    if (!destination) return;

    // 元の位置と同じ場合は何もしない
    if (destination.index === source.index) return;

    setSettings(prev => {
      // ドラッグ可能なセクションのみを抽出（headerは除外）
      const draggableSections = prev.sections.filter(s => s.id !== 'header');
      
      // ドラッグされたセクションを移動
      const [removed] = draggableSections.splice(source.index, 1);
      draggableSections.splice(destination.index, 0, removed);
      
      // 順序を振り直す
      const reorderedSections = draggableSections.map((section, index) => ({
        ...section,
        order: index + 1  // headerは0、それ以外は1から
      }));
      
      // headerセクションを保持
      const headerSection = prev.sections.find(s => s.id === 'header');
      
      // 全てのセクションを結合
      const allSections = headerSection 
        ? [headerSection, ...reorderedSections]
        : reorderedSections;
      
      return { ...prev, sections: allSections };
    });
    setIsDirty(true);
  };

  // 設定を保存する
  const handleSave = () => {
    // 保存前に体験入店情報とキャンペーン情報のセクションを除外
    const filteredSettings = ensureRequiredSections(settings);
    console.log('保存する設定:', filteredSettings.sections.map(s => s.id));
    saveSettingsMutation.mutate(filteredSettings);
  };

  // プレビューを更新する
  const refreshPreview = () => {
    if (iframeRef.current) {
      // プレビュー送信前に設定を正規化（ディープコピーで参照を切断）
      const previewSettings = JSON.parse(JSON.stringify(ensureRequiredSections(settings)));
      
      console.log('プレビューを更新します:', {
        sectionsCount: previewSettings.sections.length,
        sectionIds: previewSettings.sections.map((s: DesignSection) => s.id),
        globalSettings: Object.keys(previewSettings.globalSettings || {}),
        timestamp: new Date().toISOString()
      });
      
      // iframeを更新するベストな方法
      try {
        // プレビューのURLを構築（HTMLページを指定）
        const url = new URL('/store/preview', window.location.origin);
        
        // キャッシュを無効化するためのタイムスタンプを追加
        const timestamp = Date.now();
        url.searchParams.set('t', timestamp.toString());
        url.searchParams.set('embedded', 'true');
        
        // iframeを一旦クリアしてから再設定
        iframeRef.current.src = '';
        
        // 少し待ってから新しいURLをセット
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = url.toString();
            
            // プレビューの準備完了を受信するためのイベントリスナー
            const messageListener = (event: MessageEvent) => {
              // プレビューの準備完了を受信したら設定データを送信
              if (event.data && event.data.type === 'PREVIEW_READY') {
                console.log('プレビューの準備完了を受信しました');
                
                // 設定データを送信
                if (iframeRef.current && iframeRef.current.contentWindow) {
                  try {
                    // 設定データの整合性チェック
                    // セクションが配列であることを確認
                    if (!Array.isArray(previewSettings.sections)) {
                      console.warn('セクションが配列ではありません。空配列を使用します。');
                      previewSettings.sections = [];
                    }
                    
                    // グローバル設定がオブジェクトであることを確認
                    if (!previewSettings.globalSettings || typeof previewSettings.globalSettings !== 'object') {
                      console.warn('グローバル設定がオブジェクトではありません。デフォルト設定を使用します。');
                      previewSettings.globalSettings = {
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
                    
                    // 設定データを送信
                    iframeRef.current.contentWindow.postMessage({
                      type: 'UPDATE_DESIGN',
                      settings: previewSettings,
                      timestamp: new Date().toISOString()
                    }, '*');
                    
                    console.log('デザイン設定の更新メッセージを送信しました', {
                      timestamp,
                      sectionsCount: previewSettings.sections.length
                    });
                    
                    // 受信確認を待つ
                    const receiveTimeout = setTimeout(() => {
                      console.warn('デザイン設定更新の受信確認がタイムアウトしました');
                    }, 3000);
                    
                    // 受信確認リスナー
                    const confirmListener = (confirmEvent: MessageEvent) => {
                      if (confirmEvent.data && confirmEvent.data.type === 'DESIGN_UPDATE_RECEIVED') {
                        console.log('デザイン設定更新の受信確認を受け取りました', confirmEvent.data);
                        clearTimeout(receiveTimeout);
                        window.removeEventListener('message', confirmListener);
                      }
                    };
                    
                    window.addEventListener('message', confirmListener);
                  } catch (sendError) {
                    console.error('デザイン設定の送信エラー:', sendError);
                  }
                }
                
                // リスナーを削除
                window.removeEventListener('message', messageListener);
              }
            };
            
            // リスナーを登録
            window.addEventListener('message', messageListener);
            
            // 直接メッセージを送信する（複数回試行）
            const sendPreviewMessage = () => {
              if (iframeRef.current && iframeRef.current.contentWindow) {
                console.log('iframeにデザイン設定を送信します', { 
                  timestamp: new Date().toISOString(),
                  sectionsCount: previewSettings.sections ? previewSettings.sections.length : 0
                });
                
                try {
                  // 設定データの整合性チェック
                  const safeSettings = { ...previewSettings };
                  
                  if (!Array.isArray(safeSettings.sections)) {
                    console.warn('セクションが配列ではありません。空配列で補正します');
                    safeSettings.sections = [];
                  }
                  
                  if (!safeSettings.globalSettings || typeof safeSettings.globalSettings !== 'object') {
                    console.warn('グローバル設定がオブジェクトではありません。デフォルト設定を使用します');
                    safeSettings.globalSettings = {
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
                  
                  // メッセージ送信
                  iframeRef.current.contentWindow.postMessage({
                    type: 'UPDATE_DESIGN',
                    settings: safeSettings,
                    timestamp: new Date().toISOString()
                  }, '*');
                } catch (e) {
                  console.error('メッセージング中のエラー:', e);
                }
              } else {
                console.warn('iframeが準備できていません。後でリトライします。');
              }
            };
            
            // 複数回試行するスケジュール
            sendPreviewMessage(); // 即時試行
            
            // 0.5秒, 1秒, 2秒後にも試行
            const retryTimers = [
              setTimeout(() => sendPreviewMessage(), 500),
              setTimeout(() => sendPreviewMessage(), 1000),
              setTimeout(() => sendPreviewMessage(), 2000)
            ];
            
            // 5秒後にリスナーとタイマーを自動的に削除（クリーンアップ）
            setTimeout(() => {
              window.removeEventListener('message', messageListener);
              retryTimers.forEach(timer => clearTimeout(timer));
            }, 5000);
          }
        }, 100);
      } catch (error) {
        console.error('プレビュー更新エラー:', error);
        toast({
          title: 'プレビュー更新エラー',
          description: 'プレビューの更新に失敗しました。再度お試しください。',
          variant: 'destructive',
        });
      }
    }
  };

  // 子ウィンドウからのメッセージを受け取る
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // プレビューページからのログを親ウィンドウのコンソールに出力
      if (event.data.type === 'forward-log') {
        console.log('プレビューウィンドウからのログ:', event.data);
      }
      // iframeがロードされた通知を受け取ったら設定を送信
      else if (event.data.type === 'PREVIEW_READY') {
        refreshPreview();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // 設定が変更されたら自動的にプレビューを更新
  useEffect(() => {
    // 設定変更時にプレビューを更新
    const timer = setTimeout(() => {
      refreshPreview();
    }, 500); // デバウンス処理
    
    return () => clearTimeout(timer);
  }, [settings]);

  // セクション詳細設定のコンポーネント
  const SectionDetailSettings = ({ section }: { section: DesignSection }) => {
    const sectionSettings = section.settings || {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      titleColor: '#ff4d7d',
      borderColor: '#e0e0e0',
      fontSize: 16,
      padding: 20,
      borderRadius: 8,
      borderWidth: 1
    };
    
    return (
      <div className="p-3 border-t bg-muted/30">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor={`${section.id}-bg-color`}>背景色</Label>
            <div className="flex">
              <Input 
                id={`${section.id}-bg-color`}
                type="color" 
                value={sectionSettings.backgroundColor || '#ffffff'} 
                onChange={(e) => updateSectionSettings(section.id, { backgroundColor: e.target.value })}
                className="w-10 h-10 p-1 mr-2"
              />
              <Input 
                value={sectionSettings.backgroundColor || '#ffffff'} 
                onChange={(e) => updateSectionSettings(section.id, { backgroundColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${section.id}-text-color`}>文字色</Label>
            <div className="flex">
              <Input 
                id={`${section.id}-text-color`}
                type="color" 
                value={sectionSettings.textColor || '#333333'} 
                onChange={(e) => updateSectionSettings(section.id, { textColor: e.target.value })}
                className="w-10 h-10 p-1 mr-2"
              />
              <Input 
                value={sectionSettings.textColor || '#333333'} 
                onChange={(e) => updateSectionSettings(section.id, { textColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor={`${section.id}-title-color`}>見出し色</Label>
            <div className="flex">
              <Input 
                id={`${section.id}-title-color`}
                type="color" 
                value={sectionSettings.titleColor || '#ff4d7d'} 
                onChange={(e) => updateSectionSettings(section.id, { titleColor: e.target.value })}
                className="w-10 h-10 p-1 mr-2"
              />
              <Input 
                value={sectionSettings.titleColor || '#ff4d7d'} 
                onChange={(e) => updateSectionSettings(section.id, { titleColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${section.id}-border-color`}>枠線色</Label>
            <div className="flex">
              <Input 
                id={`${section.id}-border-color`}
                type="color" 
                value={sectionSettings.borderColor || '#e0e0e0'} 
                onChange={(e) => updateSectionSettings(section.id, { borderColor: e.target.value })}
                className="w-10 h-10 p-1 mr-2"
              />
              <Input 
                value={sectionSettings.borderColor || '#e0e0e0'} 
                onChange={(e) => updateSectionSettings(section.id, { borderColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor={`${section.id}-font-size`}>
              文字サイズ: {sectionSettings.fontSize || 16}px
            </Label>
            <Slider
              id={`${section.id}-font-size`}
              defaultValue={[sectionSettings.fontSize || 16]}
              min={12}
              max={24}
              step={1}
              onValueChange={(value) => updateSectionSettings(section.id, { fontSize: value[0] })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${section.id}-padding`}>
              内側余白: {sectionSettings.padding || 20}px
            </Label>
            <Slider
              id={`${section.id}-padding`}
              defaultValue={[sectionSettings.padding || 20]}
              min={0}
              max={40}
              step={1}
              onValueChange={(value) => updateSectionSettings(section.id, { padding: value[0] })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${section.id}-border-radius`}>
              角丸: {sectionSettings.borderRadius || 8}px
            </Label>
            <Slider
              id={`${section.id}-border-radius`}
              defaultValue={[sectionSettings.borderRadius || 8]}
              min={0}
              max={20}
              step={1}
              onValueChange={(value) => updateSectionSettings(section.id, { borderRadius: value[0] })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${section.id}-border-width`}>
              枠線太さ: {sectionSettings.borderWidth || 1}px
            </Label>
            <Slider
              id={`${section.id}-border-width`}
              defaultValue={[sectionSettings.borderWidth || 1]}
              min={0}
              max={10}
              step={1}
              onValueChange={(value) => updateSectionSettings(section.id, { borderWidth: value[0] })}
            />
          </div>
        </div>
      </div>
    );
  };

  // ローディング中の表示
  if (designSettingsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" />
          <p>デザイン設定を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ヘッダー */}
      <header className="p-4 border-b flex items-center justify-between bg-card">
        <h1 className="text-xl font-bold">店舗デザイン管理</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-muted p-1 rounded-md">
            <Button 
              variant={deviceView === 'pc' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setDeviceView('pc')}
            >
              <Monitor className="h-4 w-4 mr-1" />
              PC
            </Button>
            <Button 
              variant={deviceView === 'smartphone' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setDeviceView('smartphone')}
            >
              <Smartphone className="h-4 w-4 mr-1" />
              スマホ
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshPreview}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            更新
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSave}
            disabled={!isDirty || saveSettingsMutation.isPending}
          >
            {saveSettingsMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                保存
              </>
            )}
          </Button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー（設定パネル） */}
        <div className="w-96 border-r bg-card overflow-auto p-4">
          <Tabs defaultValue="sections">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="sections" className="flex-1">
                <Layout className="h-4 w-4 mr-1" />
                コンテンツ
              </TabsTrigger>
              <TabsTrigger value="styles" className="flex-1">
                <Palette className="h-4 w-4 mr-1" />
                スタイル
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                <Settings className="h-4 w-4 mr-1" />
                設定
              </TabsTrigger>
            </TabsList>

            {/* コンテンツタブ */}
            <TabsContent value="sections" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                セクションの表示/非表示と順序を変更できます。各セクションをクリックすると詳細設定ができます。
              </div>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sections-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {settings.sections
                        .filter(section => 
                          // ヘッダーは特別扱い、REMOVED_SECTION_IDSのセクションは除外
                          section.id === 'header' || 
                          (!REMOVED_SECTION_IDS.includes(section.id))
                        )
                        // ヘッダーは特別扱い、その他は通常の順序で表示
                        .sort((a, b) => {
                          // ヘッダーは常に先頭
                          if (a.id === 'header') return -1;
                          if (b.id === 'header') return 1;
                          
                          // その他は通常の順序で
                          return a.order - b.order;
                        })
                        .map((section, index) => (
                          <Draggable 
                            key={section.id} 
                            draggableId={section.id} 
                            index={index}
                            // ヘッダーはドラッグ不可
                            isDragDisabled={section.id === 'header'}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="relative"
                              >
                                <Card 
                                  className={`overflow-hidden ${activeSection === section.id ? 'ring-2 ring-primary' : ''}`}
                                >
                                  <CardContent className="p-0">
                                    <div 
                                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50"
                                      onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                                    >
                                      <div className="flex items-center">
                                        {section.id !== 'header' && (
                                          <span
                                            {...provided.dragHandleProps}
                                            className="mr-2 cursor-grab"
                                            title="ドラッグして順序を変更"
                                          >
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                          </span>
                                        )}
                                        {section.visible ? (
                                          <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                                        ) : (
                                          <EyeOff className="h-4 w-4 mr-2 text-muted-foreground" />
                                        )}
                                        <span className={section.visible ? '' : 'text-muted-foreground line-through'}>
                                          {section.title || getSectionTitle(section.id)}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSectionVisibility(section.id);
                                          }}
                                          // ヘッダーは常に表示
                                          disabled={section.id === 'header'}
                                        >
                                          {section.visible ? (
                                            <EyeOff className="h-4 w-4" />
                                          ) : (
                                            <Eye className="h-4 w-4" />
                                          )}
                                        </Button>
                                        {section.id !== 'header' && (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                changeOrder(section.id, 'up');
                                              }}
                                              disabled={section.order <= 1} // 最小順序は1
                                            >
                                              <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                changeOrder(section.id, 'down');
                                              }}
                                              disabled={section.order >= settings.sections.filter(s => s.id !== 'header').length}
                                            >
                                              <ArrowDown className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {activeSection === section.id && (
                                      <SectionDetailSettings section={section} />
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </TabsContent>

            {/* スタイルタブ */}
            <TabsContent value="styles" className="space-y-6">
              <div className="text-sm text-muted-foreground mb-2">
                全体のデザインスタイルを設定できます。
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="main-color">メインカラー</Label>
                  <div className="flex">
                    <Input 
                      id="main-color"
                      type="color" 
                      value={settings.globalSettings.mainColor} 
                      onChange={(e) => updateGlobalSettings({ mainColor: e.target.value })}
                      className="w-10 h-10 p-1 mr-2"
                    />
                    <Input 
                      value={settings.globalSettings.mainColor} 
                      onChange={(e) => updateGlobalSettings({ mainColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">サブカラー</Label>
                  <div className="flex">
                    <Input 
                      id="secondary-color"
                      type="color" 
                      value={settings.globalSettings.secondaryColor} 
                      onChange={(e) => updateGlobalSettings({ secondaryColor: e.target.value })}
                      className="w-10 h-10 p-1 mr-2"
                    />
                    <Input 
                      value={settings.globalSettings.secondaryColor} 
                      onChange={(e) => updateGlobalSettings({ secondaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accent-color">アクセントカラー</Label>
                  <div className="flex">
                    <Input 
                      id="accent-color"
                      type="color" 
                      value={settings.globalSettings.accentColor} 
                      onChange={(e) => updateGlobalSettings({ accentColor: e.target.value })}
                      className="w-10 h-10 p-1 mr-2"
                    />
                    <Input 
                      value={settings.globalSettings.accentColor} 
                      onChange={(e) => updateGlobalSettings({ accentColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="background-color">背景色</Label>
                  <div className="flex">
                    <Input 
                      id="background-color"
                      type="color" 
                      value={settings.globalSettings.backgroundColor} 
                      onChange={(e) => updateGlobalSettings({ backgroundColor: e.target.value })}
                      className="w-10 h-10 p-1 mr-2"
                    />
                    <Input 
                      value={settings.globalSettings.backgroundColor} 
                      onChange={(e) => updateGlobalSettings({ backgroundColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="font-family">フォント</Label>
                  <select
                    id="font-family"
                    value={settings.globalSettings.fontFamily}
                    onChange={(e) => updateGlobalSettings({ fontFamily: e.target.value })}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="sans-serif">Sans-serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="'Hiragino Kaku Gothic Pro', sans-serif">ヒラギノ角ゴ Pro</option>
                    <option value="'Hiragino Mincho Pro', serif">ヒラギノ明朝 Pro</option>
                    <option value="'Meiryo', sans-serif">メイリオ</option>
                    <option value="'MS Gothic', sans-serif">ＭＳ ゴシック</option>
                    <option value="'MS Mincho', serif">ＭＳ 明朝</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="border-radius">
                    全体の角丸: {settings.globalSettings.borderRadius}px
                  </Label>
                  <Slider
                    id="border-radius"
                    defaultValue={[settings.globalSettings.borderRadius]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={(value) => updateGlobalSettings({ borderRadius: value[0] })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-width">
                    最大幅: {settings.globalSettings.maxWidth}px
                  </Label>
                  <Slider
                    id="max-width"
                    defaultValue={[settings.globalSettings.maxWidth]}
                    min={600}
                    max={1600}
                    step={50}
                    onValueChange={(value) => updateGlobalSettings({ maxWidth: value[0] })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* 設定タブ */}
            <TabsContent value="settings" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                店舗情報ページの詳細設定ができます。
              </div>
              
              <div className="p-4 bg-primary/10 rounded-md">
                <h3 className="text-sm font-medium mb-2">デザイン設定の初期化</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  全てのデザイン設定をデフォルトに戻します。この操作は元に戻せません。
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // 確認ダイアログを表示
                    if (window.confirm('全てのデザイン設定をデフォルトに戻しますか？この操作は元に戻せません。')) {
                      const defaultSettings = ensureRequiredSections(getDefaultDesignSettings());
                      setSettings(defaultSettings);
                      setIsDirty(true);
                      toast({
                        title: '設定をリセットしました',
                        description: 'デザイン設定がデフォルトに戻されました。'
                      });
                    }
                  }}
                >
                  設定をリセット
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* プレビュー */}
        <div className="flex-1 overflow-hidden bg-muted relative">
          <div className="absolute inset-0 p-4">
            <div className="h-full rounded-md bg-background shadow-md flex flex-col">
              <div className="p-2 bg-muted/50 border-b flex justify-center">
                <div className="text-sm text-muted-foreground">
                  {deviceView === 'pc' ? 'PCビュー' : 'スマートフォンビュー'}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className={`h-full transition-all duration-300 ${deviceView === 'smartphone' ? 'max-w-[375px] mx-auto' : 'w-full'}`}>
                  <div className="w-full h-full border-0 relative">
                    {/* 通常のiframeプレビュー用 */}
                    <iframe 
                      ref={iframeRef}
                      src={`/store/preview?embedded=true&t=${Date.now()}`} 
                      className="w-full h-full border-0"
                      title="プレビュー"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                      sandbox="allow-same-origin allow-scripts allow-forms"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-800/70 text-white text-xs px-2 py-1">
                      プレビューモード - 表示のみ
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}