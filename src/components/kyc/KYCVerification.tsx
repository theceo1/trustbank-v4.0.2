'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { KYCService } from '@/lib/services/kyc';
import { KYCTier } from '@/lib/types/kyc';
import { motion } from 'framer-motion';
import { compressImage } from '@/lib/utils/imageCompression';

interface KYCVerificationProps {
  userId: string;
  tier: KYCTier;
  onVerificationComplete?: () => void;
}

export function KYCVerification({ userId, tier, onVerificationComplete }: KYCVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState(() => {
    // Load saved form data from localStorage if available
    const savedData = localStorage.getItem(`kyc_form_${userId}`);
    return savedData ? JSON.parse(savedData) : {
      nin: '',
      bvn: '',
      firstName: '',
      lastName: '',
      dob: '',
    };
  });
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [photoIdImage, setPhotoIdImage] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'form' | 'processing' | 'submitting'>('form');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const kycService = new KYCService();

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`kyc_form_${userId}`, JSON.stringify(formData));
  }, [formData, userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Update file size limit to 20MB
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size should be less than 20MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingImage(true);
      
      // Compress image before converting to base64
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 2048,
        useWebWorker: true
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        if (e.target.name === 'selfie') {
          setSelfieImage(base64Data);
          setProgress(prev => Math.min(prev + 33, 100));
        } else {
          setPhotoIdImage(base64Data);
          setProgress(prev => Math.min(prev + 33, 100));
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast({
        title: "Image Processing Failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingImage(false);
    }
  };

  const handleVerification = async () => {
    try {
      setVerificationStep('processing');
      setLoading(true);
      
      // Create KYC record
      const record = await kycService.createKYCRecord(userId, tier);
      setProgress(40);
      
      setVerificationStep('submitting');
      switch (tier) {
        case 'basic':
          if (!formData.nin || !selfieImage) {
            throw new Error('Please provide NIN and selfie');
          }
          await kycService.verifyNIN(
            record.id,
            formData.nin,
            selfieImage,
            formData.firstName,
            formData.lastName
          );
          break;
          
        case 'intermediate':
          if (!formData.bvn) {
            throw new Error('Please provide BVN');
          }
          await kycService.verifyBVN(
            record.id,
            formData.bvn,
            formData.firstName,
            formData.lastName,
            formData.dob
          );
          break;
          
        case 'advanced':
          if (!selfieImage || !photoIdImage) {
            throw new Error('Please provide selfie and photo ID');
          }
          await kycService.verifyPhotoID(
            record.id,
            selfieImage,
            photoIdImage,
            formData.firstName,
            formData.lastName
          );
          break;
      }

      setProgress(100);
      
      // Clear saved form data after successful submission
      localStorage.removeItem(`kyc_form_${userId}`);

      toast({
        title: "Verification Submitted",
        description: "Your verification is being processed. You will be notified once completed.",
      });

      onVerificationComplete?.();
    } catch (error) {
      setProgress(0);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "An error occurred during verification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setVerificationStep('form');
    }
  };

  const renderVerificationForm = () => {
    switch (tier) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nin">National Identity Number (NIN)</Label>
              <Input
                id="nin"
                name="nin"
                value={formData.nin}
                onChange={handleInputChange}
                placeholder="Enter your NIN"
              />
            </div>
            <div className="space-y-2">
              <Label>Selfie Photo</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Selfie
                </Button>
                {selfieImage && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                name="selfie"
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        );

      case 'intermediate':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
              <Input
                id="bvn"
                name="bvn"
                value={formData.bvn}
                onChange={handleInputChange}
                placeholder="Enter your BVN"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
              />
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Photo ID (International Passport, Driver's License)</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload ID
                </Button>
                {photoIdImage && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                name="photoId"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="space-y-2">
              <Label>Selfie Photo</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Selfie
                </Button>
                {selfieImage && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                name="selfie"
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Verification - {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Progress value={progress} className="w-full" />
          
          <Alert>
            <AlertDescription>
              Please ensure all documents are clear and legible. Maximum file size is 20MB.
            </AlertDescription>
          </Alert>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {verificationStep === 'form' && renderVerificationForm()}
            {verificationStep === 'processing' && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <p>Processing your documents...</p>
              </div>
            )}
            {verificationStep === 'submitting' && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <p>Submitting verification...</p>
              </div>
            )}
          </motion.div>

          <Button
            onClick={handleVerification}
            disabled={loading || processingImage}
            className="w-full bg-green-600 hover:bg-green-700"
            aria-busy={loading}
            aria-disabled={loading || processingImage}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Submit Verification'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 