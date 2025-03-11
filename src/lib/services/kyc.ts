import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { KYCTier, KYCStatus, VerificationStatus, KYCRecord, NINVerificationResponse, BVNVerificationResponse, PhotoIDVerificationResponse } from '@/lib/types/kyc';
import { dojahService } from './dojah';

export class KYCService {
  private supabase = createClientComponentClient();
  private dojah = dojahService;

  async createKYCRecord(userId: string, tier: KYCTier): Promise<KYCRecord> {
    const { data, error } = await this.supabase
      .from('kyc_records')
      .insert({
        user_id: userId,
        tier,
        status: 'pending',
        verification_status: 'Pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateKYCStatus(
    recordId: string, 
    status: KYCStatus, 
    verificationStatus: VerificationStatus,
    verificationData?: any
  ): Promise<void> {
    const { error } = await this.supabase
      .from('kyc_records')
      .update({
        status,
        verification_status: verificationStatus,
        verification_data: verificationData,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId);

    if (error) throw error;
  }

  async getKYCRecord(userId: string): Promise<KYCRecord | null> {
    const { data, error } = await this.supabase
      .from('kyc_records')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async verifyNIN(
    recordId: string,
    nin: string,
    selfieImage: string,
    firstName?: string,
    lastName?: string
  ): Promise<void> {
    try {
      const response = await this.dojah.verifyNIN(nin, selfieImage, firstName, lastName);
      
      // Check confidence value for selfie verification
      const isVerified = response.entity.selfie_verification?.confidence_value >= 90;
      
      await this.updateKYCStatus(
        recordId,
        isVerified ? 'verified' : 'rejected',
        isVerified ? 'Completed' : 'Failed',
        response
      );
    } catch (error) {
      await this.updateKYCStatus(recordId, 'rejected', 'Failed', { error });
      throw error;
    }
  }

  async verifyBVN(
    recordId: string,
    bvn: string,
    firstName?: string,
    lastName?: string,
    dob?: string
  ): Promise<void> {
    try {
      const response = await this.dojah.verifyBVN(bvn, firstName, lastName, dob);
      
      const isVerified = response.entity.verification?.status === true && 
                        (!firstName || response.entity.verification?.confidence_value >= 90);
      
      await this.updateKYCStatus(
        recordId,
        isVerified ? 'verified' : 'rejected',
        isVerified ? 'Completed' : 'Failed',
        response
      );
    } catch (error) {
      await this.updateKYCStatus(recordId, 'rejected', 'Failed', { error });
      throw error;
    }
  }

  async verifyPhotoID(
    recordId: string,
    selfieImage: string,
    photoIdImage: string,
    firstName?: string,
    lastName?: string
  ): Promise<void> {
    try {
      const response = await this.dojah.verifyPhotoID(selfieImage, photoIdImage, firstName, lastName);
      
      const isVerified = response.entity.selfie_verification?.confidence_value >= 90;
      
      await this.updateKYCStatus(
        recordId,
        isVerified ? 'verified' : 'rejected',
        isVerified ? 'Completed' : 'Failed',
        response
      );
    } catch (error) {
      await this.updateKYCStatus(recordId, 'rejected', 'Failed', { error });
      throw error;
    }
  }

  async getKYCLimits(tier: KYCTier): Promise<{ daily: number; monthly: number }> {
    const limits = {
      basic: { daily: 100000, monthly: 1000000 }, // NGN
      intermediate: { daily: 500000, monthly: 5000000 },
      advanced: { daily: 2000000, monthly: 20000000 }
    };
    return limits[tier];
  }

  async getUserKYCTier(userId: string): Promise<KYCTier> {
    const record = await this.getKYCRecord(userId);
    if (!record || record.status !== 'verified') return 'basic';
    return record.tier;
  }

  async subscribeToWebhooks(webhookUrl: string): Promise<void> {
    await this.dojah.subscribeWebhook(webhookUrl, 'kyc_widget');
  }

  async handleWebhook(payload: any): Promise<void> {
    const { verification_status, reference_id, data } = payload;
    
    // Find KYC record by reference ID in verification_data
    const { data: records, error } = await this.supabase
      .from('kyc_records')
      .select('*')
      .contains('verification_data', { reference_id });

    if (error) throw error;
    if (!records.length) return;

    const record = records[0];
    
    await this.updateKYCStatus(
      record.id,
      verification_status === 'Completed' ? 'verified' : 'rejected',
      verification_status,
      data
    );
  }
}

export const kycService = new KYCService(); 