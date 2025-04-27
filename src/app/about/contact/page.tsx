//src/app/about/contact/page.tsx
'use client';

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, MapPin, MessageSquare, Loader2, Globe, Twitter, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import type { Database } from '@/lib/database.types';

const contactInfo = [
  { 
    icon: <Mail className="h-5 w-5" />, 
    text: "support@trustbank.tech",
    link: "mailto:support@trustbank.tech"
  },
  { 
    icon: <Globe className="h-5 w-5" />, 
    text: "@trustBanktech",
    link: "https://twitter.com/trustBanktech"
  },
  { 
    icon: <MapPin className="h-5 w-5" />, 
    text: "World Wide Web",
    link: null
  }
];

const socialLinks = [
  { 
    icon: <Twitter className="h-5 w-5" />, 
    href: "https://twitter.com/trustbanktech",
    color: "hover:text-blue-400"
  },
  { 
    icon: <Instagram className="h-5 w-5" />, 
    href: "https://instagram.com/trustbank.tech",
    color: "hover:text-pink-500"
  },
  { 
    icon: <Facebook className="h-5 w-5" />, 
    href: "https://facebook.com/trustbanktech",
    color: "hover:text-blue-600"
  }
];

export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createClientComponentClient<Database>();
      const { error } = await supabase
        .from('contact_messages')
        .insert([{ 
          name, 
          email, 
          message
        }]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setIsDialogOpen(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/50 dark:to-blue-950/50">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about our services? We're here to help and would love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full shadow-lg bg-green-50/50 dark:bg-green-900/20">
              <CardHeader>
                <CardTitle className="text-2xl">Contact Information</CardTitle>
                <CardDescription>Find us through any of these channels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 text-muted-foreground">
                      {item.icon}
                      {item.link ? (
                        <Link href={item.link} className="hover:text-green-600 transition-colors">
                          {item.text}
                        </Link>
                      ) : (
                        <span>{item.text}</span>
                      )}
                    </div>
                  ))}
                </div>
              
                <Card className="bg-white/50 dark:bg-gray-800/50">
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-2">Business Hours</h3>
                    <p className="text-sm text-muted-foreground">
                      Monday - Friday: 7:00 AM - 10:00 PM (WAT)<br />
                      Weekend: Available for emergencies
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <h3 className="font-medium">Connect With Us</h3>
                  <div className="flex space-x-4">
                    {socialLinks.map((social, index) => (
                      <Link 
                        key={index}
                        href={social.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={cn(
                          "text-muted-foreground transition-colors",
                          social.color
                        )}
                      >
                        {social.icon}
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="shadow-lg bg-blue-50/50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you shortly</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Input
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="How can we help?"
                      value={message}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                      required
                      className="min-h-[120px] bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-500 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thank You!</DialogTitle>
          </DialogHeader>
          <div className="text-center p-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-16 h-16 bg-green-600/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <MessageSquare className="h-8 w-8 text-green-600" />
            </motion.div>
            <p className="text-muted-foreground mb-4">
              We've received your message and will get back to you within 24 hours.
            </p>
            <p className="mb-6 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <span className="font-bold text-green-600">Signed:</span> Tony from trustBank
            </p>
            <Button 
              onClick={() => setIsDialogOpen(false)}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 