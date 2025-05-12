declare interface KorapayOptions {
  key: string;
  reference: string;
  amount: number;
  currency: string;
  customer: {
    name?: string;
    email?: string;
  };
  onClose?: () => void;
  onSuccess?: (data: any) => void;
  onFailed?: () => void;
}

interface KorapayWindow {
  Korapay?: {
    initialize: (options: KorapayOptions) => void;
  };
}

declare const window: Window & typeof globalThis & KorapayWindow;
