'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, HelpCircle, Wallet, Shield, Users, Coins, Clock, MessageSquare } from 'lucide-react';
import { cn } from "@/lib/utils";

const categories = [
  {
    id: 'general',
    name: 'General',
    icon: <HelpCircle className="h-4 w-4" />,
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
  },
  {
    id: 'account',
    name: 'Account',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-green-50 dark:bg-green-900/20 text-green-600'
  },
  {
    id: 'security',
    name: 'Security',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-red-50 dark:bg-red-900/20 text-red-600'
  },
  {
    id: 'trading',
    name: 'Trading',
    icon: <Coins className="h-4 w-4" />,
    color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
  },
  {
    id: 'support',
    name: 'Support',
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'
  }
];

const faqs = [
  // General FAQs
  {
    question: "What is trustBank?",
    answer: "trustBank is your gateway to seamless crypto banking. We're dedicated to providing secure, swift, and transparent financial solutions for the underserved.",
    category: 'general'
  },
  {
    question: "What drives trustBank's mission?",
    answer: "Our mission is to bridge the financial gap, connecting millions worldwide to cutting-edge crypto banking services.",
    category: 'general'
  },
  {
    question: "What are trustBank's core values?",
    answer: (
      <ul className="list-disc list-inside space-y-1">
        <li>Customer-centricity - Putting our users first in everything we do</li>
        <li>Innovation - Continuously improving our services</li>
        <li>Transparency - Clear and honest communication</li>
        <li>Security - Protecting our users' assets and data</li>
        <li>Inclusivity - Making finance accessible to everyone</li>
      </ul>
    ),
    category: 'general'
  },
  {
    question: "What services do you offer?",
    answer: (
      <div className="space-y-2">
        <p>Our current services include:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Cryptocurrency trading platform</li>
          <li>Secure digital wallet</li>
          <li>Real-time market data and analytics</li>
          <li>24/7 customer support</li>
          <li>Educational resources</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">More services coming soon!</p>
      </div>
    ),
    category: 'general'
  },
  {
    question: "What is cryptocurrency?",
    answer: (
      <div className="space-y-2">
        <p>Cryptocurrency is a digital or virtual currency that uses cryptography for security. Key features include:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Decentralized operation (no central bank control)</li>
          <li>Secure peer-to-peer transactions</li>
          <li>Transparent transaction history</li>
          <li>Global accessibility</li>
          <li>24/7 market operation</li>
        </ul>
      </div>
    ),
    category: 'general'
  },
  {
    question: "Where does trustBank operate?",
    answer: (
      <div className="space-y-2">
        <p>trustBank operates globally with a focus on emerging markets. Our services are available in:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Africa (Nigeria, Kenya, South Africa)</li>
          <li>Asia (Philippines, Indonesia, India)</li>
          <li>Latin America (Brazil, Mexico, Argentina)</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">We're continuously expanding to new regions.</p>
      </div>
    ),
    category: 'general'
  },

  // Account FAQs
  {
    question: "How can I create an account?",
    answer: (
      <div className="space-y-2">
        <p>Creating an account is simple:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Visit our <Link href="/register" className="text-green-600 hover:underline">Sign Up</Link> page</li>
          <li>Enter your email and create a password</li>
          <li>Verify your email address</li>
          <li>Complete your profile information</li>
          <li>Start your crypto journey!</li>
        </ol>
      </div>
    ),
    category: 'account'
  },
  {
    question: "What is KYC verification and why is it required?",
    answer: (
      <div className="space-y-2">
        <p>KYC (Know Your Customer) verification is a mandatory process to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Comply with financial regulations</li>
          <li>Prevent fraud and money laundering</li>
          <li>Protect your account security</li>
          <li>Enable higher transaction limits</li>
        </ul>
        <p className="mt-2">Required documents include:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Government-issued ID (passport, driver's license)</li>
          <li>Proof of address (utility bill, bank statement)</li>
          <li>Selfie with ID for verification</li>
        </ul>
      </div>
    ),
    category: 'account'
  },
  {
    question: "How do I reset my password?",
    answer: (
      <div className="space-y-2">
        <p>To reset your password:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click 'Forgot Password' on the login page</li>
          <li>Enter your registered email address</li>
          <li>Check your email for reset instructions</li>
          <li>Click the reset link and create a new password</li>
          <li>Log in with your new password</li>
        </ol>
        <p className="text-sm text-muted-foreground mt-2">For security, reset links expire after 1 hour.</p>
      </div>
    ),
    category: 'account'
  },
  {
    question: "What are the account limits?",
    answer: (
      <div className="space-y-2">
        <p>Account limits vary by verification level:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Basic (Email verified):
            <ul className="list-disc list-inside ml-4">
              <li>Deposit: Up to $1,000/day</li>
              <li>Withdrawal: Up to $1,000/day</li>
            </ul>
          </li>
          <li>Verified (KYC completed):
            <ul className="list-disc list-inside ml-4">
              <li>Deposit: Up to $100,000/day</li>
              <li>Withdrawal: Up to $100,000/day</li>
            </ul>
          </li>
          <li>Premium (Additional verification):
            <ul className="list-disc list-inside ml-4">
              <li>Custom limits</li>
              <li>OTC trading access</li>
            </ul>
          </li>
        </ul>
      </div>
    ),
    category: 'account'
  },

  // Security FAQs
  {
    question: "Is trustBank secure?",
    answer: (
      <div className="space-y-2">
        <p>Yes, we implement multiple layers of security:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Two-factor authentication (2FA)</li>
          <li>Cold storage for crypto assets</li>
          <li>Advanced encryption protocols</li>
          <li>Regular security audits</li>
          <li>24/7 fraud monitoring</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">Your security is our top priority.</p>
      </div>
    ),
    category: 'security'
  },
  {
    question: "How do I enable two-factor authentication (2FA)?",
    answer: (
      <div className="space-y-2">
        <p>To enable 2FA:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Go to Account Settings {String.fromCharCode(62)} Security</li>
          <li>Click 'Enable 2FA'</li>
          <li>Choose your preferred method:
            <ul className="list-disc list-inside ml-4">
              <li>Google Authenticator</li>
              <li>SMS verification</li>
              <li>Email verification</li>
            </ul>
          </li>
          <li>Follow the setup instructions</li>
          <li>Save backup codes in a secure location</li>
        </ol>
      </div>
    ),
    category: 'security'
  },
  {
    question: "How do I report suspicious activity?",
    answer: (
      <div className="space-y-2">
        <p>If you notice any suspicious activity:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Immediately secure your account by changing your password</li>
          <li>Contact our support team via the <Link href="/about/contact" className="text-green-600 hover:underline">contact form</Link></li>
          <li>Provide detailed information about the suspicious activity</li>
          <li>Our security team will investigate and respond within 24 hours</li>
        </ol>
      </div>
    ),
    category: 'security'
  },
  {
    question: "What happens if I lose my 2FA device?",
    answer: (
      <div className="space-y-2">
        <p>If you lose access to your 2FA device:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Use your saved backup codes to access your account</li>
          <li>Contact support if you don't have backup codes</li>
          <li>Verify your identity through our recovery process</li>
          <li>Set up 2FA on your new device</li>
        </ol>
        <p className="text-sm text-muted-foreground mt-2">Account recovery may take 24-48 hours for security purposes.</p>
      </div>
    ),
    category: 'security'
  },

  // Trading FAQs
  {
    question: "What cryptocurrencies do you support?",
    answer: (
      <div className="space-y-2">
        <p>We currently support the following cryptocurrencies:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Bitcoin (BTC)</li>
          <li>Ethereum (ETH)</li>
          <li>Tether (USDT)</li>
          <li>USD Coin (USDC)</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">We&apos;re continuously adding support for more cryptocurrencies.</p>
      </div>
    ),
    category: 'trading'
  },
  {
    question: "How do I start trading on trustBank?",
    answer: (
      <div className="space-y-2">
        <p>Follow these steps to start trading:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Create and verify your account</li>
          <li>Complete KYC verification</li>
          <li>Add funds to your wallet</li>
          <li>Navigate to the trading page</li>
          <li>Select your desired cryptocurrency</li>
          <li>Place your first trade!</li>
        </ol>
        <p className="text-sm text-muted-foreground mt-2">Our support team is available to help if you need assistance.</p>
      </div>
    ),
    category: 'trading'
  },
  {
    question: "What are the trading fees?",
    answer: (
      <div className="space-y-2">
        <p>Our fee structure is transparent and volume-based:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Base trading fee: 4.0%</li>
          <li>Network fees vary by cryptocurrency</li>
          <li>Referral discount: 0.1% per referral (up to 0.5%)</li>
        </ul>
        <p className="mt-2">Volume-based discounts (30-day volume in USD):</p>
        <ul className="list-disc list-inside space-y-1">
          <li>$1,000 - $5,000: 3.5% fee</li>
          <li>$5,000 - $20,000: 3.0% fee</li>
          <li>$20,000 - $100,000: 2.8% fee</li>
          <li>$100,000+: 2.5% fee</li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          Visit our Trading Guide for detailed information about fees and limits.
        </p>
      </div>
    ),
    category: 'trading'
  },
  {
    question: "What trading pairs are available?",
    answer: (
      <div className="space-y-2">
        <p>Available trading pairs include:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Crypto/Fiat pairs:
            <ul className="list-disc list-inside ml-4">
              <li>BTC/NGN, ETH/NGN</li>
              <li>USDT/NGN, USDC/NGN</li>
            </ul>
          </li>
          <li>Crypto/Crypto pairs:
            <ul className="list-disc list-inside ml-4">
              <li>BTC/USDT, ETH/USDT</li>
              <li>ETH/BTC</li>
            </ul>
          </li>
        </ul>
      </div>
    ),
    category: 'trading'
  },

  // Support FAQs
  {
    question: "What are your customer support hours?",
    answer: "Our support team is available 24/7 to assist you with any questions or concerns. We prioritize urgent security-related issues and aim to respond to all inquiries within 24 hours.",
    category: 'support'
  },
  {
    question: "How can I contact support?",
    answer: (
      <div className="space-y-2">
        <p>Multiple support channels are available:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Live chat (24/7)</li>
          <li>Email support: support@trustbank.tech</li>
          <li>Phone support: Available during business hours</li>
          <li><Link href="/about/contact" className="text-green-600 hover:underline">Contact form</Link></li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">For urgent issues, we recommend using live chat.</p>
      </div>
    ),
    category: 'support'
  },
  {
    question: "What is your typical response time?",
    answer: (
      <div className="space-y-2">
        <p>Our response times vary by channel and priority:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Live chat: Immediate to 5 minutes</li>
          <li>Email: Within 24 hours</li>
          <li>Security issues: Priority response</li>
          <li>General inquiries: 24-48 hours</li>
        </ul>
      </div>
    ),
    category: 'support'
  },
  {
    question: "Do you offer educational resources?",
    answer: (
      <div className="space-y-2">
        <p>Yes, we provide various educational resources:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Crypto trading guides</li>
          <li>Video tutorials</li>
          <li>Trading webinars</li>
          <li>Market analysis</li>
          <li>Security best practices</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">Visit our <Link href="/learn" className="text-green-600 hover:underline">Learning Center</Link> for more resources.</p>
      </div>
    ),
    category: 'support'
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/50 dark:to-blue-950/50">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-2"
        >
          <h1 className="text-lg md:text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Get answers to common questions about trustBank and our services.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Search and Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/50 dark:bg-gray-800/50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "cursor-pointer hover:bg-accent",
                  !selectedCategory && "bg-accent"
                )}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer hover:bg-accent flex items-center gap-1",
                    selectedCategory === category.id && category.color
                  )}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.icon}
                  {category.name}
                </Badge>
              ))}
            </div>
          </motion.div>

          {/* FAQ Accordion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className={cn(
                            categories.find(c => c.id === faq.category)?.color
                          )}>
                            {categories.find(c => c.id === faq.category)?.name}
                          </Badge>
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>

          {/* No Results Message */}
          {filteredFaqs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-muted-foreground">No matching questions found.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
} 