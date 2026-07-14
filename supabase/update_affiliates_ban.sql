-- Add ban management columns to affiliate_links
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Ensure indexes exist for fast checking
CREATE INDEX IF NOT EXISTS idx_affiliate_links_banned ON affiliate_links (is_banned);
