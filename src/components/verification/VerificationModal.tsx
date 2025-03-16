import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Upload, Loader2, Camera } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { FormProvider } from "react-hook-form";

export type VerificationType = 'email' | 'phone' | 'basic_info' | 'nin' | 'bvn' | 'livecheck' | 'government_id' | 'passport' | 'selfie';

export interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationType: VerificationType;
  requestId: string;
}

interface VerificationConfig {
  title: string;
  description: string;
  fields: string[];
}

const VERIFICATION_TYPES: Record<VerificationType, VerificationConfig> = {
  email: {
    title: 'Email Verification',
    description: 'Verify your email address',
    fields: ['email']
  },
  phone: {
    title: 'Phone Verification',
    description: 'Verify your phone number',
    fields: ['phone']
  },
  basic_info: {
    title: 'Basic Information',
    description: 'Provide your basic information',
    fields: ['firstName', 'lastName', 'dateOfBirth', 'address']
  },
  nin: {
    title: 'NIN Verification',
    description: 'Verify your National Identification Number',
    fields: ['nin', 'selfie']
  },
  bvn: {
    title: 'BVN Verification',
    description: 'Verify your Bank Verification Number',
    fields: ['bvn']
  },
  livecheck: {
    title: 'Live Check',
    description: 'Complete a live verification check',
    fields: ['selfie']
  },
  government_id: {
    title: 'Government ID',
    description: 'Upload your government-issued ID',
    fields: ['idType', 'idNumber', 'idFront', 'idBack']
  },
  passport: {
    title: 'Passport Verification',
    description: 'Verify your international passport',
    fields: ['passport_number', 'passportImage']
  },
  selfie: {
    title: 'Selfie Verification',
    description: 'Take a selfie for verification',
    fields: ['selfie']
  }
};

const formSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().min(5).optional(),
  nin: z.string().min(11).max(11).optional(),
  bvn: z.string().min(11).max(11).optional(),
  passport_number: z.string().min(8).optional(),
});

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

const LoadingButton = ({ loading, children, ...props }: LoadingButtonProps) => (
  <Button {...props} disabled={loading}>
    {loading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Submitting...
      </>
    ) : children}
  </Button>
);

export function VerificationModal({
  isOpen,
  onClose,
  verificationType,
  requestId
}: VerificationModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClientComponentClient();

  const methods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Add your default form values here based on verification type
    }
  });

  const verificationConfig = VERIFICATION_TYPES[verificationType as keyof typeof VERIFICATION_TYPES];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            handleFileChange('selfie', file);
          }
        }, 'image/jpeg');
        stopCamera();
      }
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (formData: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      // Upload files to Supabase storage if any
      const uploads = await Promise.all(
        Object.entries(files).map(async ([field, file]) => {
          if (!file) return null;

          const { data, error } = await supabase.storage
            .from('verifications')
            .upload(`${requestId}/${field}`, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type
            });

          if (error) throw error;
          return { field, path: data.path };
        })
      );

      // Update verification request with file paths and form data
      const { error: updateError } = await supabase
        .from('verification_requests')
        .update({
          status: 'submitted',
          metadata: {
            files: uploads.reduce((acc, upload) => {
              if (upload) {
                acc[upload.field] = upload.path;
              }
              return acc;
            }, {} as Record<string, string>),
            form_data: formData
          }
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      onClose();
    } catch (error) {
      console.error('Verification submission failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field: string) => {
    switch (field) {
      case 'email':
        return (
          <FormField
            control={methods.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'phone':
        return (
          <FormField
            control={methods.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Enter your phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'firstName':
      case 'lastName':
        return (
          <FormField
            control={methods.control}
            name={field}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field === 'firstName' ? 'First Name' : 'Last Name'}</FormLabel>
                <FormControl>
                  <Input placeholder={`Enter your ${field === 'firstName' ? 'first' : 'last'} name`} {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'dateOfBirth':
        return (
          <FormField
            control={methods.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'address':
        return (
          <FormField
            control={methods.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'nin':
        return (
          <FormField
            control={methods.control}
            name="nin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>National Identity Number (NIN)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your 11-digit NIN" maxLength={11} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'bvn':
        return (
          <FormField
            control={methods.control}
            name="bvn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Verification Number (BVN)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your 11-digit BVN" maxLength={11} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'passport_number':
        return (
          <FormField
            control={methods.control}
            name="passport_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passport Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your passport number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'selfie':
        return (
          <div className="space-y-4">
            <Label>Selfie</Label>
            {isCameraActive ? (
              <div className="space-y-4">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
                <Button onClick={capturePhoto} className="w-full">
                  Capture Photo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {files.selfie ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(files.selfie)}
                      alt="Captured selfie"
                      className="w-full rounded-lg"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFiles(prev => ({ ...prev, selfie: null }));
                        startCamera();
                      }}
                      className="mt-2"
                    >
                      Retake Photo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={startCamera} className="w-full">
                      <Camera className="mr-2 h-4 w-4" />
                      Take Selfie
                    </Button>
                    <div className="relative">
                      <input
                        type="file"
                        id="selfie"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('selfie')?.click()}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Selfie
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        );
      case 'id_front':
      case 'id_back':
      case 'passport_scan':
        return (
          <div className="space-y-4">
            <Label>{field === 'id_front' ? 'Front of ID' : field === 'id_back' ? 'Back of ID' : 'Passport Scan'}</Label>
            <div className="space-y-4">
              {files[field] ? (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(files[field]!)}
                    alt={`Uploaded ${field}`}
                    className="w-full rounded-lg"
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleFileChange(field, null)}
                    className="mt-2"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={startCamera} className="w-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Capture {field === 'id_front' ? 'Front' : field === 'id_back' ? 'Back' : 'Passport'}
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      id={field}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById(field)?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {field === 'id_front' ? 'Front' : field === 'id_back' ? 'Back' : 'Passport'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {VERIFICATION_TYPES[verificationType].title}
          </DialogTitle>
          <DialogDescription>
            {VERIFICATION_TYPES[verificationType].description}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
            {VERIFICATION_TYPES[verificationType].fields.map((field: string) => (
              <div key={field} className="space-y-2">
                {renderField(field)}
              </div>
            ))}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <LoadingButton type="submit" loading={isLoading}>
                Submit
              </LoadingButton>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
} 