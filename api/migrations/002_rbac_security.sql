-- ============================================
-- Migration 002: RBAC + Security
-- ============================================
-- This migration adds role-based access control (RBAC)
-- and security features including audit logs and rate limiting.
-- ============================================

-- ============================================
-- PART 1: Roles and Permissions Tables
-- ============================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0, -- Higher = more permissions
    is_system INTEGER DEFAULT 0, -- System roles cannot be deleted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    resource TEXT NOT NULL, -- pages, posts, media, settings, users, sites, organizations
    action TEXT NOT NULL, -- create, read, update, delete, publish, manage
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ============================================
-- PART 2: Audit Logs Table
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    site_id TEXT,
    organization_id TEXT,
    action TEXT NOT NULL, -- create, update, delete, login, logout, etc.
    resource_type TEXT NOT NULL, -- page, post, media, user, site, etc.
    resource_id TEXT,
    resource_name TEXT,
    old_value TEXT, -- JSON of previous state
    new_value TEXT, -- JSON of new state
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_site_id ON audit_logs(site_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- PART 3: Rate Limiting Table
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limits (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL, -- user_id, ip_address, or api_key
    identifier_type TEXT NOT NULL, -- user, ip, api_key
    endpoint TEXT NOT NULL, -- /api/pages, /api/media, etc.
    request_count INTEGER DEFAULT 1,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, identifier_type, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

-- ============================================
-- PART 4: Insert Default Roles
-- ============================================

-- Super Admin - Full access to everything
INSERT OR IGNORE INTO roles (id, name, display_name, description, level, is_system)
VALUES ('role_super_admin', 'super_admin', 'Super Admin', 'Full access to all features and all tenants', 100, 1);

-- Agency Admin - Full access to their organization
INSERT OR IGNORE INTO roles (id, name, display_name, description, level, is_system)
VALUES ('role_agency_admin', 'agency_admin', 'Agency Admin', 'Full access to organization and all sites', 80, 1);

-- Agency Editor - Can edit content in all org sites
INSERT OR IGNORE INTO roles (id, name, display_name, description, level, is_system)
VALUES ('role_agency_editor', 'agency_editor', 'Agency Editor', 'Can edit content in all organization sites', 60, 1);

-- Client Admin - Full access to their site
INSERT OR IGNORE INTO roles (id, name, display_name, description, level, is_system)
VALUES ('role_client_admin', 'client_admin', 'Client Admin', 'Full access to their site', 40, 1);

-- Client Editor - Can edit content in their site
INSERT OR IGNORE INTO roles (id, name, display_name, description, level, is_system)
VALUES ('role_client_editor', 'client_editor', 'Client Editor', 'Can edit content in their site', 20, 1);

-- Viewer - Read-only access
INSERT OR IGNORE INTO roles (id, name, display_name, description, level, is_system)
VALUES ('role_viewer', 'viewer', 'Viewer', 'Read-only access', 10, 1);

-- ============================================
-- PART 5: Insert Default Permissions
-- ============================================

-- Pages permissions
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_pages_create', 'pages.create', 'Create Pages', 'Can create new pages', 'pages', 'create');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_pages_read', 'pages.read', 'View Pages', 'Can view pages', 'pages', 'read');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_pages_update', 'pages.update', 'Edit Pages', 'Can edit pages', 'pages', 'update');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_pages_delete', 'pages.delete', 'Delete Pages', 'Can delete pages', 'pages', 'delete');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_pages_publish', 'pages.publish', 'Publish Pages', 'Can publish/unpublish pages', 'pages', 'publish');

-- Posts permissions
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_posts_create', 'posts.create', 'Create Posts', 'Can create new posts', 'posts', 'create');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_posts_read', 'posts.read', 'View Posts', 'Can view posts', 'posts', 'read');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_posts_update', 'posts.update', 'Edit Posts', 'Can edit posts', 'posts', 'update');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_posts_delete', 'posts.delete', 'Delete Posts', 'Can delete posts', 'posts', 'delete');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_posts_publish', 'posts.publish', 'Publish Posts', 'Can publish/unpublish posts', 'posts', 'publish');

-- Media permissions
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_media_create', 'media.create', 'Upload Media', 'Can upload media files', 'media', 'create');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_media_read', 'media.read', 'View Media', 'Can view media files', 'media', 'read');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_media_update', 'media.update', 'Edit Media', 'Can edit media metadata', 'media', 'update');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_media_delete', 'media.delete', 'Delete Media', 'Can delete media files', 'media', 'delete');

