-- =====================================================
-- Migration: Otimização de Imagens + Menu Items
-- Data: 2026-01-05
-- =====================================================

-- 1. Adicionar campos de dimensões e variantes na tabela media
ALTER TABLE media ADD COLUMN width INTEGER;
ALTER TABLE media ADD COLUMN height INTEGER;
ALTER TABLE media ADD COLUMN aspect_ratio TEXT;
ALTER TABLE media ADD COLUMN variants TEXT;  -- JSON com URLs das variantes
ALTER TABLE media ADD COLUMN thumbnail_url TEXT;

-- 2. Criar tabela menu_items com Foreign Keys
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    menu_id TEXT NOT NULL,
    site_id TEXT NOT NULL,
    label TEXT NOT NULL,
    url TEXT,
    page_id TEXT,
    item_type TEXT DEFAULT 'link' CHECK(item_type IN ('link', 'page', 'external', 'home')),
    target TEXT DEFAULT '_self' CHECK(target IN ('_self', '_blank')),
    icon TEXT,
    parent_item_id TEXT,
    position INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (parent_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_menu_items_menu ON menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_site ON menu_items(site_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_position ON menu_items(menu_id, position);
CREATE INDEX IF NOT EXISTS idx_menu_items_parent ON menu_items(parent_item_id);

-- 4. Índices adicionais para media (otimização de queries)
CREATE INDEX IF NOT EXISTS idx_media_site ON media(site_id);
CREATE INDEX IF NOT EXISTS idx_media_folder ON media(site_id, folder);
