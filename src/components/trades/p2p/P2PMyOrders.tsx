import { useEffect, useState } from 'react';
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

interface P2POrder {
  id: string;
  type: 'buy' | 'sell';
  currency: string;
  amount: number;
  price: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export function P2PMyOrders() {
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trades/p2p/orders/my');
      const data = await response.json();
      if (data.status === 'success') {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching my P2P orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/trades/p2p/orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Order Cancelled', {
          description: 'Your order has been cancelled successfully.',
        });
        fetchOrders(); // Refresh orders list
      } else {
        throw new Error(data.error || 'Failed to cancel order');
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading your orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        You haven't created any orders yet
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="capitalize">{order.type}</TableCell>
              <TableCell>{order.currency}</TableCell>
              <TableCell>{order.amount}</TableCell>
              <TableCell>{order.price}</TableCell>
              <TableCell className="capitalize">{order.status}</TableCell>
              <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                {order.status === 'active' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => cancelOrder(order.id)}
                  >
                    Cancel
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 