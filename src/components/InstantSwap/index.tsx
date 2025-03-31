'use client';

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useQuidaxAPI } from '@/hooks/useQuidaxAPI';
import { SUPPORTED_CURRENCIES, DEFAULT_USD_NGN_RATE } from './constants';
import { CurrencySelector } from './components/CurrencySelector';
import { AmountInput } from './components/AmountInput';
import { TradePreview } from './components/TradePreview';
import { useSwapForm } from './hooks/useSwapForm';
import { useMarketRates } from './hooks/useMarketRates';
import { useWallets } from './hooks/useWallets';
import { InstantSwapModalProps, TradeDetails } from './types';
import { calculateNGNEquivalent } from './utils/currency';
import { Wallet } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from "@/components/ui/use-toast";

export function InstantSwapModal({ isOpen, onClose, wallet }: InstantSwapModalProps) {
  const [fromSearchQuery, setFromSearchQuery] = useState('');
  const [toSearchQuery, setToSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [tradeDetails, setTradeDetails] = useState<TradeDetails | null>(null);
  const [countdown, setCountdown] = useState(14);
  const [isLoading, setIsLoading] = useState(false);
  const [quidaxId, setQuidaxId] = useState('');
  const [quoteId, setQuoteId] = useState('');

  const supabase = createClientComponentClient();

  const { formData, error, updateFormField, validateForm, resetForm } = useSwapForm({
    initialFromCurrency: wallet?.currency || ''
  });

  const { wallets, getWalletBalance } = useWallets();
  const { rate } = useMarketRates({
    fromCurrency: formData.fromCurrency,
    toCurrency: formData.toCurrency
  });
  const { createSwapQuotation, confirmSwapQuotation } = useQuidaxAPI();

  useEffect(() => {
    const fetchQuidaxId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('quidax_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        if (!profiles || profiles.length === 0) return;
        
        setQuidaxId(profiles[0].quidax_id || '');
      } catch (err) {
        console.error('Error fetching Quidax ID:', err);
      }
    };

    fetchQuidaxId();
  }, [supabase]);

  const handleGetQuote = async () => {
    if (!validateForm() || !quidaxId) return;

    try {
      setIsLoading(true);
      
      // Convert amount to crypto if needed
      let cryptoAmount = formData.amount;
      if (formData.amountCurrency === 'NGN') {
        // If amount is in NGN, convert to crypto using the rate
        cryptoAmount = (Number(formData.amount) / rate).toString();
      } else if (formData.amountCurrency === 'USD') {
        // If amount is in USD, first convert to NGN then to crypto
        const ngnAmount = Number(formData.amount) * DEFAULT_USD_NGN_RATE;
        cryptoAmount = (ngnAmount / rate).toString();
      }

      const quote = await createSwapQuotation({
        from_currency: formData.fromCurrency.toLowerCase(),
        to_currency: formData.toCurrency.toLowerCase(),
        from_amount: cryptoAmount,
        user_id: quidaxId
      });

      setQuoteId(quote.id);

      // Calculate fees based on NGN equivalent
      const ngnEquivalent = calculateNGNEquivalent(cryptoAmount, formData.fromCurrency, wallets);
      
      // Fee calculation based on NGN amount
      let feePercentage = 0.01; // Default 1%
      if (ngnEquivalent >= 10000000) { // >= 10M NGN
        feePercentage = 0.005; // 0.5%
      } else if (ngnEquivalent >= 5000000) { // >= 5M NGN
        feePercentage = 0.0075; // 0.75%
      }

      // Calculate total fee and split between platform and service
      const totalFee = ngnEquivalent * feePercentage;
      const fees = {
        platform: totalFee / 2, // Split evenly between platform and service
        service: totalFee / 2,
        total: totalFee
      };

      setTradeDetails({
        type: "swap",
        amount: cryptoAmount,
        currency: formData.fromCurrency,
        rate: Number(quote.quoted_price),
        fees,
        total: ngnEquivalent + fees.total,
        quote_amount: quote.to_amount,
        ngn_equivalent: ngnEquivalent
      });

      setShowPreview(true);
      setCountdown(14);

    } catch (error) {
      console.error('Error getting quote:', error);
      toast({
        title: "Error",
        description: "Failed to get quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!tradeDetails || !quidaxId || !quoteId) return;

    try {
      setIsLoading(true);

      const result = await confirmSwapQuotation({
        from_currency: formData.fromCurrency.toLowerCase(),
        to_currency: formData.toCurrency.toLowerCase(),
        from_amount: formData.amount,
        user_id: quidaxId,
        quotation_id: quoteId
      });

      if (result.status === 'success') {
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error confirming swap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setShowPreview(false);
    onClose();
  };

  const renderAvailableBalance = () => {
    if (!formData.fromCurrency) return null;
    
    const balance = getWalletBalance(formData.fromCurrency);
    const ngnEquivalent = calculateNGNEquivalent(balance, formData.fromCurrency, wallets);
    
    return (
      <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4" />
          <span>Available Balance:</span>
          <span className="font-medium text-green-600 dark:text-green-500">
            {balance} {formData.fromCurrency}
            {formData.fromCurrency !== 'NGN' && ngnEquivalent > 0 && (
              <span className="ml-1 text-gray-500">
                (≈ ₦{ngnEquivalent.toLocaleString()})
              </span>
            )}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Instant Swap</DialogTitle>
            <DialogDescription>
              Instantly swap between cryptocurrencies at the best rates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <CurrencySelector
              label="From"
              value={formData.fromCurrency}
              onChange={(value) => updateFormField('fromCurrency', value)}
              currencies={SUPPORTED_CURRENCIES}
              searchQuery={fromSearchQuery}
              onSearchChange={setFromSearchQuery}
              excludeCurrency={formData.toCurrency}
            />
            {renderAvailableBalance()}

            <AmountInput
              amount={formData.amount}
              onAmountChange={(value) => updateFormField('amount', value)}
              amountCurrency={formData.amountCurrency}
              onAmountCurrencyChange={(value) => updateFormField('amountCurrency', value)}
              fromCurrency={formData.fromCurrency}
            />

            <CurrencySelector
              label="To"
              value={formData.toCurrency}
              onChange={(value) => updateFormField('toCurrency', value)}
              currencies={SUPPORTED_CURRENCIES}
              searchQuery={toSearchQuery}
              onSearchChange={setToSearchQuery}
              excludeCurrency={formData.fromCurrency}
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              onClick={handleGetQuote}
              disabled={!validateForm() || isLoading || !quidaxId}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Getting Quote...
                </>
              ) : (
                'Get Quote'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {tradeDetails && (
        <TradePreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onConfirm={handleConfirmSwap}
          trade={tradeDetails}
          countdown={countdown}
        />
      )}
    </>
  );
} 