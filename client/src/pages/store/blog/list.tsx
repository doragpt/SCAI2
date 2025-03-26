import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Loader2, CalendarIcon, FileTextIcon, PlusCircleIcon, EditIcon, Newspaper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { blogKeys } from '@/constants/queryKeys';

// ブログ記事の型定義
interface BlogPost {
  id: number;
  store_id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  status: 'draft' | 'published' | 'scheduled';
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface BlogListResponse {
  posts: BlogPost[];
  pagination: PaginationData;
}

const BlogListPage = () => {
  const { toast } = useToast();
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  // ブログ記事の取得
  const { data, isLoading, isError } = useQuery<BlogListResponse>({
    queryKey: [...blogKeys.list, page, pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/blog?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('ブログ記事の取得に失敗しました');
      }
      return response.json();
    }
  });

  // エラー時の処理
  React.useEffect(() => {
    if (isError) {
      toast({
        title: 'エラー',
        description: 'ブログ記事の取得に失敗しました。再度お試しください。',
        variant: 'destructive',
      });
    }
  }, [isError, toast]);

  // ステータスに応じたバッジの表示
  const getStatusBadge = (status: string, scheduledAt: string | null) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500">公開中</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">
          {scheduledAt ? `${format(new Date(scheduledAt), 'yyyy/MM/dd HH:mm')}に公開予定` : '公開予定'}
        </Badge>;
      case 'draft':
        return <Badge variant="outline" className="border-gray-500 text-gray-500">下書き</Badge>;
      default:
        return null;
    }
  };

  // ページネーションの表示処理
  const renderPagination = (pagination: PaginationData) => {
    const { currentPage, totalPages } = pagination;
    if (totalPages <= 1) return null;

    const pageItems = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageItems.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={i === currentPage}
            onClick={() => setPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          {pageItems}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ブログ一覧</h1>
          <p className="text-muted-foreground mt-2">
            店舗のブログ記事を管理します
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/store/blog">
            <Button variant="outline">
              <Newspaper className="mr-2 h-4 w-4" />
              ブログ管理
            </Button>
          </Link>
          <Link href="/store/blog/new">
            <Button>
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </Link>
        </div>
      </div>
      
      <Separator />
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {data?.posts?.length === 0 ? (
            <div className="text-center py-10">
              <FileTextIcon className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium">記事がありません</h2>
              <p className="text-muted-foreground mt-2">
                最初のブログ記事を作成しましょう
              </p>
              <Link href="/store/blog/new">
                <Button className="mt-4">
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  記事を作成
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {data?.posts.map((post) => (
                  <Card key={post.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {post.thumbnail && (
                        <div className="w-full md:w-40 h-40 flex-shrink-0 overflow-hidden">
                          <img 
                            src={post.thumbnail} 
                            alt={post.title} 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                      )}
                      <div className="flex-1 p-0">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                              <CardDescription className="mt-2 flex items-center text-xs">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {post.published_at 
                                  ? `公開: ${format(new Date(post.published_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}`
                                  : `作成: ${format(new Date(post.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}`
                                }
                              </CardDescription>
                            </div>
                            <div>
                              {getStatusBadge(post.status, post.scheduled_at)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="line-clamp-2 text-sm text-muted-foreground">
                            {post.content.replace(/<[^>]*>/g, '')}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <div className="text-xs text-muted-foreground">
                            更新: {format(new Date(post.updated_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                          </div>
                          <div className="flex space-x-2">
                            <Link href={`/blog/${post.id}`}>
                              <Button variant="ghost" size="sm">
                                閲覧
                              </Button>
                            </Link>
                            <Link href={`/store/blog/edit/${post.id}`}>
                              <Button variant="outline" size="sm">
                                <EditIcon className="h-4 w-4 mr-1" />
                                編集
                              </Button>
                            </Link>
                          </div>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {data?.pagination && renderPagination(data.pagination)}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogListPage;