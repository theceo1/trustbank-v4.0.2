'use client';

import { useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SwapQuotationParams {
  from_currency: string;
  to_currency: string;
  from_amount: string;
  user_id: string;
}

interface SwapConfirmationParams extends SwapQuotationParams {
  quotation_id: string;
}

export function useQuidaxAPI() {
  const supabase = createClientComponentClient();

  const createSwapQuotation = useCallback(async (params: SwapQuotationParams) => {
    try {
      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating swap quotation:', error);
      throw error;
    }
  }, []);

  const confirmSwapQuotation = useCallback(async (params: SwapConfirmationParams) => {
    try {
      const response = await fetch('/api/swap/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error confirming swap quotation:', error);
      throw error;
    }
  }, []);

  return {
    createSwapQuotation,
    confirmSwapQuotation,
  };
} 