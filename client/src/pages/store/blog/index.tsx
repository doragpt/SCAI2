import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { type BlogPost } from "@shared/schema";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Eye,
  FileEdit,
  FilePlus,
  MoreVertical,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Search,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// ブログ記事のステータスに応じたバッジの表示
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "published":
      return (
        <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3" />
          公開中
        </Badge>
      );
    case "scheduled":
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          予約投稿
        </Badge>
      );
    case "draft":
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <FileEdit className="h-3 w-3" />
          下書き
        </Badge>
      );
  }
};

export default function BlogManagement() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const { toast } = useToast();

  // 記事一覧の取得
  const {
    data,
    isLoading,
    refetch,
    error
  } = useQuery<{
    posts: BlogPost[];
    pagination: { currentPage: number; totalPages: number; totalItems: number };
  }>({
    queryKey: ["blog-management", page, status, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (page > 1) params.append("page", page.toString());
      if (status) params.append("status", status);
      if (search) params.append("search", search);

      console.log("Fetching blog posts with params:", params.toString());
      
      // API呼び出しとレスポンスの処理
      const response = await fetch(`/api/blog/store-posts?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('ブログ記事一覧の取得に失敗しました');
      }
      
      const result = await response.json();
      console.log("Blog posts API response:", result);
      return result;
    },
    enabled: !!user && user.role === "store",
  });

  // 記事の削除
  const handleDeletePost = async () => {
    if (!deletePostId) return;
    
    try {
      await apiRequest("DELETE", `/api/blog/${deletePostId}`);
      toast({
        title: "記事を削除しました",
        description: "ブログ記事が正常に削除されました",
      });
      refetch();
    } catch (error) {
      console.error("記事削除エラー:", error);
      toast({
        title: "削除エラー",
        description: "記事の削除中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setDeletePostId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 店舗ユーザー以外はダッシュボードにリダイレクト
  if (!user || user.role !== "store") {
    setLocation("/store/dashboard");
    return null;
  }

  // デバッグ情報の表示
  console.log("Query data:", data);
  console.log("Query error:", error);

  const posts = data?.posts || [];
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 };
  
  // デバッグ用に実際の表示データを確認
  console.log("Displaying posts:", posts);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">ブログ管理</CardTitle>
              <CardDescription>
                店舗情報やイベント告知などを投稿しましょう
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/store/blog/new">
                <FilePlus className="h-4 w-4 mr-2" />
                新規作成
              </Link>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* フィルターとサーチバー */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="flex items-center relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="記事タイトルで検索"
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={status || ""}
                  onValueChange={(value) => setStatus(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="すべてのステータス" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべてのステータス</SelectItem>
                    <SelectItem value="published">公開中</SelectItem>
                    <SelectItem value="scheduled">予約投稿</SelectItem>
                    <SelectItem value="draft">下書き</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatus(null);
                setPage(1);
              }}
            >
              フィルターをリセット
            </Button>
          </div>

          {/* 記事一覧テーブル */}
          {posts.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[350px]">タイトル</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="hidden md:table-cell">作成日</TableHead>
                    <TableHead className="hidden md:table-cell">公開日</TableHead>
                    <TableHead className="w-[100px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="truncate">{post.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={post.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(post.created_at || new Date()), "yyyy/MM/dd", { locale: ja })}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {post.published_at
                          ? format(new Date(post.published_at), "yyyy/MM/dd", { locale: ja })
                          : post.scheduled_at
                          ? `${format(new Date(post.scheduled_at), "yyyy/MM/dd", { locale: ja })} (予定)`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setLocation(`/store/blog/edit/${post.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              編集
                            </DropdownMenuItem>
                            
                            {post.status === "published" && (
                              <DropdownMenuItem
                                onClick={() => window.open(`/blog/${post.id}`, "_blank")}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                閲覧
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeletePostId(post.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">ブログ記事がありません</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {search || status
                  ? "検索条件に一致する記事がありません。条件を変更してお試しください。"
                  : "まだブログ記事が投稿されていません。「新規作成」から記事を追加しましょう。"}
              </p>
              {(search || status) && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearch("");
                    setStatus(null);
                  }}
                >
                  フィルターをリセット
                </Button>
              )}
            </div>
          )}
        </CardContent>

        {posts.length > 0 && pagination.totalPages > 1 && (
          <CardFooter>
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </CardFooter>
        )}
      </Card>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ブログ記事の削除</AlertDialogTitle>
            <AlertDialogDescription>
              本当にこの記事を削除しますか？この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}