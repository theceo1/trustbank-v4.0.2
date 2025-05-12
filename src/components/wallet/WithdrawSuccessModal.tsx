import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WithdrawSuccessModalProps {
  open: boolean;
  onClose: () => void;
  status: "success" | "processing" | "failed";
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  error?: string;
}

export default function WithdrawSuccessModal({ open, onClose, status, amount, bankName, accountNumber, accountName, error }: WithdrawSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        aria-describedby="withdraw-success-modal-desc"
        aria-labelledby="withdraw-success-modal-title"
        className="sm:max-w-[425px] bg-gradient-to-br from-indigo-950 via-purple-900 to-black border-purple-800/50 shadow-xl p-0"
      >
        <DialogHeader>
          <DialogTitle id="withdraw-success-modal-title">
            {status === "success" ? "Withdrawal Successful" : status === "processing" ? "Withdrawal Processing" : "Withdrawal Failed"}
          </DialogTitle>
          <DialogDescription id="withdraw-success-modal-desc">
            {status === "success" && "Your funds have been sent to your bank account."}
            {status === "processing" && "Your withdrawal is being processed. You will be notified once it is complete."}
            {status === "failed" && (error || "Withdrawal failed. Please try again or contact support.")}
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 p-4 bg-white/30 dark:bg-black/30 rounded-xl text-center shadow-lg">
          <div className="font-semibold text-lg text-blue-900 dark:text-blue-200">{bankName}</div>
          <div className="font-mono text-2xl text-green-800 dark:text-green-400 select-all tracking-widest">{accountNumber}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Account Name: {accountName}</div>
          <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mt-2">₦{amount.toLocaleString()}</div>
        </div>
        <Button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-green-500 to-blue-600 dark:from-green-700 dark:to-blue-900 text-white font-semibold rounded-lg shadow-md mt-2"
          aria-label="Close modal"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
