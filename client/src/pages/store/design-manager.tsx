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
import { getServiceTypeLabel } from '@/lib/utils';

// デザイン設定の型定義
interface SectionSettings {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  titleColor?: string;
  fontSize?: number;
  padding?: number;
  borderRadius?: number;
  borderWidth?: number;
}

interface DesignSection {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  settings: SectionSettings;
}

interface GlobalDesignSettings {
  mainColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderRadius: number;
  maxWidth: number;
}

interface DesignSettings {
  sections: DesignSection[];
  globalSettings: GlobalDesignSettings;
}

export default function StoreDesignManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<DesignSettings>({
    sections: [],
    globalSettings: {
      mainColor: '#ff4d7d',
      secondaryColor: '#ffc7d8',
      accentColor: '#ff9eb8',
      backgroundColor: '#fff5f9',
      fontFamily: 'sans-serif',
      borderRadius: 8,
      maxWidth: 1200
    }
  });
  const [isDirty, setIsDirty] = useState(false);
  const [deviceView, setDeviceView] = useState<'pc' | 'smartphone'>('pc');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // デフォルトのデザイン設定を取得する関数
  const getDefaultSettings = (): DesignSettings => {
    return {
      sections: [
        {
          id: "header",
          title: "ヘッダー",
          visible: true,
          order: 1,
          settings: {
            backgroundColor: "#ffffff",
            textColor: "#333333",
            titleColor: "#ff69b4"
          }
        },
        {
          id: "catchphrase",
          title: "キャッチフレーズ",
          visible: true,
          order: 2,
          settings: {
            backgroundColor: "#fff5f8",
            textColor: "#333333",
            titleColor: "#ff69b4"
          }
        },
        {
          id: "description",
          title: "仕事内容",
          visible: true,
          order: 3,
          settings: {
            backgroundColor: "#ffffff",
            textColor: "#333333",
            titleColor: "#ff69b4"
          }
        },
        {
          id: "photo_gallery",
          title: "写真ギャラリー",
          visible: true,
          order: 4,
          settings: {
            backgroundColor: "#ffffff",
            textColor: "#333333",
            titleColor: "#ff69b4"
          }
        },
        {
          id: "benefits",
          title: "待遇・環境",
          visible: true,
          order: 5,
          settings: {
            backgroundColor: "#fff5f8",
            textColor: "#333333",
            titleColor: "#ff69b4"
          }
        }
      ],
      globalSettings: {
        mainColor: "#ff69b4",
        secondaryColor: "#fff5f8",
        accentColor: "#ff1493",
        backgroundColor: "#ffffff",
        fontFamily: "sans-serif",
        borderRadius: 8,
        maxWidth: 1200
      }
    };
  };

  // デザイン設定を取得する
  const { isLoading, refetch } = useQuery<DesignSettings>({
    queryKey: [QUERY_KEYS.STORE_DESIGN],
    queryFn: async () => {
      try {
        const response = await apiRequest<DesignSettings>('GET', '/api/design');
        return response;
      } catch (error) {
        console.error('デザイン設定の取得に失敗しました', error);
        return getDefaultSettings();
      }
    }
  });
  
  // データが取得できたらステートを更新
  useEffect(() => {
    if (refetch) {
      refetch().then(result => {
        if (result.data) {
          setSettings(result.data);
          setIsDirty(false);
        }
      });
    }
  }, [refetch]);

  // デザイン設定を保存する
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: DesignSettings) => {
      const response = await apiRequest('POST', '/api/design', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "保存完了",
        description: "デザイン設定を保存しました。",
      });
      setIsDirty(false);
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: "デザイン設定の保存に失敗しました。" + error.message,
        variant: "destructive"
      });
    }
  });

  // プレビューにデザイン設定を送信する
  useEffect(() => {
    const previewWindow = iframeRef.current?.contentWindow;
    if (previewWindow) {
      try {
        console.log('プレビューウィンドウにデザイン設定を送信します', { time: new Date().toISOString() });
        previewWindow.postMessage({ type: 'UPDATE_DESIGN', settings }, '*');
      } catch (error) {
        console.error('プレビューへのメッセージ送信に失敗しました', error);
      }
    }
  }, [settings]);

  // 設定が変更されたらpropsを更新する
  const handleSettingsChange = (newSettings: DesignSettings) => {
    setSettings(newSettings);
    setIsDirty(true);
  };

  // セクションの表示/非表示を切り替える
  const toggleSectionVisibility = (sectionId: string) => {
    const updatedSections = settings.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          visible: !section.visible
        };
      }
      return section;
    });

    handleSettingsChange({
      ...settings,
      sections: updatedSections
    });
  };

  // セクションの順序を変更する
  const changeOrder = (sectionId: string, direction: 'up' | 'down') => {
    const sortedSections = [...settings.sections].sort((a, b) => a.order - b.order);
    const sectionIndex = sortedSections.findIndex(section => section.id === sectionId);
    
    if (sectionIndex === -1) return;
    
    if (direction === 'up' && sectionIndex > 0) {
      // 上に移動
      const temp = sortedSections[sectionIndex].order;
      sortedSections[sectionIndex].order = sortedSections[sectionIndex - 1].order;
      sortedSections[sectionIndex - 1].order = temp;
    } else if (direction === 'down' && sectionIndex < sortedSections.length - 1) {
      // 下に移動
      const temp = sortedSections[sectionIndex].order;
      sortedSections[sectionIndex].order = sortedSections[sectionIndex + 1].order;
      sortedSections[sectionIndex + 1].order = temp;
    }
    
    handleSettingsChange({
      ...settings,
      sections: sortedSections
    });
  };
  
  // ドラッグアンドドロップによるセクション順序変更
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return; // ドロップ先がない場合は何もしない
    
    const { source, destination } = result;
    if (source.index === destination.index) return; // 位置が変わっていない場合は何もしない
    
    // 並び順でソートされたセクションリストを取得
    const sortedSections = [...settings.sections].sort((a, b) => a.order - b.order);
    
    // 移動するアイテムを一時保存
    const [movedItem] = sortedSections.splice(source.index, 1);
    
    // 新しい位置に挿入
    sortedSections.splice(destination.index, 0, movedItem);
    
    // order値を更新（1から順に振り直す）
    const updatedSections = sortedSections.map((section, index) => ({
      ...section,
      order: index + 1
    }));
    
    handleSettingsChange({
      ...settings,
      sections: updatedSections
    });
  };

  // セクション設定を更新する
  const updateSectionSettings = (sectionId: string, newSettings: Partial<SectionSettings>) => {
    const updatedSections = settings.sections.map(section => {
      if (section.id === sectionId) {
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

    handleSettingsChange({
      ...settings,
      sections: updatedSections
    });
  };

  // グローバル設定を更新する
  const updateGlobalSettings = (newSettings: Partial<GlobalDesignSettings>) => {
    handleSettingsChange({
      ...settings,
      globalSettings: {
        ...settings.globalSettings,
        ...newSettings
      }
    });
  };

  // 設定を保存する
  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  // プレビューをリフレッシュする
  const refreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // セクション詳細設定のコンポーネント
  const SectionDetailSettings = ({ section }: { section: DesignSection }) => (
    <div className="p-3 border-t bg-muted/30">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor={`${section.id}-bg-color`}>背景色</Label>
          <div className="flex">
            <Input 
              id={`${section.id}-bg-color`}
              type="color" 
              value={section.settings.backgroundColor || '#ffffff'} 
              onChange={(e) => updateSectionSettings(section.id, { backgroundColor: e.target.value })}
              className="w-10 h-10 p-1 mr-2"
            />
            <Input 
              value={section.settings.backgroundColor || '#ffffff'} 
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
              value={section.settings.textColor || '#333333'} 
              onChange={(e) => updateSectionSettings(section.id, { textColor: e.target.value })}
              className="w-10 h-10 p-1 mr-2"
            />
            <Input 
              value={section.settings.textColor || '#333333'} 
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
              value={section.settings.titleColor || '#ff6b81'} 
              onChange={(e) => updateSectionSettings(section.id, { titleColor: e.target.value })}
              className="w-10 h-10 p-1 mr-2"
            />
            <Input 
              value={section.settings.titleColor || '#ff6b81'} 
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
              value={section.settings.borderColor || '#e0e0e0'} 
              onChange={(e) => updateSectionSettings(section.id, { borderColor: e.target.value })}
              className="w-10 h-10 p-1 mr-2"
            />
            <Input 
              value={section.settings.borderColor || '#e0e0e0'} 
              onChange={(e) => updateSectionSettings(section.id, { borderColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor={`${section.id}-font-size`}>
            文字サイズ: {section.settings.fontSize || 16}px
          </Label>
          <Slider
            id={`${section.id}-font-size`}
            defaultValue={[section.settings.fontSize || 16]}
            min={12}
            max={24}
            step={1}
            onValueChange={(value) => updateSectionSettings(section.id, { fontSize: value[0] })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${section.id}-padding`}>
            内側余白: {section.settings.padding || 20}px
          </Label>
          <Slider
            id={`${section.id}-padding`}
            defaultValue={[section.settings.padding || 20]}
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
            角丸: {section.settings.borderRadius || 8}px
          </Label>
          <Slider
            id={`${section.id}-border-radius`}
            defaultValue={[section.settings.borderRadius || 8]}
            min={0}
            max={20}
            step={1}
            onValueChange={(value) => updateSectionSettings(section.id, { borderRadius: value[0] })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${section.id}-border-width`}>
            枠線太さ: {section.settings.borderWidth || 1}px
          </Label>
          <Slider
            id={`${section.id}-border-width`}
            defaultValue={[section.settings.borderWidth || 1]}
            min={0}
            max={10}
            step={1}
            onValueChange={(value) => updateSectionSettings(section.id, { borderWidth: value[0] })}
          />
        </div>
      </div>
    </div>
  );

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
                        .sort((a, b) => a.order - b.order)
                        .map((section, index) => (
                          <Draggable key={section.id} draggableId={section.id} index={index}>
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
                                        <span
                                          {...provided.dragHandleProps}
                                          className="mr-2 cursor-grab"
                                          title="ドラッグして順序を変更"
                                        >
                                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </span>
                                        {section.visible ? (
                                          <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                                        ) : (
                                          <EyeOff className="h-4 w-4 mr-2 text-muted-foreground" />
                                        )}
                                        <span className={section.visible ? '' : 'text-muted-foreground line-through'}>
                                          {section.title}
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
                                        >
                                          {section.visible ? (
                                            <EyeOff className="h-4 w-4" />
                                          ) : (
                                            <Eye className="h-4 w-4" />
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            changeOrder(section.id, 'up');
                                          }}
                                          disabled={section.order === 1}
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
                                          disabled={section.order === settings.sections.length}
                                        >
                                          <ArrowDown className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* セクション詳細設定 */}
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
            <TabsContent value="styles" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                サイト全体のスタイル設定を変更できます。全体的な色調やデザインの雰囲気に影響します。
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
                    className="w-full border rounded px-3 py-2"
                    value={settings.globalSettings.fontFamily}
                    onChange={(e) => updateGlobalSettings({ fontFamily: e.target.value })}
                  >
                    <option value="sans-serif">ゴシック体</option>
                    <option value="serif">明朝体</option>
                    <option value="'Noto Sans JP', sans-serif">Noto Sans JP</option>
                    <option value="'M PLUS 1p', sans-serif">M PLUS 1p</option>
                    <option value="'Kosugi Maru', sans-serif">Kosugi Maru</option>
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
                    コンテンツ最大幅: {settings.globalSettings.maxWidth}px
                  </Label>
                  <Slider
                    id="max-width"
                    defaultValue={[settings.globalSettings.maxWidth]}
                    min={600}
                    max={1600}
                    step={10}
                    onValueChange={(value) => updateGlobalSettings({ maxWidth: value[0] })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* 設定タブ */}
            <TabsContent value="settings" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                その他の設定を行えます。表示に関する詳細な設定やシステム設定などを行います。
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-2">デバイス設定</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    レスポンシブデザインの設定を行います。各デバイスでの表示を最適化できます。
                  </p>
                  
                  <div className="space-y-2">
                    <Label>プレビューモード</Label>
                    <div className="flex items-center space-x-2 bg-muted p-1 rounded-md w-fit">
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
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-2">保存と公開</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    デザイン設定の保存と公開を行います。変更内容を保存して公開画面に反映します。
                  </p>
                  
                  <div className="space-y-4">
                    <Button 
                      variant="default" 
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
                          設定を保存する
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={refreshPreview}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      プレビューを更新する
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* プレビュー領域 */}
        <div className="flex-1 bg-muted/50 overflow-auto">
          <div className="h-full p-4 flex flex-col items-center justify-center">
            <div className={`
              bg-white border rounded-md overflow-hidden shadow-md transition-all duration-300
              ${deviceView === 'pc' ? 'w-full max-w-[1000px] h-[800px]' : 'w-[375px] h-[667px]'}
            `}>
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
                  <span className="ml-2">読み込み中...</span>
                </div>
              ) : (
                <iframe 
                  src="/store/preview" 
                  className="w-full h-full border-0" 
                  ref={iframeRef}
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {deviceView === 'pc' ? 'PCビュー' : 'スマートフォンビュー'} - 実際の表示と異なる場合があります
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}