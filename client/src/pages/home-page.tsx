import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { StoreProfile } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { data: jobListings, isLoading } = useQuery<StoreProfile[]>({
    queryKey: ["/api/jobs/public"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            SCAI
          </h1>
          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild>
                <Link href={user.role === "store" ? "/store" : "/talent/register"}>
                  マイページ
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/auth">無料会員登録</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4">
            AIが最適な求人をご提案
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            会員登録でAIマッチング機能が使えます
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>出稼ぎ希望の方</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  希望条件に合った求人をAIが提案。
                  地域や期間、給与など、あなたの希望に沿った求人をご紹介します。
                </p>
                {!user && (
                  <Button asChild className="w-full">
                    <Link href="/auth">AIマッチングを試す</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>在籍希望の方</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  お住まいの地域で、あなたの希望に合った店舗をAIが提案。
                  面接日程の調整もスムーズに行えます。
                </p>
                {!user && (
                  <Button asChild className="w-full">
                    <Link href="/auth">AIマッチングを試す</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h3 className="text-2xl font-bold mb-6">新着求人情報</h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobListings?.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{job.businessName}</span>
                      <span className="text-sm text-muted-foreground">
                        {job.location}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">業種:</span>
                        <span>{job.serviceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">保証額:</span>
                        <span>¥{job.minimumGuarantee?.toLocaleString()} ~ ¥{job.maximumGuarantee?.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {job.transportationSupport && (
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                            交通費支給
                          </span>
                        )}
                        {job.housingSupport && (
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                            寮完備
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
