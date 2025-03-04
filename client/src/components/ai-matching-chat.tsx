import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { workTypes } from "@shared/schema";

export const AIMatchingChat = () => {
  const [messages, setMessages] = useState<Array<{ type: 'ai' | 'user', content: string }>>([
    {
      type: 'ai',
      content: 'SCAIマッチングへようこそ！\nここではあなたの希望にそって最適な提案をします。\nまずは出稼ぎをお探しか、在籍をお探しかをお聞かせください！'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

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
    }, 1000);
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

      {/* ローディング表示 */}
      {isLoading && (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  );
};