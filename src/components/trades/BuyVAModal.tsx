import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";

interface BuyVAModalProps {
  open: boolean;
  onDone: () => void;
  vamDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    amount: number;
  };
  loading?: boolean;
  expiry?: number; // seconds
  onMarkPaid?: () => void;
}

export default function BuyVAModal({ open, onDone, vamDetails, loading, expiry = 900, onMarkPaid }: BuyVAModalProps) {
  const [countdown, setCountdown] = useState(expiry);
  const [markedPaid, setMarkedPaid] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCountdown(expiry);
    setMarkedPaid(false);
    if (expiry <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, expiry]);

  const handleMarkPaid = () => {
    setMarkedPaid(true);
    if (onMarkPaid) onMarkPaid();
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const expired = countdown === 0;

  return (
    <Dialog open={open} onOpenChange={v => !v && onDone()}>
      <DialogContent
  aria-describedby="buy-va-modal-desc"
  aria-labelledby="buy-va-modal-title"
>
  <DialogTitle id="buy-va-modal-title">Virtual Account Payment</DialogTitle>
  <DialogDescription id="buy-va-modal-desc">
    Please use the virtual account details below to complete your payment.
  </DialogDescription>
        <DialogTitle>Make Payment</DialogTitle>
        <DialogDescription id="vam-modal-desc">
          Please transfer exactly <b>₦{vamDetails.amount.toLocaleString()}</b> to the account below.<br />
          <span className="inline-flex items-center gap-1 text-sm text-yellow-600 font-semibold">
            Quote/account expires in: {minutes}:{seconds.toString().padStart(2, '0')}
          </span><br />
          Your crypto will be credited after payment confirmation.
        </DialogDescription>
        <div className="my-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-xl text-center">
          <div className="font-semibold text-lg">{vamDetails.bankName}</div>
          <div className="font-mono text-2xl text-green-800 dark:text-green-400 select-all">{vamDetails.accountNumber}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Account Name: {vamDetails.accountName}</div>
        </div>
        <Button
          onClick={handleMarkPaid}
          disabled={loading || expired || markedPaid}
          className="w-full"
          aria-label="Mark as paid"
        >
          {expired ? "Expired" : markedPaid ? "Marked as Paid" : loading ? "Processing..." : "Mark as Paid"}
        </Button>
        <Button
          onClick={onDone}
          variant="outline"
          className="w-full mt-2"
          aria-label="Close modal"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
