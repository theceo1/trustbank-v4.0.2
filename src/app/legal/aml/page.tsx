'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ShieldCheck, UserCheck, AlertTriangle, Search, FileCheck, Ban } from 'lucide-react';
import { motion } from 'framer-motion';

const sections = [
  {
    id: 'purpose',
    title: 'Purpose and Scope',
    icon: <ShieldCheck className="w-5 h-5 text-green-600" />,
    content: `This Anti-Money Laundering (AML) Policy outlines trustBank's commitment to preventing money laundering and terrorist financing. It applies to all customers, employees, and partners globally.`
  },
  {
    id: 'kyc',
    title: 'Know Your Customer (KYC)',
    icon: <UserCheck className="w-5 h-5 text-green-600" />,
    content: `We implement robust KYC procedures:
    • Verification of identity using government-issued documents
    • Proof of address verification
    • Source of funds verification
    • Regular customer due diligence updates
    • Enhanced due diligence for high-risk customers`
  },
  {
    id: 'monitoring',
    title: 'Transaction Monitoring',
    icon: <Search className="w-5 h-5 text-green-600" />,
    content: `Our transaction monitoring system includes:
    • Real-time transaction screening
    • Pattern analysis for suspicious activities
    • Risk-based transaction limits
    • Automated flagging of unusual transactions
    • Regular review of monitoring thresholds`
  },
  {
    id: 'risk',
    title: 'Risk Assessment',
    icon: <AlertTriangle className="w-5 h-5 text-green-600" />,
    content: `We conduct regular risk assessments:
    • Customer risk profiling
    • Geographic risk evaluation
    • Product and service risk analysis
    • Delivery channel risk assessment
    • Regular updates to risk assessment methodology`
  },
  {
    id: 'reporting',
    title: 'Suspicious Activity Reporting',
    icon: <FileCheck className="w-5 h-5 text-green-600" />,
    content: `Our reporting procedures include:
    • Immediate internal reporting of suspicious activities
    • Filing of Suspicious Activity Reports (SARs)
    • Cooperation with law enforcement agencies
    • Documentation of all reported incidents
    • Regular staff training on reporting requirements`
  },
  {
    id: 'prohibited',
    title: 'Prohibited Activities',
    icon: <Ban className="w-5 h-5 text-green-600" />,
    content: `We strictly prohibit:
    • Anonymous or numbered accounts
    • Shell bank relationships
    • Transactions with sanctioned countries/individuals
    • Structuring transactions to avoid reporting
    • Business relationships with known money launderers`
  }
];

export default function AMLPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 print:mb-6">
        <h1 className="text-3xl font-bold mb-4">Anti-Money Laundering Policy</h1>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Last updated: March 15, 2025</span>
        </div>
      </div>

      <Card className="mb-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-none">
        <CardContent className="p-6">
          <p className="text-lg">
            trustBank is committed to maintaining the highest standards of Anti-Money Laundering (AML) compliance and requires all employees, customers, and partners to adhere to these standards to prevent the use of our services for money laundering or terrorist financing.
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
          For AML compliance inquiries, please contact our Compliance Officer at{' '}
          <a href="mailto:compliance@trustbank.tech" className="text-green-600 hover:underline">
            compliance@trustbank.tech
          </a>
        </p>
      </div>
    </div>
  );
} 