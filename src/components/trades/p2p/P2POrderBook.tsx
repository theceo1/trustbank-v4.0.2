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
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface P2POrder {
  id: string;
  user_id: string;
  type: 'buy' | 'sell';
  currency: string;
  amount: number;
  price: number;
  payment_methods: {
    type: string;
    details: string;
  }[];
  creator: {
    name: string;
    completed_trades: number;
    completion_rate: number;
  };
  order_type: string;
  post_only: boolean;
  trigger_price: string | null;
  expiry: string;
  expires_at: string | null;
  user: {
    username: string;
  };
}

interface P2POrderBookProps {
  currency: string;
  type: 'buy' | 'sell';
  onSelect: (order: P2POrder) => void;
}

export function P2POrderBook({ currency, type, onSelect }: P2POrderBookProps) {
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/trades/p2p/orders?currency=${currency}&type=${type}`);
        const data = await response.json();
        if (data.status === 'success') {
          setOrders(data.data);
        }
      } catch (error) {
        console.error('Error fetching P2P orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currency, type]);

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {type} orders available for {currency}
      </div>
    );
  }

  const getOrderTypeBadge = (orderType: string) => {
    const colors = {
      market: 'bg-blue-100 text-blue-800',
      limit: 'bg-purple-100 text-purple-800',
      stop_loss: 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge variant="secondary" className={colors[orderType as keyof typeof colors]}>
        {orderType.replace('_', '-')}
      </Badge>
    );
  };

  const getExpiryBadge = (expiry: string, expiresAt: string | null) => {
    if (expiry === 'gtc') {
      return (
        <Badge variant="outline">GTC</Badge>
      );
    }
    if (expiresAt) {
      return (
        <span className="text-sm text-muted-foreground">
          Expires {formatDistanceToNow(new Date(expiresAt))}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Order Book</h3>
        <Badge variant={type === 'buy' ? 'default' : 'destructive'} className="capitalize">
          {type}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Price (NGN)</TableHead>
            <TableHead>Amount ({currency})</TableHead>
            <TableHead>Total (NGN)</TableHead>
            <TableHead>Trader</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelect(order)}
            >
              <TableCell>
                {getOrderTypeBadge(order.order_type)}
                {order.post_only && (
                  <Badge variant="outline" className="ml-2">
                    Post Only
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="font-medium">₦{Number(order.price).toLocaleString()}</div>
                {order.trigger_price && (
                  <div className="text-sm text-muted-foreground">
                    Trigger: ₦{Number(order.trigger_price).toLocaleString()}
                  </div>
                )}
              </TableCell>
              <TableCell>{Number(order.amount).toLocaleString()} {currency}</TableCell>
              <TableCell>₦{(Number(order.amount) * Number(order.price)).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{order.user.username}</span>
                  <span className="text-sm text-muted-foreground">
                    {order.creator.completed_trades} trades
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {getExpiryBadge(order.expiry, order.expires_at)}
              </TableCell>
              <TableCell>
                <button
                  className="text-sm font-medium text-green-600 hover:text-green-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(order);
                  }}
                >
                  {type === 'buy' ? 'Sell' : 'Buy'}
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 