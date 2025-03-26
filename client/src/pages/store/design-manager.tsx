import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Smartphone, 
  Save, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  X, 
  RefreshCw,
  Settings,
  Layout,
  Image,
  Type,
  GripVertical,
  Move,
  Palette,
  Plus
} from 'lucide-react';

// デザイン設定の型定義
interface DesignSettings {
  sections: {
    id: string;
    title: string;
    visible: boolean;
    order: number;
    settings: {
      backgroundColor?: string;
      textColor?: string;
      borderColor?: string;
      titleColor?: string;
      fontSize?: number;
      padding?: number;
      borderRadius?: number;
      borderWidth?: number;
    };
  }[];
  globalSettings: {
    mainColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: number;
    maxWidth: number;
  };
}

// サンプルのセクションデータ (実際のデータはAPIから取得)
const defaultSections = [
  {
    id: 'header',
    title: '店舗基本情報',
    visible: true,
    order: 1,
    settings: {
      backgroundColor: '#fff5f9',
      textColor: '#333333',
      borderColor: '#ffd6dd',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'catchphrase',
    title: 'キャッチコピー・仕事内容',
    visible: true,
    order: 2,
    settings: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      borderColor: '#e0e0e0',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'photo_gallery',
    title: '写真ギャラリー',
    visible: true,
    order: 3,
    settings: {
      backgroundColor: '#fff9fa',
      textColor: '#333333',
      borderColor: '#ffd6dd',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'special_offers',
    title: '特別オファー',
    visible: true,
    order: 4,
    settings: {
      backgroundColor: '#fff0f5',
      textColor: '#333333',
      borderColor: '#ffcce0',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'salary',
    title: '給与情報',
    visible: true,
    order: 5,
    settings: {
      backgroundColor: '#fff9fa',
      textColor: '#333333',
      borderColor: '#ffd6dd',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'salary_examples',
    title: '給与例・体験保証',
    visible: true,
    order: 6,
    settings: {
      backgroundColor: '#fff5ff',
      textColor: '#333333',
      borderColor: '#f5d0ff',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'benefits',
    title: '待遇・環境',
    visible: true,
    order: 7,
    settings: {
      backgroundColor: '#fafafa',
      textColor: '#333333',
      borderColor: '#e0e0e0',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'schedule',
    title: '勤務時間',
    visible: true,
    order: 8,
    settings: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      borderColor: '#e0e0e0',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'requirements',
    title: '応募条件',
    visible: true,
    order: 9,
    settings: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      borderColor: '#e0e0e0',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'privacy_measures',
    title: '身バレ対策',
    visible: true,
    order: 10,
    settings: {
      backgroundColor: '#f0faff',
      textColor: '#333333',
      borderColor: '#d0e8ff',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'facility_features',
    title: '店舗設備',
    visible: true,
    order: 11,
    settings: {
      backgroundColor: '#f9fff0',
      textColor: '#333333',
      borderColor: '#e0ffd0',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'access',
    title: 'アクセス・住所',
    visible: true,
    order: 12,
    settings: {
      backgroundColor: '#f8f8f8',
      textColor: '#333333',
      borderColor: '#e0e0e0',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'contact',
    title: '応募方法・連絡先',
    visible: true,
    order: 13,
    settings: {
      backgroundColor: '#fff9fa',
      textColor: '#333333',
      borderColor: '#ffd6dd',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'trial_entry',
    title: '体験入店情報',
    visible: true,
    order: 14,
    settings: {
      backgroundColor: '#fff0f5',
      textColor: '#333333',
      borderColor: '#ffcce0',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'campaigns',
    title: 'キャンペーン情報',
    visible: true,
    order: 15,
    settings: {
      backgroundColor: '#fff9f0',
      textColor: '#333333',
      borderColor: '#ffe0cc',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'testimonials',
    title: '体験談・口コミ',
    visible: true,
    order: 16,
    settings: {
      backgroundColor: '#f0f5ff',
      textColor: '#333333',
      borderColor: '#d0e0ff',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'job_videos',
    title: '求人動画',
    visible: true,
    order: 17,
    settings: {
      backgroundColor: '#f5f5f5',
      textColor: '#333333',
      borderColor: '#e0e0e0',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'sns',
    title: 'SNS情報',
    visible: true,
    order: 18,
    settings: {
      backgroundColor: '#f0f0ff',
      textColor: '#333333',
      borderColor: '#d5d5ff',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  },
  {
    id: 'blog',
    title: '店舗ブログ',
    visible: true,
    order: 19,
    settings: {
      backgroundColor: '#fff8f0',
      textColor: '#333333',
      borderColor: '#ffebcc',
      titleColor: '#ff4d7d',
      fontSize: 18,
      padding: 24,
      borderRadius: 10,
      borderWidth: 1
    }
  }
];

// デフォルトのグローバル設定
const defaultGlobalSettings = {
  mainColor: '#ff4d7d',
  secondaryColor: '#fff5f9',
  accentColor: '#7854ff',
  backgroundColor: '#ffffff',
  fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "游ゴシック", YuGothic, Meiryo, sans-serif',
  borderRadius: 10,
  maxWidth: 1200
};

export default function StoreDesignManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deviceView, setDeviceView] = useState<'pc' | 'smartphone'>('pc');
  const [settings, setSettings] = useState<DesignSettings>({
    sections: defaultSections,
    globalSettings: defaultGlobalSettings
  });
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 設定を読み込むクエリ
  const { data: savedSettings, isLoading, isError } = useQuery({
    queryKey: [QUERY_KEYS.STORE_DESIGN],
    queryFn: async () => {
      try {
        console.log('デザイン設定を取得中...', QUERY_KEYS.STORE_DESIGN);
        const response = await apiRequest('GET', QUERY_KEYS.STORE_DESIGN);
        console.log('デザイン設定取得成功:', response);
        return response as DesignSettings;
      } catch (error) {
        console.error('デザイン設定の取得に失敗しました', error);
        return null;
      }
    },
    enabled: !!user?.id && user?.role === 'store',
    staleTime: 300000 // 5分間キャッシュ
  });

  // 設定を保存するミューテーション
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: DesignSettings) => {
      console.log('デザイン設定を保存中...', QUERY_KEYS.STORE_DESIGN, data);
      return await apiRequest('POST', QUERY_KEYS.STORE_DESIGN, data);
    },
    onSuccess: () => {
      toast({
        title: '設定を保存しました',
        description: 'デザイン設定が正常に保存されました',
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STORE_DESIGN] });
      setIsDirty(false);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: '保存に失敗しました',
        description: error.message || 'エラーが発生しました。もう一度お試しください。',
      });
    }
  });

  // 保存された設定をロード
  useEffect(() => {
    if (savedSettings) {
      // 写真ギャラリーセクションが存在しない場合は追加する
      let updatedSettings = { ...savedSettings };
      const hasPhotoGallery = savedSettings.sections.some(section => section.id === 'photo_gallery');
      
      if (!hasPhotoGallery) {
        console.log('写真ギャラリーセクションが見つからないため追加します');
        updatedSettings.sections = [
          ...updatedSettings.sections,
          {
            id: 'photo_gallery',
            title: '写真ギャラリー',
            visible: true,
            order: updatedSettings.sections.length + 1,
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
          }
        ];
      }
      
      setSettings(updatedSettings);
    }
  }, [savedSettings]);

  // 設定変更時の処理
  const handleSettingsChange = (newSettings: DesignSettings) => {
    setSettings(newSettings);
    setIsDirty(true);
    updatePreview(newSettings);
  };

  // セクションの表示/非表示を切り替える
  const toggleSectionVisibility = (sectionId: string) => {
    const newSections = settings.sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, visible: !section.visible };
      }
      return section;
    });
    
    handleSettingsChange({
      ...settings,
      sections: newSections
    });
  };

  // セクションの順序を変更する（アップ・ダウンボタン用）
  const changeOrder = (sectionId: string, direction: 'up' | 'down') => {
    const sortedSections = [...settings.sections].sort((a, b) => a.order - b.order);
    const sectionIndex = sortedSections.findIndex(s => s.id === sectionId);
    
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
  const handleDragEnd = (result: any) => {
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
    
    // 設定を更新
    handleSettingsChange({
      ...settings,
      sections: updatedSections
    });
    
    console.log('セクション順序を更新しました:', {
      from: source.index + 1,
      to: destination.index + 1,
      section: movedItem.title
    });
  };

  // セクション設定を更新する
  const updateSectionSettings = (sectionId: string, newSettings: any) => {
    const newSections = settings.sections.map(section => {
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
      sections: newSections
    });
  };

  // グローバル設定を更新する
  const updateGlobalSettings = (newGlobalSettings: any) => {
    handleSettingsChange({
      ...settings,
      globalSettings: {
        ...settings.globalSettings,
        ...newGlobalSettings
      }
    });
  };

  // プレビューを更新する
  const updatePreview = (newSettings: DesignSettings) => {
    // iframeにpostMessageを使って設定を送信
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_DESIGN',
        settings: newSettings
      }, '*');

      // リアルタイムプレビューのログ
      console.log('リアルタイムプレビュー更新:', { 
        time: new Date().toISOString(),
        sections: newSettings.sections.length
      });
    }
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
              
              {settings.sections
                .sort((a, b) => a.order - b.order)
                .map(section => (
                  <Card 
                    key={section.id} 
                    className={`overflow-hidden ${activeSection === section.id ? 'ring-2 ring-primary' : ''}`}
                  >
                    <CardContent className="p-0">
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50"
                        onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                      >
                        <div className="flex items-center">
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
                      )}
                    </CardContent>
                  </Card>
                ))}
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
                その他の設定を変更できます。
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="enable-animations" />
                  <Label htmlFor="enable-animations">アニメーション効果を有効にする</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="enable-hover-effects" />
                  <Label htmlFor="enable-hover-effects">ホバーエフェクトを有効にする</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="enable-sticky-header" />
                  <Label htmlFor="enable-sticky-header">ヘッダーを固定表示する</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="enable-smooth-scroll" />
                  <Label htmlFor="enable-smooth-scroll">スムーススクロールを有効にする</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="header-style">ヘッダースタイル</Label>
                  <select
                    id="header-style"
                    className="w-full border rounded px-3 py-2"
                    defaultValue="standard"
                  >
                    <option value="standard">標準</option>
                    <option value="minimal">シンプル</option>
                    <option value="centered">中央寄せ</option>
                    <option value="split">分割</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="footer-style">フッタースタイル</Label>
                  <select
                    id="footer-style"
                    className="w-full border rounded px-3 py-2"
                    defaultValue="standard"
                  >
                    <option value="standard">標準</option>
                    <option value="minimal">シンプル</option>
                    <option value="dark">ダーク</option>
                    <option value="centered">中央寄せ</option>
                  </select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* プレビュー領域 */}
        <div className="flex-1 bg-muted p-6 flex justify-center overflow-auto">
          <div 
            className={`
              bg-white rounded-md shadow-md flex justify-center 
              ${deviceView === 'pc' ? 'w-full h-full' : 'w-[375px] h-[667px]'}
            `}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">読み込み中...</span>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src="/store/preview"
                title="プレビュー"
                className="w-full h-full border-0"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}