import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
  UserCheck,
  FileText,
  Key,
  LogIn,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

export function UserActivity({ userId }: UserActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activity`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity data');
      }
      const data = await response.json();
      setActivities(data.activities);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'login':
        return <LogIn className="h-4 w-4" />;
      case 'transaction':
        return <Activity className="h-4 w-4" />;
      case 'kyc':
        return <UserCheck className="h-4 w-4" />;
      case 'profile_update':
        return <FileText className="h-4 w-4" />;
      case 'password_change':
        return <Key className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Activity['status']) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'success':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Recent user activities and system events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-gray-500">No activities found</p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0"
              >
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                    {activity.ipAddress && (
                      <p className="text-xs text-gray-500">from {activity.ipAddress}</p>
                    )}
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 