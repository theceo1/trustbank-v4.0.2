import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

export default function HomePage() {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            Your Trusted Cryptocurrency Exchange Platform
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Trade cryptocurrencies securely and easily. Buy, sell, and manage your digital assets with confidence.
          </p>
          <div className="space-x-4">
            <Link href="/auth/register">
              <Button className="bg-green-600 hover:bg-green-700 text-white">Get Started</Button>
            </Link>
            <Link href="/about">
              <Button variant="outline">Learn More</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container space-y-6 py-8 dark:bg-transparent md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Features
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Everything you need to manage your cryptocurrency investments
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <Icons.arrowUpDown className="h-12 w-12 text-green-600" />
              <div className="space-y-2">
                <h3 className="font-bold">Instant Trading</h3>
                <p className="text-sm text-muted-foreground">
                  Trade cryptocurrencies instantly with competitive rates
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <Icons.shield className="h-12 w-12 text-green-600" />
              <div className="space-y-2">
                <h3 className="font-bold">Secure Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Your assets are stored in secure cold storage
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <Icons.user className="h-12 w-12 text-green-600" />
              <div className="space-y-2">
                <h3 className="font-bold">KYC Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Fast and secure identity verification process
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
