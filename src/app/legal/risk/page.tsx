'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle, TrendingDown, Wifi, Scale, Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const sections = [
  {
    id: 'market',
    title: 'Market Risk',
    icon: <TrendingDown className="w-5 h-5 text-green-600" />,
    content: `Cryptocurrency markets involve significant risks:
    • High price volatility and rapid fluctuations
    • Market manipulation risks
    • Impact of global events on prices
    • Potential for substantial losses
    • Limited historical data for analysis`
  },
  {
    id: 'technical',
    title: 'Technical and Security Risks',
    icon: <Lock className="w-5 h-5 text-green-600" />,
    content: `Technical risks include:
    • Potential platform downtime
    • Cybersecurity threats
    • Wallet security vulnerabilities
    • Network congestion issues
    • Smart contract vulnerabilities`
  },
  {
    id: 'operational',
    title: 'Operational Risks',
    icon: <AlertTriangle className="w-5 h-5 text-green-600" />,
    content: `Operational considerations include:
    • Transaction processing delays
    • Order execution risks
    • System maintenance interruptions
    • Third-party service provider risks
    • Human error in operations`
  },
  {
    id: 'regulatory',
    title: 'Regulatory Risks',
    icon: <Scale className="w-5 h-5 text-green-600" />,
    content: `Regulatory environment risks:
    • Changes in government regulations
    • Tax law changes
    • Restrictions on cryptocurrency trading
    • Cross-border transaction limitations
    • Compliance requirement changes`
  },
  {
    id: 'network',
    title: 'Network and Protocol Risks',
    icon: <Wifi className="w-5 h-5 text-green-600" />,
    content: `Blockchain network risks include:
    • Network forks and upgrades
    • Mining/validation issues
    • Network congestion
    • Protocol vulnerabilities
    • Consensus mechanism failures`
  },
  {
    id: 'global',
    title: 'Global Market Risks',
    icon: <Globe className="w-5 h-5 text-green-600" />,
    content: `International market factors:
    • Currency exchange rate fluctuations
    • Political and economic events
    • International regulatory changes
    • Cross-border transaction risks
    • Global market sentiment impact`
  }
];

export default function RiskPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 print:mb-6">
        <h1 className="text-3xl font-bold mb-4">Risk Disclosure</h1>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Last updated: March 15, 2025</span>
        </div>
      </div>

      <Card className="mb-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 border-none">
        <CardContent className="p-6">
          <p className="text-lg">
            Cryptocurrency trading involves significant risks. This disclosure outlines various risks associated with using trustBank's services. Please read this carefully and ensure you understand these risks before trading.
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
          For risk-related inquiries, please contact our Risk Management Team at{' '}
          <a href="mailto:risk@trustbank.tech" className="text-green-600 hover:underline">
            risk@trustbank.tech
          </a>
        </p>
      </div>
    </div>
  );
} 