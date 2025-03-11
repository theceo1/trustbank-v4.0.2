'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from 'framer-motion';
import { formatNumber } from '@/lib/utils';

interface SwapTransaction {
  id: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  to_amount: string;
  rate: string;
  status: string;
  created_at: string;
}

export function SwapHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<SwapTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSwapHistory = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/trades/swap/transactions', {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch swap history');
        }

        if (data.status === 'success') {
          setTransactions(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch swap history');
        }
      } catch (error) {
        console.error('Failed to fetch swap history:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch swap history');
      } finally {
        setLoading(false);
      }
    };

    fetchSwapHistory();
    const interval = setInterval(fetchSwapHistory, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No swap transactions found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx, index) => (
        <motion.div
          key={tx.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {formatNumber(tx.from_amount)} {tx.from_currency.toUpperCase()}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">
                {formatNumber(tx.to_amount)} {tx.to_currency.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Rate: 1 {tx.from_currency.toUpperCase()} = {formatNumber(tx.rate)} {tx.to_currency.toUpperCase()}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
            </div>
          </div>
          <Badge
            variant={tx.status === 'completed' ? 'default' : 'secondary'}
            className={`capitalize ${
              tx.status === 'completed' ? 'bg-green-600' : ''
            }`}
          >
            {tx.status}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
} 