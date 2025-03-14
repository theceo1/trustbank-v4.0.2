import { motion } from 'framer-motion';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    name: "Ijeoma Ogugua",
    role: "Crypto Trader",
    avatar: "/images/placeholder-user.jpg",
    content: "TrustBank has made my crypto trading experience smooth and secure. I couldn't ask for a better platform.",
    rating: 4
  },
  {
    name: "Michael Massamba",
    role: "Investment Analyst",
    avatar: "/images/placeholder-user.jpg",
    content: "The real-time market data and user-friendly interface have significantly improved my trading strategies.",
    rating: 3
  },
  {
    name: "Vivian Vincent",
    role: "Business Owner",
    avatar: "/images/placeholder-user.jpg",
    content: "TrustBank's security features give me peace of mind. I can trade confidently knowing my assets are protected.",
    rating: 4
  },
  {
    name: "Austin Obinna",
    role: "Day Trader",
    avatar: "/images/placeholder-user.jpg",
    content: "The community support is incredible. I've learned so much from other traders!",
    rating: 3
  },
  {
    name: "Kate Chukwu",
    role: "Trader",
    avatar: "/images/placeholder-user.jpg",
    content: "The platform is easy to use and the customer support is top-notch. I've been able to make consistent profits since joining.",
    rating: 3
  },
  {
    name: "Aminu Sanni",
    role: "Entrepreneur",
    avatar: "/images/placeholder-user.jpg",
    content: "TrustBank has been a game-changer for me. The platform's features and the community support have made a significant difference in my trading success.",
    rating: 3
  }
];

export function UserFeedback() {
  return (
    <section className="py-20 overflow-hidden bg-gradient-to-b from-green-50/30 to-white dark:from-green-950/20 dark:to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
            Community Voices
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Real stories from our growing community
          </p>
        </motion.div>

        <div className="relative max-w-6xl mx-auto overflow-hidden">
          <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-background to-transparent z-10" />
          
          <motion.div
            animate={{
              x: [0, -1200],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
            className="flex gap-6 py-4"
          >
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <Card 
                key={index} 
                className="w-[300px] flex-shrink-0 backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-6">
                  <Quote className="w-6 h-6 text-green-600/20 mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 line-clamp-4">
                    {testimonial.content}
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-green-100 dark:border-green-900">
                      <AvatarImage
                        src={testimonial.avatar}
                        alt={testimonial.name}
                      />
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {testimonial.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {testimonial.role}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < testimonial.rating 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-300 dark:text-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
} 