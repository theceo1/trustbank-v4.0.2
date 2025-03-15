"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, Download, Copy, Shield } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const securityQuestionsSchema = z.object({
  question1: z.string().min(1, "Please select a security question"),
  answer1: z.string().min(1, "Please provide an answer"),
  question2: z.string().min(1, "Please select a security question"),
  answer2: z.string().min(1, "Please provide an answer"),
  question3: z.string().min(1, "Please select a security question"),
  answer3: z.string().min(1, "Please provide an answer"),
});

type SecurityQuestionsFormValues = z.infer<typeof securityQuestionsSchema>;

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "In which city were you born?",
  "What was your mother's maiden name?",
  "What was the name of your first school?",
  "What was your childhood nickname?",
  "What is your favorite book?",
  "What was the make of your first car?",
  "What is your favorite movie?",
  "What is the name of the street you grew up on?",
  "What is your favorite sports team?"
];

export default function AccountRecoveryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const form = useForm<SecurityQuestionsFormValues>({
    resolver: zodResolver(securityQuestionsSchema),
  });

  const generateRecoveryCodes = async () => {
    setIsLoading(true);
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      
      if (!factorsData?.totp.length) {
        throw new Error("Please set up 2FA before generating recovery codes");
      }

      const totpFactor = factorsData.totp[0];
      
      const { data, error } = await supabase.auth.mfa.generateRecoveryCodes({
        factorId: totpFactor.id
      });

      if (error) throw error;

      setRecoveryCodes(data.codes);
      toast({
        title: "Success",
        description: "Recovery codes generated successfully.",
      });
    } catch (error) {
      console.error('Error generating recovery codes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate recovery codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      toast({
        title: "Copied",
        description: "Recovery codes copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy codes to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([recoveryCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'trustbank-recovery-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const onSubmit = async (values: SecurityQuestionsFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('security_questions')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          questions: [
            { question: values.question1, answer: values.answer1 },
            { question: values.question2, answer: values.answer2 },
            { question: values.question3, answer: values.answer3 },
          ],
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Security questions updated successfully.",
      });
    } catch (error) {
      console.error('Error saving security questions:', error);
      toast({
        title: "Error",
        description: "Failed to save security questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="h-6 w-6 text-green-600" />
              Account Recovery Options
            </CardTitle>
            <CardDescription>
              Set up recovery options to regain access to your account if needed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="codes" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="codes">Recovery Codes</TabsTrigger>
                <TabsTrigger value="questions">Security Questions</TabsTrigger>
              </TabsList>

              <TabsContent value="codes" className="space-y-4">
                <div className="space-y-4">
                  {recoveryCodes.length > 0 ? (
                    <>
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {recoveryCodes.map((code, index) => (
                            <code key={index} className="font-mono text-sm">
                              {code}
                            </code>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={copyToClipboard}
                          className="flex-1"
                          variant="outline"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Codes
                        </Button>
                        <Button
                          onClick={downloadCodes}
                          className="flex-1"
                          variant="outline"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Codes
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      onClick={generateRecoveryCodes}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-500 text-white"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate Recovery Codes
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="questions">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`question${num}` as keyof SecurityQuestionsFormValues}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Security Question {num}</FormLabel>
                              <FormControl>
                                <select
                                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                  {...field}
                                >
                                  <option value="">Select a question</option>
                                  {SECURITY_QUESTIONS.map((question) => (
                                    <option key={question} value={question}>
                                      {question}
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`answer${num}` as keyof SecurityQuestionsFormValues}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Answer {num}</FormLabel>
                              <FormControl>
                                <Input {...field} type="text" placeholder="Enter your answer" />
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
                      className="w-full bg-green-600 hover:bg-green-500 text-white"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Security Questions
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 