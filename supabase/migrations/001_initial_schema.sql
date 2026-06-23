-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  settings JSONB DEFAULT '{}'
);

-- Users (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','operator','assistant','viewer')),
  site_id UUID REFERENCES sites(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Songs
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  ccli_number TEXT,
  key TEXT,
  tempo INTEGER,
  tags TEXT[] DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '[]',
  default_arrangement JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_songs_org ON songs(org_id);
CREATE INDEX idx_songs_title ON songs USING gin(title gin_trgm_ops);

-- Slide Decks
CREATE TABLE slide_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slides JSONB NOT NULL DEFAULT '[]',
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bible Translations
CREATE TABLE bible_translations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  is_bundled BOOLEAN DEFAULT FALSE
);

-- Bible Verses
CREATE TABLE bible_verses (
  id BIGSERIAL PRIMARY KEY,
  translation_id TEXT REFERENCES bible_translations(id),
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  UNIQUE(translation_id, book, chapter, verse)
);
CREATE INDEX idx_bible_lookup ON bible_verses(translation_id, book, chapter);
CREATE INDEX idx_bible_text ON bible_verses USING gin(text gin_trgm_ops);

-- Media Items
CREATE TABLE media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image','video','audio')),
  mime_type TEXT,
  url TEXT NOT NULL,
  cdn_url TEXT,
  size_bytes BIGINT,
  duration_seconds FLOAT,
  tags TEXT[] DEFAULT '{}',
  folder_path TEXT DEFAULT '/',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','live','archived')),
  created_by UUID REFERENCES users(id),
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_services_site ON services(site_id, scheduled_at DESC);

-- Live Sessions
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id),
  site_id UUID REFERENCES sites(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  state JSONB NOT NULL DEFAULT '{}',
  operator_id UUID REFERENCES users(id)
);

-- Live Events (audit log)
CREATE TABLE live_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_live_events_session ON live_events(session_id, created_at DESC);

-- Sermon Transcripts
CREATE TABLE sermon_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  segments JSONB DEFAULT '[]',
  detected_verses JSONB DEFAULT '[]',
  ai_suggestions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plugins
CREATE TABLE plugins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  manifest JSONB NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}'
);

-- Analytics Events
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  site_id UUID REFERENCES sites(id),
  session_id UUID,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_analytics_org ON analytics_events(org_id, created_at DESC);

-- Seed default Bible translation record
INSERT INTO bible_translations (id, name, language, is_bundled)
VALUES ('KJV', 'King James Version', 'en', TRUE)
ON CONFLICT DO NOTHING;

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slide_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their org's data)
CREATE POLICY "org_isolation" ON songs
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_isolation" ON slide_decks
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_isolation" ON media_items
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_isolation" ON services
  USING (site_id IN (SELECT id FROM sites WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())));
