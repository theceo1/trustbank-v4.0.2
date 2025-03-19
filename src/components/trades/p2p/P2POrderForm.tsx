import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAYMENT_METHODS = [
  { 
    id: 'bank_transfer', 
    label: 'Bank Transfer',
    icon: 'bank',
    description: 'Direct bank transfer to a Nigerian bank account'
  },
  {
    id: 'ussd',
    label: 'USSD Transfer',
    icon: 'phone',
    description: 'Transfer using your bank\'s USSD code'
  },
  {
    id: 'mobile_money',
    label: 'Mobile Money',
    icon: 'smartphone',
    description: 'Popular mobile payment services in Nigeria'
  },
  {
    id: 'crypto',
    label: 'Other Crypto',
    icon: 'bitcoin',
    description: 'Pay with other cryptocurrencies'
  }
];

const formSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  price: z.string().min(1, 'Price is required'),
  min_order: z.string().min(1, 'Minimum order amount is required'),
  max_order: z.string().min(1, 'Maximum order amount is required'),
  payment_methods: z.array(z.string()).min(1, 'Select at least one payment method'),
  terms: z.string().optional(),
}).refine((data) => {
  const min = parseFloat(data.min_order);
  const max = parseFloat(data.max_order);
  return min <= max;
}, {
  message: "Minimum order amount must be less than maximum order amount",
  path: ["min_order"]
}).refine((data) => {
  const amount = parseFloat(data.amount);
  const max = parseFloat(data.max_order);
  return max <= amount;
}, {
  message: "Maximum order amount must be less than total amount",
  path: ["max_order"]
});

interface P2POrderFormProps {
  type: 'buy' | 'sell';
  currency: string;
}

export function P2POrderForm({ type, currency }: P2POrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      price: '',
      min_order: '',
      max_order: '',
      payment_methods: [],
      terms: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/trades/p2p/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          currency,
          amount: values.amount,
          price: values.price,
          min_order: values.min_order,
          max_order: values.max_order,
          payment_methods: values.payment_methods.map(method => ({
            type: method,
            details: '', // User can update details later
          })),
          terms: values.terms || '',
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Order Created', {
          description: `Your ${type} order has been created successfully.`,
        });
        form.reset();
      } else {
        throw new Error(data.error || 'Failed to create order');
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                  <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the cryptocurrency you want to trade
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (NGN)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter price in Naira" 
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Enter the price in Nigerian Naira (NGN) per unit of cryptocurrency
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Amount</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter total amount" 
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Enter the total amount of cryptocurrency you want to trade
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="min_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Order</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter minimum order amount" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Minimum amount that can be traded in a single order
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Order</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter maximum order amount" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Maximum amount that can be traded in a single order
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms & Instructions</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter your terms and instructions for the trade" 
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add any specific terms, conditions, or instructions for the trade
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_methods"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Methods</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment methods" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the payment methods you accept for this trade
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
          Create {type === 'buy' ? 'Buy' : 'Sell'} Order
        </Button>
      </form>
    </Form>
  );
} 