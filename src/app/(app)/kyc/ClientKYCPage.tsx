'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";

const VERIFICATION_TYPE_MAP: Record<string, VerificationType> = {
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
    requirements: [
      'Email Verification',
      'Basic Personal Information',
      'Phone Number Verification'
    ],
    features: [
      'Basic trading features',
      'Limited trading volume',
      'Basic support'
    ],
    dailyLimit: 100,
    monthlyLimit: 1000,
    withdrawalLimit: 200,
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
    dailyLimit: 500,
    monthlyLimit: 5000,
    withdrawalLimit: 1000,
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
    dailyLimit: 2000,
    monthlyLimit: 20000,
    withdrawalLimit: 5000,
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
    dailyLimit: 10000,
    monthlyLimit: 100000,
    withdrawalLimit: 20000,
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
    dailyLimit: 50000,
    monthlyLimit: 500000,
    withdrawalLimit: 100000,
  },
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

// Add new interface for tracking pending verifications
interface PendingVerifications {
  [key: string]: boolean;
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
    <div className="flex items-center justify-between py-2">
      <span>{type}</span>
      {isVerified ? (
        <Badge variant="outline" className="bg-green-50 text-green-700">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Verified
        </Badge>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onClick}
          className="hover:bg-green-50 hover:text-green-700"
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

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(defaultStatus);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerifications>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationType, setVerificationType] = useState<VerificationType | null>(null);
  const [tierProgress, setTierProgress] = useState<Record<string, TierProgress>>({});
  
  // Replace processedToasts state with ref
  const processedToastsRef = useRef<Set<string>>(new Set());
  const previousStatusRef = useRef<VerificationStatus>(defaultStatus);
  
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const router = useRouter();

  // Add function to check if verification is newly completed
  const isNewlyVerified = (type: string, newStatus: VerificationStatus) => {
    return (
      newStatus[type as keyof VerificationStatus] && // Is verified in new status
      !previousStatusRef.current[type as keyof VerificationStatus] && // Wasn't verified in previous status
      !processedToastsRef.current.has(type) // Haven't shown toast yet
    );
  };

  // Add function to handle verification status updates
  const updateVerificationStatus = (newStatus: VerificationStatus) => {
    // Get the differences between current and new status
    const newlyVerified = Object.entries(newStatus).filter(
      ([key, isVerified]) => isVerified && isNewlyVerified(key, newStatus)
    );

    // Show toasts only for newly verified items
    newlyVerified.forEach(([type]) => {
      toast({
        title: "Verification Complete",
        description: `Your ${type.replace(/_/g, ' ')} has been approved!`,
        duration: 5000,
        className: "bg-green-600 border-green-700 text-white"
      });
      // Add to processed toasts ref
      processedToastsRef.current.add(type);
    });

    // Update verification status and previous status ref
    setVerificationStatus(newStatus);
    previousStatusRef.current = newStatus;
  };

  useEffect(() => {
    const initializeVerificationStatus = async () => {
      try {
        // Get user session to access metadata
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return;
        }

        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('kyc_level, verification_history')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        const userMetadata = user.user_metadata;
        const verificationHistory = profile?.verification_history || {};
        
        // Create initial status combining profile history and user metadata
        const combinedStatus: VerificationStatus = {
          ...defaultStatus,
          ...verificationHistory,
          // Set email and phone verification from user metadata
          email: userMetadata?.email_verified === true || user.confirmed_at != null,
          phone: userMetadata?.phone_verified || false,
          // If NIN exists in metadata, mark it as verified
          nin: userMetadata?.nin ? true : false,
          // Set basic info as verified if we have first_name and last_name
          basic_info: !!(userMetadata?.first_name && userMetadata?.last_name)
        };

        // Update verification history in database if it's empty or different
        if (!profile?.verification_history || JSON.stringify(profile.verification_history) !== JSON.stringify(combinedStatus)) {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              verification_history: combinedStatus
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating verification history:', updateError);
          }
        }

        // Initialize verification status and refs without showing toasts
        setVerificationStatus(combinedStatus);
        previousStatusRef.current = combinedStatus;
        
        // Initialize processed toasts ref with verified items
        Object.entries(combinedStatus)
          .filter(([_, isVerified]) => isVerified)
          .forEach(([type]) => processedToastsRef.current.add(type));
        
        // Calculate initial progress
        const progress = calculateTierProgress(combinedStatus);
        setTierProgress(progress);

      } catch (error) {
        console.error('Error in initialization:', error);
      }
    };

