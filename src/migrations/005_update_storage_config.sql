-- Update storage configuration for verifications bucket
ALTER TABLE storage.buckets 
ADD COLUMN IF NOT EXISTS file_size_limit BIGINT DEFAULT 5242880;

UPDATE storage.buckets
SET file_size_limit = 20971520 -- 20MB in bytes
WHERE name = 'verifications';

-- If the bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, file_size_limit)
SELECT 'verifications', 'verifications', 20971520
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'verifications'
); 