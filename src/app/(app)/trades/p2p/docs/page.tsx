import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function P2PDocsPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">P2P Trading Documentation</h1>
        <p className="text-muted-foreground">Learn how to use our P2P trading platform effectively.</p>
      </div>

      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList>
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="order-types">Order Types</TabsTrigger>
          <TabsTrigger value="trading-guide">Trading Guide</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started">
          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Welcome to P2P Trading</h2>
              <div className="prose dark:prose-invert">
                <p>
                  Our P2P trading platform allows you to buy and sell cryptocurrencies directly with other users.
                  This guide will help you understand how to use the platform effectively and safely.
                </p>
                
                <h3>Key Features</h3>
                <ul>
                  <li>Direct trading with other users</li>
                  <li>Multiple payment methods</li>
                  <li>Advanced order types</li>
                  <li>Secure escrow system</li>
                  <li>Detailed analytics</li>
                </ul>

                <h3>Getting Started</h3>
                <ol>
                  <li>Complete your KYC verification</li>
                  <li>Add your preferred payment methods</li>
                  <li>Browse the order book</li>
                  <li>Place your first trade</li>
                </ol>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="order-types">
          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Order Types</h2>
              <div className="prose dark:prose-invert">
                <h3>Market Orders</h3>
                <p>
                  Market orders are executed immediately at the best available price. These are the simplest
                  type of orders and are best for quick trades.
                </p>

                <h3>Limit Orders</h3>
                <p>
                  Limit orders allow you to set a specific price at which you want to buy or sell. The order
                  will only be executed when the market reaches your specified price.
                </p>
                <ul>
                  <li><strong>Post Only:</strong> Ensures your order is always the maker, never the taker</li>
                  <li><strong>Time in Force:</strong> Specify how long your order should remain active</li>
                </ul>

                <h3>Stop-Loss Orders</h3>
                <p>
                  Stop-loss orders help protect your position by automatically executing when the price reaches
                  a specified trigger level.
                </p>
                <ul>
                  <li><strong>Trigger Price:</strong> The price at which your order becomes active</li>
                  <li><strong>Stop Price:</strong> The price at which your order will be executed</li>
                </ul>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trading-guide">
          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Trading Guide</h2>
              <div className="prose dark:prose-invert">
                <h3>Before Trading</h3>
                <ul>
                  <li>Verify the trader's reputation and completion rate</li>
                  <li>Check supported payment methods</li>
                  <li>Review the trade terms carefully</li>
                  <li>Ensure you have sufficient funds</li>
                </ul>

                <h3>During the Trade</h3>
                <ol>
                  <li>Confirm the trade details</li>
                  <li>Wait for escrow confirmation</li>
                  <li>Make or receive payment</li>
                  <li>Confirm payment receipt</li>
                  <li>Release escrow or receive crypto</li>
                </ol>

                <h3>Best Practices</h3>
                <ul>
                  <li>Only use supported payment methods</li>
                  <li>Keep all communication on-platform</li>
                  <li>Follow the platform's dispute resolution process</li>
                  <li>Never release escrow before confirming payment</li>
                </ul>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Security Guidelines</h2>
              <div className="prose dark:prose-invert">
                <h3>Account Security</h3>
                <ul>
                  <li>Enable two-factor authentication</li>
                  <li>Use a strong, unique password</li>
                  <li>Never share your login credentials</li>
                  <li>Keep your recovery codes safe</li>
                </ul>

                <h3>Trading Security</h3>
                <ul>
                  <li>Verify payment confirmation before releasing escrow</li>
                  <li>Double-check wallet addresses</li>
                  <li>Keep records of all transactions</li>
                  <li>Report suspicious behavior immediately</li>
                </ul>

                <h3>Dispute Resolution</h3>
                <p>
                  If you encounter any issues during a trade, follow these steps:
                </p>
                <ol>
                  <li>Contact the other party through the platform</li>
                  <li>If unresolved, open a dispute ticket</li>
                  <li>Provide all relevant evidence</li>
                  <li>Wait for moderator review</li>
                  <li>Follow the moderator's decision</li>
                </ol>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 