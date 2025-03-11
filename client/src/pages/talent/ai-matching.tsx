import { SEO } from "@/lib/seo";
import { AIMatchingChat } from "@/components/ai-matching-chat";
import { useProfile } from "@/hooks/use-profile";
import { Loader2 } from "lucide-react";
import { ProfileConfirmationDialog } from "@/components/profile-confirmation-dialog";
import { useState } from "react";

export default function AIMatchingPage() {
  const { profileData, isLoading } = useProfile();
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="AI マッチング"
        description="AIがあなたの希望に合った店舗を探します"
      />
      <div className="min-h-screen bg-background">
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              SCAIマッチング
            </h1>
            <p className="text-sm text-muted-foreground">
              AIがあなたの希望に合った店舗を探します
            </p>
          </div>
        </header>
        <main className="container mx-auto py-8">
          <AIMatchingChat onStartMatching={() => setShowConfirmation(true)} />
          {profileData && (
            <ProfileConfirmationDialog
              isOpen={showConfirmation}
              onClose={() => setShowConfirmation(false)}
              onConfirm={() => {
                // AIマッチング開始のロジック
                setShowConfirmation(false);
              }}
              profileData={profileData}
              isLoading={false}
            />
          )}
        </main>
      </div>
    </>
  );
}