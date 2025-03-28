import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Trash, Plus, Check, Pencil, MoveVertical, Flag, Star, Award, Gift, Ticket, Zap, DollarSign, Banknote, Home, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SpecialOffer } from "@shared/schema";

// 利用可能なアイコンのリスト
const AVAILABLE_ICONS = [
  { name: "Award", component: Award },
  { name: "Star", component: Star },
  { name: "Gift", component: Gift },
  { name: "Ticket", component: Ticket },
  { name: "Zap", component: Zap },
  { name: "DollarSign", component: DollarSign },
  { name: "Banknote", component: Banknote },
  { name: "Home", component: Home },
  { name: "Car", component: Car },
  { name: "Flag", component: Flag },
];

// 利用可能な色のリスト
const COLOR_PRESETS = [
  { name: "ピンク", bg: "from-pink-100 to-pink-200", text: "text-pink-700", primary: "pink", border: "border-pink-300" },
  { name: "パープル", bg: "from-purple-100 to-purple-200", text: "text-purple-700", primary: "purple", border: "border-purple-300" },
  { name: "ブルー", bg: "from-blue-100 to-blue-200", text: "text-blue-700", primary: "blue", border: "border-blue-300" },
  { name: "ティール", bg: "from-teal-100 to-teal-200", text: "text-teal-700", primary: "teal", border: "border-teal-300" },
  { name: "グリーン", bg: "from-green-100 to-green-200", text: "text-green-700", primary: "green", border: "border-green-300" },
  { name: "イエロー", bg: "from-amber-100 to-amber-200", text: "text-amber-700", primary: "amber", border: "border-amber-300" },
  { name: "オレンジ", bg: "from-orange-100 to-orange-200", text: "text-orange-700", primary: "orange", border: "border-orange-300" },
  { name: "レッド", bg: "from-red-100 to-red-200", text: "text-red-700", primary: "red", border: "border-red-300" },
  { name: "グレー", bg: "from-gray-100 to-gray-200", text: "text-gray-700", primary: "gray", border: "border-gray-300" },
];

// テンプレート特典
const OFFER_TEMPLATES = [
  { 
    title: "入店祝い金", 
    description: "入店後1週間以内に全額支給", 
    icon: "Gift", 
    backgroundColor: "from-pink-100 to-pink-200",
    textColor: "text-pink-700" 
  },
  { 
    title: "面接交通費", 
    description: "面接時に全額支給", 
    icon: "Car", 
    backgroundColor: "from-amber-100 to-amber-200",
    textColor: "text-amber-700" 
  },
  { 
    title: "アリバイ対策", 
    description: "徹底したプライバシー保護", 
    icon: "Flag", 
    backgroundColor: "from-blue-100 to-blue-200",
    textColor: "text-blue-700" 
  },
  { 
    title: "罰金・ノルマなし", 
    description: "無理なく働ける環境", 
    icon: "Check", 
    backgroundColor: "from-green-100 to-green-200",
    textColor: "text-green-700" 
  },
  { 
    title: "自由出勤", 
    description: "あなたのペースで働けます", 
    icon: "Zap", 
    backgroundColor: "from-purple-100 to-purple-200",
    textColor: "text-purple-700" 
  },
];

interface SpecialOfferEditorProps {
  value: string | SpecialOffer[];
  onChange: (value: string) => void;
}

