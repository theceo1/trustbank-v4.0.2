'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, Globe, CheckCircle2, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserData {
  name: string;
  email: string;
  phone: string;
  country: string;
  avatar?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  joinedDate: string;
  timezone: string;
  language: string;
}

interface ProfileInformationProps {
  userData: UserData;
}

export default function ProfileInformation({ userData }: ProfileInformationProps) {
  const [name, setName] = useState(userData.name);
  const [email, setEmail] = useState(userData.email);
  const [phone, setPhone] = useState(userData.phone);
  const [country, setCountry] = useState(userData.country);
  const [language, setLanguage] = useState(userData.language);
  const [timezone, setTimezone] = useState(userData.timezone);

  const getVerificationBadge = () => {
    switch (userData.verificationStatus) {
      case 'verified':
        return (
          <Badge className="bg-green-50 text-green-700">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            Unverified
          </Badge>
        );
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="relative h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {userData.avatar ? (
              <Image
                src={userData.avatar}
                alt={userData.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <span className="text-2xl">{userData.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{userData.name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{userData.email}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Email</label>
            <div className="mt-1 flex items-center space-x-2">
              <input
                type="email"
                value={userData.email}
                disabled
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <span className="text-xs text-green-500">Verified</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Phone</label>
            <div className="mt-1 flex items-center space-x-2">
              <input
                type="tel"
                value={userData.phone || 'Not set'}
                disabled
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <span className="text-xs text-yellow-500">Unverified</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Country</label>
            <input
              type="text"
              value={userData.country}
              disabled
              className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Verification Status</label>
            <input
              type="text"
              value={userData.verificationStatus.charAt(0).toUpperCase() + userData.verificationStatus.slice(1)}
              disabled
              className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Joined Date</label>
            <input
              type="text"
              value={userData.joinedDate}
              disabled
              className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Timezone</label>
            <input
              type="text"
              value={userData.timezone}
              disabled
              className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Language</label>
            <input
              type="text"
              value={userData.language}
              disabled
              className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      </div>
    </Card>
  );
} 