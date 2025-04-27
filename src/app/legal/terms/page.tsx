'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing and using trustBank's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services.`
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    content: `You must be at least 18 years old and legally able to form a binding contract to use trustBank's services. By using our services, you represent and warrant that you meet all eligibility requirements.`
  },
  {
    id: 'account',
    title: '3. Account Registration and Security',
    content: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify trustBank of any unauthorized use of your account.`
  },
  {
    id: 'services',
    title: '4. Services',
    content: `trustBank provides cryptocurrency trading and related services. We reserve the right to modify, suspend, or discontinue any part of our services at any time without prior notice.`
  },
  {
    id: 'compliance',
    title: '5. Regulatory Compliance',
    content: `You agree to comply with all applicable laws, regulations, and rules related to cryptocurrency trading and financial services in your jurisdiction.`
  },
  {
    id: 'risks',
    title: '6. Risks and Disclaimers',
    content: `Cryptocurrency trading involves significant risks. You acknowledge that you understand these risks and are solely responsible for your trading decisions.`
  },
  {
    id: 'fees',
    title: '7. Fees and Charges',
    content: `You agree to pay all applicable fees for using our services. Fee schedules are subject to change, and we will provide notice of any changes through our platform.`
  },
  {
    id: 'intellectual',
    title: '8. Intellectual Property',
    content: `All content, trademarks, and intellectual property on the trustBank platform are owned by or licensed to trustBank. You may not use, copy, or distribute our intellectual property without explicit permission.`
  },
  {
    id: 'termination',
    title: '9. Account Termination',
    content: `trustBank reserves the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion.`
  },
  {
    id: 'liability',
    title: '10. Limitation of Liability',
    content: `To the maximum extent permitted by law, trustBank shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.`
  },
  {
    id: 'dispute',
    title: '11. Dispute Resolution',
    content: `If you have a complaint or dispute with trustBank, please contact our support team at support@trustbank.tech. We are committed to resolving complaints fairly and promptly. Most issues can be resolved informally by contacting us. If a dispute cannot be resolved informally, it will be handled in accordance with the laws and procedures of the jurisdiction specified below.`
  },
  {
    id: 'jurisdiction',
    title: '12. Jurisdiction and Governing Law',
    content: `These Terms of Service are governed by and construed in accordance with the laws of the jurisdiction in which trustBank operates, without regard to its conflict of law provisions. By using our services, you consent to the exclusive jurisdiction of the courts located in this jurisdiction for any disputes arising out of or relating to these terms or your use of the services.`
  },
  {
    id: 'changes',
    title: '13. Changes to Terms',
    content: `trustBank may update these Terms of Service from time to time. We will notify users of any material changes through our platform or by email. Continued use of our services after such changes constitutes acceptance of the updated terms. We encourage you to review these terms regularly.`
  },
  {
    id: 'disclaimer',
    title: '11. Regulatory Disclaimer',
    content: `trustBank is a financial technology platform, not a bank. All banking, cryptocurrency, and AML/KYC services are provided by our fully licensed and regulated partners. These partners are authorized to operate under the appropriate financial regulations and hold all necessary licenses for their jurisdictions. trustBank does not directly provide banking services. For more information, please contact our legal team.`
  }
];

export default function TermsPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 print:mb-6">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Last updated: March 15, 2025</span>
        </div>
      </div>

      <Card className="mb-8 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/50 dark:to-teal-950/50 border-none">
        <CardContent className="p-6">
          <p className="text-lg">
            Welcome to trustBank. These Terms of Service govern your access to and use of trustBank's website, mobile application, and cryptocurrency trading services. Please read these terms carefully before using our services.
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
                <h2 className="text-xl font-semibold">{section.title}</h2>
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
          For any questions about these Terms of Service, please contact us at{' '}
          <a href="mailto:legal@trustbank.tech" className="text-green-600 hover:underline">
            legal@trustbank.tech
          </a>
        </p>
      </div>
    </div>
  );
} 