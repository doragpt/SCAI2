import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, PenTool, Info } from "lucide-react";

/**
 * ブログエディターのヘルプ情報を表示するコンポーネント
 */
export function CKEditorNavigation() {
  return (
    <Card className="mb-6">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center text-blue-800">
          <Info className="mr-2 h-5 w-5" />
          ブログエディターについて
        </CardTitle>
        <CardDescription className="text-blue-600">
          ブログ記事を簡単に作成・編集できます
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="mb-4">
          当サイトのブログエディターには以下の機能があります：
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>画像のサイズ変更と位置調整</li>
          <li>ファイル選択ボタンからの画像アップロード</li>
          <li>テーブルや整形されたリストなどの高度な機能</li>
          <li>日本語に最適化されたツールバー</li>
        </ul>
        <div className="bg-green-50 p-3 rounded border border-green-200 mb-4">
          <div className="flex items-start">
            <Info className="text-green-600 mr-2 h-5 w-5 mt-0.5" />
            <p className="text-green-800 text-sm">
              画像はツールバーの「画像を挿入」ボタンをクリックしてアップロードできます。挿入後、画像をクリックして選択するとサイズ変更ハンドルが表示されます。ツールバーの位置調整ボタンで画像の配置を変更できます。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 記事を編集するためのリンクボタン
 */
export function CKEditorEditButton({ postId }: { postId: number }) {
  return (
    <Link href={`/store/blog/edit-ck/${postId}`}>
      <Button variant="outline" size="sm" className="ml-2">
        <Edit className="mr-2 h-4 w-4" />
        記事を編集
      </Button>
    </Link>
  );
}