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
import { type DesignSettings, type SectionSettings, type GlobalDesignSettings, type DesignSection } from '@shared/schema';

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
          id: "catchphrase",
          title: "キャッチコピー・仕事内容",
          visible: true,
          order: 1,
          settings: {
            backgroundColor: "#ffffff",
            textColor: "#333333",
            borderColor: "#e0e0e0",
            titleColor: "#ff6b81",
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
            titleColor: "#ff6b81",
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
            titleColor: "#ff6b81",
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
            backgroundColor: "#fff9fa",
            textColor: "#333333",
            borderColor: "#e0e0e0",
            titleColor: "#ff6b81",
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
            titleColor: "#ff6b81",
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
            titleColor: "#ff6b81",
            fontSize: 16,
            padding: 20,
            borderRadius: 8,
            borderWidth: 1
          }
        },
        {
          id: "trial_entry",
          title: "体験入店",
          visible: true,
          order: 7,
          settings: {
            backgroundColor: "#ffffff",
            textColor: "#333333",
            borderColor: "#ffd6dd",
            titleColor: "#ff6b81",
            fontSize: 16,
            padding: 20,
            borderRadius: 8,
            borderWidth: 1
          }
        },
        {
          id: "campaigns",
          title: "キャンペーン",
          visible: true,
          order: 8,
          settings: {
            backgroundColor: "#fff9fa",
            textColor: "#333333",
            borderColor: "#e0e0e0",
            titleColor: "#ff6b81",
            fontSize: 16,
            padding: 20,
            borderRadius: 8,
            borderWidth: 1
          }
        },
        {
          id: "access",
          title: "アクセス",
          visible: true,
          order: 9,
          settings: {
            backgroundColor: "#ffffff",
            textColor: "#333333",
            borderColor: "#e0e0e0",
            titleColor: "#ff6b81",
            fontSize: 16,
            padding: 20,
            borderRadius: 8,
            borderWidth: 1
          }
        },
        {
          id: "contact",
          title: "連絡先",
          visible: true,
          order: 10,
          settings: {
            backgroundColor: "#fff9fa",
            textColor: "#333333",
            borderColor: "#e0e0e0",
            titleColor: "#ff6b81",
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
            titleColor: "#ff6b81",
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

  // 設定を取得するクエリ
  const designSettingsQuery = useQuery({
    queryKey: [QUERY_KEYS.DESIGN_SETTINGS],
    queryFn: async () => {
      try {
        console.log('デザイン設定を取得しています...');
        const response = await apiRequest<DesignSettings>("GET", "/api/design");
        console.log('デザイン設定の取得に成功しました:', response);
        return response;
      } catch (error) {
        console.error('デザイン設定の取得に失敗しました:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    retry: 1,
    retryDelay: 1000
  });

  // 設定を保存するミューテーション
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: DesignSettings) => {
      try {
        console.log('デザイン設定を保存しています...', data);
        const response = await apiRequest("POST", "/api/design", data);
        console.log('デザイン設定の保存に成功しました:', response);
        return response;
      } catch (error) {
        console.error('デザイン設定の保存に失敗しました:', error);
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

  // 初期データのロード
  useEffect(() => {
    // クエリからデータが取得できた場合
    if (designSettingsQuery.isSuccess && designSettingsQuery.data) {
      console.log('デザイン設定データを適用:', designSettingsQuery.data);
      setSettings(designSettingsQuery.data);
    } 
    // エラーが発生した場合
    else if (designSettingsQuery.isError) {
      console.error('デザイン設定の読み込みエラー:', designSettingsQuery.error);
      toast({
        title: 'データの読み込みに失敗しました',
        description: '初期設定を適用します。',
        variant: 'destructive',
      });
      const defaultSettings = getDefaultSettings();
      setSettings(defaultSettings);
    } 
    // クエリが成功したが、データがない場合
    else if (designSettingsQuery.isSuccess && !designSettingsQuery.data) {
      console.log('デザイン設定が存在しないため、デフォルト設定を適用します');
      const defaultSettings = getDefaultSettings();
      setSettings(defaultSettings);
    }
    // クエリがロード中の場合は何もしない（ローディング表示は別途行う）
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

  // セクションの並び順を変更する
  const changeOrder = (id: string, direction: 'up' | 'down') => {
    setSettings(prev => {
      const sections = [...prev.sections];
      const currentIndex = sections.findIndex(s => s.id === id);
      if (currentIndex === -1) return prev;

      const currentSection = sections[currentIndex];
      const newOrder = direction === 'up' 
        ? Math.max(1, currentSection.order - 1)
        : Math.min(sections.length, currentSection.order + 1);

      // すでに存在する順序を入れ替える
      const swapSection = sections.find(s => s.order === newOrder);
      if (swapSection) {
        swapSection.order = currentSection.order;
      }

      currentSection.order = newOrder;

      return { ...prev, sections: sections };
    });
    setIsDirty(true);
  };

  // ドラッグ&ドロップ後の処理
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // ドロップ先が無効な場合は何もしない
    if (!destination) return;

    // 元の位置と同じ場合は何もしない
    if (destination.index === source.index) return;

    setSettings(prev => {
      const sections = [...prev.sections];
      const sourceIndex = sections.findIndex(s => s.order === source.index + 1);
      const destinationIndex = sections.findIndex(s => s.order === destination.index + 1);

      if (sourceIndex === -1 || destinationIndex === -1) return prev;

      const [removed] = sections.splice(sourceIndex, 1);
      sections.splice(destinationIndex, 0, removed);

      // 順序を再計算
      const reorderedSections = sections.map((section, index) => ({
        ...section,
        order: index + 1
      }));

      return { ...prev, sections: reorderedSections };
    });
    setIsDirty(true);
  };

  // 設定を保存する
  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  // プレビューを更新する
  const refreshPreview = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_DESIGN',
        settings: settings
      }, '*');
    }
  };

  // 子ウィンドウからのメッセージを受け取る
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // プレビューページからのログを親ウィンドウのコンソールに出力
      if (event.data.type === 'forward-log') {
        console.log('プレビューウィンドウからのログ:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [settings]);

  // セクション詳細設定のコンポーネント
  const SectionDetailSettings = ({ section }: { section: DesignSection }) => {
    const sectionSettings = section.settings || {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      titleColor: '#ff6b81',
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
                value={sectionSettings.titleColor || '#ff6b81'} 
                onChange={(e) => updateSectionSettings(section.id, { titleColor: e.target.value })}
                className="w-10 h-10 p-1 mr-2"
              />
              <Input 
                value={sectionSettings.titleColor || '#ff6b81'} 
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
                    最大幅: {settings.globalSettings.maxWidth}px
                  </Label>
                  <Slider
                    id="max-width"
                    defaultValue={[settings.globalSettings.maxWidth]}
                    min={800}
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
                その他の設定を変更できます。
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">プレビュー設定</h3>
                        <p className="text-sm text-muted-foreground">
                          プレビューの表示方法を設定します。
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="device-view">デバイス表示</Label>
                        <div className="flex space-x-2">
                          <Button
                            variant={deviceView === 'pc' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDeviceView('pc')}
                            className="flex-1"
                          >
                            <Monitor className="h-4 w-4 mr-2" />
                            PC
                          </Button>
                          <Button
                            variant={deviceView === 'smartphone' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDeviceView('smartphone')}
                            className="flex-1"
                          >
                            <Smartphone className="h-4 w-4 mr-2" />
                            スマートフォン
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">保存・リセット</h3>
                        <p className="text-sm text-muted-foreground">
                          設定の保存やリセットを行います。
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="default"
                          onClick={handleSave}
                          disabled={!isDirty || saveSettingsMutation.isPending}
                          className="flex-1"
                        >
                          {saveSettingsMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              保存中...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              設定を保存
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (designSettingsQuery.data) {
                              setSettings(designSettingsQuery.data);
                            } else {
                              setSettings(getDefaultSettings());
                            }
                            setIsDirty(false);
                          }}
                          disabled={!isDirty || saveSettingsMutation.isPending}
                          className="flex-1"
                        >
                          変更を破棄
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* プレビュー */}
        <div className="flex-1 overflow-auto p-4 bg-muted/20">
          <div className="flex flex-col h-full items-center">
            <div className="mb-2 text-center">
              <h2 className="text-lg font-bold">プレビュー</h2>
              <p className="text-sm text-muted-foreground">
                実際の表示と異なる場合があります。設定変更後は「更新」ボタンをクリックしてください。
              </p>
            </div>
            
            <div 
              className={`mt-4 flex-1 relative overflow-hidden border border-border rounded-lg shadow ${
                deviceView === 'smartphone' 
                  ? 'w-[375px] max-w-full' 
                  : 'w-full max-w-[1200px]'
              }`}
            >
              {designSettingsQuery.isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  読み込み中...
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  src="/store/preview"
                  className="w-full h-full bg-white"
                  title="店舗プレビュー"
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