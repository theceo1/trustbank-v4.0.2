'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/components/ui/use-toast'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { quidaxService } from '@/lib/quidax'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const formSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
})

interface OnboardingFormProps {
  user: User
}

export function OnboardingForm({ user }: OnboardingFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      // Create Quidax sub-account
      const quidaxUser = await quidaxService.createSubAccount({
        email: user.email!,
        first_name: values.first_name,
        last_name: values.last_name,
      })

      if (!quidaxUser?.id) {
        console.error('Failed to create Quidax account:', quidaxUser)
        throw new Error('Failed to complete account setup')
      }

      // Update user profile with Quidax ID
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          quidax_id: quidaxUser.id,
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
          email: user.email,
        })

      if (updateError) {
        throw updateError
      }

      toast({
        title: 'Registration complete!',
        description: 'Your trading account has been set up successfully.',
      })

      router.push('/profile/wallet')
    } catch (error: any) {
      console.error('Registration error:', error)
      toast({
        title: 'Registration failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+234..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Complete Registration
        </Button>
      </form>
    </Form>
  )
} 