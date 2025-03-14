// src/app/auth/signup/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, User, ArrowLeft } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { useToast } from "@/components/ui/use-toast";

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams?.get('ref') || '';
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          referralCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      toast({
        title: "✅ Account Created Successfully",
        description: "Welcome to trustBank! Complete your KYC verification to start trading.",
      });

      router.replace('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const supabase = createClientComponentClient<Database>();
      
      toast({
        title: "Connecting to Google",
        description: "Please complete the Google sign-in process...",
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
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
    <div className="min-h-screen w-full flex relative overflow-hidden">
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
              className="absolute rounded-full bg-green-500/30 backdrop-blur-3xl"
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
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 10 + (i * 2),
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          );
        })}

        {/* Enhanced Gradient Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent"
          animate={{
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* Enhanced Grid Pattern */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(22, 163, 74, 0.2) 1px, transparent 0)`,
            backgroundSize: '50px 50px',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '50px 50px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Left Panel - Features */}
      <div className="hidden md:flex md:w-1/2 p-8 flex-col justify-between relative">
        <Link 
          href="/" 
          className="flex items-center text-green-600 hover:text-green-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-400">
              Welcome to trustBank
            </h1>
            <p className="text-lg text-muted-foreground">
              The trusted gateway to web 3.0
            </p>
            
            <div className="space-y-4 mt-8">
              {[
                { icon: Shield, text: "Bank-grade security protocols" },
                { icon: Lock, text: "End-to-end encryption" },
                { icon: User, text: "Personalized trading experience" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.2 }}
                  className="flex items-center space-x-3 text-muted-foreground"
                >
                  <div className="w-8 h-8 rounded-full bg-green-600/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-green-600" />
                  </div>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Sign Up Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-card-foreground">Create Account</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Unlock financial inclusion with <span className="text-green-600">trustBank</span>
              </p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        First Name
                      </Label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          className="pl-10"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Last Name
                      </Label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email-address" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <Input
                      id="email-address"
                      name="email"
                      type="email"
                      required
                      className="pl-10"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="pl-10"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="referral-code">Referral Code (Optional)</Label>
                    <Input
                      id="referral-code"
                      value={referralCode}
                      placeholder="Enter referral code"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to trustBank's{' '}
                      <Link href="/privacy-policy" className="text-green-600 hover:text-green-500 hover:underline">
                        Privacy Policy
                      </Link>{' '}
                      and{' '}
                      <Link href="/terms-of-service" className="text-green-600 hover:text-green-500 hover:underline">
                        Terms of Service
                      </Link>
                    </Label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-500 text-white transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center"
                  >
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating your account...</span>
                  </motion.div>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">OR</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full transition-all duration-200 transform hover:scale-[1.02] hover:bg-green-500 hover:text-white"
              >
                <FcGoogle className="h-4 w-4 mr-2" />
                Sign up with Google
              </Button>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-green-600 hover:text-green-500">
                  Log in
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}