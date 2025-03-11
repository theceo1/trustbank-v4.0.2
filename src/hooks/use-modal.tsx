'use client';

import { create } from 'zustand';

interface Wallet {
  currency: string;
  balance: string;
}

interface ModalData {
  wallet?: Wallet;
}

interface ModalStore {
  type: string | null;
  data: ModalData;
  isOpen: boolean;
  onOpen: (type: string, data?: ModalData) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
})); 