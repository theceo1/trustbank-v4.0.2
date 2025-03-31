-- Add referred_by column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS referred_by VARCHAR(255);

-- Add index on referred_by column
CREATE INDEX IF NOT EXISTS idx_user_profiles_referred_by ON public.user_profiles(referred_by);

-- Add foreign key constraint to ensure referred_by points to a valid referral_code
ALTER TABLE public.user_profiles
ADD CONSTRAINT fk_user_profiles_referred_by 
FOREIGN KEY (referred_by) 
REFERENCES public.user_profiles(referral_code)
ON DELETE SET NULL; 