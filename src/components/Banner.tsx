import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function Banner() {
  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-gradient-to-r from-primary/20 to-primary/5">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-x-2">
        <span className="font-medium">Welcome to trustBank!</span>
        <span>Trade with confidence on the most secure crypto ecosystem for emerging markets.</span>
      </AlertDescription>
    </Alert>
  );
} 