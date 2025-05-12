import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const mockFees = {
  amount: 6000,
  service_fee: 200,
  vat: 3.75,
  total_fee: 203.75,
  you_receive: 5796.25,
  depositor: "John Doe"
};

export default function FundWalletPreview({ open, onClose, onConfirm, loading }: any) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        aria-describedby="fund-wallet-preview-desc"
        className={`
          max-w-md w-full
          bg-white dark:bg-neutral-900
          rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800
          p-0
          transition-colors
        `}
      >
        {/* Description */}
        <div className="px-8 pt-8 pb-2">
          <div
            id="fund-wallet-preview-desc"
            className="text-base text-neutral-700 dark:text-neutral-200 font-medium mb-6 text-center"
          >
            Please review your funding details before confirming.
          </div>
          {/* Depositor */}
          <div className="flex flex-col items-center mb-6">
            <span className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Depositor</span>
            <span className="text-lg font-bold text-green-700 dark:text-green-400">{mockFees.depositor}</span>
          </div>
          {/* Fee Breakdown */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-base">
              <span className="text-neutral-600 dark:text-neutral-300">Amount to Fund:</span>
              <span className="font-semibold text-green-700 dark:text-green-300">
                ₦{mockFees.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
            <div className="flex justify-between items-center text-base">
              <span className="text-neutral-600 dark:text-neutral-300">Service Fee:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-300">
                ₦{mockFees.service_fee.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
            <div className="flex justify-between items-center text-base">
              <span className="text-neutral-600 dark:text-neutral-300">VAT:</span>
              <span className="font-semibold text-orange-500 dark:text-orange-200">
                ₦{mockFees.vat.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-700 my-2"></div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-neutral-900 dark:text-neutral-100">Total Fee</span>
              <span className="text-orange-700 dark:text-orange-400">
                ₦{mockFees.total_fee.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-green-700 dark:text-green-300">You Will Receive</span>
              <span className="text-green-800 dark:text-green-400">
                ₦{mockFees.you_receive.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div className="flex justify-between gap-4 px-8 pb-8">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-1/2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg py-3 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-1/2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg py-3 shadow-md transition"
            disabled={loading}
            aria-label="Confirm fund wallet"
          >
            {loading ? "Processing..." : "Confirm & Fund"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}