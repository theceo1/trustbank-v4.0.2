"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InstantSwapModal } from "@/components/InstantSwapModal";
import type { ComponentType } from "react";
import {
  Wallet,
  Calculator,
  Eye,
  Target,
  Newspaper,
  Users,
  BookMarked,
  HelpCircle,
  Mail,
  Shield,
  FileText,
  GraduationCap,
  Headphones,
  AlertCircle,
  LineChart,
  ArrowLeftRight,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Cookie,
} from "lucide-react";
import { MetaLogo, SnapchatLogo, TikTokLogo, InstagramLogo, TwitterLogo, ThreadsLogo, TelegramLogo } from "../icons";
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useProfile } from '@/hooks/useProfile';

interface LinkItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  isNew?: boolean;
  onClick?: () => void;
}

interface SocialLink {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const socialLinks: SocialLink[] = [
  {
    name: "Meta",
    href: "https://facebook.com/trustBanktech",
    icon: MetaLogo,
  },
  {
    name: "Instagram",
    href: "https://instagram.com/trustBanktech",
    icon: InstagramLogo,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/trustBanktech",
    icon: TwitterLogo,
  },
  {
    name: "Telegram",
    href: "https://t.me/trustBanktech",
    icon: TelegramLogo,
  },
  {
    name: "Threads",
    href: "https://threads.net/@trustBanktech",
    icon: ThreadsLogo,
  },
  {
    name: "TikTok",
    href: "https://tiktok.com/@trustBanktech",
    icon: TikTokLogo,
  },
  {
    name: "Snapchat",
    href: "https://snapchat.com/add/trustBanktech",
    icon: SnapchatLogo,
  },
];

export function Footer() {
  const [showInstantSwap, setShowInstantSwap] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const { user, isInitialized: isAuthInitialized } = useAuth();
  const { profile, isInitialized: isProfileInitialized } = useProfile();
  const { toast } = useToast();

  const handleInstantSwap = async () => {
    try {
      console.log('[Footer] Checking session for instant swap...');
      if (!isAuthInitialized || !isProfileInitialized) {
        console.log('[Footer] Session or profile not yet initialized');
        toast({
          title: "Please wait",
          description: "Initializing your session...",
          className: "bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
        });
        return;
      }

      if (!user) {
        console.log('[Footer] No session found');
        toast({
          title: "Authentication Required",
          description: "Please sign in to access instant swap.",
          className: "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
        });
        return;
      }

      if (!profile?.quidax_id) {
        console.log('[Footer] No Quidax ID found');
        toast({
          title: "Account Setup Required",
          description: "Please wait while your account is being set up.",
          className: "bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
        });
        return;
      }
      
      console.log('[Footer] Opening swap modal');
      setShowInstantSwap(true);
    } catch (error) {
      console.error('[Footer] Error checking session:', error);
      toast({
        title: "Error",
        description: "Unable to verify authentication status. Please try again.",
        className: "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
      });
    }
  };

  const handleAuthenticatedNavigation = async (path: string) => {
    try {
      if (!isAuthInitialized || !isProfileInitialized) {
        toast({
          title: "Please wait",
          description: "Initializing your session...",
          className: "bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
        });
        return;
      }

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access this feature.",
          className: "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
        });
        return;
      }

      if (!profile?.quidax_id) {
        toast({
          title: "Account Setup Required",
          description: "Please wait while your account is being set up.",
          className: "bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
        });
        return;
      }

