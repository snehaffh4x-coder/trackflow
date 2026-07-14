-- Add telegram_username column to store the affiliate's @username
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS telegram_username TEXT;
