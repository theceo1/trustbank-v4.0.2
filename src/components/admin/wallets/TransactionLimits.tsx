import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

interface TransactionLimit {
  currency: string;
  dailyLimit: number;
  singleTransactionLimit: number;
  requireApprovalAbove: number;
}

const SUPPORTED_CURRENCIES = ['BTC', 'ETH', 'USDT', 'NGN'];

export function TransactionLimits() {
  const [limits, setLimits] = useState<TransactionLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [editingLimit, setEditingLimit] = useState<TransactionLimit | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const response = await fetch('/api/admin/wallets/limits');
      const data = await response.json();
      setLimits(data);
    } catch (error) {
      console.error('Error fetching limits:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transaction limits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLimit = async () => {
    if (!editingLimit) return;

    try {
      const response = await fetch('/api/admin/wallets/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLimit),
      });

      if (!response.ok) throw new Error('Failed to save limit');

      toast({
        title: 'Success',
        description: 'Transaction limits updated successfully',
      });

      fetchLimits();
      setEditingLimit(null);
    } catch (error) {
      console.error('Error saving limit:', error);
      toast({
        title: 'Error',
        description: 'Failed to save transaction limits',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Limits</CardTitle>
        <CardDescription>Configure transaction limits and approval thresholds per currency</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setEditingLimit({
                  currency: selectedCurrency,
                  dailyLimit: 0,
                  singleTransactionLimit: 0,
                  requireApprovalAbove: 0,
                });
              }}
              disabled={!selectedCurrency}
            >
              Add Limit
            </Button>
          </div>

          <div className="space-y-4">
            {limits.map((limit) => (
              <div key={limit.currency} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{limit.currency}</h3>
                  <Button variant="outline" onClick={() => setEditingLimit(limit)}>
                    Edit
                  </Button>
                </div>
                <div className="grid gap-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Daily Limit:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(limit.dailyLimit, limit.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Single Transaction Limit:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(limit.singleTransactionLimit, limit.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Requires Approval Above:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(limit.requireApprovalAbove, limit.currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {editingLimit && (
            <div className="rounded-lg border p-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingLimit.currency} - Edit Limits
              </h3>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Daily Limit</label>
                  <Input
                    type="number"
                    value={editingLimit.dailyLimit}
                    onChange={(e) =>
                      setEditingLimit({
                        ...editingLimit,
                        dailyLimit: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Single Transaction Limit</label>
                  <Input
                    type="number"
                    value={editingLimit.singleTransactionLimit}
                    onChange={(e) =>
                      setEditingLimit({
                        ...editingLimit,
                        singleTransactionLimit: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Requires Approval Above</label>
                  <Input
                    type="number"
                    value={editingLimit.requireApprovalAbove}
                    onChange={(e) =>
                      setEditingLimit({
                        ...editingLimit,
                        requireApprovalAbove: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveLimit}>Save</Button>
                  <Button variant="outline" onClick={() => setEditingLimit(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 