import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function AgeVerificationModal() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const verified = localStorage.getItem("age-verified");
    if (!verified) {
      setOpen(true);
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem("age-verified", "true");
    setOpen(false);
  };

  const handleDeny = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>年齢確認</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            当サイトは18歳未満および高校生の閲覧はお断りします。
            あなたは18歳以上ですか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="secondary" onClick={handleDeny}>
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