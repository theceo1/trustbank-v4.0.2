'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Globe, CheckCircle2, Clock } from 'lucide-react';

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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-100 dark:border-green-900">
        <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-800 shadow-lg">
          {userData.avatar ? (
            <AvatarImage src={userData.avatar} alt={userData.name} />
          ) : (
            <AvatarFallback className="text-3xl bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
              {userData.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{userData.name}</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>{userData.email}</span>
          </div>
          <div className="flex items-center gap-2">
            {getVerificationBadge()}
            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
              Member since {userData.joinedDate}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={userData.email} disabled />
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  Verified
                </Badge>
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={userData.phone || 'Not set'} disabled />
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                  Unverified
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-600" />
              Location & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Country</Label>
              <Select disabled value={userData.country}>
                <SelectTrigger>
                  <SelectValue placeholder={userData.country} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={userData.country}>{userData.country}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select disabled value={userData.language}>
                <SelectTrigger>
                  <SelectValue placeholder={userData.language} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={userData.language}>{userData.language}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Verification Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  value={userData.verificationStatus.charAt(0).toUpperCase() + userData.verificationStatus.slice(1)} 
                  disabled 
                />
                {getVerificationBadge()}
              </div>
            </div>
            <div>
              <Label>Member Since</Label>
              <Input value={userData.joinedDate} disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Time Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Timezone</Label>
              <Input value={userData.timezone} disabled />
            </div>
            <div>
              <Label>Last Updated</Label>
              <Input value="Just now" disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 