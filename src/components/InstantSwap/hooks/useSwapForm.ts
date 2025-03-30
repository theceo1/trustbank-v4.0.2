import { useState, useCallback } from 'react';
import { AmountCurrencyType, SwapFormData } from '../types';
import { validateAmount, validateSwapForm } from '../utils/validation';
import { useToast } from '@/hooks/use-toast';

interface UseSwapFormProps {
  initialFromCurrency?: string;
}

export const useSwapForm = ({ initialFromCurrency = '' }: UseSwapFormProps = {}) => {
  const [formData, setFormData] = useState<SwapFormData>({
    fromCurrency: initialFromCurrency,
    toCurrency: '',
    amount: '',
    amountCurrency: 'CRYPTO',
  });
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const updateFormField = useCallback((field: keyof SwapFormData, value: string | AmountCurrencyType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const validateForm = useCallback((): boolean => {
    const validationError = validateSwapForm(
      formData.fromCurrency,
      formData.toCurrency,
      formData.amount
    );

    if (validationError) {
      setError(validationError);
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return false;
    }

    const amountError = validateAmount(
      formData.amount,
      formData.amountCurrency,
      formData.fromCurrency
    );

    if (amountError) {
      setError(amountError);
      toast({
        title: "Amount Error",
        description: amountError,
        variant: "destructive",
      });
      return false;
    }

    return true;
  }, [formData, toast]);

  const resetForm = useCallback(() => {
    setFormData({
      fromCurrency: initialFromCurrency,
      toCurrency: '',
      amount: '',
      amountCurrency: 'CRYPTO',
    });
    setError(null);
  }, [initialFromCurrency]);

  return {
    formData,
    error,
    updateFormField,
    validateForm,
    resetForm,
  };
}; 