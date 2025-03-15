'use client';

import { Button } from "@/components/ui/button";
import { Moon, Sun, ArrowLeftRight, Loader2, X } from "lucide-react";
import Link from "next/link";
import type { User } from '@supabase/auth-helpers-nextjs';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  theme: string;
  setTheme: (theme: string) => void;
  onSignOut: () => Promise<void>;
  loading: boolean;
  isSigningOut: boolean;
  handleInstantSwap: () => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  user,
  theme,
  setTheme,
  onSignOut,
  loading,
  isSigningOut,
  handleInstantSwap,
}: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-full mx-auto px-4 flex flex-col">
        {/* Fixed Header Section */}
        <div className="py-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="font-bold text-xl" onClick={onClose}>
              trustBank
            </Link>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-start h-12 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-400"
            onClick={() => {
              handleInstantSwap();
              onClose();
            }}
          >
            <ArrowLeftRight className="h-5 w-5 mr-2" />
            Instant Swap
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Primary Navigation */}
            <div className="space-y-3">
              <Link
                href="/market"
                className="flex items-center h-12 px-4 text-lg rounded-md hover:bg-accent"
                onClick={onClose}
              >
                Market
              </Link>
              <Link
                href="/calculator"
                className="flex items-center h-12 px-4 text-lg rounded-md hover:bg-accent"
                onClick={onClose}
              >
                Calculator
              </Link>
            </div>

            {/* Authenticated User Navigation */}
            {!loading && user && (
              <div className="space-y-3 pt-3 border-t border-border">
                <Link
                  href="/dashboard"
                  className="flex items-center h-12 px-4 text-lg rounded-md hover:bg-accent"
                  onClick={onClose}
                >
                  Dashboard
                </Link>
                <Link
                  href="/trade"
                  className="flex items-center h-12 px-4 text-lg rounded-md hover:bg-accent"
                  onClick={onClose}
                >
                  Trade
                </Link>
              </div>
            )}

            {/* User Account Section */}
            {!loading && user && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Account
                </div>
                <div className="space-y-1">
                  <Link
                    href="/profile"
                    className="flex items-center h-10 px-4 text-base rounded-md hover:bg-accent"
                    onClick={onClose}
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/kyc"
                    className="flex items-center h-10 px-4 text-base rounded-md hover:bg-accent"
                    onClick={onClose}
                  >
                    KYC Verification
                  </Link>
                  <Link
                    href="/profile/wallet"
                    className="flex items-center h-10 px-4 text-base rounded-md hover:bg-accent"
                    onClick={onClose}
                  >
                    Wallet
                  </Link>
                  <Link
                    href="/profile/security"
                    className="flex items-center h-10 px-4 text-base rounded-md hover:bg-accent"
                    onClick={onClose}
                  >
                    Security
                  </Link>
                  <Link
                    href="/features"
                    className="flex items-center h-10 px-4 text-base rounded-md hover:bg-accent"
                    onClick={onClose}
                  >
                    Features
                  </Link>
                </div>
              </div>
            )}

            {/* About Section */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                About
              </div>
              <div className="space-y-1">
                <Link
                  href="/about/blog"
                  className="flex items-center h-10 px-4 text-base rounded-md hover:bg-accent"
                  onClick={onClose}
                >
                  Blog
                </Link>
                <Link
                  href="/about/mission"
                  className="flex items-center h-10 px-4 text-base rounded-md hover:bg-accent"
                  onClick={onClose}
                >
                  Mission
                </Link>
                <Link
                  href="/about/vision"
                  className="flex items-center h-10 px-4 text-base rounded-md hover:bg-accent"
                  onClick={onClose}
                >
                  Vision
                </Link>
                <Link
                  href="/about/contact"
                  className="flex items-center h-10 px-4 text-base rounded-md hover:bg-accent"
                  onClick={onClose}
                >
                  Contact Us
                </Link>
                <Link
                  href="/about/faq"
                  className="flex items-center h-10 px-4 text-base rounded-md hover:bg-accent"
                  onClick={onClose}
                >
                  FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="py-4 space-y-4 border-t border-border">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="lg"
            className="w-full justify-start h-12"
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              onClose();
            }}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 mr-2" />
            ) : (
              <Moon className="h-5 w-5 mr-2" />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>

          {/* Authentication Buttons */}
          {user ? (
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start h-12"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                "Sign Out"
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-12"
                asChild
              >
                <Link href="/auth/login" onClick={onClose}>
                  Sign In
                </Link>
              </Button>
              <Button
                size="lg"
                className="w-full h-12 bg-green-600 hover:bg-green-700"
                asChild
              >
                <Link href="/auth/signup" onClick={onClose}>
                  Get Started
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 