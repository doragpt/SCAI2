import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { workTypes, prefectures } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 定数定義
const GUARANTEE_OPTIONS = [
  { value: "none", label: "希望無し" },
  { value: "1", label: "保証1万" },
  { value: "2", label: "保証2万" },
  { value: "3", label: "保証3万" },
  { value: "4", label: "保証4万" },
  { value: "5", label: "保証5万" },
  { value: "6", label: "保証6万" },
  { value: "7", label: "保証7万" },
  { value: "8", label: "保証8万" },
  { value: "9", label: "保証9万" },
  { value: "10", label: "保証10万以上" },
];

const TIME_OPTIONS = [
  { value: "none", label: "希望無し" },
  { value: "30", label: "30分" },
  { value: "40", label: "40分" },
  { value: "50", label: "50分" },
  { value: "60", label: "60分" },
  { value: "70", label: "70分" },
  { value: "80", label: "80分" },
  { value: "90", label: "90分" },
  { value: "100", label: "100分" },
  { value: "110", label: "110分" },
  { value: "120", label: "120分" },
];

const RATE_OPTIONS = [
  { value: "none", label: "希望無し" },
  { value: "3000", label: "3,000円" },
  { value: "5000", label: "5,000円" },
  { value: "8000", label: "8,000円" },
  { value: "10000", label: "10,000円" },
  { value: "12000", label: "12,000円" },
  { value: "15000", label: "15,000円" },
  { value: "18000", label: "18,000円" },
  { value: "20000", label: "20,000円" },
  { value: "25000", label: "25,000円" },
  { value: "30000", label: "30,000円以上" },
];

const WORK_TYPES = [
  { id: "store-health", label: "店舗型ヘルス" },
  { id: "hotel-health", label: "ホテルヘルス" },
  { id: "delivery-health", label: "デリバリーヘルス" },
  { id: "esthe", label: "風俗エステ" },
  { id: "mseikan", label: "M性感" },
  { id: "onakura", label: "オナクラ" },
] as const;

type WorkingConditions = {
  workPeriodStart?: string;
  workPeriodEnd?: string;
  canArrivePreviousDay?: boolean;
  desiredGuarantee?: string;
  desiredTime?: string;
  desiredRate?: string;
  waitingHours?: number;
  departureLocation?: string;
  returnLocation?: string;
  preferredLocations: string[];
  ngLocations: string[];
  notes?: string;
  interviewDates?: string[];
  workTypes: string[];
};

