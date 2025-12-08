-- ===========================================
-- OrbId Analytics Database Schema
-- ===========================================
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- USERS TABLE - Core user data
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  wallet_address TEXT UNIQUE,
  world_id_hash TEXT,
  is_verified_human BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  total_logins INT DEFAULT 0,
  total_tx_sent INT DEFAULT 0,
  total_tx_received INT DEFAULT 0,
  total_session_time_seconds INT DEFAULT 0,
  analytics_consent BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_country ON analytics_users(country_code);
CREATE INDEX IF NOT EXISTS idx_users_created ON analytics_users(created_at);

-- ===========================================
-- SESSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES analytics_users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  ip_address TEXT,
  country_code TEXT,
  user_agent TEXT,
  pages_viewed INT DEFAULT 0,
  actions_taken INT DEFAULT 0
);

-- ===========================================
-- EVENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES analytics_users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES analytics_sessions(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_category TEXT,
  metadata JSONB DEFAULT '{}',
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_date ON analytics_events(created_at);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE analytics_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access users" ON analytics_users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access sessions" ON analytics_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access events" ON analytics_events FOR ALL USING (auth.role() = 'service_role');
