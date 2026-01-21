-- ==========================================================
-- DocuGithub Database Schema
-- Based on n8n workflow requirements
-- ==========================================================

-- Drop existing tables if recreating
-- DROP TABLE IF EXISTS readme_versions CASCADE;
-- DROP TABLE IF EXISTS sessions CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ==========================================================
-- USERS TABLE
-- Stores authenticated users from Auth0
-- ==========================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_id TEXT UNIQUE NOT NULL,
  email TEXT,
  github_username TEXT,
  github_token TEXT, -- Encrypted GitHub access token from Auth0
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Auth0 lookups
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==========================================================
-- SESSIONS TABLE
-- Stores documentation generation sessions
-- ==========================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Repository Information
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  default_branch TEXT DEFAULT 'main',
  repo_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Session Status
  -- Possible values: initialized, analyzing, analyzed, preferences_set, 
  --                  generating, generated, revised, pushing, pushed, error
  status TEXT DEFAULT 'initialized',
  error_message TEXT,
  
  -- User Preferences
  preferences JSONB DEFAULT '{
    "tone": "professional",
    "sections": ["overview", "installation", "usage", "contributing", "license"],
    "badges": ["license", "version"],
    "include_toc": true,
    "emoji_style": "minimal",
    "language": "en"
  }'::jsonb,
  
  -- Analysis Results (from Gemini)
  analysis JSONB,
  analyzed_at TIMESTAMPTZ,
  
  -- Generated README
  generated_readme TEXT,
  current_version INTEGER DEFAULT 0,
  
  -- Push Information
  pushed_at TIMESTAMPTZ,
  commit_sha TEXT,
  commit_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_repo ON sessions(repo_owner, repo_name);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- ==========================================================
-- README VERSIONS TABLE
-- Stores version history for chat-based revisions
-- ==========================================================
CREATE TABLE IF NOT EXISTS readme_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changes_summary TEXT,
  user_message TEXT, -- The user's revision request
  sections_modified TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique version per session
  CONSTRAINT unique_session_version UNIQUE(session_id, version)
);

-- Index for version lookups
CREATE INDEX IF NOT EXISTS idx_readme_versions_session ON readme_versions(session_id);
CREATE INDEX IF NOT EXISTS idx_readme_versions_version ON readme_versions(session_id, version DESC);

-- ==========================================================
-- TRIGGERS
-- ==========================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE readme_versions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Enable read access for service role" ON users
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid()::text = auth0_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid()::text = auth0_id);

-- Sessions table policies
CREATE POLICY "Service role full access to sessions" ON sessions
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text)
  );

CREATE POLICY "Users can create sessions" ON sessions
  FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text)
    OR user_id IS NULL
  );

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text)
  );

-- README versions policies
CREATE POLICY "Service role full access to versions" ON readme_versions
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own readme versions" ON readme_versions
  FOR SELECT
  USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE u.auth0_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create readme versions for own sessions" ON readme_versions
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE u.auth0_id = auth.uid()::text
    )
  );

-- ==========================================================
-- HELPER FUNCTIONS
-- ==========================================================

-- Function to get or create user from Auth0
CREATE OR REPLACE FUNCTION get_or_create_user(
  p_auth0_id TEXT,
  p_email TEXT DEFAULT NULL,
  p_github_username TEXT DEFAULT NULL,
  p_github_token TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to find existing user
  SELECT id INTO v_user_id FROM users WHERE auth0_id = p_auth0_id;
  
  -- If not found, create new user
  IF v_user_id IS NULL THEN
    INSERT INTO users (auth0_id, email, github_username, github_token, avatar_url)
    VALUES (p_auth0_id, p_email, p_github_username, p_github_token, p_avatar_url)
    RETURNING id INTO v_user_id;
  ELSE
    -- Update existing user's token if provided
    IF p_github_token IS NOT NULL THEN
      UPDATE users SET 
        github_token = p_github_token,
        github_username = COALESCE(p_github_username, github_username),
        email = COALESCE(p_email, email),
        avatar_url = COALESCE(p_avatar_url, avatar_url)
      WHERE id = v_user_id;
    END IF;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get latest version number for a session
CREATE OR REPLACE FUNCTION get_latest_version(p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO v_version
  FROM readme_versions
  WHERE session_id = p_session_id;
  
  RETURN v_version;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================
-- SAMPLE DATA (for testing)
-- ==========================================================
-- INSERT INTO users (auth0_id, email, github_username)
-- VALUES ('github|12345678', 'test@example.com', 'testuser');
