import { WalletHeader } from '@/components/admin/wallets/WalletHeader';
import { WalletOverview } from '@/components/admin/wallets/WalletOverview';
import { WalletBalances } from '@/components/admin/wallets/WalletBalances';
import { WalletActions } from '@/components/admin/wallets/WalletActions';
import { TransactionLimits } from '@/components/admin/wallets/TransactionLimits';

export default function WalletsPage() {
  return (
    <div className="space-y-6">
      <WalletHeader />
      <div className="grid gap-6 md:grid-cols-2">
        <WalletOverview />
        <WalletActions />
      </div>
      <WalletBalances />
      <TransactionLimits />
    </div>
  );
} 