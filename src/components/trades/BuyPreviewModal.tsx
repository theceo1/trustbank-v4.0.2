import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BuyPreviewModalProps {
  open: boolean;
  onClose: () => void;
  ngnAmount: number;
  crypto: string;
  cryptoAmount: number;
  rate: number;
  fees?: number;
  quoteExpiry: string;
  loading: boolean;
  error?: string;
  onConfirm: () => void;
}

export default function BuyPreviewModal({
  open, onClose, ngnAmount, crypto, cryptoAmount, rate, fees, quoteExpiry, loading, error, onConfirm
}: BuyPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogTitle>Confirm Your Purchase</DialogTitle>
        <DialogDescription>
          You are about to buy <b>{cryptoAmount} {crypto}</b> for <b>₦{ngnAmount.toLocaleString()}</b>.<br />
          Rate: ₦{rate.toLocaleString()} per {crypto}<br />
          {fees ? <>Fee: ₦{fees.toLocaleString()}<br /></> : null}
          <span className="text-xs text-yellow-500">Quote expires at: {new Date(quoteExpiry).toLocaleTimeString()}</span>
        </DialogDescription>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-4 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={onConfirm} disabled={loading} aria-label="Confirm buy and proceed to payment">
            {loading ? "Processing..." : "Confirm & Pay"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