export function SpecialOfferEditor({ value = "[]", onChange }: SpecialOfferEditorProps) {
  // 文字列形式のデータを配列に変換して状態管理
  const [fields, setFields] = useState<SpecialOffer[]>(() => {
    try {
      // valueが文字列の場合はJSONとしてパース
      if (typeof value === 'string') {
        return JSON.parse(value) || [];
      }
      // valueが配列の場合はそのまま使用
      return Array.isArray(value) ? value : [];
    } catch (e) {
      console.error("Invalid special_offers value format:", e);
      return [];
    }
  });
  
  // 値の変更をトラッキングし親コンポーネントに通知
  useEffect(() => {
    try {
      // valueが文字列の場合はJSONとしてパース
      if (typeof value === 'string') {
        setFields(JSON.parse(value) || []);
      } 
      // valueが配列の場合はそのまま使用
      else if (Array.isArray(value)) {
        setFields(value);
      }
    } catch (e) {
      console.error("Error parsing special_offers in useEffect:", e);
      setFields([]);
    }
  }, [value]);
  
  // 値が変更されたときに親コンポーネントに通知（文字列に変換）
  const updateFields = (newFields: SpecialOffer[]) => {
    setFields(newFields);
    try {
      const jsonString = JSON.stringify(newFields);
      onChange(jsonString);
    } catch (e) {
      console.error("Error stringifying special_offers:", e);
      onChange("[]");
    }
  };
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  
  // 新規追加
  const handleAddOffer = () => {
    setEditingOffer({
      id: uuidv4(),
      title: "",
      description: "",
      type: "特別オファー",
      icon: "Award",
      backgroundColor: "from-purple-100 to-purple-200",
      textColor: "text-purple-700",
      order: fields.length,
      targetAudience: [],
      isActive: true,
      isLimited: false
    });
    setEditIndex(null);
    setIsOpen(true);
  };
  
  // 編集
  const handleEditOffer = (offer: SpecialOffer, index: number) => {
    setEditingOffer(JSON.parse(JSON.stringify(offer)));
    setEditIndex(index);
    setIsOpen(true);
  };
  
  // テンプレートから追加
  const handleAddTemplate = (template: typeof OFFER_TEMPLATES[0]) => {
    const newOffer = {
      id: uuidv4(),
      title: template.title,
      description: template.description,
      type: "特別オファー", // 必須フィールド
      icon: template.icon,
      backgroundColor: template.backgroundColor,
      textColor: template.textColor,
      order: fields.length,
      targetAudience: [], // 空配列として追加
      isActive: true,
      isLimited: false
    };
    const newFields = [...fields, newOffer];
    updateFields(newFields);
  };
  
  // 保存
  const handleSaveOffer = () => {
    if (!editingOffer) return;
    
    let newFields = [...fields];
    
    if (editIndex !== null && editIndex >= 0 && editIndex < fields.length) {
      // 既存オファーを更新
      newFields[editIndex] = {...editingOffer};
    } else {
      // 新規オファーを追加
      newFields = [...newFields, {...editingOffer}];
    }
    
    updateFields(newFields);
    
    // ダイアログを閉じてフォーム状態をリセット
    setIsOpen(false);
    setEditingOffer(null);
    setEditIndex(null);
  };
  
  // 削除
  const handleRemove = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    updateFields(newFields);
  };
  
  // 並び替え
  const handleMoveOffer = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < fields.length) {
      const newFields = [...fields];
      const temp = newFields[index];
      newFields[index] = newFields[newIndex];
      newFields[newIndex] = temp;
      updateFields(newFields);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">特別オファー</h3>
        <Button 
          size="sm" 
          type="button" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAddOffer();
          }} 
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-1" /> 新規追加
        </Button>
      </div>
      
      {/* テンプレート */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
        <h4 className="text-sm font-medium mb-2">テンプレートから追加</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {OFFER_TEMPLATES.map((template, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              className="justify-start h-auto py-2 px-3"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddTemplate(template);
              }}
            >
              {AVAILABLE_ICONS.find(icon => icon.name === template.icon)?.component && (
                <span className={`mr-2 ${template.textColor}`}>
                  {React.createElement(
                    AVAILABLE_ICONS.find(icon => icon.name === template.icon)?.component || Award,
                    { className: "h-4 w-4" }
                  )}
                </span>
              )}
              <span className="truncate">{template.title}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* 特別オファープレビュー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.length > 0 ? (
          fields.map((offer, index) => (
            <div key={offer.id} className="relative group">
              <div className={`flex flex-col p-4 rounded-md bg-gradient-to-br ${offer.backgroundColor} border ${COLOR_PRESETS.find(c => c.bg === offer.backgroundColor)?.border || 'border-gray-200'} shadow-sm`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 bg-white/50 rounded-full ${offer.textColor}`}>
                    {AVAILABLE_ICONS.find(icon => icon.name === offer.icon)?.component && (
                      React.createElement(
                        AVAILABLE_ICONS.find(icon => icon.name === offer.icon)?.component || Award,
                        { className: "h-4 w-4" }
                      )
                    )}
                  </div>
                  <h5 className={`font-bold ${offer.textColor} text-sm`}>{offer.title}</h5>
                </div>
                <p className={`text-xs ${offer.textColor}`}>{offer.description}</p>
              </div>
              
              {/* 操作ボタン */}
              <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEditOffer(offer, index);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                >
                  <Trash className="h-3 w-3" />
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMoveOffer(index, 'up');
                  }}
                  disabled={index === 0}
                >
                  <MoveVertical className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-sm text-gray-500">特別オファーが設定されていません。「新規追加」ボタンをクリックするか、テンプレートから追加してください。</p>
          </div>
        )}
      </div>
      
      {/* 編集ダイアログ */}
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          // ダイアログが閉じられる時だけ状態をリセット
          if (!open) {
            setIsOpen(false);
            setEditingOffer(null);
            setEditIndex(null);
          } else {
            setIsOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? '特別オファーを編集' : '新規特別オファー'}</DialogTitle>
            <DialogDescription>
              求職者に対してアピールしたい特別な待遇や条件を設定します。
            </DialogDescription>
          </DialogHeader>
          
          {editingOffer && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">タイトル</Label>
                  <Input
                    id="title"
                    value={editingOffer.title}
                    onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })}
                    placeholder="最低保証"
                    maxLength={20}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={editingOffer.description}
                    onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                    placeholder="1日最低3万円保証"
                    rows={2}
                    maxLength={50}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">アイコン</Label>
                    <Select
                      value={editingOffer.icon}
                      onValueChange={(value) => setEditingOffer({ ...editingOffer, icon: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="アイコンを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ICONS.map((icon) => (
                          <SelectItem key={icon.name} value={icon.name} className="flex items-center">
                            <span className="mr-2">
                              {React.createElement(icon.component, { className: "h-4 w-4 inline mr-2" })}
                            </span>
                            {icon.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="color">カラー</Label>
                    <Select
                      value={editingOffer.backgroundColor}
                      onValueChange={(value) => {
                        const colorPreset = COLOR_PRESETS.find(c => c.bg === value);
                        setEditingOffer({ 
                          ...editingOffer, 
                          backgroundColor: value,
                          textColor: colorPreset?.text || 'text-gray-700'
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="色を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_PRESETS.map((color) => (
                          <SelectItem key={color.name} value={color.bg}>
                            <div className="flex items-center">
                              <span className={`w-6 h-6 rounded mr-2 inline-block bg-gradient-to-br ${color.bg}`}></span>
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* プレビュー */}
                <div className="mt-4">
                  <Label>プレビュー</Label>
                  <div className={`flex flex-col p-4 rounded-md bg-gradient-to-br ${editingOffer.backgroundColor} border ${COLOR_PRESETS.find(c => c.bg === editingOffer.backgroundColor)?.border || 'border-gray-200'} mt-2`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 bg-white/50 rounded-full ${editingOffer.textColor}`}>
                        {AVAILABLE_ICONS.find(icon => icon.name === editingOffer.icon)?.component && (
                          React.createElement(
                            AVAILABLE_ICONS.find(icon => icon.name === editingOffer.icon)?.component || Award,
                            { className: "h-4 w-4" }
                          )
                        )}
                      </div>
                      <h5 className={`font-bold ${editingOffer.textColor} text-sm`}>{editingOffer.title || 'タイトル'}</h5>
                    </div>
                    <p className={`text-xs ${editingOffer.textColor}`}>{editingOffer.description || '説明文'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                setEditingOffer(null);
                setEditIndex(null);
              }}
            >
              キャンセル
            </Button>
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSaveOffer();
              }}
              disabled={!editingOffer?.title}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}