import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Ban, CheckCircle, AlertTriangle } from 'lucide-react';

interface UserActionsProps {
  userId: string;
  userStatus: string;
  onActionComplete: () => void;
}

export function UserActions({ userId, userStatus, onActionComplete }: UserActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'suspend' | 'verify' | 'unsuspend' | null>(null);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    if (!selectedAction) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: selectedAction,
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to perform action');
      }

      toast({
        title: 'Success',
        description: `User has been ${selectedAction}ed successfully.`,
      });

      onActionComplete();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to perform action',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
      setReason('');
    }
  };

  const openDialog = (action: 'suspend' | 'verify' | 'unsuspend') => {
    setSelectedAction(action);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="flex gap-2">
        {userStatus === 'suspended' ? (
          <Button
            variant="outline"
            onClick={() => openDialog('unsuspend')}
            className="border-green-200 hover:border-green-300"
          >
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            Unsuspend
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => openDialog('suspend')}
            className="border-red-200 hover:border-red-300"
          >
            <Ban className="w-4 h-4 mr-2 text-red-600" />
            Suspend
          </Button>
        )}

        {userStatus !== 'verified' && (
          <Button
            variant="outline"
            onClick={() => openDialog('verify')}
            className="border-blue-200 hover:border-blue-300"
          >
            <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
            Verify
          </Button>
        )}
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAction === 'suspend' && 'Suspend User'}
              {selectedAction === 'unsuspend' && 'Unsuspend User'}
              {selectedAction === 'verify' && 'Verify User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAction === 'suspend' && (
                <>
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <p>Are you sure you want to suspend this user? This will prevent them from accessing their account.</p>
                </>
              )}
              {selectedAction === 'unsuspend' && (
                <>
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p>Are you sure you want to unsuspend this user? This will restore their account access.</p>
                </>
              )}
              {selectedAction === 'verify' && (
                <>
                  <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <p>Are you sure you want to verify this user? This will grant them full account privileges.</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <Textarea
              placeholder="Please provide a reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isLoading || !reason.trim()}
              className={
                selectedAction === 'suspend'
                  ? 'bg-red-600 hover:bg-red-700'
                  : selectedAction === 'verify'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 