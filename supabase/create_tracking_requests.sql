-- 1. Create Tracking Requests Table
CREATE TABLE IF NOT EXISTS tracking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT NOT NULL,
  courier_name TEXT,
  status TEXT DEFAULT 'pending',
  full_name TEXT,
  mobile_number TEXT,
  affiliate_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE tracking_requests ENABLE ROW LEVEL SECURITY;

-- 3. Allow anonymous inserts (for public forms/api)
CREATE POLICY "Allow anon insert tracking" ON tracking_requests
  FOR INSERT WITH CHECK (true);

-- 4. Allow service role full access
CREATE POLICY "Service role full access tracking" ON tracking_requests
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tracking_created ON tracking_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_number ON tracking_requests (tracking_number);
