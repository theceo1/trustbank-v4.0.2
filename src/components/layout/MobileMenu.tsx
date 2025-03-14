'use client';

import { Button } from "@/components/ui/button";
import { Moon, Sun, ArrowLeftRight } from "lucide-react";
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
}: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-4">
          {/* Common links for both authenticated and unauthenticated users */}
          <Button
            variant="outline"
            size="sm"
            className="justify-start h-8 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-400"
            onClick={onClose}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Instant Swap
          </Button>
          <Link
            href="/market"
            className="text-lg font-medium"
            onClick={onClose}
          >
            Market
          </Link>
          <Link
            href="/calculator"
            className="text-lg font-medium"
            onClick={onClose}
          >
            Calculator
          </Link>

          {/* Links only for authenticated users */}
          {!loading && user && (
            <>
              <Link
                href="/dashboard"
                className="text-lg font-medium"
                onClick={onClose}
              >
                Dashboard
              </Link>
              <Link
                href="/trade"
                className="text-lg font-medium"
                onClick={onClose}
              >
                Trade
              </Link>
            </>
          )}

          {/* About section */}
          <div className="space-y-4 pt-4 border-t">
            <Link
              href="/about/blog"
              className="text-lg font-medium block"
              onClick={onClose}
            >
              Blog
            </Link>
            <Link
              href="/about/mission"
              className="text-lg font-medium block"
              onClick={onClose}
            >
              Mission
            </Link>
            <Link
              href="/about/vision"
              className="text-lg font-medium block"
              onClick={onClose}
            >
              Vision
            </Link>
            <Link
              href="/about/contact"
              className="text-lg font-medium block"
              onClick={onClose}
            >
              Contact Us
            </Link>
            <Link
              href="/about/faq"
              className="text-lg font-medium block"
              onClick={onClose}
            >
              FAQ
            </Link>
          </div>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              onClose();
            }}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="ml-2">{theme === "dark" ? "Light" : "Dark"} Mode</span>
          </Button>

          {/* User section */}
          {user ? (
            <div className="space-y-4 pt-4 border-t">
              <Link
                href="/profile"
                className="text-lg font-medium"
                onClick={onClose}
              >
                My Profile
              </Link>
              <Link
                href="/kyc"
                className="text-lg font-medium"
                onClick={onClose}
              >
                KYC Verification
              </Link>
              <Link
                href="/profile/wallet"
                className="text-lg font-medium"
                onClick={onClose}
              >
                Wallet
              </Link>
              <Link
                href="/profile/security"
                className="text-lg font-medium"
                onClick={onClose}
              >
                Security
              </Link>
              <Link
                href="/features"
                className="text-lg font-medium"
                onClick={onClose}
              >
                Features
              </Link>
              <Button
                variant="ghost"
                className="justify-start w-full"
                onClick={onSignOut}
                disabled={isSigningOut}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-2 pt-4 border-t">
              <Button variant="ghost" asChild className="w-full justify-start">
                <Link href="/auth/login" onClick={onClose}>
                  Sign In
                </Link>
              </Button>
              <Button asChild className="w-full justify-start bg-green-600 hover:bg-green-700">
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