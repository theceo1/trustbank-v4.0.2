'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, getUserRoleAndPermissions } from '@/lib/rbac';

export default function RBACTest() {
  const { user } = useAuth();
  const [roleInfo, setRoleInfo] = useState<{
    role: string;
    permissions: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setError('No user logged in');
        setLoading(false);
        return;
      }

      try {
        const { role, permissions } = await getUserRoleAndPermissions(user.id);
        setRoleInfo({
          role,
          permissions
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!roleInfo) return <div>No role information available</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">RBAC Test Results</h2>
      
      <div className="space-y-2">
        <h3 className="text-xl">User Role</h3>
        <p className="font-mono bg-gray-100 p-2 rounded">{roleInfo.role}</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl">Permissions</h3>
        <ul className="list-disc pl-5 space-y-1">
          {roleInfo.permissions.map((permission) => (
            <li key={permission} className="font-mono">
              {permission}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl">Common Actions Test</h3>
        <ul className="space-y-2">
          {Object.values(Permission).map((permission) => (
            <li 
              key={permission}
              className={`p-2 rounded ${
                roleInfo.permissions.includes(permission)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {permission}: {roleInfo.permissions.includes(permission) ? '✅' : '❌'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 