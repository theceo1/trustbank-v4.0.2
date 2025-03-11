import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"

interface Wallet {
  id: string
  currency: string
  balance: string
  address: string | null
}

interface WalletCardProps {
  wallet: Wallet
}

export function WalletCard({ wallet }: WalletCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {wallet.currency.toUpperCase()}
        </CardTitle>
        <Icons.wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{wallet.balance}</div>
        {wallet.address && (
          <p className="text-xs text-muted-foreground truncate">
            {wallet.address}
          </p>
        )}
      </CardContent>
    </Card>
  )
} 