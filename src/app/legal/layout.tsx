'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Printer, Languages } from 'lucide-react';
import Link from 'next/link';

const legalPages = [
  { title: 'Terms of Service', href: '/legal/terms' },
  { title: 'Privacy Policy', href: '/legal/privacy' },
  { title: 'AML Policy', href: '/legal/aml' },
  { title: 'KYC Policy', href: '/legal/kyc' },
  { title: 'Risk Disclosure', href: '/legal/risk' },
  { title: 'Cookie Policy', href: '/legal/cookies' },
];

const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Spanish', value: 'es' },
  { label: 'Arabic', value: 'ar' },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState('en');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 space-y-6 print:hidden">
            <div className="sticky top-24">
              <nav className="space-y-2">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">Legal Documents</h2>
                  <div className="space-y-1">
                    {legalPages.map((page) => (
                      <Link
                        key={page.href}
                        href={page.href}
                        className="flex items-center px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground"
                      >
                        {page.title}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Languages className="w-4 h-4" />
                    <span className="text-sm font-medium">Language</span>
                  </div>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handlePrint}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Document
                  </Button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
} 