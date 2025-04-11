"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, ChevronDown, Menu, X, Loader2, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { MobileMenu } from "./MobileMenu";
import { useModal } from "@/hooks/use-modal";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@supabase/auth-helpers-nextjs';
import { InstantSwapModal } from "@/components/InstantSwapModal";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const waveAnimation = `
@keyframes wave {
  0% { transform: rotate(0deg); }
  20% { transform: rotate(-10deg); }
  40% { transform: rotate(12deg); }
  60% { transform: rotate(-10deg); }
  80% { transform: rotate(12deg); }
  100% { transform: rotate(0deg); }
}
.wave {
  display: inline-block;
  animation: wave 2.5s infinite;
  transform-origin: 70% 70%;
}
` as const;

export function Header() {
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { onOpen } = useModal();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  
  const { user, isInitialized: isAuthInitialized } = useAuth();
  const { profile, isInitialized: isProfileInitialized } = useProfile();

  const handleInstantSwap = async () => {
    try {
      console.log('[Header] Checking session for instant swap...');
      if (!isAuthInitialized || !isProfileInitialized) {
        console.log('[Header] Session or profile not yet initialized');
        toast({
          title: "Please wait",
          description: "Initializing your session...",
          className: "bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
        });
        return;
      }

      if (!user) {
        console.log('[Header] No session found');
        toast({
          title: "Authentication Required",
          description: "Please sign in to access instant swap.",
          className: "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
        });
        return;
      }

      if (!profile?.quidax_id) {
        console.log('[Header] No Quidax ID found');
        toast({
          title: "Account Setup Required",
          description: "Please wait while your account is being set up.",
          className: "bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
        });
        return;
      }
      
      console.log('[Header] Opening swap modal');
      setIsSwapModalOpen(true);
    } catch (error) {
      console.error('[Header] Error checking session:', error);
      toast({
        title: "Error",
        description: "Unable to verify authentication status. Please try again.",
        className: "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
      });
    }
  };

  useEffect(() => {
    setLoading(!isAuthInitialized || !isProfileInitialized);
  }, [isAuthInitialized, isProfileInitialized]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      toast({
        title: "Goodbye! 👋",
        description: "You have been successfully signed out.",
        className: "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
      });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('[Header] Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <style jsx global>{waveAnimation}</style>
      <header className="sticky top-0 z-[60] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="font-bold text-xl">
                trustBank
              </Link>
              {/* Show instant swap button for all users */}
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex h-8 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-400"
                onClick={handleInstantSwap}
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Instant Swap
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center space-x-2 md:hidden">
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-400"
                onClick={handleInstantSwap}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
              <button
                onClick={toggleMenu}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/market" 
                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/market' ? 'text-green-600' : ''}`}
              >
                Market
              </Link>
              <Link 
                href="/calculator" 
                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/calculator' ? 'text-green-600' : ''}`}
              >
                Calculator
              </Link>
              <Link 
                href="/trade/guide" 
                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/trade/guide' ? 'text-green-600' : ''}`}
              >
                Trade Guide
              </Link>

              {/* Links only for authenticated users */}
              {!loading && user && (
                <>
                  <Link 
                    href="/dashboard" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/dashboard' ? 'text-green-600' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/trade" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/trade' ? 'text-green-600' : ''}`}
                  >
                    Trade
                  </Link>
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8">
                    About <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/about/blog">Blog</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/about/mission">Mission</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/about/vision">Vision</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/about/contact">Contact Us</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/about/faq">FAQ</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                className="h-8 w-8"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              {loading ? (
                <Button variant="ghost" size="sm" disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={
                        pathname?.startsWith('/profile') || 
                        pathname === '/kyc' || 
                        pathname === '/features'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : ''
                      }
                    >
                      Profile
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/profile" 
                        className={pathname === '/profile' ? 'text-green-600' : ''}
                      >
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/kyc" 
                        className={pathname === '/kyc' ? 'text-green-600' : ''}
                      >
                        KYC
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/profile/wallet" 
                        className={pathname === '/profile/wallet' ? 'text-green-600' : ''}
                      >
                        Wallet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/profile/security/2fa" 
                        className={pathname === '/profile/security/2fa' ? 'text-green-600' : ''}
                      >
                        Security
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/features" 
                        className={pathname === '/features' ? 'text-green-600' : ''}
                      >
                        Features
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex items-center justify-between"
                    >
                      <span>Sign Out</span>
                      {isSigningOut && <Loader2 className="h-4 w-4 animate-spin" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" asChild>
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={toggleMenu}
        user={user}
        theme={theme || 'light'}
        setTheme={setTheme}
        onSignOut={handleSignOut}
        loading={loading}
        isSigningOut={isSigningOut}
        handleInstantSwap={handleInstantSwap}
      />

      <InstantSwapModal 
        isOpen={isSwapModalOpen} 
        onClose={() => setIsSwapModalOpen(false)} 
      />
    </>
  );
} 