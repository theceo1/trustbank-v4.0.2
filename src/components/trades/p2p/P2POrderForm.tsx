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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

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
  payment_methods: z.array(z.string()).min(1, 'Select at least one payment method'),
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
      payment_methods: [],
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
          amount: parseFloat(values.amount),
          price: parseFloat(values.price),
          payment_methods: values.payment_methods.map(method => ({
            type: method,
            details: '', // User can update details later
          })),
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({currency})</FormLabel>
              <FormControl>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="any"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price per {currency}</FormLabel>
              <FormControl>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="any"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_methods"
          render={() => (
            <FormItem>
              <FormLabel>Payment Methods</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <FormField
                    key={method.id}
                    control={form.control}
                    name="payment_methods"
                    render={({ field }) => (
                      <FormItem
                        key={method.id}
                        className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(method.id)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              if (checked) {
                                field.onChange([...value, method.id]);
                              } else {
                                field.onChange(value.filter((v) => v !== method.id));
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="text-base font-medium">
                            {method.label}
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
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