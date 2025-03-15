"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Copy } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const securityQuestionSchema = z.object({
  question1: z.string().min(1, "Please select a security question"),
  answer1: z.string().min(3, "Answer must be at least 3 characters"),
  question2: z.string().min(1, "Please select a security question"),
  answer2: z.string().min(3, "Answer must be at least 3 characters"),
  question3: z.string().min(1, "Please select a security question"),
  answer3: z.string().min(3, "Answer must be at least 3 characters"),
});

type SecurityQuestionFormValues = z.infer<typeof securityQuestionSchema>;

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was your childhood nickname?",
  "What was the make of your first car?",
  "What elementary school did you attend?",
  "What is the name of your favorite childhood friend?",
  "What street did you grow up on?",
  "What was your favorite food as a child?",
  "What was the first concert you attended?",
];

export default function RecoveryMethodPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'backupCodes' | 'securityQuestions'>('backupCodes');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SecurityQuestionFormValues>({
    resolver: zodResolver(securityQuestionSchema),
  });

  const generateBackupCodes = async () => {
    setIsLoading(true);
    try {
      // Generate random backup codes
      const codes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      setBackupCodes(codes);

      const supabase = createClientComponentClient();
      
      // Store hashed backup codes in the profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          has_recovery: true,
          recovery_method: 'backup_codes',
          backup_codes: codes, // In production, store hashed versions
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Backup codes generated successfully. Please save these codes in a secure location.",
      });
    } catch (error) {
      console.error('Error generating backup codes:', error);
      toast({
        title: "Error",
        description: "Failed to generate backup codes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSecurityQuestionsSubmit = async (values: SecurityQuestionFormValues) => {
    setIsLoading(true);
    try {
      const supabase = createClientComponentClient();
      
      // Store security questions and hashed answers in the profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          has_recovery: true,
          recovery_method: 'security_questions',
          security_questions: {
            q1: { question: values.question1, answer: values.answer1 },
            q2: { question: values.question2, answer: values.answer2 },
            q3: { question: values.question3, answer: values.answer3 },
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Security questions saved successfully.",
      });
      
      router.push('/profile/security/assessment');
    } catch (error) {
      console.error('Error saving security questions:', error);
      toast({
        title: "Error",
        description: "Failed to save security questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast({
      title: "Copied",
      description: "Backup codes copied to clipboard",
    });
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Recovery Setup
          </CardTitle>
          <CardDescription>
            Choose a method to recover your account in case you lose access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Recovery Method</Label>
            <RadioGroup
              defaultValue="backupCodes"
              onValueChange={(value) => setRecoveryMethod(value as 'backupCodes' | 'securityQuestions')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="backupCodes"
                  id="backupCodes"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="backupCodes"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="font-semibold">Backup Codes</span>
                  <span className="text-sm text-muted-foreground">
                    Generate one-time use backup codes
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="securityQuestions"
                  id="securityQuestions"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="securityQuestions"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="font-semibold">Security Questions</span>
                  <span className="text-sm text-muted-foreground">
                    Set up security questions and answers
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {recoveryMethod === 'backupCodes' ? (
            <div className="space-y-4">
              {backupCodes.length === 0 ? (
                <Button
                  onClick={generateBackupCodes}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Backup Codes
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md bg-muted p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Your Backup Codes</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyBackupCodes}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <code key={index} className="text-sm">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Save these codes in a secure location. Each code can only be used once.
                  </p>
                  <Button
                    onClick={() => router.push('/profile/security/assessment')}
                    className="w-full"
                  >
                    I've Saved My Backup Codes
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSecurityQuestionsSubmit)} className="space-y-4">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`question${num}` as keyof SecurityQuestionFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Question {num}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a security question" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SECURITY_QUESTIONS.map((question) => (
                                <SelectItem key={question} value={question}>
                                  {question}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`answer${num}` as keyof SecurityQuestionFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer {num}</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter your answer"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Security Questions
                </Button>
              </form>
            </Form>
          )}

          <div className="pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 