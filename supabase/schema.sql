-- ============================================
-- TrackFlow — Supabase Database Schema
-- ============================================
-- Run this in your Supabase SQL Editor

-- 1. Tracking Requests
CREATE TABLE IF NOT EXISTS tracking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT NOT NULL,
  courier_name TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Visitor Logs
CREATE TABLE IF NOT EXISTS visitor_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE tracking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for public forms)
CREATE POLICY "Allow anon insert tracking" ON tracking_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon insert visitors" ON visitor_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon insert contact" ON contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon insert newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Allow service role full access (for admin API routes)
CREATE POLICY "Service role full access tracking" ON tracking_requests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access visitors" ON visitor_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access contact" ON contact_messages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access newsletter" ON newsletter_subscribers
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tracking_created ON tracking_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_number ON tracking_requests (tracking_number);
CREATE INDEX IF NOT EXISTS idx_visitors_created ON visitor_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_page ON visitor_logs (page);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers (email);
