import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface AgeVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (verified: boolean) => void;
}

export function AgeVerificationModal({
  open,
  onOpenChange,
  onVerify,
}: AgeVerificationModalProps) {
  const handleVerify = () => {
    onVerify(true);
    onOpenChange(false);
  };

  const handleDeny = () => {
    onVerify(false);
    onOpenChange(false);
    window.location.href = "https://www.google.com";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">年齢確認</AlertDialogTitle>
          <AlertDialogDescription className="text-base mt-2">
            当サイトは18歳未満および高校生の閲覧はお断りします。
            あなたは18歳以上ですか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex justify-end space-x-4">
          <Button variant="outline" onClick={handleDeny}>
            いいえ
          </Button>
          <Button onClick={handleVerify}>
            はい、18歳以上です
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}