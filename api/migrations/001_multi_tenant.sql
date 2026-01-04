-- ============================================
-- Migration 001: Multi-Tenant Support
-- ============================================
-- This migration adds multi-tenant support to the CMS
-- by creating organizations, sites, and site_users tables,
-- and adding site_id to all existing content tables.
-- ============================================

-- ============================================
-- PART 1: Create new tables
-- ============================================

-- Organizations (Agencies)
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    plan TEXT DEFAULT 'free', -- free, pro, business, enterprise
    max_sites INTEGER DEFAULT 5,
    max_users INTEGER DEFAULT 10,
    max_storage_mb INTEGER DEFAULT 1024,
    settings TEXT, -- JSON for additional settings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Sites (one per client/domain)
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    domain TEXT, -- custom domain (e.g., cliente.com)
    subdomain TEXT, -- subdomain (e.g., cliente.cms-site.com)
    domain_status TEXT DEFAULT 'pending', -- pending, verifying, active, error
    domain_verification_token TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    is_active INTEGER DEFAULT 1,
    settings TEXT, -- JSON for site-specific settings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE(organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_sites_organization_id ON sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain);
CREATE INDEX IF NOT EXISTS idx_sites_subdomain ON sites(subdomain);
CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);

-- Site Users (permissions per site)
CREATE TABLE IF NOT EXISTS site_users (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor', -- owner, admin, editor, viewer
    permissions TEXT, -- JSON for granular permissions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(site_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_site_users_site_id ON site_users(site_id);
CREATE INDEX IF NOT EXISTS idx_site_users_user_id ON site_users(user_id);

-- Organization Users (membership in organization)
CREATE TABLE IF NOT EXISTS organization_users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_users_organization_id ON organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);

-- ============================================
-- PART 2: Add site_id to existing tables
-- ============================================

-- Add site_id to pages
ALTER TABLE pages ADD COLUMN site_id TEXT REFERENCES sites(id);
CREATE INDEX IF NOT EXISTS idx_pages_site_id ON pages(site_id);

-- Add site_id to page_sections
ALTER TABLE page_sections ADD COLUMN site_id TEXT REFERENCES sites(id);
CREATE INDEX IF NOT EXISTS idx_page_sections_site_id ON page_sections(site_id);

-- Add site_id to menus
ALTER TABLE menus ADD COLUMN site_id TEXT REFERENCES sites(id);
CREATE INDEX IF NOT EXISTS idx_menus_site_id ON menus(site_id);

-- Add site_id to media
ALTER TABLE media ADD COLUMN site_id TEXT REFERENCES sites(id);
CREATE INDEX IF NOT EXISTS idx_media_site_id ON media(site_id);

-- Add site_id to posts
ALTER TABLE posts ADD COLUMN site_id TEXT REFERENCES sites(id);
CREATE INDEX IF NOT EXISTS idx_posts_site_id ON posts(site_id);

-- Add site_id to categories
ALTER TABLE categories ADD COLUMN site_id TEXT REFERENCES sites(id);
CREATE INDEX IF NOT EXISTS idx_categories_site_id ON categories(site_id);

-- Add site_id to contacts
ALTER TABLE contacts ADD COLUMN site_id TEXT REFERENCES sites(id);
CREATE INDEX IF NOT EXISTS idx_contacts_site_id ON contacts(site_id);

-- Add site_id to themes
ALTER TABLE themes ADD COLUMN site_id TEXT REFERENCES sites(id);
CREATE INDEX IF NOT EXISTS idx_themes_site_id ON themes(site_id);

-- Add site_id to settings
ALTER TABLE settings ADD COLUMN site_id TEXT REFERENCES sites(id);
CREATE INDEX IF NOT EXISTS idx_settings_site_id ON settings(site_id);

-- Add organization_id to users
ALTER TABLE users ADD COLUMN organization_id TEXT REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- ============================================
-- PART 3: Create default organization and site
-- for existing data migration
-- ============================================

-- Create default organization
INSERT INTO organizations (id, name, slug, plan, max_sites, max_users)
VALUES ('org_default', 'Default Organization', 'default', 'pro', 100, 100);

-- Create default site
INSERT INTO sites (id, organization_id, name, slug, subdomain, domain_status, is_active)
VALUES ('site_default', 'org_default', 'Default Site', 'default', 'cms-site.pages.dev', 'active', 1);

-- ============================================
-- PART 4: Migrate existing data to default site
-- ============================================

-- Assign existing pages to default site
UPDATE pages SET site_id = 'site_default' WHERE site_id IS NULL;

-- Assign existing page_sections to default site
UPDATE page_sections SET site_id = 'site_default' WHERE site_id IS NULL;

-- Assign existing menus to default site
UPDATE menus SET site_id = 'site_default' WHERE site_id IS NULL;

-- Assign existing media to default site
UPDATE media SET site_id = 'site_default' WHERE site_id IS NULL;

-- Assign existing posts to default site
UPDATE posts SET site_id = 'site_default' WHERE site_id IS NULL;

-- Assign existing categories to default site
UPDATE categories SET site_id = 'site_default' WHERE site_id IS NULL;

-- Assign existing contacts to default site
UPDATE contacts SET site_id = 'site_default' WHERE site_id IS NULL;

-- Assign existing themes to default site
UPDATE themes SET site_id = 'site_default' WHERE site_id IS NULL;

-- Assign existing settings to default site
UPDATE settings SET site_id = 'site_default' WHERE site_id IS NULL;

-- Assign existing users to default organization
UPDATE users SET organization_id = 'org_default' WHERE organization_id IS NULL;

-- Create site_users entries for existing users (as owners of default site)
INSERT INTO site_users (id, site_id, user_id, role)
SELECT 
    'su_' || substr(replace(hex(randomblob(8)), '-', ''), 1, 16),
    'site_default',
    id,
    'owner'
FROM users WHERE id NOT IN (SELECT user_id FROM site_users WHERE site_id = 'site_default');

-- Create organization_users entries for existing users
INSERT INTO organization_users (id, organization_id, user_id, role)
SELECT 
    'ou_' || substr(replace(hex(randomblob(8)), '-', ''), 1, 16),
    'org_default',
    id,
    'owner'
FROM users WHERE id NOT IN (SELECT user_id FROM organization_users WHERE organization_id = 'org_default');

-- ============================================
-- PART 5: Create unique constraints for multi-tenant
-- ============================================

-- Note: SQLite doesn't support adding constraints to existing tables
-- These constraints should be enforced at the application level:
-- - pages: UNIQUE(site_id, slug)
-- - menus: UNIQUE(site_id, slug)
-- - posts: UNIQUE(site_id, slug)
-- - categories: UNIQUE(site_id, slug)
-- - themes: UNIQUE(site_id, slug)
-- - settings: UNIQUE(site_id, key)
