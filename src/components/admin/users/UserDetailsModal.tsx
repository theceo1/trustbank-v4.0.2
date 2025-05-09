'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { User } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsModal({ user, isOpen, onClose }: UserDetailsModalProps) {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleClose = () => {
    if (isMounted.current) {
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleClose}
    >
      <DialogContent className="sm:max-w-[425px]" aria-describedby="user-details-modal-desc">
        <DialogHeader>
          <DialogTitle id="user-details-modal-title">User Details</DialogTitle>
          <DialogDescription id="user-details-modal-desc">
            Detailed information about the selected user.
          </DialogDescription>
        </DialogHeader>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Role</p>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                  {user.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Last Login</p>
              <p className="text-sm text-muted-foreground">
                {new Date(user.lastLogin).toLocaleString()}
              </p>
            </div>
            {user.metadata && (
              <div>
                <p className="text-sm font-medium">Additional Information</p>
                <div className="text-sm text-muted-foreground">
                  <pre className="mt-2 w-full max-h-48 overflow-auto rounded-md bg-slate-950 p-4">
                    <code className="text-white">
                      {JSON.stringify(user.metadata, null, 2)}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}