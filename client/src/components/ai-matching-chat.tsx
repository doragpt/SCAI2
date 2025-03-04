import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { workTypes, prefectures } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WorkingConditions = {
  workPeriodStart?: string;
  workPeriodEnd?: string;
  canArrivePreviousDay?: boolean;
  desiredGuarantee?: number;
  desiredRate?: number;
  waitingHours?: number;
  departureLocation?: string;
  returnLocation?: string;
  preferredLocations: string[];
  ngLocations: string[];
  notes?: string;
  interviewDates?: string[];
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
  });
  const [showForm, setShowForm] = useState(false);

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
                <Label>希望保証（万円）</Label>
                <Input
                  type="number"
                  placeholder="希望無しの場合は空欄"
                  onChange={(e) => setConditions({
                    ...conditions,
                    desiredGuarantee: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>希望単価（万円）</Label>
                <Input
                  type="number"
                  placeholder="希望無しの場合は空欄"
                  onChange={(e) => setConditions({
                    ...conditions,
                    desiredRate: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
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
                  <Label>希望単価（万円）</Label>
                  <Input
                    type="number"
                    placeholder="希望無しの場合は空欄"
                    onChange={(e) => setConditions({
                      ...conditions,
                      desiredRate: e.target.value ? Number(e.target.value) : undefined
                    })}
                  />
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