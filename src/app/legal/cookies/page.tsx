'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Cookie, Shield, Settings, Clock, Bell, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const sections = [
  {
    id: 'what',
    title: 'What Are Cookies',
    icon: <Cookie className="w-5 h-5 text-green-600" />,
    content: `Cookies are small text files that are placed on your device when you visit our website. They help us:
    • Remember your preferences and settings
    • Understand how you use our platform
    • Improve your browsing experience
    • Provide personalized content and features
    • Maintain security and prevent fraud`
  },
  {
    id: 'types',
    title: 'Types of Cookies We Use',
    icon: <Database className="w-5 h-5 text-green-600" />,
    content: `We use the following types of cookies:
    • Essential cookies: Required for basic platform functionality
    • Preference cookies: Remember your settings and choices
    • Analytics cookies: Help us understand platform usage
    • Security cookies: Protect against unauthorized access
    • Performance cookies: Optimize website performance
    • Marketing cookies: Deliver relevant advertisements`
  },
  {
    id: 'control',
    title: 'Cookie Control',
    icon: <Settings className="w-5 h-5 text-green-600" />,
    content: `You can control cookies through:
    • Browser settings to block or delete cookies
    • Our cookie preferences center
    • Third-party opt-out tools
    • Private browsing modes
    Note: Blocking essential cookies may affect platform functionality.`
  },
  {
    id: 'duration',
    title: 'Cookie Duration',
    icon: <Clock className="w-5 h-5 text-green-600" />,
    content: `Cookies have different lifespans:
    • Session cookies: Deleted when you close your browser
    • Persistent cookies: Remain for a set period
    • Third-party cookies: Controlled by external services
    We regularly review and update our cookie usage.`
  },
  {
    id: 'privacy',
    title: 'Privacy and Security',
    icon: <Shield className="w-5 h-5 text-green-600" />,
    content: `We protect your data by:
    • Encrypting cookie data
    • Regular security audits
    • Limiting third-party access
    • Compliance with privacy laws
    • Transparent data practices`
  },
  {
    id: 'updates',
    title: 'Policy Updates',
    icon: <Bell className="w-5 h-5 text-green-600" />,
    content: `We may update this policy:
    • To reflect changes in our practices
    • When new features are added
    • To comply with regulations
    • Based on user feedback
    Check this page regularly for updates.`
  }
];

export default function CookiePolicyPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 print:mb-6">
        <h1 className="text-3xl font-bold mb-4">Cookie Policy</h1>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Last updated: March 15, 2025</span>
        </div>
      </div>

      <Card className="mb-8 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/50 dark:to-green-950/50 border-none">
        <CardContent className="p-6">
          <p className="text-lg">
            This Cookie Policy explains how trustBank uses cookies and similar technologies to provide, customize, and secure our services. By using our platform, you consent to our use of cookies as described in this policy.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {sections.map((section) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden">
              <Button
                variant="ghost"
                className="w-full p-6 flex justify-between items-center text-left"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center space-x-3">
                  {section.icon}
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                {expandedSection === section.id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
              {expandedSection === section.id && (
                <CardContent className="px-6 pb-6">
                  <p className="text-green-600 whitespace-pre-line">{section.content}</p>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        <p>
          For cookie-related inquiries, please contact our Privacy Team at{' '}
          <a href="mailto:privacy@trustbank.tech" className="text-green-600 hover:underline">
            privacy@trustbank.tech
          </a>
        </p>
      </div>
    </div>
  );
} 