    initializeVerificationStatus();
  }, []);

  useEffect(() => {
    // Set up polling for updates
    const interval = setInterval(fetchUserStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Query user profile with correct user_id field
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('kyc_level, verification_history')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      // Get verification history from profile
      const verificationHistory = profile?.verification_history || {};

      // Combine with user metadata for complete verification status
      const combinedStatus: VerificationStatus = {
        ...defaultStatus,
        ...verificationHistory, // This ensures we get the phone status from the database
        email: user.user_metadata?.email_verified === true || user.confirmed_at != null,
        basic_info: !!user.user_metadata?.first_name || false
      };

      // Update verification status in state
      updateVerificationStatus(combinedStatus);

      // Calculate and update tier progress
      const progress = calculateTierProgress(combinedStatus);
      setTierProgress(progress);

    } catch (error) {
      console.error('Error in fetchUserStatus:', error);
    }
  };

  const calculateTierProgress = (verificationStatus: VerificationStatus) => {
    const progress: Record<string, TierProgress> = {};
    
    Object.entries(KYC_TIERS).forEach(([tier, details]) => {
      const requirements = details.requirements;
      const completed = requirements.filter(req => {
        const reqKey = VERIFICATION_TYPE_MAP[req];
        return verificationStatus[reqKey as keyof VerificationStatus];
      }).length;
      
      const remaining = requirements.filter(req => {
        const reqKey = VERIFICATION_TYPE_MAP[req];
        return !verificationStatus[reqKey as keyof VerificationStatus];
      });

      progress[tier] = {
        completed,
        total: requirements.length,
        percentage: Math.round((completed / requirements.length) * 100),
        remainingRequirements: remaining
      };
    });

    return progress;
  };

  // Add function to check if previous tier is completed
  const isPreviousTierCompleted = (currentTier: string) => {
    const tiers = Object.keys(KYC_TIERS);
    const currentIndex = tiers.indexOf(currentTier);
    
    // If we're at TIER_1 or invalid tier, return true
    if (currentIndex <= 0) return true;
    
    // Get previous tier
    const previousTier = tiers[currentIndex - 1];
    const previousTierProgress = tierProgress[previousTier];
    
    // Return true if previous tier is 100% complete
    return previousTierProgress?.percentage === 100;
  };

  const startVerification = async (type: string) => {
    if (!isValidVerificationType(type)) return;

    if (type === 'phone') {
      router.push('/profile/security/phone');
      return;
    }

    // Handle other verification types...
    setVerificationType(type);
    setShowVerificationModal(true);
  };

  // Add function to check if requirement is available
  const isRequirementAvailable = (requirement: string, tier: string) => {
    // If it's already verified, it's not available
    const reqKey = VERIFICATION_TYPE_MAP[requirement];
    if (verificationStatus[reqKey as keyof VerificationStatus]) {
      return false;
    }

    // If previous tier is not completed, it's not available
    if (!isPreviousTierCompleted(tier)) {
      return false;
    }

    return true;
  };

  // Add type guard function
  function isValidVerificationType(type: string): type is VerificationType {
    return ['nin', 'bvn', 'livecheck', 'government_id', 'passport', 'selfie', 'phone'].includes(type);
  }

  const renderStatusIcon = (requirement: string) => {
    // Convert requirement to the correct key format using VERIFICATION_TYPE_MAP
    const reqKey = VERIFICATION_TYPE_MAP[requirement] as keyof VerificationStatus;
    const isVerified = verificationStatus[reqKey];
    const isPending = pendingVerifications[reqKey];
    
    if (isVerified) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-green-600"
        >
          <CheckCircle2 className="h-5 w-5" />
        </motion.div>
      );
    }
    
    if (isPending) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-yellow-600"
        >
          <Clock className="h-5 w-5" />
        </motion.div>
      );
    }
    
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-gray-400"
      >
        <XCircle className="h-5 w-5" />
      </motion.div>
    );
  };

  const getVerificationStatus = (requirement: string) => {
    const type = VERIFICATION_TYPE_MAP[requirement];
    if (!type) return false;
    return verificationStatus[type] || false;
  };

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    setVerificationType(null);
    // Refresh verification status after modal closes
    fetchUserStatus();
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
                            {!getVerificationStatus(req) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startVerification(req)}
                                className={cn(
                                  "ml-auto transition-all duration-200 hover:scale-[1.01]",
                                  "dark:text-white dark:hover:text-green-600 dark:bg-green-600/20 dark:hover:bg-green-600/30 dark:border-green-600/20 dark:hover:border-green-600/30",
                                  "text-black hover:text-green-600 bg-transparent hover:bg-green-600/10 border-black/20 hover:border-green-600/20",
                                  !isRequirementAvailable(req, tier) && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={!isRequirementAvailable(req, tier)}
                                title={!isPreviousTierCompleted(tier) ? "Complete previous tier first" : ""}
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
                              {formatCurrency(value, 'USD')}
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

      {showVerificationModal && verificationType && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={handleCloseVerificationModal}
          verificationType={verificationType}
          requestId={`kyc-${verificationType}`}
        />
      )}
    </div>
  );
} 