import { motion } from 'framer-motion';
import { useRef } from 'react';
import { Shield, Zap, Globe, BarChart2 } from 'lucide-react';

const features = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Bank-Grade Security",
    description: "Multi-layer security architecture with advanced encryption",
    gradient: "from-orange-500/20 to-red-500/20"
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast",
    description: "Execute trades in milliseconds with our optimized engine",
    gradient: "from-blue-500/20 to-purple-500/20"
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Global Access",
    description: "Trade from anywhere, anytime with our global infrastructure",
    gradient: "from-green-500/20 to-teal-500/20"
  },
  {
    icon: <BarChart2 className="w-6 h-6" />,
    title: "Advanced Analytics",
    description: "Make informed decisions with real-time market insights",
    gradient: "from-yellow-500/20 to-orange-500/20"
  }
];

export function FeatureShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-white to-green-50/30 dark:from-background dark:to-green-950/20" />
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
            Why Choose trustBank?
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Experience the difference with our cutting-edge features
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className="inline-flex items-center justify-center p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="text-green-600">{feature.icon}</div>
                </div>
                <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 