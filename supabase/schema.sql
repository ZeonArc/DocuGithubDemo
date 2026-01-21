-- DocuGithub Complete Supabase Schema
-- ============================================
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth0_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    avatar_url TEXT,
    github_username VARCHAR(255),
    github_token TEXT, -- Encrypted GitHub OAuth token
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Index for faster auth lookups
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Repository info
    repo_url TEXT NOT NULL,
    repo_owner VARCHAR(255) NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    default_branch VARCHAR(100) DEFAULT 'main',
    repo_metadata JSONB DEFAULT '{}',
    
    -- Session state
    status VARCHAR(50) DEFAULT 'initialized',
    -- Status values: initialized, analyzing, analyzed, preferences_set, generating, generated, revised, pushed, error
    
    -- AI generated content
    analysis JSONB,
    preferences JSONB DEFAULT '{"tone": "professional", "sections": ["overview", "installation", "usage", "contributing", "license"], "badges": ["license", "version"], "include_toc": true, "emoji_style": "minimal"}',
    generated_readme TEXT,
    current_version INTEGER DEFAULT 0,
    
    -- Push tracking
    pushed_at TIMESTAMPTZ,
    commit_sha VARCHAR(64),
    commit_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_repo ON sessions(repo_owner, repo_name);

-- ============================================
-- README VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS readme_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    changes_summary TEXT,
    user_message TEXT, -- The user's revision request
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(session_id, version)
);

-- Index for versions
CREATE INDEX IF NOT EXISTS idx_readme_versions_session ON readme_versions(session_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE readme_versions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = auth0_id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = auth0_id);

-- Sessions policies (allow public access for anonymous users)
CREATE POLICY "Anyone can create sessions" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view sessions" ON sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update sessions" ON sessions
    FOR UPDATE USING (true);

-- Readme versions policies
CREATE POLICY "Anyone can create versions" ON readme_versions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view versions" ON readme_versions
    FOR SELECT USING (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get latest readme version for a session
CREATE OR REPLACE FUNCTION get_latest_readme_version(p_session_id UUID)
RETURNS TABLE(version INTEGER, content TEXT, changes_summary TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT rv.version, rv.content, rv.changes_summary, rv.created_at
    FROM readme_versions rv
    WHERE rv.session_id = p_session_id
    ORDER BY rv.version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM sessions
        WHERE expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA FOR TESTING (Optional)
-- ============================================
-- Uncomment to insert test data

-- INSERT INTO sessions (repo_url, repo_owner, repo_name, status)
-- VALUES 
--     ('https://github.com/facebook/react', 'facebook', 'react', 'initialized'),
--     ('https://github.com/vercel/next.js', 'vercel', 'next.js', 'initialized');
