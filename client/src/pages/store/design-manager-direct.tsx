import { useState, useEffect, MouseEvent, ChangeEvent } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

import { 
  Layout, Palette, Settings,
  Save, RefreshCw, Monitor, Smartphone, Eye, EyeOff, 
  ArrowUp, ArrowDown, GripVertical
} from 'lucide-react';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { 
  ensureRequiredSections, 
  getSectionTitle, 
  processProfileJsonFields 
} from '@/utils/storeDesignUtils';
import { getDefaultDesignSettings } from '@/shared/defaultDesignSettings';
import PreviewRenderer from '@/components/store/PreviewRenderer';
import { type DesignSettings, type DesignSection, type GlobalDesignSettings } from '@shared/schema';

// 表示しないセクションID
const REMOVED_SECTION_IDS = ['campaign', 'experience'];

/**
 * 店舗デザイン管理コンポーネント
 * iframeを使わずに直接Reactコンポーネントとしてプレビュー表示するバージョン
 */
export default function StoreDesignManagerDirect() {
  // 現在のプレビュー画面の設定状態
  const [settings, setSettings] = useState<DesignSettings>(getDefaultDesignSettings());
  const [storeProfile, setStoreProfile] = useState<any>(null);
  
  // UI状態
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [deviceView, setDeviceView] = useState<'pc' | 'smartphone'>('pc');
  const [isDirty, setIsDirty] = useState(false);

  const { toast } = useToast();

  // デザイン設定を取得
  const designSettingsQuery = useQuery({
    queryKey: [QUERY_KEYS.DESIGN_SETTINGS],
    queryFn: async () => {
      try {
        console.log('デザイン設定を取得しています...');
        const response = await apiRequest<any>('GET', '/api/design');
        console.log('デザイン設定の取得に成功しました', response);
        
        // レスポンスが有効なら使用、そうでなければデフォルト設定を使用
        if (response && response.success && response.data) {
          return ensureRequiredSections(response.data);
        } else {
          console.warn('APIが有効なデータを返しませんでした。デフォルト設定を使用します。');
          return getDefaultDesignSettings();
        }
      } catch (error) {
        console.error('デザイン設定の取得エラー:', error);
        toast({
          title: 'エラー',
          description: 'デザイン設定の取得に失敗しました。再度お試しください。',
          variant: 'destructive',
        });
        return getDefaultDesignSettings();
      }
    },
    staleTime: 5 * 60 * 1000, // 5分
  });

  // 店舗プロフィールを取得
  const storeProfileQuery = useQuery({
    queryKey: [QUERY_KEYS.STORE_PROFILE],
    queryFn: async () => {
      try {
        const response = await apiRequest<any>('GET', '/api/store/profile');
        console.log('店舗プロフィールの取得に成功しました', response);
        return response;
      } catch (error) {
        console.error('店舗プロフィールの取得エラー:', error);
        toast({
          title: 'エラー',
          description: '店舗情報の取得に失敗しました。再度お試しください。',
          variant: 'destructive',
        });
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5分
  });

  // デザイン設定を保存するmutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: DesignSettings) => {
      const response = await apiRequest<any>('POST', '/api/design', { designData: newSettings });
      return response;
    },
    onSuccess: () => {
      toast({
        title: '保存完了',
        description: 'デザイン設定を保存しました',
      });
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DESIGN_SETTINGS] });
    },
    onError: (error) => {
      console.error('デザイン設定の保存エラー:', error);
      toast({
        title: '保存エラー',
        description: 'デザイン設定の保存に失敗しました。再度お試しください。',
        variant: 'destructive',
      });
    }
  });

  // 初期データのロード
  useEffect(() => {
    if (designSettingsQuery.data) {
      setSettings(designSettingsQuery.data);
    }

    if (storeProfileQuery.data) {
      // プロフィールデータのJSONB型フィールドを正しく処理
      const processedProfile = processProfileJsonFields(storeProfileQuery.data);
      setStoreProfile(processedProfile);
    }
  }, [designSettingsQuery.data, storeProfileQuery.data]);

  // ドラッグアンドドロップでセクションの順序を変更
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // ドラッグしたセクションのID
    const sectionId = result.draggableId;

    // 現在のセクションリスト（ヘッダーを除く）を取得
    const currentSections = settings.sections
      .filter(s => s.id !== 'header')
      .sort((a, b) => a.order - b.order);

    // 移動元のセクションを取得
    const section = settings.sections.find(s => s.id === sectionId);
    if (!section) return;

    // 新しい順序リストを作成（headerは常に0）
    const newSections = settings.sections.map(s => {
      // ヘッダーの場合は変更しない
      if (s.id === 'header') return s;

      // 動かしたセクションの場合は新しい位置を設定
      if (s.id === sectionId) {
        return { ...s, order: destIndex + 1 }; // +1 は header が 0 なので
      }

      // その他のセクションの位置を調整
      const currentIndex = currentSections.findIndex(cs => cs.id === s.id);
      // 移動していないセクションは処理しない
      if (currentIndex === -1) return s;

      // 移動元より後の位置にあるセクションが移動先より前に来る場合は1つ後ろにずらす
      if (currentIndex >= sourceIndex && destIndex < sourceIndex && currentIndex <= destIndex) {
        return { ...s, order: s.order + 1 };
      }
      // 移動元より前の位置にあるセクションが移動先より後に来る場合は1つ前にずらす
      else if (currentIndex <= sourceIndex && destIndex > sourceIndex && currentIndex >= destIndex) {
        return { ...s, order: s.order - 1 };
      }

      return s;
    });

    setSettings({ ...settings, sections: newSections });
    setIsDirty(true);
  };

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
      const swapSection = sections.find(s => s.id !== 'header' && s.order === newOrder);
      if (!swapSection) return prev;
      
      // 順序を入れ替える
      const newSections = sections.map(section => {
        if (section.id === id) {
          return { ...section, order: newOrder };
        }
        if (section.id === swapSection.id) {
          return { ...section, order: currentSection.order };
        }
        return section;
      });
      
      return { ...prev, sections: newSections };
    });
    setIsDirty(true);
  };

  // セクション設定を更新する
  const updateSectionSettings = (id: string, newSettings: any) => {
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

  // 設定を保存する
  const handleSave = () => {
    // 保存前に体験入店情報とキャンペーン情報のセクションを除外
    const filteredSettings = ensureRequiredSections(settings);
    console.log('保存する設定:', filteredSettings.sections.map((s: DesignSection) => s.id));
    saveSettingsMutation.mutate(filteredSettings);
  };

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
              <div>
                <h3 className="font-medium mb-3">メインカラー</h3>
                <div className="flex space-x-2">
                  <Input 
                    type="color" 
                    value={settings.globalSettings.mainColor} 
                    onChange={(e) => updateGlobalSettings({ mainColor: e.target.value })}
                    className="w-10 h-10 p-1"
                  />
                  <Input 
                    value={settings.globalSettings.mainColor} 
                    onChange={(e) => updateGlobalSettings({ mainColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">アクセントカラー</h3>
                <div className="flex space-x-2">
                  <Input 
                    type="color" 
                    value={settings.globalSettings.accentColor} 
                    onChange={(e) => updateGlobalSettings({ accentColor: e.target.value })}
                    className="w-10 h-10 p-1"
                  />
                  <Input 
                    value={settings.globalSettings.accentColor} 
                    onChange={(e) => updateGlobalSettings({ accentColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">背景色</h3>
                <div className="flex space-x-2">
                  <Input 
                    type="color" 
                    value={settings.globalSettings.backgroundColor} 
                    onChange={(e) => updateGlobalSettings({ backgroundColor: e.target.value })}
                    className="w-10 h-10 p-1"
                  />
                  <Input 
                    value={settings.globalSettings.backgroundColor} 
                    onChange={(e) => updateGlobalSettings({ backgroundColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">フォント</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="font-family">フォント種類</Label>
                    <select
                      id="font-family"
                      className="w-full p-2 border rounded mt-1"
                      value={settings.globalSettings.fontFamily}
                      onChange={(e) => updateGlobalSettings({ fontFamily: e.target.value })}
                    >
                      <option value="sans-serif">ゴシック体</option>
                      <option value="serif">明朝体</option>
                      <option value="cursive">デザインフォント</option>
                      <option value="monospace">等幅フォント</option>
                      <option value="'Noto Sans JP', sans-serif">Noto Sans JP</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="border-radius">境界線の丸み</Label>
                    <div className="flex items-center mt-1">
                      <span className="mr-2 text-sm">{settings.globalSettings.borderRadius}px</span>
                      <Slider
                        id="border-radius"
                        defaultValue={[settings.globalSettings.borderRadius]}
                        min={0}
                        max={20}
                        step={1}
                        className="flex-1"
                        onValueChange={(value) => updateGlobalSettings({ borderRadius: value[0] })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">レイアウト</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="max-width">最大幅 ({settings.globalSettings.maxWidth}px)</Label>
                    <Slider
                      id="max-width"
                      defaultValue={[settings.globalSettings.maxWidth]}
                      min={800}
                      max={1600}
                      step={50}
                      onValueChange={(value) => updateGlobalSettings({ maxWidth: value[0] })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="hide-titles"
                      checked={!!settings.globalSettings.hideSectionTitles}
                      onCheckedChange={(checked) => updateGlobalSettings({ hideSectionTitles: checked })}
                    />
                    <Label htmlFor="hide-titles">セクションの見出しを非表示にする</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 設定タブ */}
            <TabsContent value="settings" className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
                <h3 className="font-bold text-yellow-800 mb-2">デザイン設定のヒント</h3>
                <ul className="list-disc ml-5 space-y-1 text-yellow-700">
                  <li>メインカラーはボタンや見出しに使用されます</li>
                  <li>セクションの順序はドラッグ&ドロップで変更できます</li>
                  <li>設定変更後は必ず保存ボタンを押してください</li>
                  <li>スマホ表示も確認することをおすすめします</li>
                </ul>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-bold mb-2">デザイン設定の保存・読み込み</h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSave}
                    disabled={!isDirty}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    設定を保存
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSettings(designSettingsQuery.data || getDefaultDesignSettings());
                      setIsDirty(false);
                    }}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    初期設定に戻す
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* プレビュー領域 */}
        <div className="flex-1 relative overflow-auto bg-gray-100">
          <div className={`transition-all duration-300 ${deviceView === 'smartphone' ? 'max-w-sm' : ''} mx-auto mt-4 shadow-lg bg-white`}>
            <div className="sticky top-0 bg-gray-800 text-white p-2 text-sm flex justify-between items-center">
              <span>プレビュー</span>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-white hover:text-white hover:bg-gray-700"
                  onClick={handleSave}
                  disabled={!isDirty}
                >
                  <Save className="h-3 w-3 mr-1" />
                  保存
                </Button>
              </div>
            </div>
            <div className="overflow-auto h-[calc(100vh-140px)]">
              <PreviewRenderer 
                settings={settings} 
                storeProfile={storeProfile} 
                deviceView={deviceView}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}