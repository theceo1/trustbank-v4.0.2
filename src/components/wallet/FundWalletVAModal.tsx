import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface FundWalletVAModalProps {
  open: boolean;
  onDone: () => void;
  vamDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    amount: number;
    expiry?: number; // seconds
  };
  loading?: boolean;
  onMarkPaid?: () => void;
}

export default function FundWalletVAModal({ open, onDone, vamDetails, loading, onMarkPaid }: FundWalletVAModalProps) {
  const [countdown, setCountdown] = useState(vamDetails.expiry || 900);
  const [markedPaid, setMarkedPaid] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCountdown(vamDetails.expiry || 900);
    setMarkedPaid(false);
    if (!vamDetails.expiry || vamDetails.expiry <= 0) return;
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
  }, [open, vamDetails.expiry]);

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
        aria-describedby="fund-va-modal-desc"
        aria-labelledby="fund-va-modal-title"
      >
        <DialogHeader>
          <DialogTitle id="fund-va-modal-title">Bank Transfer Details</DialogTitle>
          <DialogDescription id="fund-va-modal-desc">
            Please transfer exactly <b>₦{vamDetails.amount.toLocaleString()}</b> to the account below.<br />
            <span className="inline-flex items-center gap-1 text-sm text-yellow-600 font-semibold">
              Expires in: {minutes}:{seconds.toString().padStart(2, '0')}
            </span><br />
            Your wallet will be credited after payment confirmation.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 p-4 bg-white/30 dark:bg-black/30 rounded-xl text-center shadow-lg">
          <div className="font-semibold text-lg text-blue-900 dark:text-blue-200">{vamDetails.bankName}</div>
          <div className="font-mono text-2xl text-green-800 dark:text-green-400 select-all tracking-widest">{vamDetails.accountNumber}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Account Name: {vamDetails.accountName}</div>
        </div>
        <Button
          onClick={handleMarkPaid}
          disabled={loading || expired || markedPaid}
          className="w-full bg-gradient-to-r from-green-500 to-blue-600 dark:from-green-700 dark:to-blue-900 text-white font-semibold rounded-lg shadow-md mt-2"
          aria-label="Mark as paid"
        >
          {expired ? "Expired" : markedPaid ? "Marked as Paid" : loading ? "Processing..." : "Mark as Paid"}
        </Button>
        <Button
          onClick={onDone}
          variant="outline"
          className="w-full mt-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
          aria-label="Close modal"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
