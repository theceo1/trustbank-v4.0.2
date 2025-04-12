'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Coins, 
  ArrowLeftRight, 
  Store, 
  Mail, 
  Check,
  Smartphone,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import { cn } from '@/lib/utils';

const products = [
  {
    id: 'exchange',
    icon: <ArrowLeftRight className="h-6 w-6 text-green-600" />,
    title: "trustExchange",
    description: "A secure and intuitive cryptocurrency exchange platform",
    features: [
      "Instant buy/sell of cryptocurrencies",
      "Advanced trading features",
      "Deep liquidity pools",
      "Multiple payment methods",
      "24/7 customer support"
    ],
    image: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 'coin',
    icon: <Coins className="h-6 w-6 text-green-600" />,
    title: "trustCoin (Coming Soon)",
    description: "Our native digital currency powering the ecosystem",
    features: [
      "Reduced trading fees",
      "Governance rights",
      "Staking rewards",
      "Cross-border transfers",
      "Merchant payments"
    ],
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 'card',
    icon: <CreditCard className="h-6 w-6 text-green-600" />,
    title: "trustCard (Coming Soon)",
    description: "Spend your crypto assets anywhere, anytime",
    features: [
      "Virtual and physical cards",
      "Zero foreign transaction fees",
      "Instant crypto-to-fiat conversion",
      "Worldwide acceptance",
      "Cashback rewards"
    ],
    image: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 'pos',
    icon: <Store className="h-6 w-6 text-green-600" />,
    title: "trustPOS (Coming Soon)",
    description: "Next-generation point of service solution for merchants",
    features: [
      "Accept crypto payments",
      "Real-time settlement",
      "Analytics dashboard",
      "Multi-currency support",
      "Integration APIs"
    ],
    image: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800"
  }
];

const benefits = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Multi-Currency Support",
    description: "80+ cryptocurrencies available"
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Bank-Grade Security",
    description: "Multi-layer protection"
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "Mobile First",
    description: "Seamless mobile experience"
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Instant Settlements",
    description: "Real-time transactions"
  }
];

export default function VisionPage() {
  const [email, setEmail] = useState('');
  const [activeProduct, setActiveProduct] = useState('exchange');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClientComponentClient<Database>();

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
            source: 'vision_page',
            preferences: { interests: ['product_updates'] },
            metadata: { subscribed_from: 'vision' }
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
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">Our Vision</Badge>
          <h1 className="text-lg md:text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
            The Future of Finance
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Building a comprehensive suite of financial products for the crypto economy
          </p>
        </motion.div>

        {/* Benefits Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "border-none shadow-lg hover:shadow-xl transition-all",
                index % 4 === 0 && "bg-green-50/50 dark:bg-green-900/20",
                index % 4 === 1 && "bg-blue-50/50 dark:bg-blue-900/20",
                index % 4 === 2 && "bg-purple-50/50 dark:bg-purple-900/20",
                index % 4 === 3 && "bg-orange-50/50 dark:bg-orange-900/20"
              )}>
                <CardContent className="pt-6 text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Products Section */}
        <div className="mb-16">
          <Tabs value={activeProduct} onValueChange={setActiveProduct}>
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
              {products.map((product) => (
                <TabsTrigger key={product.id} value={product.id} className="gap-2">
                  {product.icon}
                  <span className="hidden md:inline">{product.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {products.map((product) => (
              <TabsContent key={product.id} value={product.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <div className="grid md:grid-cols-2 gap-6 p-6">
                      <div className="space-y-6">
                        <div>
                          <CardTitle className="text-2xl mb-2">{product.title}</CardTitle>
                          <CardDescription>{product.description}</CardDescription>
                        </div>
                        <ul className="space-y-3">
                          {product.features.map((feature, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center gap-2"
                            >
                              <Check className="h-5 w-5 text-green-600" />
                              <span>{feature}</span>
                            </motion.li>
                          ))}
                        </ul>
                        <Button className="bg-green-600 hover:bg-green-500">
                          Learn More
                        </Button>
                      </div>
                      <div className="relative h-[300px] rounded-lg overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-green-600/20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Stay Updated</CardTitle>
              <CardDescription>
                Be the first to know about new features and product launches
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
                  {isSubmitting ? 'Subscribing...' : 'Subscribe for Updates'}
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