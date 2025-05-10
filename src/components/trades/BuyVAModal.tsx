import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
}

export default function BuyVAModal({ open, onDone, vamDetails, loading }: BuyVAModalProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onDone()}>
      <DialogContent>
        <DialogTitle>Make Payment</DialogTitle>
        <DialogDescription>
          Please transfer exactly <b>₦{vamDetails.amount.toLocaleString()}</b> to the account below. Your crypto will be credited after payment confirmation.
        </DialogDescription>
        <div className="my-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-xl text-center">
          <div className="font-semibold text-lg">{vamDetails.bankName}</div>
          <div className="font-mono text-2xl text-green-800 dark:text-green-400 select-all">{vamDetails.accountNumber}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Account Name: {vamDetails.accountName}</div>
        </div>
        <Button onClick={onDone} disabled={loading} className="w-full" aria-label="Done with payment">
          {loading ? "Processing..." : "Done"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