-- Menus permissions
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_menus_create', 'menus.create', 'Create Menus', 'Can create menus', 'menus', 'create');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_menus_read', 'menus.read', 'View Menus', 'Can view menus', 'menus', 'read');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_menus_update', 'menus.update', 'Edit Menus', 'Can edit menus', 'menus', 'update');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_menus_delete', 'menus.delete', 'Delete Menus', 'Can delete menus', 'menus', 'delete');

-- Settings permissions
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_settings_read', 'settings.read', 'View Settings', 'Can view site settings', 'settings', 'read');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_settings_update', 'settings.update', 'Edit Settings', 'Can edit site settings', 'settings', 'update');

-- Users permissions
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_users_create', 'users.create', 'Invite Users', 'Can invite new users', 'users', 'create');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_users_read', 'users.read', 'View Users', 'Can view users', 'users', 'read');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_users_update', 'users.update', 'Edit Users', 'Can edit user roles', 'users', 'update');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_users_delete', 'users.delete', 'Remove Users', 'Can remove users', 'users', 'delete');

-- Sites permissions
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_sites_create', 'sites.create', 'Create Sites', 'Can create new sites', 'sites', 'create');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_sites_read', 'sites.read', 'View Sites', 'Can view sites', 'sites', 'read');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_sites_update', 'sites.update', 'Edit Sites', 'Can edit site settings', 'sites', 'update');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_sites_delete', 'sites.delete', 'Delete Sites', 'Can delete sites', 'sites', 'delete');

-- Organizations permissions
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_orgs_read', 'organizations.read', 'View Organization', 'Can view organization', 'organizations', 'read');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_orgs_update', 'organizations.update', 'Edit Organization', 'Can edit organization', 'organizations', 'update');
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_orgs_manage', 'organizations.manage', 'Manage Organization', 'Full organization management', 'organizations', 'manage');

-- Audit logs permissions
INSERT OR IGNORE INTO permissions (id, name, display_name, description, resource, action)
VALUES ('perm_audit_read', 'audit.read', 'View Audit Logs', 'Can view audit logs', 'audit', 'read');

-- ============================================
-- PART 6: Assign Permissions to Roles
-- ============================================

-- Super Admin gets ALL permissions
INSERT OR IGNORE INTO role_permissions (id, role_id, permission_id)
SELECT 'rp_sa_' || substr(id, 6), 'role_super_admin', id FROM permissions;

-- Agency Admin gets most permissions except super admin stuff
INSERT OR IGNORE INTO role_permissions (id, role_id, permission_id)
SELECT 'rp_aa_' || substr(id, 6), 'role_agency_admin', id FROM permissions 
WHERE name NOT LIKE 'organizations.manage';

-- Agency Editor gets content permissions
INSERT OR IGNORE INTO role_permissions (id, role_id, permission_id)
SELECT 'rp_ae_' || substr(id, 6), 'role_agency_editor', id FROM permissions 
WHERE resource IN ('pages', 'posts', 'media', 'menus', 'categories') OR name = 'settings.read';

-- Client Admin gets site-level permissions
INSERT OR IGNORE INTO role_permissions (id, role_id, permission_id)
SELECT 'rp_ca_' || substr(id, 6), 'role_client_admin', id FROM permissions 
WHERE resource IN ('pages', 'posts', 'media', 'menus', 'categories', 'settings', 'users') 
  AND name NOT LIKE 'sites.%' AND name NOT LIKE 'organizations.%';

-- Client Editor gets content edit permissions
INSERT OR IGNORE INTO role_permissions (id, role_id, permission_id)
SELECT 'rp_ce_' || substr(id, 6), 'role_client_editor', id FROM permissions 
WHERE resource IN ('pages', 'posts', 'media', 'menus', 'categories') 
  AND action IN ('create', 'read', 'update');

-- Viewer gets read-only permissions
INSERT OR IGNORE INTO role_permissions (id, role_id, permission_id)
SELECT 'rp_v_' || substr(id, 6), 'role_viewer', id FROM permissions 
WHERE action = 'read';

-- ============================================
-- PART 7: Add role_id to users table
-- ============================================

ALTER TABLE users ADD COLUMN role_id TEXT REFERENCES roles(id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Set default role for existing users
UPDATE users SET role_id = 'role_client_admin' WHERE role_id IS NULL;