      router.push(path);
    } catch (error) {
      console.error('[Footer] Error in navigation:', error);
      toast({
        title: "Error",
        description: "Unable to navigate. Please try again.",
        className: "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
      });
    }
  };

  const quickLinks: LinkItem[] = [
    { name: "Market", href: "/market", icon: <LineChart className="w-4 h-4" /> },
    { 
      name: "Trade", 
      href: "#",
      icon: <ArrowLeftRight className="w-4 h-4" />,
      onClick: () => handleAuthenticatedNavigation('/trade')
    },
    { 
      name: "Wallet", 
      href: "#",
      icon: <Wallet className="w-4 h-4" />,
      onClick: () => handleAuthenticatedNavigation('/profile/wallet')
    },
    { name: "Calculator", href: "/calculator", icon: <Calculator className="w-4 h-4" /> },
    { 
      name: "Instant Swap", 
      href: "#", 
      icon: <ArrowLeftRight className="w-4 h-4" />,
      onClick: handleInstantSwap,
      isNew: true
    },
  ];

  const aboutLinks: LinkItem[] = [
    { name: "Vision", href: "/about/vision", icon: <Eye className="w-4 h-4" /> },
    { name: "Mission", href: "/about/mission", icon: <Target className="w-4 h-4" /> },
    { name: "Blog", href: "/about/blog", icon: <Newspaper className="w-4 h-4" /> },
    { name: "Team", href: "/about/team", icon: <Users className="w-4 h-4" /> },
    { name: "Careers", href: "/about/careers", icon: <BookMarked className="w-4 h-4" /> },
    { name: "Trade Guide", href: "/trade/guide", icon: <GraduationCap className="w-4 h-4" />, isNew: true },
  ];

  const supportLinks: LinkItem[] = [
    { name: "FAQ", href: "/about/faq", icon: <HelpCircle className="w-4 h-4" /> },
    { name: "Contact", href: "/about/contact", icon: <Mail className="w-4 h-4" /> },
    { name: "Academy", href: "/learn", icon: <GraduationCap className="w-4 h-4" /> },
    { name: "Support 24/7", href: "/support", icon: <Headphones className="w-4 h-4" /> },
    { name: "Status", href: "/status", icon: <AlertCircle className="w-4 h-4" /> },
  ];

  const legalLinks: LinkItem[] = [
    { name: "Terms", href: "/legal/terms", icon: <FileText className="w-4 h-4" /> },
    { name: "Privacy", href: "/legal/privacy", icon: <Shield className="w-4 h-4" /> },
    { name: "AML Policy", href: "/legal/aml", icon: <ShieldCheck className="w-4 h-4" /> },
    { name: "KYC Policy", href: "/legal/kyc", icon: <UserCheck className="w-4 h-4" /> },
    { name: "Risk", href: "/legal/risk", icon: <AlertTriangle className="w-4 h-4" /> },
    { name: "Cookies", href: "/legal/cookies", icon: <Cookie className="w-4 h-4" /> },
  ];

  return (
    <footer className="border-t bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-8">
          {/* Brand Section */}
          <div className="space-y-6 relative">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold">trustBank</span>
            </div>
            <p className="text-sm text-muted-foreground">
              We are <span className="text-green-600">Crypto | Simplified</span>. Making cryptocurrency trading accessible, secure, and efficient by simplifying crypto adoption in emerging markets.
            </p>
            <Button 
              variant="default" 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleAuthenticatedNavigation('/trade')}
            >
              Start Trading
            </Button>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <span className="text-sm font-medium">Refer & Earn</span>
              <Badge variant="secondary" className="bg-green-600 text-white">$50 USDT</Badge>
            </div>
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-green-500/50 to-transparent" />
          </div>

          {/* Quick Links */}
          <div className="space-y-6 relative">
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="grid gap-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  {link.onClick ? (
                    <button 
                      onClick={link.onClick}
                      className="flex items-center text-sm text-muted-foreground hover:text-green-600 transition-colors w-full"
                    >
                      {link.icon}
                      <span className="ml-3">{link.name}</span>
                      {link.isNew && <Badge variant="secondary" className="ml-2 bg-green-600/10 text-green-600">New</Badge>}
                    </button>
                  ) : (
                    <Link href={link.href} className="flex items-center text-sm text-muted-foreground hover:text-green-600 transition-colors">
                      {link.icon}
                      <span className="ml-3">{link.name}</span>
                      {link.isNew && <Badge variant="secondary" className="ml-2 bg-green-600/10 text-green-600">New</Badge>}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-green-500/50 to-transparent" />
          </div>

          {/* About */}
          <div className="space-y-6 relative">
            <h3 className="font-semibold">About</h3>
            <ul className="grid gap-3">
              {aboutLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="flex items-center text-sm text-muted-foreground hover:text-green-600 transition-colors">
                    {link.icon}
                    <span className="ml-3">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-green-500/50 to-transparent" />
          </div>

          {/* Support */}
          <div className="space-y-6 relative">
            <h3 className="font-semibold">Support</h3>
            <ul className="grid gap-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="flex items-center text-sm text-muted-foreground hover:text-green-600 transition-colors">
                    {link.icon}
                    <span className="ml-3">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-green-500/50 to-transparent" />
          </div>

          {/* Legal Links */}
          <div className="space-y-6">
            <h3 className="font-semibold">Legal</h3>
            <ul className="grid gap-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="flex items-center text-sm text-muted-foreground hover:text-green-600 transition-colors">
                    {link.icon}
                    <span className="ml-3">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-6">
          <p className="text-sm text-muted-foreground order-2 sm:order-1">
            © {new Date().getFullYear()} trustBank. All rights reserved.
          </p>

          <div className="flex items-center gap-6 order-1 sm:order-2">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-green-600 transition-colors"
                >
                  <span className="sr-only">{link.name}</span>
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground order-3">
            <Link href="/profile/security/2fa" className="hover:text-green-600">Security</Link>
          </div>
        </div>
      </div>

      {showInstantSwap && (
        <InstantSwapModal
          isOpen={showInstantSwap}
          onClose={() => setShowInstantSwap(false)}
        />
      )}
    </footer>
  );
} 