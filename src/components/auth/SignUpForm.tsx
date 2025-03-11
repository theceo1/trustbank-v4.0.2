'use client';

import { useState } from 'react';
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
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

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

      // 1. Create Supabase user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (authError) throw authError;

      // 2. Create Quidax sub-account
      const quidaxUser = await quidaxService.createSubAccount({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
      });

      // 3. Update user profile with Quidax ID
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            quidax_id: quidaxUser.id,
            quidax_sn: quidaxUser.sn,
          })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: 'Welcome to TrustBank!',
        description: 'Your account has been created successfully.',
      });

      // 4. Redirect to dashboard
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
    <div className="grid min-h-screen grid-cols-2">
      {/* Left side - Welcome content */}
      <div className="relative flex items-center justify-center p-8">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-background/50" />
        <div className="relative z-10 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-green-600">Welcome to trustBank</h1>
            <p className="text-xl text-muted-foreground">The trusted gateway to web 3.0</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Icons.shield className="h-6 w-6 text-green-600" />
              <p className="text-lg text-muted-foreground">Bank-grade security protocols</p>
            </div>
            <div className="flex items-center gap-3">
              <Icons.lock className="h-6 w-6 text-green-600" />
              <p className="text-lg text-muted-foreground">End-to-end encryption</p>
            </div>
            <div className="flex items-center gap-3">
              <Icons.user className="h-6 w-6 text-green-600" />
              <p className="text-lg text-muted-foreground">Personalized trading experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Create Account</h1>
            <p className="text-sm text-muted-foreground">
              Unlock financial inclusion with trustBank
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
              <Input
                {...register('password')}
                placeholder="Password"
                type="password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Input
                {...register('confirmPassword')}
                placeholder="Confirm Password"
                type="password"
                disabled={isLoading}
              />
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
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                required
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to TrustBank's{" "}
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
              className="w-full"
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
  );
} 