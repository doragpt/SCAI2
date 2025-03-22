import React from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TalentForm } from "@/components/talent-form";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { getTalentProfile } from "@/lib/api/talent";
import type { TalentProfileData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function TalentRegistration() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const {
    data: talentProfile,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    queryFn: async () => {
      try {
        console.log('Talent Registration page: Fetching profile data...');
        const data = await getTalentProfile();
        console.log('Talent Registration page: Profile data received:', data);
        return data;
      } catch (error) {
        console.error('Talent Registration page: Error fetching profile data:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: false,
    // Return null on error
    onError: (error: Error) => {
      console.error('Talent Registration page: Query error:', error);
      if (error.message === "認証が必要です") {
        toast({
          title: "エラー",
          description: "認証が必要です",
          variant: "destructive",
        });
      }
      return null;
    }
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">認証が必要です</p>
          <Button asChild>
            <Link href="/auth">ログイン</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {talentProfile ? "プロフィール編集" : "プロフィール作成"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {talentProfile
                ? "プロフィール情報を編集できます"
                : "安全に働くための詳細情報を登録してください"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              ログイン中: {user?.username}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="ml-2">ログアウト</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Web履歴書作成</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <TalentForm initialData={talentProfile || undefined} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}