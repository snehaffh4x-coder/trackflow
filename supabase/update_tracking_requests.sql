-- Add missing columns to tracking_requests to store user details and affiliate reference
ALTER TABLE tracking_requests ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE tracking_requests ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE tracking_requests ADD COLUMN IF NOT EXISTS affiliate_id TEXT;
