import { useState } from 'react';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Upload } from 'lucide-react';

interface UserKYCProps {
  user: User;
}

export function UserKYC({ user }: UserKYCProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    // TODO: Implement KYC verification
    setIsVerifying(false);
  };

  const handleReject = async () => {
    // TODO: Implement KYC rejection
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>KYC Status</CardTitle>
          <CardDescription>
            Verify user's identity documents and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(user.kyc?.status || 'pending')}
              <span className="font-medium">
                {user.kyc?.status ? (
                  <>
                    KYC {getStatusBadge(user.kyc.status)}
                    {user.kyc.verifiedAt && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        on {new Date(user.kyc.verifiedAt).toLocaleDateString()}
                      </span>
                    )}
                  </>
                ) : (
                  'KYC not submitted'
                )}
              </span>
            </div>
            {user.kyc?.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={isVerifying}
                >
                  Reject
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={isVerifying}
                >
                  Verify
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {user.kyc?.documents && user.kyc.documents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {user.kyc.documents.map((doc, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {doc.type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(doc.status)}
                    {getStatusBadge(doc.status)}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      View Document
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No documents uploaded yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 