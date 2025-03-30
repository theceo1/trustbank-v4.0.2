//src/components/auth/SignUpForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { quidaxService } from '@/lib/quidax';
import { Icons } from '@/components/ui/icons';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { createUserAccount } from '@/app/actions/auth'
import { motion } from 'framer-motion';
import { Shield, Lock, User, EyeOff, Eye } from "lucide-react";

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  // Watch the password field to sync with confirm password
  const watchPassword = watch('password');
  useEffect(() => {
    setPassword(watchPassword || '');
  }, [watchPassword]);

  const onSubmit = async (data: SignUpFormData) => {
    if (!termsAccepted) {
      toast({
        title: "Terms & Conditions",
        description: "Please accept the Terms of Service and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Validate referral code if provided
      if (data.referralCode) {
        const { data: referralCheck } = await supabase
          .from('user_profiles')
          .select('referral_code')
          .eq('referral_code', data.referralCode)
          .single();

        if (!referralCheck) {
          toast({
            title: "Invalid Referral Code",
            description: "The referral code you entered is not valid.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      const result = await createUserAccount(data);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: 'Welcome to trustBank!',
        description: 'Your account has been created successfully.',
      });

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
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
              className="absolute rounded-full bg-green-500/40"
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
                opacity: [0.4, 0.5, 0.4],
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
      <div className="hidden md:flex md:w-1/2 p-8 flex-col justify-end pb-32 relative z-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-green-600">Welcome to trustBank</h1>
            <p className="text-2xl text-muted-foreground">The trusted gateway to web 3.0</p>
          </div>
          <div className="space-y-6 mt-8">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-green-600/10">
                <Icons.shield className="h-3 w-3 text-green-600" />
              </div>
              <p className="text-lg text-muted-foreground">Bank-grade security protocols</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-green-600/10">
                <Icons.lock className="h-3 w-3 text-green-600" />
              </div>
              <p className="text-lg text-muted-foreground">End-to-end encryption</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-green-600/10">
                <Icons.user className="h-3 w-3 text-green-600" />
              </div>
              <p className="text-lg text-muted-foreground">Personalized trading experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="space-y-6 bg-card/80 dark:bg-zinc-900/90 backdrop-blur-xl p-8 rounded-lg border border-border shadow-xl">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground text-center">Create Account</h2>
              <p className="text-sm text-muted-foreground text-center">
                Unlock financial inclusion with <span className="font-bold text-green-600">trustBank</span>
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    {...register('firstName')}
                    placeholder="First"
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    {...register('lastName')}
                    placeholder="Last"
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Input
                  {...register('email')}
                  placeholder="Email Address"
                  type="email"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Input
                    {...register('password')}
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    className="pr-10"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowPassword(!showPassword);
                      setShowConfirmPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Input
                    {...register('confirmPassword')}
                    placeholder="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    disabled={isLoading}
                    className="pr-10"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmPassword(!showConfirmPassword);
                      setShowPassword(!showConfirmPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <Input
                  {...register('referralCode')}
                  placeholder="Referral Code (Optional)"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600 focus:ring-offset-0 focus:ring-1"
                  required
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  I agree to trustBank's{" "}
                  <Link href="/legal/privacy" className="text-green-600 hover:text-green-700">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/legal/terms" className="text-green-600 hover:text-green-700">
                    Terms of Service
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading || !termsAccepted}
              >
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                className="w-full border-input hover:bg-green-600 hover:text-white transition-colors"
                onClick={() => {
                  supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    },
                  });
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-4 w-4" />
                )}
                Google
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-green-600 hover:text-green-700">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 