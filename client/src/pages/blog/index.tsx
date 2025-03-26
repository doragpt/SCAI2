import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Link, useLocation } from 'wouter';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Loader2, CalendarIcon, StoreIcon, EyeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { blogKeys } from '@/constants/queryKeys';

// ブログ記事の型定義
interface BlogPost {
  id: number;
  store_id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  status: 'published'; // 公開ページなので常にpublished
  published_at: string;
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
  storeName?: string;
  pagination: PaginationData;
}

const PublicBlogListPage = () => {
  const { toast } = useToast();
  const [location] = useLocation();
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  // URLからstore_idを取得
  const params = new URLSearchParams(location.split('?')[1]);
  const storeId = params.get('store_id');

  // ブログ記事の取得
  const { data, isLoading, isError } = useQuery<BlogListResponse>({
    queryKey: [...blogKeys.publicList, storeId, page, pageSize],
    queryFn: async () => {
      let url = `/api/blog/public?page=${page}&pageSize=${pageSize}`;
      if (storeId) {
        url += `&storeId=${storeId}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
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

  // ページネーションの表示処理
  const renderPagination = (pagination: PaginationData) => {
    const { currentPage, totalPages } = pagination;
    if (totalPages <= 1) return null;

    const handlePageChange = (page: number) => {
      setPage(page);
    };

    return (
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className="mt-6"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {data?.storeName ? `${data.storeName}のブログ記事` : 'ブログ一覧'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {data?.storeName 
            ? `${data.storeName}の最新情報や店舗の様子をご覧いただけます` 
            : '店舗からの最新情報や各店舗の様子をご覧いただけます'}
        </p>
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
              <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium">記事がありません</h2>
              <p className="text-muted-foreground mt-2">
                {data?.storeName 
                  ? `${data.storeName}はまだ記事を公開していません` 
                  : 'まだブログ記事が公開されていません'}
              </p>
              <Link href="/jobs">
                <Button className="mt-4">
                  求人情報を見る
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.posts.map((post) => (
                  <Card key={post.id} className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative w-full h-48 overflow-hidden">
                      {post.thumbnail ? (
                        <img 
                          src={post.thumbnail} 
                          alt={post.title} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-muted">
                          <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <CardHeader className="flex-grow">
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                      <CardDescription className="mt-2 flex items-center text-xs">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {format(new Date(post.published_at), 'yyyy年MM月dd日', { locale: ja })}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-grow-0">
                      <div className="line-clamp-3 text-sm text-muted-foreground">
                        {post.content.replace(/<[^>]*>/g, '')}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="mt-auto pt-2 flex justify-between items-center">
                      {!storeId && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/blog?store_id=${post.store_id}`}>
                            <StoreIcon className="h-4 w-4 mr-1" />
                            店舗ブログ
                          </Link>
                        </Button>
                      )}
                      <Button size="sm" className="ml-auto" asChild>
                        <Link href={`/blog/${post.id}`}>
                          <EyeIcon className="h-4 w-4 mr-1" />
                          詳細を見る
                        </Link>
                      </Button>
                    </CardFooter>
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

export default PublicBlogListPage;