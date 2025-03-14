"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, ArrowRight, Sparkles, Clock, 
  Wallet, CreditCard, Users, DollarSign,
  BarChart3, Shield, Gift, Smartphone,
  Gem, Zap, PiggyBank, CoinsIcon,
  Globe, Percent, Award, Landmark
} from "lucide-react";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from "@/lib/utils";

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  link?: string;
  bgColor?: string;
  icon?: React.ReactNode;
  comingSoon?: {
    date: string;
    progress: number;
  };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      // Enhanced features list with icons and more details
      const features = [
        {
          id: 'instant-trades',
          name: 'Instant Trades',
          description: 'Execute trades instantly with competitive rates and minimal slippage. Access deep liquidity pools and get the best prices.',
          enabled: true,
          icon: <Zap className="h-5 w-5" />
        },
        {
          id: 'limit-orders',
          name: 'Advanced Trading',
          description: 'Place limit, stop-loss, and take-profit orders. Use advanced charting tools and technical indicators.',
          enabled: true,
          icon: <BarChart3 className="h-5 w-5" />
        },
        {
          id: 'p2p-trading',
          name: 'P2P Trading',
          description: 'Trade directly with other users using your preferred payment methods. Enjoy secure escrow service and dispute resolution.',
          enabled: true,
          icon: <Users className="h-5 w-5" />
        },
        {
          id: 'fiat-gateway',
          name: 'Fiat Gateway',
          description: 'Deposit and withdraw using local currency. Support for bank transfers, cards, and mobile money.',
          enabled: true,
          icon: <Landmark className="h-5 w-5" />
        },
        {
          id: 'referral-program',
          name: 'Referral Program',
          description: 'Earn up to 40% commission on trading fees. Track referrals and earnings in real-time.',
          enabled: true,
          icon: <Gift className="h-5 w-5" />
        },
        // Coming Soon Features
        {
          id: 'mobile-app',
          name: 'Mobile Trading',
          description: 'Trade on the go with our mobile apps. Get real-time price alerts and portfolio updates.',
          enabled: false,
          icon: <Smartphone className="h-5 w-5" />,
          comingSoon: {
            date: '2025 Q2',
            progress: 45
          }
        },
        {
          id: 'trustcard',
          name: 'trustCard',
          description: 'Your crypto-backed debit card with up to 5% cashback. Spend crypto anywhere Visa is accepted.',
          enabled: false,
          icon: <CreditCard className="h-5 w-5" />,
          comingSoon: {
            date: '2025 Q3',
            progress: 35
          }
        },
        {
          id: 'otc-trading',
          name: 'OTC Trading',
          description: 'Dedicated desk for trades above $100,000. Personalized service and competitive rates.',
          enabled: false,
          icon: <Gem className="h-5 w-5" />,
          comingSoon: {
            date: '2025 Q3',
            progress: 30
          }
        },
        {
          id: 'margin-trading',
          name: 'Margin Trading',
          description: 'Trade with up to 10x leverage. Access cross-margin and isolated margin accounts.',
          enabled: false,
          icon: <Percent className="h-5 w-5" />,
          comingSoon: {
            date: '2025 Q4',
            progress: 25
          }
        },
        {
          id: 'savings',
          name: 'Crypto Savings',
          description: 'Earn up to 12% APY on your crypto. Choose between flexible and fixed-term deposits.',
          enabled: false,
          icon: <PiggyBank className="h-5 w-5" />,
          comingSoon: {
            date: '2025 Q4',
            progress: 20
          }
        },
        {
          id: 'staking',
          name: 'Staking',
          description: 'Earn passive income by staking PoS tokens. Automated rewards distribution.',
          enabled: false,
          icon: <CoinsIcon className="h-5 w-5" />,
          comingSoon: {
            date: '2025 Q4',
            progress: 15
          }
        },
        {
          id: 'global-remittance',
          name: 'Global Remittance',
          description: 'Send money globally with near-zero fees using stablecoins. Instant settlement.',
          enabled: false,
          icon: <Globe className="h-5 w-5" />,
          comingSoon: {
            date: '2025 Q4',
            progress: 10
          }
        }
      ];
      
      // Enhance features with additional UI properties
      const enhancedFeatures = features.map((feature: Feature) => ({
        ...feature,
        bgColor: getFeatureColor(feature.id),
        link: getFeatureLink(feature.id)
      }));
      
      setFeatures(enhancedFeatures);
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFeatureColor = (id: string): string => {
    const colors: { [key: string]: string } = {
      'instant-trades': 'from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20',
      'limit-orders': 'from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20',
      'p2p-trading': 'from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-800/20',
      'fiat-gateway': 'from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-800/20',
      'referral-program': 'from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-800/20',
      'mobile-app': 'from-teal-50 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-800/20',
      'trustcard': 'from-cyan-50 to-sky-100 dark:from-cyan-900/20 dark:to-sky-800/20',
      'otc-trading': 'from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20',
      'margin-trading': 'from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-800/20',
      'savings': 'from-teal-50 to-emerald-100 dark:from-teal-900/20 dark:to-emerald-800/20',
      'staking': 'from-indigo-50 to-violet-100 dark:from-indigo-900/20 dark:to-violet-800/20',
      'global-remittance': 'from-slate-50 to-gray-100 dark:from-slate-900/20 dark:to-gray-800/20'
    };
    return colors[id] || 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20';
  };

  const getFeatureLink = (id: string): string => {
    const links: { [key: string]: string } = {
      'instant-trades': '/trade',
      'limit-orders': '/trade/spot',
      'p2p-trading': '/trade/p2p',
      'fiat-gateway': '/profile/wallet',
      'referral-program': '/profile/referrals',
      'mobile-app': '/download'
    };
    return links[id] || '#';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const activeFeatures = features.filter(f => f.enabled);
  const upcomingFeatures = features.filter(f => !f.enabled);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/50 dark:to-blue-950/50">
      <main className="container mx-auto px-4 py-16">
        {/* Header with Animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
            Platform Features
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the powerful features that make trustBank your trusted crypto trading platform
          </p>
        </motion.div>

        {/* Active Features Section */}
        {activeFeatures.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-8">
              <Sparkles className="h-6 w-6 text-green-600" />
              <h2 className="text-3xl font-semibold">Available Features</h2>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {activeFeatures.map((feature) => (
                <motion.div key={feature.id} variants={item}>
                  <Card className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                    "bg-gradient-to-br border-none",
                    feature.bgColor
                  )}>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-xl">{feature.name}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                      <Link href={feature.link || '#'}>
                        <Button className="bg-white/90 text-gray-900 hover:bg-green-600 hover:text-white active:bg-green-700 dark:bg-gray-900/90 dark:text-white dark:hover:bg-green-600 transition-colors duration-200">
                          Try Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Badge variant="secondary" className="bg-green-600/10 text-green-600">
                        Active
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Upcoming Features Section */}
        {upcomingFeatures.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-8">
              <Clock className="h-6 w-6 text-blue-600" />
              <h2 className="text-3xl font-semibold">Coming Soon</h2>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {upcomingFeatures.map((feature) => (
                <motion.div key={feature.id} variants={item}>
                  <Card className={cn(
                    "relative overflow-hidden bg-gradient-to-br border-none",
                    feature.bgColor,
                    "opacity-90 hover:opacity-100 transition-opacity duration-300"
                  )}>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-xl">{feature.name}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Button disabled className="bg-gray-400/50 cursor-not-allowed">
                            Coming Soon
                          </Button>
                          <Badge variant="secondary" className="bg-blue-600/10 text-blue-600">
                            {feature.comingSoon?.date}
                          </Badge>
                        </div>
                        {feature.comingSoon && (
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${feature.comingSoon.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}
      </main>
    </div>
  );
} 