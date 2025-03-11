import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  type: z.enum(['limit', 'stop_loss']),
  orderSide: z.enum(['buy', 'sell']),
  currency: z.string(),
  amount: z.string().min(1),
  price: z.string().min(1),
  triggerPrice: z.string().optional(),
  expiry: z.enum(['1h', '24h', '3d', '7d', 'gtc']),
  postOnly: z.boolean().default(false),
});

interface AdvancedOrderFormProps {
  type: 'buy' | 'sell';
  currency: string;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
}

export function AdvancedOrderForm({ type, currency, onSubmit }: AdvancedOrderFormProps) {
  const [orderType, setOrderType] = useState<'limit' | 'stop_loss'>('limit');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'limit',
      orderSide: type,
      currency,
      amount: '',
      price: '',
      triggerPrice: '',
      expiry: 'gtc',
      postOnly: false,
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Type</FormLabel>
              <Select
                onValueChange={(value: 'limit' | 'stop_loss') => {
                  field.onChange(value);
                  setOrderType(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="limit">Limit Order</SelectItem>
                  <SelectItem value="stop_loss">Stop-Loss</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({currency})</FormLabel>
              <FormControl>
                <Input placeholder="0.00" {...field} />
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
              <FormLabel>{orderType === 'limit' ? 'Limit Price' : 'Stop Price'} (NGN)</FormLabel>
              <FormControl>
                <Input placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {orderType === 'stop_loss' && (
          <FormField
            control={form.control}
            name="triggerPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trigger Price (NGN)</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time In Force</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="3d">3 Days</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="gtc">Good Till Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {orderType === 'limit' && (
          <div className="flex items-center space-x-2">
            <FormField
              control={form.control}
              name="postOnly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Post Only</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Ensure the order is always the maker, never the taker
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
          Place {orderType === 'limit' ? 'Limit' : 'Stop-Loss'} Order
        </Button>
      </form>
    </Form>
  );
} 