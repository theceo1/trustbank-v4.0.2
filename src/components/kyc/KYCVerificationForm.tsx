'use client';

import { useState, useRef } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { dojahService } from '@/lib/dojah';
import type { Database } from '@/lib/supabase';
import { Camera, RefreshCw } from 'lucide-react';

interface KYCVerificationFormProps {
  level: 'basic' | 'intermediate' | 'advanced';
  onComplete: () => void;
  onCancel: () => void;
}

const formSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('basic'),
    nin: z.string().min(11, 'NIN must be 11 digits').max(11),
    selfieImage: z.string().min(1, 'Selfie is required'),
  }),
  z.object({
    type: z.literal('intermediate'),
    bvn: z.string().min(11, 'BVN must be 11 digits').max(11),
  }),
  z.object({
    type: z.literal('advanced'),
    idType: z.enum(['passport', 'drivers_license']),
    idNumber: z.string().min(1, 'ID number is required'),
    selfieImage: z.string().min(1, 'Selfie is required'),
  }),
]);

type FormData = z.infer<typeof formSchema>;

export function KYCVerificationForm({
  level,
  onComplete,
  onCancel,
}: KYCVerificationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClientComponentClient<Database>();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: level,
    } as FormData,
  });

  // Type guards for form errors
  const isBasicErrors = (errors: any): errors is FieldErrors<{ type: 'basic'; nin: string; selfieImage: string }> => {
    return errors?.type?.type === 'basic';
  };

  const isIntermediateErrors = (errors: any): errors is FieldErrors<{ type: 'intermediate'; bvn: string }> => {
    return errors?.type?.type === 'intermediate';
  };

  const isAdvancedErrors = (errors: any): errors is FieldErrors<{ type: 'advanced'; idType: string; idNumber: string; selfieImage: string }> => {
    return errors?.type?.type === 'advanced';
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        setValue('selfieImage', imageData.split(',')[1]);
        stopCamera();
      }
    }
  };

  const retakeSelfie = () => {
    setCapturedImage(null);
    setValue('selfieImage', '');
    startCamera();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setValue(field as any, base64Data);
        if (field === 'selfieImage') {
          setCapturedImage(base64String);
        }
      };
    } catch (err: any) {
      console.error('Error handling file:', err);
      setError(err.message);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setVerificationStatus('pending');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      let verificationResult;

      switch (data.type) {
        case 'basic': {
          verificationResult = await dojahService.verifyNIN({
            nin: data.nin,
            selfieImage: data.selfieImage,
          });
          break;
        }
        case 'intermediate': {
          verificationResult = await dojahService.verifyBVN({
            bvn: data.bvn,
          });
          break;
        }
        case 'advanced': {
          verificationResult = await dojahService.verifyID({
            idType: data.idType,
            idNumber: data.idNumber,
            selfieImage: data.selfieImage,
          });
          break;
        }
      }

      if (!verificationResult.success) {
        throw new Error(verificationResult.error || 'Verification failed');
      }

      // Create KYC record
      const { error: kycError } = await supabase
        .from('kyc_records')
        .insert({
          user_id: user.id,
          document_type: data.type === 'basic' ? 'nin' : data.type === 'intermediate' ? 'bvn' : data.idType,
          document_number: data.type === 'basic' ? data.nin : data.type === 'intermediate' ? data.bvn : data.idNumber,
          status: 'pending',
          reference_id: verificationResult.referenceId,
        });

      if (kycError) throw kycError;

      // Start polling for verification status
      const pollInterval = setInterval(async () => {
        if (!verificationResult.referenceId) return;

        const statusResult = await dojahService.checkVerificationStatus(verificationResult.referenceId);
        if (statusResult.success) {
          clearInterval(pollInterval);
          setVerificationStatus('success');
          onComplete();
        } else if (statusResult.error) {
          clearInterval(pollInterval);
          setVerificationStatus('error');
          setError(statusResult.error);
        }
      }, 5000); // Poll every 5 seconds

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (verificationStatus === 'pending') {
          setVerificationStatus('error');
          setError('Verification timeout. Please try again.');
        }
      }, 120000);

    } catch (err: any) {
      console.error('Error during verification:', err);
      setError(err.message);
      setVerificationStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {level === 'basic'
            ? 'Basic Verification'
            : level === 'intermediate'
            ? 'Intermediate Verification'
            : 'Advanced Verification'}
        </h2>
        <p className="text-muted-foreground">
          Please provide the required information for verification
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {level === 'basic' && (
          <>
            <div className="space-y-2">
              <Input
                {...register('nin')}
                type="text"
                placeholder="National Identification Number"
                disabled={isLoading}
              />
              {isBasicErrors(errors) && errors.nin && (
                <p className="text-sm text-red-500">
                  {errors.nin.message}
                </p>
              )}
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Selfie Photo</h3>
                  {!showCamera && !capturedImage && (
                    <Button
                      type="button"
                      onClick={startCamera}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Take Selfie
                    </Button>
                  )}
                </div>

                {showCamera && (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={captureSelfie}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Capture Photo
                    </Button>
                  </div>
                )}

                {capturedImage && (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <img
                        src={capturedImage}
                        alt="Captured selfie"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={retakeSelfie}
                      variant="outline"
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retake Photo
                    </Button>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>Requirements:</p>
                  <ul className="list-disc list-inside">
                    <li>Ensure good lighting</li>
                    <li>Face the camera directly</li>
                    <li>Remove sunglasses or face coverings</li>
                  </ul>
                </div>

                <div className="text-sm">
                  <p>Or upload a photo:</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'selfieImage')}
                    disabled={isLoading}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {level === 'intermediate' && (
          <div className="space-y-2">
            <Input
              {...register('bvn')}
              type="text"
              placeholder="Bank Verification Number"
              disabled={isLoading}
            />
            {isIntermediateErrors(errors) && errors.bvn && (
              <p className="text-sm text-red-500">
                {errors.bvn.message}
              </p>
            )}
          </div>
        )}

        {level === 'advanced' && (
          <>
            <div className="space-y-2">
              <select
                {...register('idType')}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2"
                disabled={isLoading}
              >
                <option value="passport">International Passport</option>
                <option value="drivers_license">Driver's License</option>
              </select>
              {isAdvancedErrors(errors) && errors.idType && (
                <p className="text-sm text-red-500">
                  {errors.idType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                {...register('idNumber')}
                type="text"
                placeholder="ID Number"
                disabled={isLoading}
              />
              {isAdvancedErrors(errors) && errors.idNumber && (
                <p className="text-sm text-red-500">
                  {errors.idNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'selfieImage')}
                disabled={isLoading}
              />
              {isAdvancedErrors(errors) && errors.selfieImage && (
                <p className="text-sm text-red-500">
                  {errors.selfieImage.message}
                </p>
              )}
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {verificationStatus === 'pending' && (
          <div className="text-center py-4">
            <Icons.spinner className="h-8 w-8 animate-spin mx-auto text-green-600" />
            <p className="mt-2 text-sm text-muted-foreground">
              Verifying your information...
            </p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </form>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
} 