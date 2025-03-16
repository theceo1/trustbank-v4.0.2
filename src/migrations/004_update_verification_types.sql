-- Add basic_info to valid verification types
ALTER TABLE verification_requests
DROP CONSTRAINT valid_verification_type;

ALTER TABLE verification_requests
ADD CONSTRAINT valid_verification_type CHECK (
  verification_type IN (
    'email',
    'phone',
    'basic_info',
    'nin',
    'bvn',
    'livecheck',
    'government_id',
    'passport',
    'selfie'
  )
); 