-- 1. Add the is_active column with a default of false
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- 2. (Optional but recommended) Update all existing records to be active so current users aren't suddenly blocked
-- You can comment this out if you want everyone to be blocked until you manually approve them.
UPDATE affiliate_links SET is_active = true WHERE is_active IS NULL;
