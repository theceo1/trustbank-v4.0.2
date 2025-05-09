//src/components/wallet/VirtualAccountModal.tsx
import * as DialogPrimitive from '@radix-ui/react-dialog';
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

interface VirtualAccountModalProps {
  open: boolean;
  onDone: () => void;
  userName: string;
  accountName: string;
  accountNumber: string;
  bankName?: string;
  amount: number; // This is the total amount user should pay (includes markup, korapay, vat)
  loading: boolean;
}

import { useState } from 'react';

export const VirtualAccountModal: React.FC<VirtualAccountModalProps> = ({
  open,
  onDone,
  accountName,
  accountNumber,
  bankName,
  amount,
  loading
}: VirtualAccountModalProps) => {
  // Defensive: fallback to empty string if any prop is undefined
  accountName = accountName || '';
  accountNumber = accountNumber || '';
  bankName = bankName || '';
  amount = amount || 0;

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={open => { if (!open) onDone(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/70 z-50 animate-in fade-in" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-br from-[#2d014d] via-[#17002d] to-[#0d001a] p-8 shadow-2xl border-2 border-purple-800 focus:outline-none animate-in fade-in"
          aria-describedby="vamodal-desc"
        >
          <DialogPrimitive.Title className="text-white text-2xl font-bold text-center mb-6">Virtual Account Details</DialogPrimitive.Title>
          <DialogPrimitive.Description id="vamodal-desc" className="text-purple-200 text-center mb-8">
            Fund your trustBank wallet. Use the details below to complete your transfer. This account is unique to you and expires soon.
          </DialogPrimitive.Description>

          <div className="flex flex-col gap-4 text-lg text-white">
            <div>
              <span className="font-semibold">Account Name:</span> {accountName}
            </div>
            <div>
              <span className="font-semibold">Account Number:</span> {accountNumber}
              {accountNumber && (
                <button
                  className="ml-2 px-2 py-1 text-xs bg-purple-900 rounded text-purple-200 hover:bg-purple-700"
                  onClick={handleCopy}
                  aria-label="Copy account number"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <div>
              <span className="font-semibold">Bank Name:</span> {bankName}
            </div>
            <div>
              <span className="font-semibold">Amount to Pay:</span> ₦{Number(amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          </div>

          <div className="flex gap-4 mt-6 justify-end">
            <Button variant="outline" onClick={onDone} disabled={loading} className="flex-1 border-white text-white hover:bg-purple-800 bg-transparent font-semibold py-3 text-lg rounded-lg">Cancel</Button>
            <Button onClick={onDone} disabled={loading} className="flex-1 bg-white text-purple-800 font-extrabold hover:bg-purple-200 py-3 text-lg rounded-lg shadow">{loading ? 'Processing...' : 'Done'}</Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
