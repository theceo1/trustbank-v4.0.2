"use client";

import { useState } from "react";
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Globe, Heart, Rocket, Users } from 'lucide-react';
import { ResumeSubmissionModal } from '@/components/modals/ResumeSubmissionModal';

export default function CareersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const benefits = [
    {
      icon: <Globe className="w-6 h-6 text-green-600" />,
      title: "Remote-First Culture",
      description: "Work from anywhere in the world. We believe in hiring the best talent, regardless of location."
    },
    {
      icon: <Heart className="w-6 h-6 text-green-600" />,
      title: "Comprehensive Benefits",
      description: "Competitive salary, health insurance, and wellness programs to keep you at your best."
    },
    {
      icon: <Rocket className="w-6 h-6 text-green-600" />,
      title: "Growth Opportunities",
      description: "Continuous learning and development programs to help you reach your full potential."
    },
    {
      icon: <Users className="w-6 h-6 text-green-600" />,
      title: "Inclusive Environment",
      description: "Join a diverse team that values different perspectives and innovative thinking."
    }
  ];

  return (
    <>
      <div className="border-b">
        <div className="container flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-semibold">Careers</h1>
            <p className="text-sm text-muted-foreground">Join us in revolutionizing crypto trading</p>
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
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Help us build the future of cryptocurrency trading in emerging markets. We&apos;re looking for passionate individuals who want to make a difference.
          </p>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg blur-xl opacity-25" />
            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/50 dark:to-teal-950/50">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold mb-4">No Open Positions Right Now</h2>
                <p className="text-muted-foreground mb-6">
                  While we don&apos;t have any current openings, we&apos;re always interested in connecting with talented individuals. Drop us your resume and we&apos;ll keep you in mind for future opportunities.
                </p>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setIsModalOpen(true)}
                >
                  Submit Your Resume <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">{benefit.icon}</div>
                    <div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <ResumeSubmissionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
} 