'use client';

import { cn } from '@/lib/utils';
import { RefreshCcw } from 'lucide-react';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ 
  className,
  size = 'md',
  ...props 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className={cn('animate-spin', sizeClasses[size], className)} 
      {...props}
    >
      <RefreshCcw className="h-full w-full" />
    </div>
  );
} 