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
  console.log("AgeVerificationModal rendered:", { open });

  const handleVerify = () => {
    console.log("年齢確認: はい");
    onVerify(true);
  };

  const handleDeny = () => {
    console.log("年齢確認: いいえ");
    onVerify(false);
    window.location.href = "https://www.google.com";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>年齢確認</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            当サイトは18歳未満および高校生の閲覧はお断りします。
            あなたは18歳以上ですか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
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