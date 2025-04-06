'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatNumber } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowUpDown, MoreVertical, UserCheck, UserX, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

interface UserStats {
  totalTransactions: number;
  totalVolume: number;
  successfulTransactions: number;
  failedTransactions: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  status: string;
  role: string;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  stats: UserStats;
  kycStatus?: string;
  verificationLevel?: string;
  profileImage?: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingUsers: number;
  totalTransactions: number;
  totalVolume: number;
  averageTransactionVolume: number;
  kycCompletionRate?: number;
  userGrowth?: number;
}

interface ApiResponse {
  users: User[];
  stats: DashboardStats;
  pagination: {
    total: number;
    page: number;
    perPage: number;
  };
}

interface Column {
  id: string;
  label: string;
  sortable?: boolean;
  visible: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [columns, setColumns] = useState<Column[]>([
    { id: 'user', label: 'User', visible: true },
    { id: 'status', label: 'Status', sortable: true, visible: true },
    { id: 'kycStatus', label: 'KYC Status', visible: true },
    { id: 'transactions', label: 'Transactions', sortable: true, visible: true },
    { id: 'volume', label: 'Volume', sortable: true, visible: false },
    { id: 'last_sign_in_at', label: 'Last Login', sortable: true, visible: true },
    { id: 'created_at', label: 'Joined', sortable: true, visible: true },
    { id: 'actions', label: 'Actions', visible: true }
  ]);
  
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const defaultStats = {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingUsers: 0
  };

  const defaultPagination = {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  };

  useEffect(() => {
    fetchUsers();
  }, [search, status, kycFilter, sortField, sortOrder, page, pageSize]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page.toString(),
        pageSize: pageSize.toString(),
        source: 'auth.users', // Explicitly request auth.users table
        ...(search && { search }),
        ...(status && { status }),
        ...(kycFilter && { kycStatus: kycFilter }),
        sortBy: sortField,
        sortOrder
      };

      console.log('[Users Page] Requesting all users from auth.users table with params:', params);
      
