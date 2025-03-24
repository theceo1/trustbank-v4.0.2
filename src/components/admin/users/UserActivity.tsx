import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Activity {
  id: string;
  type: 'login' | 'transaction' | 'kyc' | 'profile_update' | 'password_change';
  description: string;
  timestamp: string;
  ipAddress?: string;
  status: 'success' | 'failed' | 'pending';
}

interface UserActivityProps {
  userId: string;
}

// Mock data - replace with actual API call
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'login',
    description: 'Successful login from Chrome on Windows',
    timestamp: '2024-03-20T10:00:00Z',
    ipAddress: '192.168.1.1',
    status: 'success',
  },
  {
    id: '2',
    type: 'transaction',
    description: 'Initiated transfer of $1,000 to Jane Smith',
    timestamp: '2024-03-19T15:30:00Z',
    status: 'pending',
  },
  {
    id: '3',
    type: 'kyc',
    description: 'Submitted KYC documents for verification',
    timestamp: '2024-03-18T09:15:00Z',
    status: 'success',
  },
];

export function UserActivity({ userId }: UserActivityProps) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'login':
        return '🔐';
      case 'transaction':
        return '💸';
      case 'kyc':
        return '📄';
      case 'profile_update':
        return '👤';
      case 'password_change':
        return '🔑';
      default:
        return '📝';
    }
  };

  const getStatusBadge = (status: Activity['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const loadMore = async () => {
    setLoading(true);
    // TODO: Implement pagination
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockActivities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getActivityIcon(activity.type)}</span>
                    <span className="capitalize">{activity.type.replace('_', ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p>{activity.description}</p>
                    {activity.ipAddress && (
                      <p className="text-sm text-muted-foreground">
                        IP: {activity.ipAddress}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(activity.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{getStatusBadge(activity.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={loadMore}
          disabled={loading}
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 