'use client';

import { SwapForm } from '@/components/trades/swap/SwapForm';
import { SwapHistory } from '@/components/trades/swap/SwapHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { KYCBanner } from '@/components/trades/KYCBanner';

export default function SwapClient() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <KYCBanner />
      
      <Card>
        <CardHeader>
          <CardTitle>Instant Swap</CardTitle>
        </CardHeader>
        <CardContent>
          <SwapForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Swap History</CardTitle>
        </CardHeader>
        <CardContent>
          <SwapHistory />
        </CardContent>
      </Card>
    </motion.div>
  );
}