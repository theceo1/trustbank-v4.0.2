//src/components/wallet/DepositPreview.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";

export interface DepositPreviewProps {
  amount: number;
  currency: string;
  userName: string;
  depositAmount: number;
  // markup and processingFee are deprecated, use serviceFee from backend only

  serviceFee: number;
  vat: number;
  totalFee: number;
  youWillReceive: number;
  loading: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  descriptionId: string;
}

const currencyFmt = (value: number, currency: string = 'NGN') => {
  return `${currency} ${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
};

export default function DepositPreview({
  amount,
  currency,
  depositAmount,

  serviceFee,
  vat,
  totalFee,
  youWillReceive,
  userName,
  loading,
  error,
  onCancel,
  onConfirm,
  descriptionId
}: DepositPreviewProps) {
  // Accessibility: aria-describedby links to the description below
  return (
    <DialogContent
      className="w-full max-w-[95vw] sm:max-w-[380px] mx-auto p-3 sm:p-5 rounded-xl shadow-xl border border-gray-200 bg-white dark:bg-[#18132a]"
      aria-describedby={descriptionId || 'deposit-preview-desc'}
      aria-labelledby="deposit-preview-title"
    >
      <DialogTitle className="sr-only">Deposit Preview</DialogTitle>
      <DialogDescription className="sr-only">Preview your deposit details and fee breakdown before confirming your transaction.</DialogDescription>
      <DialogTitle id="deposit-preview-title" className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-gray-100">Confirm Deposit</DialogTitle>
      <DialogDescription id={descriptionId || 'deposit-preview-desc'} className="mb-4 sm:mb-5 text-gray-500 text-sm sm:text-base">Review the transaction details before confirming your deposit.</DialogDescription>
      <div className="flex flex-col gap-3 sm:gap-5" role="region" aria-labelledby="deposit-preview-title" aria-describedby={descriptionId || 'deposit-preview-desc'}>
        <div className="flex flex-row justify-between items-center border-b border-gray-100 pb-2 mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Depositor</span>
          <span
            className="text-base font-semibold text-primary truncate max-w-[150px] text-right"
            title={userName}
            tabIndex={0}
            aria-label={`Depositor: ${userName}`}
          >
            {userName}
          </span>
        </div>
        <div className="flex flex-row justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">You Pay</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(depositAmount, currency)}</span>
        </div>
        {serviceFee !== undefined && (
          <div className="flex flex-row justify-between items-center">
            <span className="text-xs text-gray-500">Service Fee</span>
            <span className="text-sm font-bold text-orange-500">{formatCurrency(serviceFee, currency)}</span>
          </div>
        )}
        {vat !== undefined && (
          <div className="flex justify-between py-1">
            <span className="text-gray-400">VAT</span>
            <span className="text-gray-100 font-semibold">NGN {Number(vat).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        )}
        {/* Divider */}
        <div className="h-px bg-gray-200 my-2" />
        {totalFee !== undefined && (
          <div className="flex flex-row justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Total Fee</span>
            <span className="text-base font-bold text-orange-600">{formatCurrency(totalFee, currency)}</span>
          </div>
        )}
        {youWillReceive !== undefined && (
          <div className="flex flex-row justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">You Receive</span>
            <span className="text-base font-bold text-green-500">{formatCurrency(youWillReceive, currency)}</span>
          </div>
        )}
      </div>
      {error && <div className="text-red-600 py-2 text-xs sm:text-sm">{error}</div>}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 dark:hover:bg-[#28204a]">Cancel</Button>
        <Button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90">{loading ? 'Processing...' : 'Confirm Deposit'}</Button>
      </div>
    </DialogContent>
  );
}
