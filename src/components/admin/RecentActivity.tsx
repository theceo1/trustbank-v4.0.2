'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RecentActivityProps {
  className?: string;
}

const activities = [
  {
    id: 1,
    type: 'transfer',
    amount: 1250.00,
    currency: 'USD',
    from: 'John Doe',
    to: 'Jane Smith',
    status: 'completed',
    timestamp: '2 minutes ago',
  },
  {
    id: 2,
    type: 'deposit',
    amount: 5000.00,
    currency: 'USD',
    from: 'External Bank',
    to: 'Michael Brown',
    status: 'completed',
    timestamp: '15 minutes ago',
  },
  {
    id: 3,
    type: 'withdrawal',
    amount: 750.00,
    currency: 'USD',
    from: 'Sarah Wilson',
    to: 'External Account',
    status: 'pending',
    timestamp: '45 minutes ago',
  },
  {
    id: 4,
    type: 'transfer',
    amount: 2500.00,
    currency: 'USD',
    from: 'David Lee',
    to: 'Emma Davis',
    status: 'completed',
    timestamp: '1 hour ago',
  },
];

export function RecentActivity({ className }: RecentActivityProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.type === 'transfer' ? 'Transfer' :
                   activity.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.from} → {activity.to}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {activity.type === 'deposit' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={activity.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                    ${activity.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 