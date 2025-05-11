import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FundWalletModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// TODO: Integrate Korapay payment widget here
export default function FundWalletModal({ open, onClose, onSuccess }: FundWalletModalProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [success, setSuccess] = useState(false);

  const handleFund = async () => {
    setLoading(true);
    // Placeholder: Simulate Korapay payment
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      onSuccess();
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogTitle>Fund NGN Wallet</DialogTitle>
        <DialogDescription id="fund-wallet-modal-desc">
          Enter the amount you wish to fund and complete payment using Korapay.
        </DialogDescription>
        <input
          type="number"
          min={100}
          placeholder="Amount (NGN)"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="w-full p-2 border rounded mb-4"
          disabled={loading || success}
        />
        {!success ? (
          <Button
            onClick={handleFund}
            disabled={loading || amount < 100}
            className="w-full"
            aria-label="Fund wallet"
          >
            {loading ? "Processing..." : "Fund Wallet"}
          </Button>
        ) : (
          <div className="text-green-600 font-semibold text-center my-2">Funding successful!</div>
        )}
        <Button
          onClick={onClose}
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
