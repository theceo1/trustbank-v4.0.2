import { useEffect, useState } from 'react';
import TransactionHistory from '@/components/TransactionHistory';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface P2PTrade {
  id: string;
  order_id: string;
  escrow_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  price: number;
  total: number;
  status: 'pending_payment' | 'paid' | 'completed' | 'cancelled' | 'disputed';
  created_at: string;
}

export function P2PMyTrades() {
  const [trades, setTrades] = useState<P2PTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trades/p2p/trades/my');
      const data = await response.json();
      if (data.status === 'success') {
        setTrades(data.data);
      }
    } catch (error) {
      console.error('Error fetching my P2P trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (tradeId: string) => {
    try {
      const response = await fetch(`/api/trades/p2p/trades/${tradeId}/confirm-payment`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Payment Confirmed', {
          description: 'You have confirmed the payment for this trade.',
        });
        fetchTrades(); // Refresh trades list
      } else {
        throw new Error(data.error || 'Failed to confirm payment');
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message,
      });
    }
  };

  const openDispute = async (tradeId: string) => {
    try {
      const response = await fetch('/api/trades/p2p/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trade_id: tradeId,
          reason: 'Payment issue', // This could be made dynamic with a form
          evidence: {}, // This could be made dynamic with file uploads
        }),
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Dispute Opened', {
          description: 'Your dispute has been opened and will be reviewed by our team.',
        });
        fetchTrades(); // Refresh trades list
      } else {
        throw new Error(data.error || 'Failed to open dispute');
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading your trades...</div>;
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        You haven't made any trades yet
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell>
                {trade.buyer_id === trade.seller_id ? 'Buy' : 'Sell'}
              </TableCell>
              <TableCell>{trade.amount}</TableCell>
              <TableCell>{trade.price}</TableCell>
              <TableCell>{trade.total}</TableCell>
              <TableCell className="capitalize">{trade.status}</TableCell>
              <TableCell>{new Date(trade.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                {trade.status === 'pending_payment' && (
                  <div className="space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => confirmPayment(trade.id)}
                    >
                      Confirm Payment
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDispute(trade.id)}
                    >
                      Open Dispute
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 