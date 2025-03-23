import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Edit, PenTool, Info } from "lucide-react";

/**
 * CKEditorナビゲーションコンポーネント
 * CKEditorを使用した編集画面へのリンクを表示します
 */
export function CKEditorNavigation() {
  return (
    <Card className="mb-6">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center text-blue-800">
          <Info className="mr-2 h-5 w-5" />
          CKEditorを使用した新しいエディター
        </CardTitle>
        <CardDescription className="text-blue-600">
          より安定したブログ編集機能を試してみましょう
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="mb-4">
          CKEditorを使用した新しいブログエディターでは、以下の機能が改善されています：
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>画像のサイズ変更が安定して動作</li>
          <li>ドラッグ＆ドロップでの画像挿入をサポート</li>
          <li>テーブルや整形されたリストなどの高度な機能</li>
          <li>日本語に最適化されたツールバー</li>
        </ul>
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-4">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-600 mr-2 h-5 w-5 mt-0.5" />
            <p className="text-yellow-800 text-sm">
              このエディターは実験的なものです。問題が発生した場合は、従来のエディターを使用してください。
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Link href="/store/blog/new-ck">
          <Button className="w-full sm:w-auto" variant="default">
            <PenTool className="mr-2 h-4 w-4" />
            CKEditorで新規作成
          </Button>
        </Link>
        {/* 現在編集中の記事がある場合、その記事IDを使用するリンクが別途必要 */}
        <Button variant="outline" onClick={() => window.history.back()}>
          従来のエディターを使用
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * 既存の記事をCKEditorで編集するためのリンクボタン
 */
export function CKEditorEditButton({ postId }: { postId: number }) {
  return (
    <Link href={`/store/blog/edit-ck/${postId}`}>
      <Button variant="outline" size="sm" className="ml-2">
        <Edit className="mr-2 h-4 w-4" />
        CKEditorで編集
      </Button>
    </Link>
  );
}