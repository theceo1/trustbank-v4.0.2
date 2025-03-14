import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function CallToAction() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white to-green-50/30 dark:from-background dark:to-green-950/20" />
      
      <div className="container mx-auto px-4">
        <Card className="relative max-w-4xl mx-auto overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
          <div className="relative p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                Ready to Join Our Growing Community?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Be part of a thriving ecosystem where traders help traders. From beginners to experts, everyone contributes to our success story.
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm"
                >
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Bank-Grade Security</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm"
                >
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Lightning Fast Trades</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm"
                >
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Beginner & Expert Friendly</span>
                </motion.div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link href="https://chat.whatsapp.com/HeOE6jNRGhqAoJ8HOZU6dA" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    Join Community <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline"
                  className="border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Link href="/learn">Trading Academy</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </Card>
      </div>
    </section>
  );
} 