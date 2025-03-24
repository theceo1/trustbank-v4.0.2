'use client';

import { useState } from 'react';
import { UserList } from '@/components/admin/users/UserList';
import { UserFilters } from '@/components/admin/users/UserFilters';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

export default function UsersPage() {
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: '',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            View and manage user accounts and permissions
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      <UserFilters filters={filters} onFilterChange={setFilters} />
      <UserList filters={filters} />
    </div>
  );
} 