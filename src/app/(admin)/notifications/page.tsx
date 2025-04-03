'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, Info } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: 'alert',
    title: 'System Alert',
    message: 'High transaction volume detected',
    time: '5 minutes ago',
    icon: AlertTriangle,
    color: 'bg-yellow-500'
  },
  {
    id: 2,
    type: 'success',
    title: 'KYC Verification',
    message: 'New KYC submission requires review',
    time: '10 minutes ago',
    icon: CheckCircle,
    color: 'bg-green-500'
  },
  {
    id: 3,
    type: 'info',
    title: 'System Update',
    message: 'New system update available',
    time: '1 hour ago',
    icon: Info,
    color: 'bg-blue-500'
  }
];

export default function AdminNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Button variant="outline" size="sm">
          <Bell className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className="flex items-start space-x-4 p-4 rounded-lg border"
                >
                  <div className={`p-2 rounded-full ${notification.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{notification.title}</p>
                      <Badge variant="outline">{notification.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 