import axios from 'axios';

const dojahApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_DOJAH_API_URL,
  headers: {
    'AppId': process.env.DOJAH_APP_ID,
    'Authorization': process.env.DOJAH_API_KEY,
  },
});

export interface NINVerificationData {
  nin: string;
  selfieImage: string;
}

export interface BVNVerificationData {
  bvn: string;
}

export interface IDVerificationData {
  idType: 'passport' | 'drivers_license';
  idNumber: string;
  selfieImage: string;
}

export interface VerificationResponse {
  success: boolean;
  referenceId?: string;
  error?: string;
  data?: any;
}

export const dojahService = {
  async registerWebhook() {
    try {
      const response = await dojahApi.post('/api/v1/webhook/subscribe', {
        webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/dojah`,
        service: 'kyc',
      }, {
        headers: {
          'Authorization': process.env.DOJAH_API_KEY,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error registering webhook:', error);
      throw new Error(error.response?.data?.message || 'Failed to register webhook');
    }
  },

  async verifyNIN(data: NINVerificationData): Promise<VerificationResponse> {
    try {
      const response = await dojahApi.post('/api/v1/kyc/nin', {
        nin: data.nin,
        selfie_image: data.selfieImage,
      });

      const { entity } = response.data;
      const success = entity?.selfie_verification?.match === true;

      return {
        success,
        referenceId: response.headers['x-ref-id'],
        data: entity,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'NIN verification failed',
      };
    }
  },

  async verifyBVN(data: BVNVerificationData): Promise<VerificationResponse> {
    try {
      const response = await dojahApi.get('/api/v1/kyc/bvn', {
        params: { bvn: data.bvn },
      });

      const { entity } = response.data;
      const success = entity?.bvn?.status === true;

      return {
        success,
        referenceId: response.headers['x-ref-id'],
        data: entity,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'BVN verification failed',
      };
    }
  },

  async verifyID(data: IDVerificationData): Promise<VerificationResponse> {
    try {
      const response = await dojahApi.post('/api/v1/kyc/photoid/verify', {
        id_type: data.idType,
        id_number: data.idNumber,
        selfie_image: data.selfieImage,
      });

      const { entity } = response.data;
      const success = entity?.selfie?.match === true;

      return {
        success,
        referenceId: response.headers['x-ref-id'],
        data: entity,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'ID verification failed',
      };
    }
  },

  async checkVerificationStatus(referenceId: string): Promise<VerificationResponse> {
    try {
      const response = await dojahApi.get(`/api/v1/kyc/verification`, {
        params: { reference_id: referenceId },
      });

      return {
        success: response.data.verification_status === 'Completed',
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check verification status',
      };
    }
  },
}; 