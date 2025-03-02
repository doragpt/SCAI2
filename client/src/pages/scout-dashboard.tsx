import { useQuery } from "@tanstack/react-query";
import { TalentProfile } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScoutApplicationView } from "@/components/scout-application-view";
import { Loader2, LogOut } from "lucide-react";

export default function ScoutDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: profiles, isLoading: profilesLoading } = useQuery<TalentProfile[]>({
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
            SCAI Scout Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Logged in as {user?.username}
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
              <span className="ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profiles">
          <TabsList className="w-full">
            <TabsTrigger value="profiles">Available Talent</TabsTrigger>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles?.map((profile) => (
                <Card key={profile.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>¥{profile.guaranteeAmount.toLocaleString()} / day</span>
                      <span className="text-sm text-muted-foreground">
                        {profile.age} years old
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                        <img
                          src={`data:image/jpeg;base64,${profile.photos[0]}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Height: {profile.height}cm</div>
                        <div>Weight: {profile.weight}kg</div>
                        <div>Bust: {profile.bust}cm</div>
                        <div>Waist: {profile.waist}cm</div>
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
                        onClick={() => {/* TODO: Open application modal */}}
                      >
                        Send Offer
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
