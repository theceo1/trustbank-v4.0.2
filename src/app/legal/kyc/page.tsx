'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, UserCheck, Layers, Shield, Clock, AlertTriangle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const sections = [
  {
    id: 'tiers',
    title: 'KYC Verification Tiers',
    icon: <Layers className="w-5 h-5 text-green-600" />,
    content: `Our KYC process consists of three tiers:
    • Basic Tier: Email verification, phone verification
    • Intermediate Tier: Government ID verification, proof of address
    • Advanced Tier: Enhanced due diligence, video verification
    Each tier provides increased trading limits and platform features.`
  },
  {
    id: 'requirements',
    title: 'Verification Requirements',
    icon: <UserCheck className="w-5 h-5 text-green-600" />,
    content: `Required documents for verification:
    • Valid government-issued photo ID (passport, driver's license)
    • Recent proof of address (utility bill, bank statement)
    • Clear selfie with ID document
    • Source of funds declaration (for higher tiers)
    All documents must be valid and not expired.`
  },
  {
    id: 'process',
    title: 'Verification Process',
    icon: <Clock className="w-5 h-5 text-green-600" />,
    content: `Our verification process includes:
    • Automated document authenticity checks
    • Facial recognition and liveness detection
    • Address verification
    • PEP and sanctions screening
    • Manual review by our compliance team
    Most verifications are completed within 24-48 hours.`
  },
  {
    id: 'security',
    title: 'Data Security',
    icon: <Lock className="w-5 h-5 text-green-600" />,
    content: `We protect your verification data through:
    • End-to-end encryption
    • Secure data storage compliant with GDPR
    • Limited staff access to personal information
    • Regular security audits
    • Automatic data deletion when no longer needed`
  },
  {
    id: 'compliance',
    title: 'Regulatory Compliance',
    icon: <Shield className="w-5 h-5 text-green-600" />,
    content: `Our KYC policy complies with:
    • Local and international AML regulations
    • FATF recommendations
    • Data protection laws
    • Financial services regulations
    • Industry best practices`
  },
  {
    id: 'restrictions',
    title: 'Restrictions and Limitations',
    icon: <AlertTriangle className="w-5 h-5 text-green-600" />,
    content: `Account restrictions may apply:
    • Unverified accounts have limited functionality
    • Trading limits based on verification level
    • Geographic restrictions for certain services
    • Mandatory re-verification in specific cases
    • Suspension of service for non-compliance`
  }
];

export default function KYCPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 print:mb-6">
        <h1 className="text-3xl font-bold mb-4">Know Your Customer (KYC) Policy</h1>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Last updated: March 15, 2025</span>
        </div>
      </div>

      <Card className="mb-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-none">
        <CardContent className="p-6">
          <p className="text-lg">
            trustBank's KYC policy is designed to verify the identity of our users, prevent fraud, and ensure compliance with regulatory requirements. This policy outlines our verification procedures, requirements, and user obligations.
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
          For KYC-related inquiries, please contact our Verification Team at{' '}
          <a href="mailto:kyc@trustbank.tech" className="text-green-600 hover:underline">
            kyc@trustbank.tech
          </a>
        </p>
      </div>
    </div>
  );
} 