export const AIMatchingChat = () => {
  const [messages, setMessages] = useState<Array<{ type: 'ai' | 'user', content: string }>>([
    {
      type: 'ai',
      content: 'SCAIマッチングへようこそ！\nここではあなたの希望にそって最適な提案をします。\nまずは出稼ぎをお探しか、在籍をお探しかをお聞かせください！'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [conditions, setConditions] = useState<WorkingConditions>({
    preferredLocations: [],
    ngLocations: [],
    workTypes: [],
  });
  const [showForm, setShowForm] = useState(false);

  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
      setSelectedType(null);
      setConditions({
        preferredLocations: [],
        ngLocations: [],
        workTypes: [],
      });
      setMessages([messages[0]]);
    }
  };

  const handleWorkTypeSelect = async (type: string) => {
    setIsLoading(true);
    setSelectedType(type);

    // ユーザーの選択を表示
    setMessages(prev => [...prev, {
      type: 'user',
      content: type === '出稼ぎ' ? '出稼ぎを希望します' : '在籍を希望します'
    }]);

    // AIの応答を追加
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: `${type}のお探しを希望ですね！\nそれではあなたの希望条件を教えてください！`
      }]);
      setIsLoading(false);
      setShowForm(true);
    }, 1000);
  };

  const handleConditionSubmit = () => {
    // バリデーションと送信処理
    console.log('Submitted conditions:', conditions);
    setMessages(prev => [...prev, {
      type: 'ai',
      content: '入力してくれてありがとう！\n今現在のあなたのプロフィールを確認するね！'
    }]);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* メッセージ表示エリア */}
      <div className="space-y-4">
        {messages.map((message, index) => (
          <Card
            key={index}
            className={`p-4 ${
              message.type === 'ai'
                ? 'bg-primary/10'
                : 'bg-background ml-8'
            }`}
          >
            <p className="whitespace-pre-line">{message.content}</p>
          </Card>
        ))}
      </div>

      {/* 選択ボタン */}
      {!selectedType && !isLoading && (
        <div className="flex gap-4 justify-center">
          {workTypes.map((type) => (
            <Button
              key={type}
              onClick={() => handleWorkTypeSelect(type)}
              className="min-w-[120px]"
            >
              {type}
            </Button>
          ))}
        </div>
      )}

      {/* 条件入力フォーム */}
      {showForm && selectedType && (
        <Card className="p-6 space-y-6">
          {/* 戻るボタン */}
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>選択しなおす</span>
            </Button>
          </div>

          {/* 業種選択 */}
          <div className="space-y-2">
            <Label>希望業種（複数選択可）</Label>
            <div className="grid grid-cols-2 gap-4">
              {WORK_TYPES.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={conditions.workTypes.includes(type.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setConditions({
                          ...conditions,
                          workTypes: [...conditions.workTypes, type.id]
                        });
                      } else {
                        setConditions({
                          ...conditions,
                          workTypes: conditions.workTypes.filter(t => t !== type.id)
                        });
                      }
                    }}
                  />
                  <Label htmlFor={type.id}>{type.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {selectedType === '出稼ぎ' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>勤務開始日</Label>
                  <Input
                    type="date"
                    onChange={(e) => setConditions({
                      ...conditions,
                      workPeriodStart: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>勤務終了日</Label>
                  <Input
                    type="date"
                    onChange={(e) => setConditions({
                      ...conditions,
                      workPeriodEnd: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="previous-day"
                  onCheckedChange={(checked) => setConditions({
                    ...conditions,
                    canArrivePreviousDay: checked
                  })}
                />
                <Label htmlFor="previous-day">前日入りの可否</Label>
              </div>

              <div className="space-y-2">
                <Label>希望保証</Label>
                <Select
                  onValueChange={(value) => setConditions({
                    ...conditions,
                    desiredGuarantee: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="希望保証を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {GUARANTEE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>希望単価</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    onValueChange={(value) => setConditions({
                      ...conditions,
                      desiredTime: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="時間を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(value) => setConditions({
                      ...conditions,
                      desiredRate: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="金額を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {RATE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>待機時間（時間）</Label>
                <Input
                  type="number"
                  placeholder="12時間以上が保証条件となる場合が多いです"
                  onChange={(e) => setConditions({
                    ...conditions,
                    waitingHours: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>出発地</Label>
                  <Select
                    onValueChange={(value) => setConditions({
                      ...conditions,
                      departureLocation: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="都道府県を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {prefectures.map((pref) => (
                        <SelectItem key={pref} value={pref}>
                          {pref}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>帰宅地</Label>
                  <Select
                    onValueChange={(value) => setConditions({
                      ...conditions,
                      returnLocation: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="都道府県を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {prefectures.map((pref) => (
                        <SelectItem key={pref} value={pref}>
                          {pref}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>希望地域</Label>
                <Select
                  onValueChange={(value) => setConditions({
                    ...conditions,
                    preferredLocations: [...conditions.preferredLocations, value]
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="都道府県を選択（複数選択可）" />
                  </SelectTrigger>
                  <SelectContent>
                    {prefectures.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {conditions.preferredLocations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {conditions.preferredLocations.map((loc) => (
                      <Button
                        key={loc}
                        variant="secondary"
                        size="sm"
                        onClick={() => setConditions({
                          ...conditions,
                          preferredLocations: conditions.preferredLocations.filter(l => l !== loc)
                        })}
                      >
                        {loc} ×
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>NG地域</Label>
                <Select
                  onValueChange={(value) => setConditions({
                    ...conditions,
                    ngLocations: [...conditions.ngLocations, value]
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="都道府県を選択（複数選択可）" />
                  </SelectTrigger>
                  <SelectContent>
                    {prefectures.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {conditions.ngLocations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {conditions.ngLocations.map((loc) => (
                      <Button
                        key={loc}
                        variant="secondary"
                        size="sm"
                        onClick={() => setConditions({
                          ...conditions,
                          ngLocations: conditions.ngLocations.filter(l => l !== loc)
                        })}
                      >
                        {loc} ×
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>その他備考</Label>
                <Input
                  placeholder="その他の希望条件があればご記入ください"
                  onChange={(e) => setConditions({
                    ...conditions,
                    notes: e.target.value
                  })}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <Label>面接希望日時 {i + 1}</Label>
                    <Input
                      type="datetime-local"
                      onChange={(e) => {
                        const dates = [...(conditions.interviewDates || [])];
                        dates[i] = e.target.value;
                        setConditions({
                          ...conditions,
                          interviewDates: dates
                        });
                      }}
                    />
                  </div>
                ))}

                <div className="space-y-2">
                  <Label>希望単価</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      onValueChange={(value) => setConditions({
                        ...conditions,
                        desiredTime: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="時間を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      onValueChange={(value) => setConditions({
                        ...conditions,
                        desiredRate: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="金額を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {RATE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>希望地域</Label>
                  <Select
                    onValueChange={(value) => setConditions({
                      ...conditions,
                      preferredLocations: [...conditions.preferredLocations, value]
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="都道府県を選択（複数選択可）" />
                    </SelectTrigger>
                    <SelectContent>
                      {prefectures.map((pref) => (
                        <SelectItem key={pref} value={pref}>
                          {pref}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {conditions.preferredLocations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {conditions.preferredLocations.map((loc) => (
                        <Button
                          key={loc}
                          variant="secondary"
                          size="sm"
                          onClick={() => setConditions({
                            ...conditions,
                            preferredLocations: conditions.preferredLocations.filter(l => l !== loc)
                          })}
                        >
                          {loc} ×
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Button
            className="w-full"
            onClick={handleConditionSubmit}
          >
            入力内容を確認する
          </Button>
        </Card>
      )}

      {/* ローディング表示 */}
      {isLoading && (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  );
};