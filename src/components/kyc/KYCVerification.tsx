'use client';

import { useState, useRef } from 'react';
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

interface KYCVerificationProps {
  userId: string;
  tier: KYCTier;
  onVerificationComplete?: () => void;
}

export function KYCVerification({ userId, tier, onVerificationComplete }: KYCVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    nin: '',
    bvn: '',
    firstName: '',
    lastName: '',
    dob: '',
  });
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [photoIdImage, setPhotoIdImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const kycService = new KYCService();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size should be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      
      if (e.target.name === 'selfie') {
        setSelfieImage(base64Data);
      } else {
        setPhotoIdImage(base64Data);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVerification = async () => {
    try {
      setLoading(true);
      
      // Create KYC record
      const record = await kycService.createKYCRecord(userId, tier);
      
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

      toast({
        title: "Verification Submitted",
        description: "Your verification is being processed. You will be notified once completed.",
      });

      onVerificationComplete?.();
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "An error occurred during verification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-green-600">
            {tier === 'basic' && 'Basic Verification (Tier 1)'}
            {tier === 'intermediate' && 'Intermediate Verification (Tier 2)'}
            {tier === 'advanced' && 'Advanced Verification (Tier 3)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                {tier === 'basic' && 'Please provide your NIN and a selfie photo for basic verification.'}
                {tier === 'intermediate' && 'Please provide your BVN and personal details for intermediate verification.'}
                {tier === 'advanced' && 'Please provide your photo ID and a selfie photo for advanced verification.'}
              </AlertDescription>
            </Alert>

            <Progress value={progress} className="w-full" />

            {renderVerificationForm()}

            <Button
              className="w-full"
              onClick={handleVerification}
              disabled={loading}
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
    </motion.div>
  );
} 