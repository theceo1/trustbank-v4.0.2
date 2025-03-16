'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Star, Lock, Crown, CheckCircle2, XCircle, Clock, ChevronRight, Upload, Camera, Info, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatCurrency } from "@/lib/format";
import { VerificationModal, VerificationType } from "@/components/verification/VerificationModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import React from 'react';

interface KYCTierConfig {
  name: string;
  icon: LucideIcon;
  requirements: string[];
  features: string[];
  dailyLimit: number;
  monthlyLimit: number;
  withdrawalLimit: number;
}

// KYC Tiers configuration
const KYC_TIERS: Record<string, KYCTierConfig> = {
  TIER_1: {
    name: 'Basic',
    icon: Shield,
    requirements: ['Email Verification', 'Phone Number Verification', 'Basic Personal Information'],
    features: [
      'Basic trading features',
      'Limited withdrawals',
      'Standard support'
    ],
    dailyLimit: 100000,
    monthlyLimit: 1000000,
    withdrawalLimit: 200000,
  },
  TIER_2: {
    name: 'Starter',
    icon: Star,
    requirements: ['NIN Verification', 'Selfie Verification'],
    features: [
      'Increased trading limits',
      'P2P trading access',
      'Priority support'
    ],
    dailyLimit: 500000,
    monthlyLimit: 5000000,
    withdrawalLimit: 1000000,
  },
  TIER_3: {
    name: 'Intermediate',
    icon: ArrowUpDown,
    requirements: ['BVN Verification'],
    features: [
      'Higher trading limits',
      'OTC trading access',
      'Dedicated support line'
    ],
    dailyLimit: 2000000,
    monthlyLimit: 20000000,
    withdrawalLimit: 5000000,
  },
  TIER_4: {
    name: 'Advanced',
    icon: Lock,
    requirements: ['LiveCheck Verification'],
    features: [
      'Premium trading features',
      'VIP support',
      'Advanced market tools'
    ],
    dailyLimit: 10000000,
    monthlyLimit: 100000000,
    withdrawalLimit: 20000000,
  },
  TIER_5: {
    name: 'Premium',
    icon: Crown,
    requirements: ['Government-issued ID', 'International Passport'],
    features: [
      'Unlimited trading',
      'Institutional features',
      'Dedicated account manager'
    ],
    dailyLimit: 50000000,
    monthlyLimit: 500000000,
    withdrawalLimit: 100000000,
  },
};

// Add this mapping at the top of the file
const VERIFICATION_TYPE_MAP: Record<string, string> = {
  'Email Verification': 'email',
  'Phone Number Verification': 'phone',
  'Basic Personal Information': 'basic_info',
  'NIN Verification': 'nin',
  'BVN Verification': 'bvn',
  'LiveCheck Verification': 'livecheck',
  'Government-issued ID': 'government_id',
  'International Passport': 'passport',
  'Selfie Verification': 'selfie'
};

interface VerificationStatus {
  email: boolean;
  phone: boolean;
  basic_info: boolean;
  nin: boolean;
  bvn: boolean;
  livecheck: boolean;
  government_id: boolean;
  passport: boolean;
  selfie: boolean;
}

interface TierProgress {
  completed: number;
  total: number;
  percentage: number;
  remainingRequirements: string[];
}

const getVerificationDescription = (type: string) => {
  const descriptions: Record<string, string> = {
    email: 'Verify your email address to secure your account and receive important notifications',
    phone: 'Add your phone number for two-factor authentication and account recovery',
    basic_info: 'Provide basic personal information like name, date of birth, and address',
    nin: 'Submit your National Identification Number (NIN) for identity verification',
    bvn: 'Verify your Bank Verification Number (BVN) to enable higher transaction limits',
    livecheck: 'Complete a live video verification check to confirm your identity',
    government_id: 'Upload a valid government-issued ID for advanced verification',
    passport: 'Submit your international passport for premium tier access',
    selfie: 'Take a selfie holding your ID for additional verification',
  };
  return descriptions[type] || 'Complete this verification step';
};

const getStatusDescription = (status: boolean) => {
  return status
    ? 'Verification complete! You have successfully met this requirement.'
    : 'Verification needed. Click the verify button to complete this requirement.';
};

interface ClientKYCPageProps {
  initialProfile: {
    id: string;
    user_id: string;
    kyc_tier: string;
    risk_score: number;
    verification_history: Record<string, boolean>;
    [key: string]: any;
  } | null;
}

interface VerificationStatusProps {
  type: string;
  isVerified: boolean;
  onClick: () => void;
}

