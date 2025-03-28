import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Save, RefreshCw, Settings, Palette, Layout, 
  Eye, EyeOff, ArrowUp, ArrowDown, Monitor, 
  Smartphone, GripVertical, CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type DesignSettings, type DesignSection } from '@shared/schema';
import { getDefaultDesignSettings } from '@/shared/defaultDesignSettings';
import PreviewRenderer from '@/components/store/PreviewRenderer';

/**
 * 店舗デザイン管理コンポーネント（新バージョン）
 * インラインプレビューを使用した改良版
 */
export default function StoreDesignManagerNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<DesignSettings>(getDefaultDesignSettings());
  const [isDirty, setIsDirty] = useState(false);
  const [deviceView, setDeviceView] = useState<'pc' | 'smartphone'>('pc');
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
  const designSettingsQuery = useQuery({
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
        if (!designSettings.sections || !Array.isArray(designSettings.sections)) {
          console.warn('デザイン設定のセクションが無効です。デフォルト設定を使用します。');
          return getDefaultDesignSettings();
        }
        
        // グローバル設定の存在確認
        if (!designSettings.globalSettings || typeof designSettings.globalSettings !== 'object') {
          console.warn('デザイン設定のグローバル設定が無効です。デフォルト設定を使用します。');
          return getDefaultDesignSettings();
        }
        
        console.log('デザイン設定の取得に成功しました', {
          isDefault: response.isDefault,
          sectionsCount: designSettings.sections.length,
          hasGlobalSettings: !!designSettings.globalSettings,
          sectionIds: designSettings.sections.map(s => s.id)
        });
        
        return designSettings;
      } catch (error) {
        console.error('デザイン設定の取得エラー:', error);
        // エラー時はデフォルト設定を返す
        return getDefaultDesignSettings();
      }
    },
    staleTime: 5 * 60 * 1000 // 5分間キャッシュ
  });

  // 店舗プロフィールを取得するクエリ
  const storeProfileQuery = useQuery({
    queryKey: [QUERY_KEYS.STORE_PROFILE],
    queryFn: async () => {
      try {
        return await apiRequest<any>('GET', '/api/store/profile');
      } catch (error) {
        console.error('店舗プロフィール取得エラー:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000
  });

  // デザイン設定を保存するミューテーション
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: DesignSettings) => {
      return await apiRequest('POST', '/api/design', { settings });
    },
    onSuccess: () => {
      toast({
        title: "保存しました",
        description: "デザイン設定を保存しました",
        variant: "default"
      });
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DESIGN_SETTINGS] });
    },
    onError: (error) => {
      console.error('デザイン設定の保存エラー:', error);
      toast({
        title: "エラー",
        description: "デザイン設定の保存に失敗しました",
        variant: "destructive"
      });
    }
  });

  // クエリが完了したらステートを更新
  useEffect(() => {
    if (designSettingsQuery.data) {
      setSettings(designSettingsQuery.data);
      console.log('デザイン設定データを適用します');
    }
  }, [designSettingsQuery.data]);

  // デザイン設定を保存
  const handleSave = async () => {
    if (!isDirty) return;
    
    try {
      await saveSettingsMutation.mutateAsync(settings);
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  // プレビューを更新
  const refreshPreview = () => {
    // 最新の設定を使用してプレビューを更新
    console.log('プレビューを更新します:', {
      sectionsCount: settings.sections.length,
      sectionIds: settings.sections.map(s => s.id),
      globalSettings: Object.keys(settings.globalSettings),
      timestamp: new Date().toISOString()
    });
    
    // 設定データを保持しているので特に何もしなくてもいいが、
    // 必要に応じて状態を更新したい場合は、ここに記述
  };

  // セクションのドラッグ＆ドロップ
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(settings.sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // 順序を更新
    const updatedSections = items.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    
    setSettings({
      ...settings,
      sections: updatedSections
    });
    setIsDirty(true);
  };

  // セクションの表示/非表示を切り替える
  const toggleSection = (sectionId: string) => {
    setSettings({
      ...settings,
      sections: settings.sections.map(section => 
        section.id === sectionId 
          ? { ...section, visible: !section.visible }
          : section
      )
    });
    setIsDirty(true);
  };

  // セクション設定を更新
  const updateSectionSettings = (sectionId: string, newSettings: any) => {
    setSettings({
      ...settings,
      sections: settings.sections.map(section => 
        section.id === sectionId 
          ? { 
              ...section, 
              settings: { ...section.settings, ...newSettings } 
            }
          : section
      )
    });
    setIsDirty(true);
  };

  // グローバル設定を更新
  const updateGlobalSettings = (newSettings: any) => {
    setSettings({
      ...settings,
      globalSettings: { ...settings.globalSettings, ...newSettings }
    });
    setIsDirty(true);
  };

  // 必要なセクションを追加する
  const ensureRequiredSections = () => {
    // すべてのセクションIDのリスト（フラット配列）
    const allSectionIds = Object.values(SECTION_IDS).flat();
    
    // "security_measures" が含まれていない場合は追加
    if (!settings.sections.some(section => section.id === "security_measures")) {
      console.log('セクション "security_measures" を追加します');
      
      const newSections = [...settings.sections];
      
      // 新しいセクションを追加
      newSections.push({
        id: "security_measures",
        order: newSections.length + 1,
        title: "安全対策",
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
      });
      
      // セクション更新
      setSettings({
        ...settings,
        sections: newSections
      });
      setIsDirty(true);
    }
    
    console.log('最終セクション構成:', settings.sections.map(s => s.id));
  };

  // 必要なセクションを確保
  useEffect(() => {
    if (settings.sections.length > 0) {
      ensureRequiredSections();
    }
  }, [settings.sections.length]);

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
            ) : isDirty ? (
              <>
                <Save className="h-4 w-4 mr-1" />
                保存
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                保存済み
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
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`
                                  rounded-md 
                                  border
                                  ${section.visible ? 'bg-card' : 'bg-muted/30 opacity-60'} 
                                  ${activeSection === section.id ? 'ring-2 ring-primary' : ''}
                                `}
                              >
                                <div className="p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div {...provided.dragHandleProps} className="cursor-grab">
                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="font-medium" onClick={() => setActiveSection(section.id !== activeSection ? section.id : null)}>
                                      {getSectionTitle(section.id)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => toggleSection(section.id)}
                                      title={section.visible ? '非表示にする' : '表示する'}
                                    >
                                      {section.visible ? (
                                        <Eye className="h-4 w-4" />
                                      ) : (
                                        <EyeOff className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                {activeSection === section.id && (
                                  <SectionDetailSettings section={section} />
                                )}
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
            <TabsContent value="styles" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="main-color">メインカラー</Label>
                      <div className="flex">
                        <Input
                          id="main-color"
                          type="color"
                          value={settings.globalSettings.mainColor || '#ff6b81'}
                          onChange={(e) => updateGlobalSettings({ mainColor: e.target.value })}
                          className="w-10 h-10 p-1 mr-2"
                        />
                        <Input
                          value={settings.globalSettings.mainColor || '#ff6b81'}
                          onChange={(e) => updateGlobalSettings({ mainColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">セカンダリカラー</Label>
                      <div className="flex">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={settings.globalSettings.secondaryColor || '#f9f9f9'}
                          onChange={(e) => updateGlobalSettings({ secondaryColor: e.target.value })}
                          className="w-10 h-10 p-1 mr-2"
                        />
                        <Input
                          value={settings.globalSettings.secondaryColor || '#f9f9f9'}
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
                          value={settings.globalSettings.accentColor || '#41a0ff'}
                          onChange={(e) => updateGlobalSettings({ accentColor: e.target.value })}
                          className="w-10 h-10 p-1 mr-2"
                        />
                        <Input
                          value={settings.globalSettings.accentColor || '#41a0ff'}
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
                          value={settings.globalSettings.backgroundColor || '#ffffff'}
                          onChange={(e) => updateGlobalSettings({ backgroundColor: e.target.value })}
                          className="w-10 h-10 p-1 mr-2"
                        />
                        <Input
                          value={settings.globalSettings.backgroundColor || '#ffffff'}
                          onChange={(e) => updateGlobalSettings({ backgroundColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="font-family">フォント</Label>
                      <select
                        id="font-family"
                        value={settings.globalSettings.fontFamily || 'sans-serif'}
                        onChange={(e) => updateGlobalSettings({ fontFamily: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border"
                      >
                        <option value="sans-serif">サンセリフ (Noto Sans JP)</option>
                        <option value="serif">セリフ (Noto Serif JP)</option>
                        <option value="cursive">手書き風 (Noto Sans JP)</option>
                        <option value="monospace">等幅 (Noto Sans Mono)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="border-radius">
                        全体の角丸: {settings.globalSettings.borderRadius || 8}px
                      </Label>
                      <Slider
                        id="border-radius"
                        defaultValue={[settings.globalSettings.borderRadius || 8]}
                        min={0}
                        max={16}
                        step={1}
                        onValueChange={(value) => updateGlobalSettings({ borderRadius: value[0] })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-width">
                        最大幅: {settings.globalSettings.maxWidth || 1200}px
                      </Label>
                      <Slider
                        id="max-width"
                        defaultValue={[settings.globalSettings.maxWidth || 1200]}
                        min={800}
                        max={1600}
                        step={50}
                        onValueChange={(value) => updateGlobalSettings({ maxWidth: value[0] })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 設定タブ */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hide-section-titles"
                        checked={settings.globalSettings.hideSectionTitles || false}
                        onChange={(e) => updateGlobalSettings({ hideSectionTitles: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="hide-section-titles">セクションの見出しを非表示にする</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
              <div className="flex-1 overflow-auto">
                <div className={`transition-all duration-300 ${deviceView === 'smartphone' ? 'max-w-[375px] mx-auto' : 'w-full'}`}>
                  {/* インラインプレビュー - 新方式 */}
                  <PreviewRenderer 
                    settings={settings}
                    storeProfile={storeProfileQuery.data}
                    deviceView={deviceView}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}