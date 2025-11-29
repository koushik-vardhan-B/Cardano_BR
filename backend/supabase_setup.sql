-- Supabase Database Setup Script
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- TABLE: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: screenings
-- ============================================================================
CREATE TABLE IF NOT EXISTS screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id TEXT UNIQUE NOT NULL,
  patient_id TEXT NOT NULL,
  risk_score_label TEXT NOT NULL,
  risk_score_numeric INTEGER NOT NULL,
  confidence FLOAT NOT NULL,
  explanation TEXT,
  operator_user_id TEXT REFERENCES users(id),
  operator_name TEXT,
  
  -- Blockchain fields
  anchor_status TEXT DEFAULT 'pending',
  anchor_attempts INTEGER DEFAULT 0,
  tx_hash TEXT,
  did TEXT,
  report_hash TEXT,
  cardano_ref TEXT,
  last_anchor_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_screenings_operator ON screenings(operator_user_id);
CREATE INDEX IF NOT EXISTS idx_screenings_created ON screenings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screenings_status ON screenings(anchor_status);
CREATE INDEX IF NOT EXISTS idx_screenings_patient ON screenings(patient_id);

-- ============================================================================
-- TABLE: anchor_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS anchor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID REFERENCES screenings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  error_text TEXT,
  response_body JSONB,
  attempt_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for anchor logs
CREATE INDEX IF NOT EXISTS idx_anchor_logs_screening ON anchor_logs(screening_id);
CREATE INDEX IF NOT EXISTS idx_anchor_logs_attempt ON anchor_logs(attempt_at DESC);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_screenings_updated_at BEFORE UPDATE ON screenings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (Optional - Enable if needed)
-- ============================================================================
-- Uncomment these lines if you want to enable RLS
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE screenings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE anchor_logs ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own screenings
-- CREATE POLICY "Users can view own screenings" ON screenings
--   FOR SELECT USING (operator_user_id = auth.uid()::text);

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- INSERT INTO users (id, display_name) VALUES 
--   ('test-doctor-1', 'Dr. Test User'),
--   ('demo-operator', 'Demo Operator');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify setup:
-- SELECT * FROM users;
-- SELECT * FROM screenings;
-- SELECT * FROM anchor_logs;
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