const VerificationStatus = ({ type, isVerified, onClick }: VerificationStatusProps) => {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border",
        isVerified ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-gray-200 dark:border-gray-800"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          isVerified ? "bg-green-500" : "bg-gray-100 dark:bg-gray-800"
        )}>
          {isVerified ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : (
            <XCircle className="w-5 h-5 text-gray-500" />
          )}
        </div>
        <div>
          <h3 className="font-medium">{type}</h3>
          <p className="text-sm text-gray-500">
            {isVerified ? "Verified" : "Not verified"}
          </p>
        </div>
      </div>
      {!isVerified && (
        <Button
          variant="outline"
          onClick={onClick}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Verify
        </Button>
      )}
    </div>
  );
};

export default function ClientKYCPage({ initialProfile }: ClientKYCPageProps) {
  const [currentTier, setCurrentTier] = useState('TIER_1');
  const defaultStatus: VerificationStatus = {
    email: false,
    phone: false,
    basic_info: false,
    nin: false,
    bvn: false,
    livecheck: false,
    government_id: false,
    passport: false,
    selfie: false,
  };

  // Initialize with verification history, ensuring all required fields exist
  const initialStatus = {
    ...defaultStatus,
    ...(initialProfile?.verification_history || {})
  };

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    type: VerificationType;
    requestId: string;
  }>({ isOpen: false, type: 'email', requestId: '' });
  const [tierProgress, setTierProgress] = useState<Record<string, TierProgress>>({});
  const [processedToasts, setProcessedToasts] = useState<Set<string>>(new Set());
  
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    // Initial fetch
    fetchUserStatus();

    // Set up polling with a cleanup
    const interval = setInterval(fetchUserStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const calculateTierProgress = (verificationStatus: VerificationStatus) => {
    const progress: Record<string, TierProgress> = {};
    
    Object.entries(KYC_TIERS).forEach(([tier, details]) => {
      const requirements = details.requirements;
      const completed = requirements.filter(req => 
        verificationStatus[req.toLowerCase().replace(/ /g, '_') as keyof VerificationStatus]
      ).length;
      
      const remaining = requirements.filter(req => 
        !verificationStatus[req.toLowerCase().replace(/ /g, '_') as keyof VerificationStatus]
      );

      progress[tier] = {
        completed,
        total: requirements.length,
        percentage: (completed / requirements.length) * 100,
        remainingRequirements: remaining
      };
    });

    return progress;
  };

  const fetchUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('kyc_tier, verification_history')
        .eq('user_id', user.id)
        .single();

      if (profile?.verification_history) {
        const newVerificationHistory = profile.verification_history;
        
        // Check for newly completed verifications
        Object.entries(newVerificationHistory).forEach(([type, isVerified]) => {
          if (isVerified && 
              !verificationStatus[type as keyof VerificationStatus] && 
              !processedToasts.has(type)) {
            toast({
              title: "Verification Complete",
              description: `Your ${type.replace(/_/g, ' ')} has been approved!`,
              duration: 5000,
            });
            setProcessedToasts(prev => new Set([...prev, type]));
          }
        });

        // Update verification status
        setVerificationStatus(newVerificationHistory);
        setCurrentTier(profile.kyc_tier);
        
        // Calculate progress
        const progress = calculateTierProgress(newVerificationHistory);
        setTierProgress(progress);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const startVerification = async (type: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Get current tier
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('kyc_tier')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Map the display type to the database type
      const verificationType = VERIFICATION_TYPE_MAP[type] || type.toLowerCase();

      // Validate verification type
      if (!isValidVerificationType(verificationType)) {
        throw new Error('Invalid verification type');
      }

      // Create verification request
      const { data: request, error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          verification_type: verificationType,
          requested_tier: profile.kyc_tier,
          status: 'pending',
          metadata: {
            initiated_at: new Date().toISOString(),
            source: 'user_initiated',
            display_type: type
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Show verification modal
      setVerificationModal({
        isOpen: true,
        type: verificationType as VerificationType,
        requestId: request.id
      });
    } catch (error) {
      console.error('Error starting verification:', error);
      toast({
        title: "Verification Error",
        description: "Failed to start verification process. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add type guard function
  function isValidVerificationType(type: string): type is VerificationType {
    return ['email', 'phone', 'basic_info', 'nin', 'bvn', 'livecheck', 'government_id', 'passport', 'selfie'].includes(type);
  }

  const getVerificationStatus = (requirement: string) => {
    const status = verificationStatus[requirement as keyof VerificationStatus];
    return status || false;
  };

  const renderStatusIcon = (requirement: string) => {
    const isVerified = verificationStatus[requirement.toLowerCase().replace(/ /g, '_') as keyof VerificationStatus];
    
    return isVerified ? (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-green-600"
      >
        <CheckCircle2 className="h-5 w-5" />
      </motion.div>
    ) : (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-gray-400"
      >
        <Clock className="h-5 w-5" />
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Alert className="bg-gradient-to-r from-green-600/20 to-green-600/5 border-green-600/20">
        <AlertDescription className="flex items-center gap-x-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span>Our identity verification system adapts to your trading needs, ensuring security while maintaining convenience.</span>
        </AlertDescription>
      </Alert>

      <AnimatePresence>
        {Object.entries(KYC_TIERS).map(([tier, config], index) => (
          <motion.div
            key={tier}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              'transition-all duration-200 hover:shadow-lg hover:scale-[1.01]',
              'shadow-md dark:shadow-none',
              currentTier === tier ? 'border-green-600' : ''
            )}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {React.createElement(config.icon, { className: "h-5 w-5 text-green-600" })}
                    <span>{config.name}</span>
                  </CardTitle>
                  {currentTier === tier && (
                    <span className="text-sm text-green-600">(Current)</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Progress: {Math.round(tierProgress[tier]?.percentage || 0)}%
                  </div>
                  <Progress value={tierProgress[tier]?.percentage || 0} className="w-[100px]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Requirements</h4>
                    <ul className="space-y-2">
                      {config.requirements.map((req) => (
                        <li key={req} className="flex items-center justify-between group">
                          <HoverCard>
                            <HoverCardTrigger>
                              <span className={cn(
                                "flex items-center gap-2 cursor-help",
                                getVerificationStatus(req) && "text-green-600"
                              )}>
                                {req}
                                <Info className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent>
                              <div className="space-y-2">
                                <h4 className={cn(
                                  "font-medium",
                                  getVerificationStatus(req) && "text-green-600"
                                )}>{req}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {getVerificationDescription(req)}
                                </p>
                                <p className={cn(
                                  "text-sm",
                                  getVerificationStatus(req) ? "text-green-600" : "text-red-600/50"
                                )}>
                                  {getStatusDescription(getVerificationStatus(req))}
                                </p>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {renderStatusIcon(req)}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{getStatusDescription(getVerificationStatus(req))}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {!verificationStatus[req as keyof VerificationStatus] && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startVerification(req)}
                                className={cn(
                                  "ml-auto transition-all duration-200 hover:scale-[1.01]",
                                  "dark:text-white dark:hover:text-green-600 dark:bg-green-600/20 dark:hover:bg-green-600/30 dark:border-green-600/20 dark:hover:border-green-600/30",
                                  "text-black hover:text-green-600 bg-transparent hover:bg-green-600/10 border-black/20 hover:border-green-600/20"
                                )}
                              >
                                Verify
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Features</h4>
                    <ul className="space-y-2">
                      {config.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 group hover:bg-green-600/5 p-2 rounded-md transition-colors">
                          <CheckCircle2 className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Trading Limits</h4>
                    <ul className="space-y-2">
                      {[
                        { label: 'Daily', value: config.dailyLimit },
                        { label: 'Monthly', value: config.monthlyLimit },
                        { label: 'Withdrawal', value: config.withdrawalLimit }
                      ].map(({ label, value }) => (
                        <li key={label} className="group">
                          <div className="flex justify-between mb-1">
                            <span>{label}:</span>
                            <span className="font-medium group-hover:text-green-600 transition-colors">
                              {formatCurrency(value, 'NGN')}
                            </span>
                          </div>
                          <Progress 
                            value={currentTier === tier ? 60 : tier < currentTier ? 100 : 0} 
                            className="h-2 group-hover:bg-green-600/20 transition-colors"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tier Progress</span>
                    <span>{tierProgress[tier]?.completed}/{tierProgress[tier]?.total} Requirements</span>
                  </div>
                  <Progress value={tierProgress[tier]?.percentage || 0} className="h-1.5" />
                  {tierProgress[tier]?.remainingRequirements.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <span>Remaining requirements:</span>
                      <ul className="list-disc list-inside mt-1">
                        {tierProgress[tier]?.remainingRequirements.map((req) => (
                          <li key={req}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <VerificationModal
        isOpen={verificationModal.isOpen}
        onClose={() => {
          setVerificationModal({ isOpen: false, type: 'email', requestId: '' });
          fetchUserStatus(); // Refresh status after modal closes
        }}
        verificationType={verificationModal.type}
        requestId={verificationModal.requestId}
      />
    </div>
  );
} 