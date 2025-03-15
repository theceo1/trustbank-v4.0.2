"use client";

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Linkedin, Twitter } from 'lucide-react';

export default function TeamPage() {
  const teamMembers = [
    {
      name: "Anthony Ogugua",
      role: "Founder & CEO, CTO",
      bio: "A passionate technologist and entrepreneur with extensive experience in fintech and blockchain technology. Leading the vision and technical direction of trustBank.",
      image: "/images/avatars/placeholder.png",
      social: {
        twitter: "https://twitter.com/__theCEO",
        linkedin: "https://linkedin.com/in/tonyoguguadev",
        github: "https://github.com/theceo1"
      }
    },
    {
      name: "Micael Kiniumba",
      role: "International Concierge",
      bio: "Dedicated to providing exceptional service and support for our international clients, ensuring a seamless experience with trustBank's global operations.",
      image: "/images/avatars/placeholder.png"
    },
    {
      name: "Coming Soon",
      role: "Head of Product",
      bio: "Our product lead will be announced soon. They are passionate about creating intuitive user experiences.",
      image: "/images/avatars/placeholder.png"
    },
    {
      name: "Coming Soon",
      role: "Head of Operations",
      bio: "Our operations lead will be announced soon. They excel at optimizing processes and team coordination.",
      image: "/images/avatars/placeholder.png"
    },
    {
      name: "Coming Soon",
      role: "Head of Marketing",
      bio: "Our marketing lead will be announced soon. They will drive our growth and market presence.",
      image: "/images/avatars/placeholder.png"
    }
  ];

  return (
    <>
      <div className="border-b">
        <div className="container flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-semibold">Team</h1>
            <p className="text-sm text-muted-foreground">Meet the people behind trustBank</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <Badge className="mb-4 bg-green-600/10 text-green-600 hover:bg-green-600/20">Our Team</Badge>
          <h2 className="text-3xl font-bold mb-4">Meet the Visionaries</h2>
          <p className="text-lg text-muted-foreground">
            Our team is being carefully assembled to bring you the best cryptocurrency trading experience in emerging markets.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mb-16"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg blur-xl opacity-25" />
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/50 dark:to-teal-950/50">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">We&apos;re Building Something Special</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our team is working hard to simplify cryptocurrency adoption in emerging markets. 
                Stay tuned for exciting announcements about our growing team of industry experts and technology innovators.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 flex items-center justify-center mb-4">
                      {member.name === "Coming Soon" ? (
                        <span className="text-2xl font-bold text-green-600">?</span>
                      ) : (
                        <span className="text-2xl font-bold text-green-600">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{member.name}</h3>
                    <p className="text-sm text-green-600 mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>
                    {member.social ? (
                      <div className="flex space-x-3 text-muted-foreground">
                        <a href={member.social.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                          <Twitter className="w-5 h-5" />
                        </a>
                        <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                          <Linkedin className="w-5 h-5" />
                        </a>
                        <a href={member.social.github} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                          <Github className="w-5 h-5" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex space-x-3 text-muted-foreground">
                        <Twitter className="w-5 h-5 opacity-50" />
                        <Linkedin className="w-5 h-5 opacity-50" />
                        <Github className="w-5 h-5 opacity-50" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
} 