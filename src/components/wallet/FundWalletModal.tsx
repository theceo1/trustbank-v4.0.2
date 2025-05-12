//src/components/wallet/FundWalletModal.tsx
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import FundWalletPreview from "./FundWalletPreview";
import FundWalletVAModal from "./FundWalletVAModal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";

export interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    name: string;
    email: string;
  };
}

// Replace with your actual Korapay public key
const KORAPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_KORAPAY_PUBLIC_KEY || "YOUR_KORAPAY_PUBLIC_KEY";



export default function FundWalletModal({ isOpen, onClose, onSuccess, user }: FundWalletModalProps) {
  // State
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVAModal, setShowVAModal] = useState(false);
  const [vaDetails, setVaDetails] = useState<null | {
    accountName: string;
    accountNumber: string;
    bankName: string;
    amount: number;
    expiry?: number;
  }>(null);

  // Reset modal state on close
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setLoading(false);
      setError("");
      setSuccess(false);
      setShowPreview(false);
    }
  }, [isOpen]);

  // Handle Korapay payment
  const handleFund = async () => {
    setShowPreview(true);
  };

  const handlePreviewConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      // Call backend to initiate Korapay bank transfer (one-time virtual account)
      const response = await fetch("/api/payments/fund-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          email: user.email,
          name: user.name,
        }),
      });
      if (!response.ok) throw new Error("Failed to initiate funding. Try again.");
      const data = await response.json();
      if (!data || !data.accountNumber) throw new Error("No virtual account details returned.");
      setVaDetails({
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        amount: Number(amount),
        expiry: data.expiry || 900,
      });
      setShowVAModal(true);
      setShowPreview(false);
    } catch (err: any) {
      setError(err.message || "Failed to initiate funding");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent
        aria-describedby="fund-wallet-modal-desc"
        className={`
          max-w-md w-full
          bg-white dark:bg-neutral-900
          rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800
          p-0
          transition-colors
        `}
      >
        <div className="px-8 pt-8 pb-2">
          <div
            id="fund-wallet-modal-desc"
            className="text-base text-neutral-700 dark:text-neutral-200 font-medium mb-6 text-center"
          >
            Fund your NGN wallet. Enter the amount and complete payment swiftly .
          </div>
        <Label htmlFor="fund-amount" className="block text-neutral-700 dark:text-neutral-200 mb-1 text-lg font-semibold">Amount</Label>
        <Input
          id="fund-amount"
          type="number"
          min={100}
          placeholder="Enter amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 focus:border-green-600 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-700 placeholder-neutral-400 text-xl px-4 py-3 rounded-lg shadow-inner mb-4"
          disabled={loading || success}
        />
        <div className="text-xs mb-2 text-neutral-600 dark:text-neutral-400">
          Funding for: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{user.name && !user.name.match(/^\w{8}(-\w{4}){3}-\w{12}$/) ? user.name : 'User'}</span> <br></br> 
          <span className="text-green-700 dark:text-green-300">{user.email}</span>
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {!success ? (
          <Button
            onClick={handleFund}
            disabled={loading || !amount || Number(amount) < 100}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg py-3 shadow-md transition"
            aria-label="Fund wallet"
          >
            {loading ? "Processing..." : "Fund Wallet"}
          </Button>
        ) : (
          <div className="text-green-600 dark:text-green-400 font-semibold text-center my-2">Funding successful!</div>
        )}
        <FundWalletPreview
          open={showPreview}
          onClose={() => setShowPreview(false)}
          amount={Number(amount) || 0}
          userName={user.name}
          userEmail={user.email}
          loading={loading}
          error={error}
          onConfirm={handlePreviewConfirm}
        />
        {vaDetails && (
          <FundWalletVAModal
            open={showVAModal}
            onDone={() => {
              setShowVAModal(false);
              setVaDetails(null);
              setSuccess(true);
              onSuccess();
            }}
            vamDetails={vaDetails}
            loading={loading}
            onMarkPaid={() => {
              setSuccess(true);
              onSuccess();
            }}
          />
        )}
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full mt-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg py-3 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          aria-label="Close modal"
        >
          Close
        </Button>
        {/* This div is required for Korapay widget to attach if using inline mode */}
        <div id="korapay-widget" />
      </div>
      </DialogContent>
    </Dialog>
  );
}

// Notes:
// - Replace KORAPAY_PUBLIC_KEY with your real public key (use env vars in production).
// - For production, always generate a unique reference from your backend and verify the transaction after payment.
// - You may want to pass the user's name/email for better reconciliation.
// - For further customization, see the official Korapay docs: https://korapay.com/docs/inline
// - The /api/payments/generate-reference endpoint must return { reference: string } and should create a unique, secure reference for each payment.
