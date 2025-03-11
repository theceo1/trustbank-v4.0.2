"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstantSwapModal({ isOpen, onClose }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Instant Swap</DialogTitle>
          <DialogDescription>
            Coming soon! Instantly swap between cryptocurrencies at the best rates.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export function BuyCryptoModal({ isOpen, onClose }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy Crypto</DialogTitle>
          <DialogDescription>
            Coming soon! Buy cryptocurrency instantly with your local currency.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
} 