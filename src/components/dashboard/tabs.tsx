import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function DashboardTabs() {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview" asChild>
          <Link href="/app/dashboard">Overview</Link>
        </TabsTrigger>
        <TabsTrigger value="transactions" asChild>
          <Link href="/app/dashboard/transactions">Transactions</Link>
        </TabsTrigger>
        <TabsTrigger value="analytics" asChild>
          <Link href="/app/dashboard/analytics">Analytics</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
} 