      const apiUrl = `/api/admin/users?${new URLSearchParams(params)}`;
      console.log('[Users Page] Full API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('[Users Page] Response status:', response.status);
      
      const data = await response.json();
      console.log('[Users Page] API returned:', {
        userCount: data.users?.length,
        totalUsers: data.pagination?.total,
        firstUserId: data.users?.[0]?.id,
        stats: data.stats
      });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
      setStats({
        ...defaultStats,
        ...data.stats,
        totalUsers: data.pagination?.total || 0
      });
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);

    } catch (error) {
      console.error('[Users Page] Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    let dbField = field;
    // Map frontend fields to database fields
    switch (field) {
      case 'transactions':
        dbField = 'user_profiles.completed_trades';
        break;
      case 'volume':
        dbField = 'user_profiles.trading_volume_usd';
        break;
      case 'status':
        dbField = 'user_profiles.status';
        break;
      case 'last_sign_in_at':
      case 'created_at':
        dbField = `users.${field}`;
        break;
    }

    if (sortField === dbField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(dbField);
      setSortOrder('asc');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update user status');

      toast({
        title: 'Success',
        description: `User status updated to ${newStatus}`,
      });

      fetchUsers(); // Refresh user list
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'border-gray-500 text-gray-500 dark:border-gray-400 dark:text-gray-400';
    switch (status.toLowerCase()) {
      case 'verified':
        return 'border-green-500 text-green-500 dark:border-green-400 dark:text-green-400';
      case 'pending':
        return 'border-yellow-500 text-yellow-500 dark:border-yellow-400 dark:text-yellow-400';
      case 'rejected':
        return 'border-red-500 text-red-500 dark:border-red-400 dark:text-red-400';
      case 'suspended':
        return 'border-red-500 text-red-500 dark:border-red-400 dark:text-red-400';
      default:
        return 'border-gray-500 text-gray-500 dark:border-gray-400 dark:text-gray-400';
    }
  };

  const getKycStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'border-green-500 text-green-500 dark:border-green-400 dark:text-green-400';
      case 'pending':
        return 'border-yellow-500 text-yellow-500 dark:border-yellow-400 dark:text-yellow-400';
      case 'rejected':
        return 'border-red-500 text-red-500 dark:border-red-400 dark:text-red-400';
      default:
        return 'border-gray-500 text-gray-500 dark:border-gray-400 dark:text-gray-400';
    }
  };

  const toggleColumn = (columnId: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <div className="text-green-600 dark:text-green-400">
              {stats?.userGrowth && stats.userGrowth > 0 && `+${stats.userGrowth}%`}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : formatNumber(stats?.totalUsers || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <div className="text-green-600 dark:text-green-400">
              {stats?.activeUsers && stats.totalUsers && 
                `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%`}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : formatNumber(stats?.activeUsers || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Completion</CardTitle>
            <div className="text-green-600 dark:text-green-400">
              {stats?.kycCompletionRate && `${Math.round(stats.kycCompletionRate)}%`}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : formatNumber(stats?.totalTransactions || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : `₦${formatNumber(stats?.totalVolume || 0)}`}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm bg-background"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-950 border-2">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-950 border-2">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={kycFilter} onValueChange={setKycFilter}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-950 border-2">
              <SelectValue placeholder="Filter by KYC" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-950 border-2">
              <SelectItem value="all">All KYC Status</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-950 border-2">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-950 border-2">
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-gray-950 border-2">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.visible}
                  onCheckedChange={() => toggleColumn(column.id)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchUsers}
            className="hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="relative">
        <ScrollArea className="h-[600px] rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-muted/50">
                {columns.map((column) => 
                  column.visible && (
                    <TableHead key={column.id}>
                      {column.sortable ? (
                        <div 
                          className="flex items-center gap-2 cursor-pointer" 
                          onClick={() => handleSort(column.id)}
                        >
                          {column.label}
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      ) : column.label}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-muted/50">
                    {columns.filter(col => col.visible).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={columns.filter(col => col.visible).length} 
                    className="text-center py-8"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    {columns.map((column) => {
                      if (!column.visible) return null;
                      
                      switch (column.id) {
                        case 'user':
                          return (
                            <TableCell key={column.id}>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={user.profileImage} />
                                  <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                          );
                        case 'status':
                          return (
                            <TableCell key={column.id}>
                              <Badge variant="outline" className={getStatusColor(user.status)}>
                                {user.status || 'Inactive'}
                              </Badge>
                            </TableCell>
                          );
                        case 'kycStatus':
                          return (
                            <TableCell key={column.id}>
                              <Badge variant="outline" className={getKycStatusColor(user.kycStatus)}>
                                {user.kycStatus || 'Pending'}
                              </Badge>
                            </TableCell>
                          );
                        case 'transactions':
                          return (
                            <TableCell key={column.id}>
                              {formatNumber(user.stats?.totalTransactions || 0)}
                            </TableCell>
                          );
                        case 'volume':
                          return (
                            <TableCell key={column.id}>
                              ₦{formatNumber(user.stats?.totalVolume || 0)}
                            </TableCell>
                          );
                        case 'last_sign_in_at':
                          return (
                            <TableCell key={column.id}>
                              {formatDate(user.lastLogin)}
                            </TableCell>
                          );
                        case 'created_at':
                          return (
                            <TableCell key={column.id}>
                              {formatDate(user.createdAt)}
                            </TableCell>
                          );
                        case 'actions':
                          return (
                            <TableCell key={column.id}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'active')}>
                                    <UserCheck className="mr-2 h-4 w-4" /> Activate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'suspended')}>
                                    <UserX className="mr-2 h-4 w-4" /> Suspend
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          );
                        default:
                          return null;
                      }
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {users.length} of {totalRecords} users
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            showFirstLast
          />
        </div>
      </Card>

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.profileImage} />
                  <AvatarFallback>{selectedUser.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={getStatusColor(selectedUser.status)}>
                    {selectedUser.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">KYC Status</p>
                  <Badge className={getKycStatusColor(selectedUser.kycStatus)}>
                    {selectedUser.kycStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Transactions</p>
                  <p className="font-medium">{formatNumber(selectedUser.stats?.totalTransactions || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Volume</p>
                  <p className="font-medium">₦{formatNumber(selectedUser.stats?.totalVolume || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="font-medium">{formatDate(selectedUser.lastLogin)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}