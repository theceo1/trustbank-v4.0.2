"use client"

import { useState } from 'react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from '@/components/ui/use-toast'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  currency: string
  walletAddress?: string
  isLoading: boolean
}

export function DepositModal({
  isOpen,
  onClose,
  currency,
  walletAddress,
  isLoading,
}: DepositModalProps) {
  const { toast } = useToast()

  const copyToClipboard = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress)
        toast({
          title: "Address copied!",
          description: "The wallet address has been copied to your clipboard.",
        })
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Please try copying the address manually.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit {currency}</DialogTitle>
          <DialogDescription>
            Send only {currency} to this address. Sending any other asset may result in permanent loss.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
          ) : walletAddress ? (
            <>
              <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <QRCode
                  value={walletAddress}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wallet Address
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 text-sm bg-gray-50 dark:bg-gray-900 rounded-md overflow-x-auto">
                    {walletAddress}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    <Icons.copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-4 text-sm text-gray-500 dark:text-gray-400">
              No wallet address available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 