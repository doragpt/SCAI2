import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { BlogPost } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { HtmlContent } from '@/components/html-content';
import { Loader2, Plus, ArrowLeft, Edit, Trash } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Breadcrumb } from '@/components/breadcrumb';
import { toast } from '@/hooks/use-toast';

export default function BlogList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ブログ投稿の取得クエリ
  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.BLOG_POSTS, page, pageSize],
    queryFn: async () => {
      const response = await apiRequest<{
        posts: BlogPost[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
        }
      }>('GET', `/api/blog?page=${page}&pageSize=${pageSize}`);
      return response;
    }
  });

  // コンテンツの抜粋を作成（HTMLタグを除去して最初の100文字を表示）
  const getExcerpt = (content: string) => {
    // HTMLタグを除去
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  // エラー発生時
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
    <div className="container mx-auto p-4 max-w-5xl">
      <Breadcrumb items={[
        { label: 'ダッシュボード', href: '/store/dashboard' },
        { label: 'ブログ管理', href: '/store/blog' },
        { label: 'ブログ一覧', href: '/store/blog/list' }
      ]} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">店舗ブログ一覧</h1>
        <Link href="/store/blog/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規記事作成
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">読み込み中...</span>
        </div>
      ) : (
        <>
          {data?.posts && data.posts.length > 0 ? (
            <div className="grid gap-6 mt-6">
              {data.posts.map((post) => (
                <Card key={post.id} className="overflow-hidden border-t-4" style={{ borderTopColor: '#ff4d7d' }}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{post.title}</CardTitle>
                        <CardDescription>
                          公開日: {formatDate(post.published_at || post.created_at)}
                          {post.status === 'scheduled' && post.scheduled_at && 
                            ` (${formatDate(post.scheduled_at)}に公開予定)`}
                          {post.status === 'draft' && ' (下書き)'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/store/blog/edit/${post.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            編集
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      {post.thumbnail && (
                        <img 
                          src={post.thumbnail} 
                          alt={post.title} 
                          className="w-32 h-32 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {getExcerpt(post.content)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Link href={`/blog/${post.id}`}>
                      <Button variant="link" className="text-primary p-0 h-auto">
                        記事を表示
                      </Button>
                    </Link>
                    <div className="text-sm text-gray-500">
                      ID: {post.id}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">まだブログ記事がありません</h3>
              <p className="text-gray-500 mb-4">新しい記事を作成して店舗の魅力をアピールしましょう！</p>
              <Link href="/store/blog/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  最初の記事を作成する
                </Button>
              </Link>
            </div>
          )}

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={data.pagination.currentPage}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      <div className="mt-8">
        <Link href="/store/blog">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            ブログ管理に戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}