import { motion } from 'framer-motion';
import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { CreditCard, Coins, BarChart2, Terminal } from 'lucide-react';

const visionItems = [
{
        icon: <BarChart2 className="w-10 h-10" />,
        title: "trustExchange",
        content: "Experience user-friendly yet professional trading of ETFs and other digital assets on a trusted platform.",
        color: "from-green-500/20 to-emerald-700/20",
        comingSoon: "Q1 2025"
    },
    {
    icon: <Coins className="w-10 h-10" />,
    title: "trustCoin",
    content: "Experience stability with trustCoin, our most stable ETF. Safe for investment and a reliable store of value.",
    color: "from-emerald-400/20 to-green-600/20",
    comingSoon: "Q2 2025"
  },
  {
    icon: <CreditCard className="w-10 h-10" />,
    title: "trustCard",
    content: "Borderless Payments, Real-Time transactions at terminal, and cashback rewards when you transact with trustCard.",
    color: "from-green-400/20 to-emerald-600/20",
    comingSoon: "Q3 2025"
  },
  {
    icon: <Terminal className="w-10 h-10" />,
    title: "trustTerminal",
    content: "Point Of Service terminal for merchants who accept crypto payments. Save on transaction time, cost, profit, and EARN on every transaction.",
    color: "from-emerald-500/20 to-green-700/20",
    comingSoon: "Q1 2026"
  }
];

export function VisionBoard() {
  const containerRef = useRef<HTMLDivElement>(null);
  

  return (
    <section ref={containerRef} className="py-20 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/50 to-white dark:from-green-950/20 dark:to-background" />
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">Our Vision</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">Building the future of finance, one feature at a time</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {visionItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-100 transition-opacity duration-300`} />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-green-600 transition-transform duration-300 group-hover:scale-110">
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                      {item.comingSoon}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 