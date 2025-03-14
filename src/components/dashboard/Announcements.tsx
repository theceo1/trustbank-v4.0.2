'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Shield, ArrowRight, Gift, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface AnnouncementsProps {
  isVerified: boolean;
}

export default function Announcements({ isVerified }: AnnouncementsProps) {
  const announcements = [
    {
      id: 1,
      title: isVerified ? "Welcome to trustBank!" : "Complete Your Verification",
      description: isVerified
        ? "Start trading crypto with confidence. Explore our features and start your journey."
        : "Complete your KYC verification to unlock full trading features and higher limits.",
      icon: isVerified ? <Gift className="h-5 w-5" /> : <Shield className="h-5 w-5" />,
      action: isVerified
        ? { text: "Start Trading", href: "/trade" }
        : { text: "Verify Now", href: "/kyc" },
      type: isVerified ? "success" : "warning",
      priority: isVerified ? "low" : "high"
    },
    {
      id: 2,
      title: "Earn With Referrals",
      description: "Invite friends and earn up to 30% commission on their trading fees.",
      icon: <Gift className="h-5 w-5" />,
      action: { text: "Start Earning", href: "/profile?tab=referrals" },
      type: "info",
      priority: "medium"
    },
    {
      id: 3,
      title: "New Features Coming Soon",
      description: "Stay tuned for exciting new features including mobile trading and crypto card.",
      icon: <Zap className="h-5 w-5" />,
      action: { text: "Learn More", href: "/features" },
      type: "info",
      priority: "low"
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 border-gray-200 dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Bell className="h-5 w-5 text-green-600" />
          Announcements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start space-x-4 p-4 rounded-lg bg-white dark:bg-gray-800/50 shadow-sm">
                <div className={`
                  p-2 rounded-full
                  ${announcement.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : ''}
                  ${announcement.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20' : ''}
                  ${announcement.type === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' : ''}
                `}>
                  {announcement.icon}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{announcement.title}</p>
                    <Badge variant={
                      announcement.priority === 'high' ? 'destructive' :
                      announcement.priority === 'medium' ? 'secondary' :
                      'default'
                    }>
                      {announcement.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {announcement.description}
                  </p>
                  <div className="pt-2">
                    <Link href={announcement.action.href}>
                      <Button variant="link" className="h-auto p-0 text-green-600">
                        {announcement.action.text}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 