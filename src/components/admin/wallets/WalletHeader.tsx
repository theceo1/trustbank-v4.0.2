import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function WalletHeader() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Wallets</CardTitle>
        <CardDescription>
          Manage system wallets, monitor balances, and handle transactions across all supported cryptocurrencies.
        </CardDescription>
      </CardHeader>
    </Card>
  );
} 