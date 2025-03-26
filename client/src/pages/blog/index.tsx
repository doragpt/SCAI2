import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { BlogPost } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { HtmlContent } from '@/components/html-content';
import { Loader2, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Breadcrumb } from '@/components/breadcrumb';

export default function PublicBlogList() {
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const { id } = useParams<{ id?: string }>();
  const storeId = id ? parseInt(id) : undefined;

  // ブログ投稿の取得クエリ
  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.PUBLIC_BLOG_POSTS, page, pageSize, storeId],
    queryFn: async () => {
      const endpoint = storeId 
        ? `/api/blog/public?storeId=${storeId}&page=${page}&pageSize=${pageSize}`
        : `/api/blog/public?page=${page}&pageSize=${pageSize}`;
      
      const response = await apiRequest<{
        posts: BlogPost[];
        storeName?: string;
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
        }
      }>('GET', endpoint);
      return response;
    }
  });

  // コンテンツの抜粋を作成
  const getExcerpt = (content: string) => {
    // HTMLタグを除去
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">ブログ一覧</h1>
        <div className="p-4 border rounded bg-red-50 text-red-500">
          エラーが発生しました: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Breadcrumb items={[
        { label: 'ホーム', href: '/' },
        { label: storeId ? `${data?.storeName || '店舗'}のブログ` : 'ブログ一覧', href: storeId ? `/blog/store/${storeId}` : '/blog' }
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{storeId ? `${data?.storeName || '店舗'}のブログ` : '新着ブログ記事'}</h1>
        <p className="text-gray-500">お店の最新情報や業界の話題をお届けします</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">読み込み中...</span>
        </div>
      ) : (
        <>
          {data?.posts && data.posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {data.posts.map((post) => (
                <Card key={post.id} className="overflow-hidden flex flex-col h-full">
                  <div className="relative h-48 overflow-hidden">
                    {post.thumbnail ? (
                      <img 
                        src={post.thumbnail} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-2 text-lg font-bold">
                      {post.title}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(post.published_at || post.created_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {getExcerpt(post.content)}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Link href={`/blog/${post.id}`} className="w-full">
                      <Button variant="default" className="w-full">
                        記事を読む
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">まだブログ記事がありません</h3>
              <p className="text-gray-500">まもなく新しい記事が投稿される予定です。また後ほどチェックしてください！</p>
            </div>
          )}

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination
                currentPage={data.pagination.currentPage}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {storeId && (
        <div className="mt-8">
          <Link href={`/jobs/${storeId}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              店舗ページに戻る
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}