import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { KYCSubmission } from '@/types/admin';
import { Permission } from '@/lib/rbac';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

export function KYCManagement() {
  const { permissions } = useAdmin();
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [selectedStatus]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/admin/users/kyc?status=${selectedStatus}`);
      const data = await response.json();
      setSubmissions(data.submissions);
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch KYC submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (submission: KYCSubmission) => {
    setSelectedSubmission(submission);
    setReviewDialog(true);
  };

  const handleAction = async (action: 'approved' | 'rejected') => {
    if (!selectedSubmission) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/users/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          action,
          reason: reviewNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process KYC action');
      }

      toast({
        title: 'Success',
        description: `KYC submission ${action} successfully`,
      });

      setReviewDialog(false);
      setReviewNotes('');
      fetchSubmissions();
    } catch (error) {
      console.error('Error processing KYC action:', error);
      toast({
        title: 'Error',
        description: 'Failed to process KYC action',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Verifications</CardTitle>
        <CardDescription>Manage user KYC verification requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{submission.user_profiles.full_name}</div>
                    <div className="text-sm text-gray-500">{submission.user_profiles.email}</div>
                  </div>
                </TableCell>
                <TableCell>{submission.document_type}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'}`}>
                    {submission.status}
                  </span>
                </TableCell>
                <TableCell>
                  {submission.status === 'pending' && permissions.includes(Permission.APPROVE_KYC) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReview(submission)}
                    >
                      Review
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review KYC Submission</DialogTitle>
              <DialogDescription>
                Review the user's KYC documents and approve or reject the submission.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedSubmission?.document_urls.map((url, index) => (
                <div key={index} className="aspect-video relative">
                  <img
                    src={url}
                    alt={`KYC Document ${index + 1}`}
                    className="rounded-lg object-cover w-full h-full"
                  />
                </div>
              ))}

              <Textarea
                placeholder="Add review notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setReviewDialog(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAction('rejected')}
                disabled={processing}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleAction('approved')}
                disabled={processing}
              >
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 