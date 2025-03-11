'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Shield, Lock, Eye, Database, Bell, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const sections = [
  {
    id: 'collection',
    title: 'Information We Collect',
    icon: <Database className="w-5 h-5 text-green-600" />,
    content: `We collect various types of information to provide and improve our services:
    • Personal Information: Name, email address, phone number, date of birth
    • Identity Verification: Government-issued ID, proof of address
    • Financial Information: Bank account details, transaction history
    • Technical Data: IP address, browser type, device information
    • Usage Data: Trading activity, platform interactions`
  },
  {
    id: 'use',
    title: 'How We Use Your Information',
    icon: <Eye className="w-5 h-5 text-green-600" />,
    content: `Your information is used for:
    • Processing transactions and maintaining your account
    • Verifying your identity and preventing fraud
    • Improving our services and user experience
    • Communicating important updates and changes
    • Complying with legal and regulatory requirements`
  },
  {
    id: 'sharing',
    title: 'Information Sharing',
    icon: <UserCheck className="w-5 h-5 text-green-600" />,
    content: `We may share your information with:
    • Financial institutions and payment processors
    • Identity verification services
    • Law enforcement and regulatory authorities
    • Service providers who assist in our operations
    We never sell your personal information to third parties.`
  },
  {
    id: 'security',
    title: 'Data Security',
    icon: <Lock className="w-5 h-5 text-green-600" />,
    content: `We implement robust security measures:
    • End-to-end encryption for sensitive data
    • Regular security audits and penetration testing
    • Multi-factor authentication
    • Secure data storage and transmission protocols
    • Employee training on data protection`
  },
  {
    id: 'rights',
    title: 'Your Privacy Rights',
    icon: <Shield className="w-5 h-5 text-green-600" />,
    content: `You have the right to:
    • Access your personal information
    • Request corrections to your data
    • Delete your account and associated data
    • Opt-out of marketing communications
    • Request data portability
    Contact our privacy team to exercise these rights.`
  },
  {
    id: 'updates',
    title: 'Privacy Policy Updates',
    icon: <Bell className="w-5 h-5 text-green-600" />,
    content: `We may update this privacy policy periodically. We will notify you of any material changes through our platform or via email. Continued use of our services after such changes constitutes acceptance of the updated policy.`
  }
];

export default function PrivacyPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 print:mb-6">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Last updated: March 15, 2025</span>
        </div>
      </div>

      <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-none">
        <CardContent className="p-6">
          <p className="text-lg">
            At trustBank, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, share, and protect your data.
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
          For privacy-related inquiries, please contact our Data Protection Officer at{' '}
          <a href="mailto:privacy@trustbank.tech" className="text-green-600 hover:underline">
            privacy@trustbank.tech
          </a>
        </p>
      </div>
    </div>
  );
} 