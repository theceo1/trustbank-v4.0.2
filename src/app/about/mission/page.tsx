'use client';

import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Heart, Shield, Zap, Mail, ArrowRight, Check, Users, Wallet, Building } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import { cn } from "@/lib/utils";

const stats = [
  { 
    value: '1.4B', 
    label: 'Unbanked Adults Globally',
    description: 'People without access to basic financial services'
  },
  { 
    value: '57%', 
    label: 'Mobile Internet Users',
    description: 'In emerging markets with potential crypto access'
  },
  { 
    value: '$500B+', 
    label: 'Remittance Market',
    description: 'Annual cross-border payments in emerging markets'
  },
  { 
    value: '95%', 
    label: 'Transaction Cost Reduction',
    description: 'Potential savings using crypto vs traditional methods'
  },
];

const impactAreas = [
  {
    icon: <Users className="h-6 w-6 text-green-600" />,
    title: "Financial Inclusion",
    description: "Bringing banking services to the underserved populations in emerging markets."
  },
  {
    icon: <Wallet className="h-6 w-6 text-green-600" />,
    title: "Affordable Remittances",
    description: "Reducing the cost of sending money across borders for millions of families."
  },
  {
    icon: <Building className="h-6 w-6 text-green-600" />,
    title: "Economic Growth",
    description: "Fostering entrepreneurship and business development through accessible financial tools."
  },
  {
    icon: <Shield className="h-6 w-6 text-green-600" />,
    title: "Secure Transactions",
    description: "Providing safe and transparent financial services to protect users' assets."
  }
];

const challenges = [
  {
    title: "Limited Banking Access",
    description: "2.5 billion people in emerging markets lack access to traditional banking",
    solution: "Mobile-first crypto solutions"
  },
  {
    title: "High Transaction Costs",
    description: "Average remittance fees of 6.5% eat into crucial family support",
    solution: "Near-zero crypto transfer fees"
  },
  {
    title: "Financial Education",
    description: "65% of adults in developing economies are financially illiterate",
    solution: "Built-in learning resources"
  }
];

export default function MissionPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const controls = useAnimation();

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    controls.start(i => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2 }
    }));
  }, [controls]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: subscribeError } = await supabase
        .from('newsletter_subscribers')
        .insert([
          {
            email,
            source: 'mission_page',
            preferences: { interests: ['financial_inclusion', 'crypto_adoption'] },
            metadata: { subscribed_from: 'mission' }
          }
        ]);

      if (subscribeError) throw subscribeError;

      setSuccess(true);
      setEmail('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      console.error('Subscription error:', error);
      if (error.code === '23505') {
        setError('This email is already subscribed to our newsletter.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/50 dark:to-blue-950/50">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">Our Mission</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
            Simplifying Crypto Adoption
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Making cryptocurrency accessible and useful for everyone in emerging markets
          </p>
        </motion.div>

        {/* Impact Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {stats.map((stat, index) => (
            <Card key={stat.label} className={cn(
              "shadow-lg transition-all hover:shadow-xl",
              index % 4 === 0 && "bg-green-50/50 dark:bg-green-900/20",
              index % 4 === 1 && "bg-blue-50/50 dark:bg-blue-900/20",
              index % 4 === 2 && "bg-purple-50/50 dark:bg-purple-900/20",
              index % 4 === 3 && "bg-orange-50/50 dark:bg-orange-900/20"
            )}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600 mb-2">{stat.value}</div>
                <div className="font-medium mb-2">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Impact Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {impactAreas.map((area, index) => (
            <motion.div
              key={area.title}
              custom={index}
              initial={{ opacity: 0, y: 20 }}
              animate={controls}
            >
              <Card className={cn(
                "shadow-lg transition-all hover:shadow-xl",
                index % 3 === 0 && "bg-green-50/50 dark:bg-green-900/20",
                index % 3 === 1 && "bg-blue-50/50 dark:bg-blue-900/20",
                index % 3 === 2 && "bg-purple-50/50 dark:bg-purple-900/20"
              )}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {area.icon}
                    <CardTitle className="text-lg">{area.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{area.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Challenges and Solutions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-center mb-8">Challenges We're Solving</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {challenges.map((challenge, index) => (
              <Card key={challenge.title} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  <CardDescription>{challenge.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">{challenge.solution}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="overflow-hidden border-2 border-green-600/20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Join Our Mission</CardTitle>
              <CardDescription>
                Be part of the movement to bring financial freedom to emerging markets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Subscribing...'
                  ) : (
                    <span className="flex items-center gap-2">
                      Join the Movement <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-green-600"
                  >
                    <Check className="h-5 w-5" />
                    <span>Successfully subscribed!</span>
                  </motion.div>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 