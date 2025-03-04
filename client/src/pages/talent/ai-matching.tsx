import { AIMatchingChat } from "@/components/ai-matching-chat";

export default function AIMatchingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AIマッチング
          </h1>
          <p className="text-sm text-muted-foreground">
            AIがあなたの希望に合った店舗を探します
          </p>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <AIMatchingChat />
      </main>
    </div>
  );
}
