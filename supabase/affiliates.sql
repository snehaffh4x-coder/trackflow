-- 5. Affiliate Links
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT UNIQUE NOT NULL,
  affiliate_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select affiliates" ON affiliate_links
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert affiliates" ON affiliate_links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access affiliates" ON affiliate_links
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_affiliate_id ON affiliate_links (affiliate_id);
CREATE INDEX IF NOT EXISTS idx_chat_id ON affiliate_links (chat_id);
