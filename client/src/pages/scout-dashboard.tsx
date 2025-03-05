import { useQuery } from "@tanstack/react-query";
import { TalentProfile } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScoutApplicationView } from "@/components/scout-application-view";
import { Loader2, LogOut } from "lucide-react";

interface ExtendedTalentProfile extends TalentProfile {
  guaranteeAmount: number;
  age: number;
  photos: string[];
  serviceTypes: string[];
  height?: number;
  weight?: number;
  bust?: number;
  waist?: number;
}

export default function ScoutDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: profiles, isLoading: profilesLoading } = useQuery<ExtendedTalentProfile[]>({
    queryKey: ["/api/talent/profiles"],
  });

  if (profilesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            SCAI スカウトダッシュボード
          </h1>
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
        <Tabs defaultValue="profiles">
          <TabsList className="w-full">
            <TabsTrigger value="profiles">利用可能な女性</TabsTrigger>
            <TabsTrigger value="applications">申請履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles?.map((profile) => (
                <Card key={profile.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>¥{profile.guaranteeAmount.toLocaleString()} / 日</span>
                      <span className="text-sm text-muted-foreground">
                        {profile.age}歳
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile.photos[0] && (
                        <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                          <img
                            src={`data:image/jpeg;base64,${profile.photos[0]}`}
                            alt="プロフィール"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {profile.height && <div>身長: {profile.height}cm</div>}
                        {profile.weight && <div>体重: {profile.weight}kg</div>}
                        {profile.bust && <div>バスト: {profile.bust}cm</div>}
                        {profile.waist && <div>ウエスト: {profile.waist}cm</div>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.serviceTypes.map((type) => (
                          <span
                            key={type}
                            className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => {/* TODO: オファーモーダルを開く */}}
                      >
                        オファーを送る
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="applications" className="mt-6">
            <ScoutApplicationView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}