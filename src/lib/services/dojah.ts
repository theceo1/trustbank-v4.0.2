import { NINVerificationResponse, BVNVerificationResponse, PhotoIDVerificationResponse } from '@/lib/types/kyc';

const DOJAH_API_URL = process.env.NEXT_PUBLIC_DOJAH_API_URL || 'https://api.dojah.io/api/v1';
const DOJAH_APP_ID = process.env.DOJAH_APP_ID;
const DOJAH_SECRET_KEY = process.env.DOJAH_SECRET_KEY;

class DojahService {
  private static instance: DojahService;
  private readonly baseUrl: string;
  private readonly headers: HeadersInit;

  private constructor() {
    this.baseUrl = DOJAH_API_URL;
    this.headers = {
      'Content-Type': 'application/json',
      'AppId': DOJAH_APP_ID!,
      'Authorization': `Bearer ${DOJAH_SECRET_KEY}`,
    };
  }

  public static getInstance(): DojahService {
    if (!DojahService.instance) {
      DojahService.instance = new DojahService();
    }
    return DojahService.instance;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to make request');
    }

    return response.json();
  }

  async verifyNIN(nin: string, selfieImage: string, firstName?: string, lastName?: string): Promise<NINVerificationResponse> {
    return this.request('/kyc/nin/verify', {
      method: 'POST',
      body: JSON.stringify({
        nin,
        selfie_image: selfieImage,
        first_name: firstName,
        last_name: lastName,
      }),
    });
  }

  async verifyBVN(bvn: string, firstName?: string, lastName?: string, dob?: string): Promise<BVNVerificationResponse> {
    const params = new URLSearchParams({
      bvn,
      ...(firstName && { first_name: firstName }),
      ...(lastName && { last_name: lastName }),
      ...(dob && { dob }),
    });

    return this.request(`/kyc/bvn?${params}`);
  }

  async verifyPhotoID(selfieImage: string, photoIdImage: string, firstName?: string, lastName?: string): Promise<PhotoIDVerificationResponse> {
    return this.request('/kyc/photoid/verify', {
      method: 'POST',
      body: JSON.stringify({
        selfie_image: selfieImage,
        photoid_image: photoIdImage,
        first_name: firstName,
        last_name: lastName,
      }),
    });
  }

  async subscribeWebhook(webhookUrl: string, service: string): Promise<{ entity: string }> {
    return this.request('/webhook/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        webhook: webhookUrl,
        service,
      }),
    });
  }

  async getVerification(referenceId: string): Promise<any> {
    return this.request(`/kyc/verification?reference_id=${referenceId}`);
  }

  async getAllVerifications(page: number = 1): Promise<any> {
    return this.request(`/kyc/verifications?page=${page}`);
  }
}

export const dojahService = DojahService.getInstance(); 