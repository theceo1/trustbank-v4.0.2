'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import type { Database } from '@/types/database';
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function P2PTradeListPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting user:', error);
        toast({
          title: "Error",
          description: "Failed to get user information. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase.auth, toast]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('p2p_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch orders. Please try again.",
          variant: "destructive"
        });
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, supabase, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">P2P Trading</h1>
        {user && (
          <Button asChild>
            <Link href="/trade/p2p/create">Create Order</Link>
          </Button>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p>No P2P orders found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {order.type === 'buy' ? 'Buy' : 'Sell'} {order.currency}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Price: {order.price} {order.fiat_currency}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Amount: {order.amount} {order.currency}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/trade/p2p/${order.id}`)}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 