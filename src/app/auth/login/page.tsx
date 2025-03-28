'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { useToast } from "@/components/ui/use-toast";

// Waving hand animation variants
const waveVariants = {
  wave: {
    rotate: [0, 14, -8, 14, -4, 10, 0],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut"
    }
  }
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/dashboard';
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      toast({
        title: "Welcome back! 👋",
        description: "Successfully signed in to your account.",
      });

      router.replace(redirectTo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      setError(errorMessage);
      toast({
        title: "Error signing in",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClientComponentClient<Database>();
      
      toast({
        title: "Connecting to Google",
        description: "Please complete the sign in process in the popup window...",
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`
        }
      });

      if (error) throw error;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      setError(errorMessage);
      toast({
        title: "Google Sign-in Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 w-full z-0">
        {/* Floating Circles */}
        {[...Array(5)].map((_, i) => {
          const width = 150 + (i * 50);
          const height = 150 + (i * 50);
          const left = `${15 + (i * 20)}%`;
          const top = `${10 + (i * 15)}%`;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-green-500/20 dark:bg-green-500/20"
              style={{
                width,
                height,
                left,
                top,
              }}
              animate={{
                x: [0, 50, 0],
                y: [0, 30, 0],
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 10 + (i * 2),
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          );
        })}
      </div>

      {/* Left Panel - Welcome Message */}
      <div className="hidden md:flex md:w-1/2 p-8 flex-col justify-center relative z-10">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-foreground flex items-center gap-3">
            Hi there{' '}
            <motion.span
              variants={waveVariants}
              animate="wave"
              style={{ display: 'inline-block', originX: 0.7, originY: 0.7 }}
            >
              👋
            </motion.span>
          </h1>
          <div className="space-y-2">
            <p className="text-xl text-foreground">
              Welcome to <span className="text-green-500">trustBank</span>
            </p>
            <p className="text-muted-foreground text-lg">
              an ecosystem designed for real impact in emerging markets.
            </p>
            <p className="text-green-500 text-sm font-medium tracking-wider">
              CRYPTO | SIMPLIFIED
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="space-y-6 bg-card/80 dark:bg-zinc-900/90 backdrop-blur-xl p-8 rounded-lg border border-border">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Welcome Back</h2>
              <p className="text-sm text-muted-foreground">
                Continue your journey with <span className="text-green-600">trustBank</span>
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    required
                    className="bg-background/50 dark:bg-zinc-800/50 border-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    required
                    className="bg-background/50 dark:bg-zinc-800/50 border-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-green-500 hover:text-green-400"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card dark:bg-zinc-900 text-muted-foreground">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full border-input hover:bg-accent"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Sign in with Google
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-green-500 hover:text-green-400">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 