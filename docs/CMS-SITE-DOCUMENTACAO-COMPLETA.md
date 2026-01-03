# 📚 CMS SITE - DOCUMENTAÇÃO OFICIAL

**Versão:** 1.0.0  
**Data:** 03/01/2026  
**Status:** Em Desenvolvimento  

---

## 📋 ÍNDICE

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura do Banco de Dados](#4-estrutura-do-banco-de-dados)
5. [API - Endpoints](#5-api---endpoints)
6. [Frontend - Site Público](#6-frontend---site-público)
7. [Admin Panel](#7-admin-panel)
8. [Sistema de Temas](#8-sistema-de-temas)
9. [Otimização de Performance](#9-otimização-de-performance)
10. [SEO e Compliance Google](#10-seo-e-compliance-google)
11. [Roadmap do Projeto](#11-roadmap-do-projeto)
12. [Recursos Cloudflare](#12-recursos-cloudflare)
13. [Guia de Deploy](#13-guia-de-deploy)

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 O que é o CMS Site?

O **CMS Site** é um Sistema de Gerenciamento de Conteúdo (CMS) moderno, construído 100% na infraestrutura Cloudflare, projetado para criar sites institucionais de alta performance.

### 1.2 Proposta de Valor

| Característica | Benefício |
|----------------|-----------|
| **Performance** | Sites com nota 90+ no PageSpeed |
| **Simplicidade** | Interface intuitiva para não-programadores |
| **Escalabilidade** | Arquitetura preparada para multi-tenant (SaaS) |
| **IA Integrada** | Geração de conteúdo personalizado (futuro) |
| **Custo Baixo** | ~$10/mês por cliente |

### 1.3 Público-Alvo

- Empresas que precisam de sites institucionais
- Agências que gerenciam múltiplos sites
- Negócios que querem independência para atualizar conteúdo

### 1.4 Visão Futura (SaaS)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CMS SITE (SaaS)                             │
│              "Criador de Sites com IA"                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SUPER ADMIN (Você - CodieHost)                                 │
│  └── Gerencia todos os clientes                                 │
│                                                                 │
│  CLIENTES (Multi-Tenant)                                        │
│  ├── Cliente 1: planacdistribuidora.com.br                      │
│  ├── Cliente 2: empresax.com.br                                 │
│  └── Cliente N: empresay.com.br                                 │
│                                                                 │
│  IA GENERATIVA (Por Cliente)                                    │
│  └── Aprende tom de voz e gera conteúdo personalizado           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. ARQUITETURA TÉCNICA

### 2.1 Diagrama Geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USUÁRIO FINAL                                   │
│                    (Desktop / Mobile / Tablet)                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE (CDN Global)                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Cache de páginas HTML (Edge TTL: 1h)                          │    │
│  │ • Cache de assets (CSS/JS: 1 ano com hash)                      │    │
│  │ • Image Resizing (WebP/AVIF automático)                         │    │
│  │ • Zaraz (Analytics server-side)                                 │    │
│  │ • WAF/DDoS Protection                                           │    │
│  │ • SSL/TLS automático                                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│      SITE PÚBLICO             │   │        ADMIN PANEL            │
│   (Cloudflare Pages)          │   │    (Cloudflare Pages)         │
│                               │   │                               │
│ • HTML estático otimizado     │   │ • React + Tailwind            │
│ • CSS crítico inline          │   │ • SPA (Single Page App)       │
│ • JS mínimo (defer)           │   │ • Autenticação JWT            │
│ • Imagens responsivas         │   │ • Editor de páginas           │
│ • SEO otimizado               │   │ • Gerenciador de mídia        │
│                               │   │ • Configurações               │
│ URL: site.pages.dev           │   │ URL: admin.pages.dev          │
│ ou domínio customizado        │   │                               │
└───────────────────────────────┘   └───────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API BACKEND                                     │
│                   (Cloudflare Worker + Hono)                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Endpoints:                                                      │    │
│  │ • /api/public/*    → Dados públicos (cache KV)                  │    │
│  │ • /api/auth/*      → Autenticação (JWT)                         │    │
│  │ • /api/pages/*     → CRUD páginas                               │    │
│  │ • /api/menus/*     → CRUD menus                                 │    │
│  │ • /api/media/*     → Upload/gestão mídia                        │    │
│  │ • /api/settings/*  → Configurações                              │    │
│  │ • /api/themes/*    → Temas                                      │    │
│  │ • /images/*        → Proxy de imagens otimizadas                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  URL: cms-site-api.workers.dev                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌───────────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│      D1 (SQLite)      │ │    R2 (S3)      │ │      KV (Cache)         │
│                       │ │                 │ │                         │
│ • users               │ │ • Imagens       │ │ • cms-site-cache        │
│ • pages               │ │ • Documentos    │ │   (dados públicos)      │
│ • page_sections       │ │ • Uploads       │ │                         │
│ • menus               │ │                 │ │ • cms-site-sessions     │
│ • media               │ │ Bucket:         │ │   (sessões JWT)         │
│ • settings            │ │ cms-site-media  │ │                         │
│ • themes              │ │                 │ │                         │
│ • contacts            │ │                 │ │                         │
│ • audit_logs          │ │                 │ │                         │
│                       │ │                 │ │                         │
│ DB: cms-site-db       │ │                 │ │                         │
└───────────────────────┘ └─────────────────┘ └─────────────────────────┘
```

### 2.2 Fluxo de Requisição

#### Site Público (Visitante)
```
1. Visitante acessa planacdistribuidora.com.br
2. Cloudflare Edge verifica cache
   └── HIT: Retorna HTML cacheado (< 50ms)
   └── MISS: Continua...
3. Pages serve HTML estático
4. Browser carrega CSS/JS (cacheados 1 ano)
5. Imagens carregam via Image Resizing (WebP automático)
6. Zaraz injeta analytics server-side (0 JS no cliente)
```

#### Admin Panel (Usuário Autenticado)
```
1. Usuário acessa admin.site.pages.dev
2. React SPA carrega
3. Verifica JWT no cookie/localStorage
   └── Inválido: Redireciona para login
   └── Válido: Carrega dashboard
4. Todas as ações via API REST
5. Alterações invalidam cache KV
```

---

## 3. STACK TECNOLÓGICA

### 3.1 Backend

| Tecnologia | Versão | Função |
|------------|--------|--------|
| Cloudflare Workers | - | Runtime serverless |
| Hono | 4.x | Framework web (leve, 14KB) |
| TypeScript | 5.x | Linguagem tipada |
| D1 | - | Banco de dados SQL (SQLite) |
| R2 | - | Object storage (imagens) |
| KV | - | Key-Value store (cache) |

### 3.2 Frontend (Site Público)

| Tecnologia | Função |
|------------|--------|
| HTML5 Semântico | Estrutura |
| CSS3 + Custom Properties | Estilização (temas via variáveis) |
| JavaScript Vanilla | Interatividade mínima |
| Cloudflare Pages | Hospedagem |

**Por que não usar framework (React/Vue)?**
- Performance máxima (0 JS de framework)
- SEO perfeito (HTML puro)
- Menor complexidade
- Carregamento instantâneo

### 3.3 Frontend (Admin Panel)

| Tecnologia | Versão | Função |
|------------|--------|--------|
| React | 18.x | UI Framework |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Estilização |
| React Router | 6.x | Navegação SPA |
| TanStack Query | 5.x | Cache de API |
| dnd-kit | - | Drag and drop |
| Tiptap | 2.x | Editor de texto rico |
| Lucide React | - | Ícones |

### 3.4 Serviços Cloudflare

| Serviço | Plano | Custo | Função |
|---------|-------|-------|--------|
| Workers | Paid | $5/mês | API Backend |
| Pages | Free | $0 | Hospedagem frontend |
| D1 | Free | $0 | Banco de dados |
| R2 | Free tier | $0* | Storage de mídia |
| KV | Free tier | $0* | Cache |
| Images | Paid | $5/mês | Otimização de imagens |
| Zaraz | Paid | Contratado | Analytics |

*Grátis dentro dos limites do free tier

**Custo total estimado: ~$10/mês por site**

---

## 4. ESTRUTURA DO BANCO DE DADOS

### 4.1 Diagrama ER

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   users     │     │   themes    │     │  settings   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ email       │     │ name        │     │ key         │
│ password    │     │ slug        │     │ value       │
│ name        │     │ colors (JSON)│    │ type        │
│ role        │     │ fonts (JSON)│     │ group_name  │
│ active      │     │ is_active   │     │ label       │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   menus     │     │   pages     │     │ page_sections   │
├─────────────┤     ├─────────────┤     ├─────────────────┤
│ id (PK)     │◄────┤ menu_id(FK) │     │ id (PK)         │
│ name        │     │ id (PK)     │────►│ page_id (FK)    │
│ slug        │     │ title       │     │ section_type    │
│ parent_id   │──┐  │ slug        │     │ title           │
│ position    │  │  │ page_type   │     │ content (JSON)  │
│ is_visible  │  │  │ banner_*    │     │ position        │
└─────────────┘  │  │ content     │     │ is_visible      │
      ▲          │  │ meta_*      │     └─────────────────┘
      └──────────┘  │ status      │
    (self-ref)      └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   media     │     │  contacts   │     │ audit_logs  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ file_name   │     │ name        │     │ user_id(FK) │
│ file_type   │     │ email       │     │ action      │
│ mime_type   │     │ phone       │     │ entity_type │
│ url         │     │ message     │     │ entity_id   │
│ folder      │     │ status      │     │ old_values  │
│ alt_text    │     │ source_page │     │ new_values  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 4.2 Detalhamento das Tabelas

#### `users` - Usuários do Sistema
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
    avatar_url TEXT,
    active INTEGER DEFAULT 1,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Role | Permissões |
|------|------------|
| admin | Tudo (configurações, temas, usuários) |
| editor | Páginas, menus, mídia, contatos |
| viewer | Apenas visualização |

#### `settings` - Configurações do Site
```sql
CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    type TEXT DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json', 'image', 'color')),
    group_name TEXT DEFAULT 'general',
    label TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Grupos de Configurações:**

| Grupo | Configurações |
|-------|---------------|
| general | site_name, site_description, logo_url, favicon_url |
| contact | phone, whatsapp, email, address, city, state, working_hours |
| social | instagram, facebook, youtube, linkedin |
| analytics | gtm_id, ga4_id, meta_pixel_id, google_ads_id |

#### `themes` - Temas Visuais
```sql
CREATE TABLE themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    colors TEXT NOT NULL,      -- JSON
    fonts TEXT,                -- JSON
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Estrutura do JSON `colors`:**
```json
{
  "primary": "#AA000E",
  "secondary": "#3d3d3d",
  "accent": "#20a838",
  "background": "#ffffff",
  "surface": "#f6f8fb",
  "text": "#333333",
  "textLight": "#666666",
  "border": "#e0e0e0"
}
```

**Estrutura do JSON `fonts`:**
```json
{
  "heading": "Poppins, sans-serif",
  "body": "Barlow, sans-serif"
}
```

#### `menus` - Estrutura de Navegação
```sql
CREATE TABLE menus (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    parent_id TEXT,            -- Self-reference para submenus
    position INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE SET NULL
);
```

#### `pages` - Páginas do Site
```sql
CREATE TABLE pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    page_type TEXT DEFAULT 'content' CHECK (page_type IN ('home', 'content', 'product', 'contact', 'custom')),
    
    -- Banner
    banner_image TEXT,
    banner_title TEXT,
    banner_subtitle TEXT,
    
    -- Conteúdo
    content TEXT,              -- HTML
    excerpt TEXT,
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    canonical_url TEXT,
    og_image TEXT,
    
    -- Organização
    menu_id TEXT,
    position INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at DATETIME,
    
    -- Audit
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL
);
```

#### `page_sections` - Seções das Páginas
```sql
CREATE TABLE page_sections (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL,
    section_type TEXT NOT NULL CHECK (section_type IN (
        'text',           -- Bloco de texto
        'features',       -- Lista de features com ícones
        'gallery',        -- Galeria de imagens
        'cta',            -- Call to Action
        'faq',            -- Perguntas frequentes
        'contact_form',   -- Formulário de contato
        'testimonials',   -- Depoimentos
        'stats',          -- Estatísticas/números
        'team',           -- Equipe
        'custom'          -- HTML customizado
    )),
    title TEXT,
    content TEXT,              -- JSON com dados específicos do tipo
    position INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);
```

**Exemplos de `content` por tipo:**

```json
// section_type: "features"
{
  "columns": 3,
  "items": [
    {"icon": "shield", "title": "Segurança", "description": "..."},
    {"icon": "clock", "title": "Agilidade", "description": "..."}
  ]
}

// section_type: "gallery"
{
  "layout": "grid",
  "columns": 4,
  "images": [
    {"url": "/images/...", "alt": "...", "caption": "..."}
  ]
}

// section_type: "faq"
{
  "items": [
    {"question": "Como funciona?", "answer": "..."},
    {"question": "Qual o prazo?", "answer": "..."}
  ]
}

// section_type: "cta"
{
  "title": "Fale Conosco",
  "description": "Entre em contato para um orçamento",
  "buttonText": "Solicitar Orçamento",
  "buttonUrl": "/contato",
  "background": "primary"
}
```

#### `media` - Arquivos de Mídia
```sql
CREATE TABLE media (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    file_name TEXT UNIQUE NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'document', 'video')),
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    url TEXT NOT NULL,
    width INTEGER,             -- Para imagens
    height INTEGER,            -- Para imagens
    alt_text TEXT,
    caption TEXT,
    folder TEXT DEFAULT 'general',
    uploaded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
```

#### `contacts` - Leads/Contatos
```sql
CREATE TABLE contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    project_type TEXT,
    message TEXT,
    source_page TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `audit_logs` - Logs de Auditoria
```sql
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,      -- create, update, delete, login, logout
    entity_type TEXT NOT NULL, -- page, menu, media, setting, user
    entity_id TEXT,
    old_values TEXT,           -- JSON
    new_values TEXT,           -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 5. API - ENDPOINTS

### 5.1 Base URL

```
Desenvolvimento: http://localhost:8787
Produção: https://cms-site-api.{account}.workers.dev
```

### 5.2 Autenticação

Todas as rotas (exceto `/api/public/*`) requerem autenticação via JWT.

**Header:**
```
Authorization: Bearer <token>
```

**Ou Cookie:**
```
auth_token=<token>
```

### 5.3 Endpoints Públicos

| Método | Endpoint | Descrição | Cache |
|--------|----------|-----------|-------|
| GET | `/api/public/settings` | Configurações do site | 5 min |
| GET | `/api/public/theme` | Tema ativo (cores, fontes) | 5 min |
| GET | `/api/public/navigation` | Menu de navegação | 5 min |
| GET | `/api/public/pages` | Lista de páginas publicadas | 5 min |
| GET | `/api/public/pages/:slug` | Página por slug | 5 min |
| GET | `/api/public/home` | Página inicial | 5 min |
| POST | `/api/public/contact` | Enviar formulário | - |
| GET | `/api/public/sitemap.xml` | Sitemap XML | 1 hora |
| GET | `/api/public/search?q=` | Buscar no site | - |

### 5.4 Endpoints de Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login (email + senha) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Dados do usuário logado |
| POST | `/api/auth/change-password` | Alterar senha |
| POST | `/api/auth/users` | Criar usuário (admin) |
| GET | `/api/auth/users` | Listar usuários (admin) |
| PUT | `/api/auth/users/:id` | Atualizar usuário (admin) |
| DELETE | `/api/auth/users/:id` | Deletar usuário (admin) |

### 5.5 Endpoints de Páginas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/pages` | Listar páginas |
| GET | `/api/pages/:id` | Buscar página por ID |
| POST | `/api/pages` | Criar página |
| PUT | `/api/pages/:id` | Atualizar página |
| DELETE | `/api/pages/:id` | Deletar página |
| POST | `/api/pages/reorder` | Reordenar páginas |
| POST | `/api/pages/:id/duplicate` | Duplicar página |
| POST | `/api/pages/:id/publish` | Publicar página |
| POST | `/api/pages/:id/unpublish` | Despublicar página |

### 5.6 Endpoints de Menus

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/menus` | Listar menus (hierárquico) |
| GET | `/api/menus?flat=true` | Listar menus (plano) |
| GET | `/api/menus/:id` | Buscar menu por ID |
| POST | `/api/menus` | Criar menu |
| PUT | `/api/menus/:id` | Atualizar menu |
| DELETE | `/api/menus/:id` | Deletar menu |
| POST | `/api/menus/reorder` | Reordenar menus |

### 5.7 Endpoints de Mídia

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/media` | Listar mídia |
| GET | `/api/media/:id` | Buscar mídia por ID |
| POST | `/api/media/upload` | Upload de arquivo |
| PUT | `/api/media/:id` | Atualizar metadados |
| DELETE | `/api/media/:id` | Deletar arquivo |
| GET | `/api/media/folders/list` | Listar pastas |

### 5.8 Endpoints de Configurações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/settings` | Listar todas (por grupo) |
| GET | `/api/settings/:key` | Buscar por chave |
| PUT | `/api/settings/:key` | Atualizar configuração |
| PUT | `/api/settings` | Atualizar múltiplas |

### 5.9 Endpoints de Temas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/themes` | Listar temas |
| GET | `/api/themes/active` | Tema ativo |
| GET | `/api/themes/:id` | Buscar tema |
| POST | `/api/themes` | Criar tema |
| PUT | `/api/themes/:id` | Atualizar tema |
| POST | `/api/themes/:id/activate` | Ativar tema |
| POST | `/api/themes/:id/duplicate` | Duplicar tema |
| DELETE | `/api/themes/:id` | Deletar tema |

### 5.10 Endpoints de Contatos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/contacts` | Listar contatos |
| GET | `/api/contacts/stats` | Estatísticas |
| GET | `/api/contacts/:id` | Buscar contato |
| PUT | `/api/contacts/:id/status` | Atualizar status |
| POST | `/api/contacts/:id/notes` | Adicionar nota |
| DELETE | `/api/contacts/:id` | Deletar contato |
| GET | `/api/contacts/export/csv` | Exportar CSV |

### 5.11 Endpoints de Imagens

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/images/:path` | Imagem original |
| GET | `/images/:path?w=800` | Redimensionada |
| GET | `/images/:path?w=800&q=80&f=webp` | Otimizada |

**Parâmetros de transformação:**
- `w` ou `width`: Largura máxima (px)
- `h` ou `height`: Altura máxima (px)
- `q` ou `quality`: Qualidade (1-100, default: 85)
- `f` ou `format`: Formato (auto, webp, avif, jpg, png)
- `fit`: Modo de ajuste (cover, contain, scale-down)

---

## 6. FRONTEND - SITE PÚBLICO

### 6.1 Princípios de Design

1. **Mobile-First**: Design começa pelo mobile
2. **Performance**: LCP < 2.5s, FID < 100ms, CLS < 0.1
3. **Acessibilidade**: WCAG 2.1 AA
4. **SEO**: HTML semântico, meta tags, structured data

### 6.2 Estrutura de Arquivos

```
frontend/
├── index.html              # Página inicial
├── [slug].html             # Template de página (gerado)
├── 404.html                # Página de erro
├── assets/
│   ├── css/
│   │   ├── critical.css    # CSS crítico (inline)
│   │   ├── main.css        # CSS principal
│   │   └── themes/         # Variações de tema
│   ├── js/
│   │   ├── app.js          # JS principal (mínimo)
│   │   └── components/     # Componentes isolados
│   └── images/
│       └── icons/          # Ícones SVG
├── _headers                # Headers do Cloudflare
├── _redirects              # Redirects
├── robots.txt
└── sitemap.xml             # Gerado pela API
```

### 6.3 Template HTML Base

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Preconnect -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- SEO -->
    <title>{{meta_title}} | {{site_name}}</title>
    <meta name="description" content="{{meta_description}}">
    <meta name="keywords" content="{{meta_keywords}}">
    <link rel="canonical" href="{{canonical_url}}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="{{meta_title}}">
    <meta property="og:description" content="{{meta_description}}">
    <meta property="og:image" content="{{og_image}}">
    <meta property="og:url" content="{{canonical_url}}">
    <meta property="og:type" content="website">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    
    <!-- Favicon -->
    <link rel="icon" href="{{favicon_url}}" type="image/x-icon">
    
    <!-- CSS Crítico (inline) -->
    <style>
        {{critical_css}}
    </style>
    
    <!-- CSS Principal (defer) -->
    <link rel="preload" href="/assets/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="/assets/css/main.css"></noscript>
    
    <!-- Fontes -->
    <link href="https://fonts.googleapis.com/css2?family={{fonts}}&display=swap" rel="stylesheet">
    
    <!-- Theme Colors (CSS Variables) -->
    <style>
        :root {
            --color-primary: {{colors.primary}};
            --color-secondary: {{colors.secondary}};
            --color-accent: {{colors.accent}};
            --color-background: {{colors.background}};
            --color-surface: {{colors.surface}};
            --color-text: {{colors.text}};
            --color-text-light: {{colors.textLight}};
            --color-border: {{colors.border}};
            --font-heading: {{fonts.heading}};
            --font-body: {{fonts.body}};
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <nav class="nav">
            <a href="/" class="logo">
                <img src="{{logo_url}}" alt="{{site_name}}" width="150" height="40">
            </a>
            <ul class="nav-menu">
                {{#each navigation}}
                <li class="nav-item {{#if children}}has-dropdown{{/if}}">
                    <a href="/{{slug}}">{{name}}</a>
                    {{#if children}}
                    <ul class="dropdown">
                        {{#each children}}
                        <li><a href="/{{slug}}">{{name}}</a></li>
                        {{/each}}
                    </ul>
                    {{/if}}
                </li>
                {{/each}}
            </ul>
            <button class="nav-toggle" aria-label="Menu">
                <span></span>
            </button>
        </nav>
    </header>

    <!-- Main Content -->
    <main>
        {{content}}
    </main>

    <!-- Footer -->
    <footer class="footer">
        <!-- Conteúdo do footer -->
    </footer>

    <!-- WhatsApp Button -->
    <a href="https://wa.me/{{whatsapp}}" class="whatsapp-btn" aria-label="WhatsApp">
        <svg>...</svg>
    </a>

    <!-- JS (defer) -->
    <script src="/assets/js/app.js" defer></script>
</body>
</html>
```

### 6.4 CSS Architecture

```css
/* ========================================
   CSS Architecture: ITCSS + BEM
   ======================================== */

/* 1. Settings - Variables */
:root {
    /* Colors (injetadas do tema) */
    --color-primary: #AA000E;
    --color-secondary: #3d3d3d;
    /* ... */
    
    /* Typography */
    --font-heading: 'Poppins', sans-serif;
    --font-body: 'Barlow', sans-serif;
    --font-size-base: 16px;
    --line-height-base: 1.6;
    
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 2rem;
    --spacing-xl: 4rem;
    
    /* Breakpoints */
    --breakpoint-sm: 640px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 1024px;
    --breakpoint-xl: 1280px;
    
    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-base: 300ms ease;
}

/* 2. Generic - Reset */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* 3. Elements - Base HTML */
body {
    font-family: var(--font-body);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    color: var(--color-text);
    background: var(--color-background);
}

/* 4. Objects - Layout patterns */
.container { /* ... */ }
.grid { /* ... */ }

/* 5. Components - UI components */
.header { /* ... */ }
.nav { /* ... */ }
.btn { /* ... */ }
.card { /* ... */ }
.banner { /* ... */ }
.section { /* ... */ }
.footer { /* ... */ }

/* 6. Utilities - Helpers */
.sr-only { /* Screen reader only */ }
.text-center { text-align: center; }
.hidden { display: none; }
```

### 6.5 Componentes de Seção

Cada `section_type` do banco de dados tem um template HTML correspondente:

```html
<!-- section_type: features -->
<section class="section section--features">
    <div class="container">
        <h2 class="section__title">{{title}}</h2>
        <div class="features-grid features-grid--{{columns}}">
            {{#each items}}
            <div class="feature-card">
                <div class="feature-card__icon">
                    <svg>{{icon}}</svg>
                </div>
                <h3 class="feature-card__title">{{title}}</h3>
                <p class="feature-card__description">{{description}}</p>
            </div>
            {{/each}}
        </div>
    </div>
</section>

<!-- section_type: cta -->
<section class="section section--cta section--{{background}}">
    <div class="container">
        <h2 class="section__title">{{title}}</h2>
        <p class="section__description">{{description}}</p>
        <a href="{{buttonUrl}}" class="btn btn--primary btn--lg">
            {{buttonText}}
        </a>
    </div>
</section>

<!-- section_type: gallery -->
<section class="section section--gallery">
    <div class="container">
        <h2 class="section__title">{{title}}</h2>
        <div class="gallery gallery--{{layout}} gallery--cols-{{columns}}">
            {{#each images}}
            <figure class="gallery__item">
                <img 
                    src="{{url}}?w=400&f=auto" 
                    srcset="{{url}}?w=400&f=auto 400w,
                            {{url}}?w=800&f=auto 800w"
                    sizes="(max-width: 768px) 100vw, 25vw"
                    alt="{{alt}}"
                    loading="lazy"
                    width="400"
                    height="300"
                >
                {{#if caption}}
                <figcaption>{{caption}}</figcaption>
                {{/if}}
            </figure>
            {{/each}}
        </div>
    </div>
</section>
```

---

## 7. ADMIN PANEL

### 7.1 Estrutura de Arquivos

```
admin/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                # Entry point
│   ├── App.tsx                 # Router principal
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   ├── ui/                 # Componentes base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   └── ...
│   │   ├── editor/             # Editor de página
│   │   │   ├── PageEditor.tsx
│   │   │   ├── SectionEditor.tsx
│   │   │   ├── BannerEditor.tsx
│   │   │   └── ContentEditor.tsx
│   │   ├── media/              # Gerenciador de mídia
│   │   │   ├── MediaLibrary.tsx
│   │   │   ├── MediaUpload.tsx
│   │   │   └── MediaPicker.tsx
│   │   └── menus/              # Gerenciador de menus
│   │       ├── MenuTree.tsx
│   │       └── MenuEditor.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Pages.tsx           # Lista de páginas
│   │   ├── PageEdit.tsx        # Editar página
│   │   ├── Menus.tsx
│   │   ├── Media.tsx
│   │   ├── Contacts.tsx
│   │   ├── Settings.tsx
│   │   ├── Themes.tsx
│   │   └── Users.tsx
│   ├── services/
│   │   ├── api.ts              # Cliente HTTP
│   │   ├── auth.ts
│   │   ├── pages.ts
│   │   ├── menus.ts
│   │   ├── media.ts
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePages.ts
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── styles/
│   │   └── globals.css
│   └── utils/
│       ├── helpers.ts
│       └── constants.ts
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### 7.2 Telas do Admin

#### Dashboard
- Estatísticas gerais (páginas, contatos, visitas)
- Últimos contatos recebidos
- Páginas mais acessadas
- Atalhos rápidos

#### Páginas
- Lista com busca, filtros, paginação
- Status (rascunho, publicado, arquivado)
- Ações: editar, duplicar, publicar, deletar
- Drag-and-drop para reordenar

#### Editor de Página
- Banner (imagem, título, subtítulo)
- Seções (adicionar, editar, reordenar, remover)
- Editor de texto rico (TipTap)
- Seletor de mídia
- Configurações SEO
- Preview

#### Menus
- Árvore hierárquica (drag-and-drop)
- Adicionar/editar menu
- Vincular páginas
- Reordenar

#### Mídia
- Grid de arquivos
- Upload (drag-and-drop)
- Pastas
- Busca
- Metadados (alt, caption)

#### Contatos
- Lista com status
- Detalhes do contato
- Adicionar notas
- Mudar status
- Exportar CSV

#### Configurações
- Informações do site
- Dados de contato
- Redes sociais
- Códigos de analytics

#### Temas
- Lista de temas
- Editor de cores
- Editor de fontes
- Ativar tema
- Duplicar tema

### 7.3 Fluxo do Editor de Página

```
┌─────────────────────────────────────────────────────────────────┐
│                    EDITOR DE PÁGINA                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ TOOLBAR                                                 │    │
│  │ [Salvar Rascunho] [Publicar] [Preview] [Configurações]  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │ MENU LATERAL         │  │ ÁREA DE EDIÇÃO                 │   │
│  │                      │  │                                │   │
│  │ ▼ Banner             │  │ ┌────────────────────────────┐ │   │
│  │   - Imagem           │  │ │       BANNER               │ │   │
│  │   - Título           │  │ │  [Imagem de fundo]         │ │   │
│  │   - Subtítulo        │  │ │  Título da Página          │ │   │
│  │                      │  │ │  Subtítulo aqui            │ │   │
│  │ ▼ Seções             │  │ └────────────────────────────┘ │   │
│  │   ◆ Texto            │  │                                │   │
│  │   ◆ Features         │  │ ┌────────────────────────────┐ │   │
│  │   ◆ Galeria          │  │ │       SEÇÃO: Texto         │ │   │
│  │   [+ Adicionar]      │  │ │  Editor de texto rico...   │ │   │
│  │                      │  │ │                            │ │   │
│  │ ▼ SEO                │  │ └────────────────────────────┘ │   │
│  │   - Meta Title       │  │                                │   │
│  │   - Meta Description │  │ ┌────────────────────────────┐ │   │
│  │   - Keywords         │  │ │       SEÇÃO: Features      │ │   │
│  │                      │  │ │  [Icon] Título  Descrição  │ │   │
│  └──────────────────────┘  │ │  [Icon] Título  Descrição  │ │   │
│                            │ └────────────────────────────┘ │   │
│                            │                                │   │
│                            │ [+ Adicionar Nova Seção]       │   │
│                            │                                │   │
│                            └────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. SISTEMA DE TEMAS

### 8.1 Como Funciona

Os temas são baseados em **CSS Custom Properties** (variáveis CSS), permitindo trocar cores e fontes sem recarregar a página.

### 8.2 Estrutura de um Tema

```json
{
  "id": "theme_planac",
  "name": "Planac Vermelho",
  "slug": "planac-vermelho",
  "colors": {
    "primary": "#AA000E",
    "secondary": "#3d3d3d",
    "accent": "#20a838",
    "background": "#ffffff",
    "surface": "#f6f8fb",
    "text": "#333333",
    "textLight": "#666666",
    "border": "#e0e0e0",
    "success": "#22c55e",
    "warning": "#f59e0b",
    "error": "#ef4444"
  },
  "fonts": {
    "heading": "Poppins",
    "body": "Barlow",
    "headingWeight": "600",
    "bodyWeight": "400"
  },
  "is_active": true
}
```

### 8.3 Aplicação no Frontend

```html
<style>
  :root {
    /* Injetado dinamicamente pelo servidor */
    --color-primary: #AA000E;
    --color-secondary: #3d3d3d;
    /* ... */
  }
</style>
```

```css
/* Uso no CSS */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: color-mix(in srgb, var(--color-primary), black 15%);
}

h1, h2, h3 {
  font-family: var(--font-heading);
  color: var(--color-text);
}

body {
  font-family: var(--font-body);
  background: var(--color-background);
}
```

### 8.4 Temas Pré-definidos

| Tema | Primary | Secondary | Uso |
|------|---------|-----------|-----|
| Vermelho Corporativo | #AA000E | #3d3d3d | Construção, indústria |
| Azul Profissional | #0066CC | #1a1a2e | Tecnologia, serviços |
| Verde Natural | #2E7D32 | #424242 | Agricultura, sustentabilidade |
| Laranja Energia | #E65100 | #37474F | Energia, logística |
| Roxo Criativo | #6A1B9A | #263238 | Agências, design |

### 8.5 Editor de Temas no Admin

- Color picker para cada cor
- Preview em tempo real
- Seletor de fontes do Google Fonts
- Duplicar tema existente
- Exportar/importar tema (JSON)

---

## 9. OTIMIZAÇÃO DE PERFORMANCE

### 9.1 Metas de Performance

| Métrica | Meta | Descrição |
|---------|------|-----------|
| **LCP** | < 2.5s | Largest Contentful Paint |
| **FID** | < 100ms | First Input Delay |
| **CLS** | < 0.1 | Cumulative Layout Shift |
| **TTFB** | < 200ms | Time to First Byte |
| **PageSpeed Score** | > 90 | Desktop e Mobile |

### 9.2 Estratégias de Otimização

#### Imagens
```html
<!-- Responsivo com srcset -->
<img 
  src="/images/banner.jpg?w=640&f=auto"
  srcset="/images/banner.jpg?w=640&f=auto 640w,
          /images/banner.jpg?w=960&f=auto 960w,
          /images/banner.jpg?w=1920&f=auto 1920w"
  sizes="100vw"
  alt="Banner"
  width="1920"
  height="600"
  loading="eager"
  fetchpriority="high"
>

<!-- Lazy loading para abaixo do fold -->
<img 
  src="/images/foto.jpg?w=400&f=auto"
  loading="lazy"
  alt="..."
>
```

#### CSS
```html
<!-- CSS Crítico inline -->
<style>
  /* Apenas CSS acima do fold */
  .header { ... }
  .banner { ... }
  .nav { ... }
</style>

<!-- CSS completo com preload -->
<link rel="preload" href="/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/css/main.css"></noscript>
```

#### JavaScript
```html
<!-- Mínimo JS, sempre defer -->
<script src="/js/app.js" defer></script>

<!-- Sem inline JS blocking -->
<!-- Sem jQuery, React ou frameworks pesados no site público -->
```

#### Fontes
```html
<!-- Preconnect -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Font com display swap -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Barlow:wght@400;500&display=swap" rel="stylesheet">
```

### 9.3 Headers de Cache (Cloudflare)

```
# _headers (Cloudflare Pages)

# HTML - Cache curto, revalidar
/*.html
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400
  
# CSS/JS - Cache longo (versionado)
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Imagens - Cache longo
/images/*
  Cache-Control: public, max-age=31536000
  
# API - Sem cache no browser
/api/*
  Cache-Control: no-store
```

### 9.4 Checklist de Performance

- [ ] HTML minificado
- [ ] CSS crítico inline (< 14KB)
- [ ] CSS não-crítico com preload
- [ ] JavaScript defer (não blocking)
- [ ] Imagens WebP/AVIF via Cloudflare
- [ ] Imagens com width/height definidos
- [ ] Lazy loading em imagens abaixo do fold
- [ ] Fontes com display=swap
- [ ] Preconnect para origens externas
- [ ] Cache headers otimizados
- [ ] Compressão gzip/brotli (automático Cloudflare)

---

## 10. SEO E COMPLIANCE GOOGLE

### 10.1 Checklist de SEO

#### Meta Tags
- [ ] `<title>` único por página (50-60 caracteres)
- [ ] `<meta name="description">` (150-160 caracteres)
- [ ] `<meta name="keywords">` (opcional, pouco peso)
- [ ] `<link rel="canonical">` definido
- [ ] Open Graph tags completas
- [ ] Twitter Card tags

#### Estrutura HTML
- [ ] HTML5 semântico (`<header>`, `<main>`, `<nav>`, `<article>`, `<footer>`)
- [ ] Heading hierarchy (`<h1>` único, `<h2>`..`<h6>` em ordem)
- [ ] Alt text em todas as imagens
- [ ] Links com texto descritivo
- [ ] Breadcrumbs (quando aplicável)

#### Técnico
- [ ] robots.txt configurado
- [ ] Sitemap.xml gerado e atualizado
- [ ] HTTPS (automático via Cloudflare)
- [ ] Mobile-friendly (responsive)
- [ ] Page speed > 90
- [ ] Core Web Vitals aprovados
- [ ] Schema.org / Structured Data

### 10.2 robots.txt

```
# robots.txt

User-agent: *
Allow: /

# Admin não indexar
Disallow: /admin/
Disallow: /api/

# Sitemap
Sitemap: https://www.planacdistribuidora.com.br/sitemap.xml
```

### 10.3 Sitemap.xml

Gerado automaticamente pela API em `/api/public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.planacdistribuidora.com.br/</loc>
    <lastmod>2026-01-03</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.planacdistribuidora.com.br/sobre</loc>
    <lastmod>2026-01-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... -->
</urlset>
```

### 10.4 Structured Data (Schema.org)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Planac Distribuidora",
  "url": "https://www.planacdistribuidora.com.br",
  "logo": "https://www.planacdistribuidora.com.br/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+55-43-3000-0000",
    "contactType": "sales"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Londrina",
    "addressRegion": "PR",
    "addressCountry": "BR"
  },
  "sameAs": [
    "https://www.facebook.com/planac",
    "https://www.instagram.com/planac"
  ]
}
</script>
```

### 10.5 Analytics (Zaraz)

O Zaraz substitui GTM/GA4/Pixel com zero JavaScript no cliente:

**Vantagens:**
- Não bloqueia renderização
- Não é bloqueado por ad-blockers
- Melhor performance
- Server-side (mais preciso)

**Configuração no Dashboard Cloudflare:**
1. Acessar Zaraz no domínio
2. Adicionar ferramenta: Google Analytics 4
3. Configurar Measurement ID
4. Adicionar ferramenta: Meta Pixel
5. Configurar Pixel ID

---

## 11. ROADMAP DO PROJETO

### Fase 1: MVP - CMS de Páginas ⏳
**Objetivo:** CMS funcional para o cliente Planac
**Prazo estimado:** 2-3 semanas

| Tarefa | Status | Prioridade |
|--------|--------|------------|
| API Backend completa | ✅ Feito | Alta |
| Banco de dados D1 | ✅ Feito | Alta |
| Storage R2 | ✅ Feito | Alta |
| Cache KV | ✅ Feito | Alta |
| Admin Panel - Layout | 🔜 Próximo | Alta |
| Admin Panel - Login | 🔜 Próximo | Alta |
| Admin Panel - Páginas | 🔜 Próximo | Alta |
| Admin Panel - Menus | ⏳ Pendente | Alta |
| Admin Panel - Mídia | ⏳ Pendente | Alta |
| Admin Panel - Configurações | ⏳ Pendente | Média |
| Admin Panel - Temas | ⏳ Pendente | Média |
| Frontend - Templates | ⏳ Pendente | Alta |
| Frontend - Performance | ⏳ Pendente | Alta |
| Testes PageSpeed | ⏳ Pendente | Alta |
| Deploy produção | ⏳ Pendente | Alta |
| Conectar domínio Planac | ⏳ Pendente | Alta |

### Fase 2: Multi-Tenant (SaaS)
**Objetivo:** Suportar múltiplos clientes
**Prazo estimado:** 3-4 semanas

| Tarefa | Status |
|--------|--------|
| Arquitetura multi-tenant | ⏳ |
| Super Admin Panel | ⏳ |
| Gerenciamento de clientes | ⏳ |
| Banco por cliente (D1) | ⏳ |
| Domínios customizados | ⏳ |
| Sistema de planos/limites | ⏳ |

### Fase 3: IA Generativa
**Objetivo:** IA que aprende sobre cada cliente
**Prazo estimado:** 4-6 semanas

| Tarefa | Status |
|--------|--------|
| Integração Workers AI | ⏳ |
| Vectorize por cliente | ⏳ |
| Upload de documentos base | ⏳ |
| RAG (Retrieval Augmented Generation) | ⏳ |
| Gerador de conteúdo | ⏳ |
| Gerador de SEO | ⏳ |
| Sugestões de melhoria | ⏳ |

### Fase 4: Escala e Monetização
**Objetivo:** Produto comercializável
**Prazo estimado:** 4-6 semanas

| Tarefa | Status |
|--------|--------|
| Sistema de billing | ⏳ |
| Integração pagamentos | ⏳ |
| Métricas de uso | ⏳ |
| White-label | ⏳ |
| API pública | ⏳ |
| Documentação para clientes | ⏳ |

---

## 12. RECURSOS CLOUDFLARE

### 12.1 Recursos Criados

| Tipo | Nome | ID |
|------|------|-----|
| D1 Database | cms-site-db | `8961e5db-b486-4bc5-bf35-be81240be063` |
| R2 Bucket | cms-site-media | - |
| KV Namespace | cms-site-cache | `bcdc2b754e8049d38da38f0e004c7104` |
| KV Namespace | cms-site-sessions | `1e35f7e79bc645d09441f6200efb0183` |
| Worker | cms-site-api | A criar |
| Pages | cms-site | A criar |
| Pages | cms-site-admin | A criar |

### 12.2 Variáveis de Ambiente

```toml
# wrangler.toml

[vars]
ADMIN_ORIGIN = "https://cms-site-admin.pages.dev"
SITE_ORIGIN = "https://cms-site.pages.dev"

# Secrets (configurar via wrangler secret put)
# JWT_SECRET = "sua-chave-secreta-aqui"
```

### 12.3 Bindings

```toml
[[d1_databases]]
binding = "DB"
database_name = "cms-site-db"
database_id = "8961e5db-b486-4bc5-bf35-be81240be063"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "cms-site-media"

[[kv_namespaces]]
binding = "CACHE"
id = "bcdc2b754e8049d38da38f0e004c7104"

[[kv_namespaces]]
binding = "SESSIONS"
id = "1e35f7e79bc645d09441f6200efb0183"
```

---

## 13. GUIA DE DEPLOY

### 13.1 Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Wrangler CLI (`npm install -g wrangler`)
- Conta Cloudflare configurada

### 13.2 Deploy da API

```bash
# 1. Entrar na pasta da API
cd api

# 2. Instalar dependências
npm install

# 3. Configurar secret JWT
wrangler secret put JWT_SECRET
# Digite uma chave segura quando solicitado

# 4. Deploy
npm run deploy

# 5. Verificar
curl https://cms-site-api.{sua-conta}.workers.dev/health
```

### 13.3 Deploy do Admin

```bash
# 1. Entrar na pasta do Admin
cd admin

# 2. Instalar dependências
npm install

# 3. Build
npm run build

# 4. Deploy via Cloudflare Pages
# - Conectar repositório GitHub
# - Ou usar wrangler pages deploy dist
```

### 13.4 Deploy do Frontend

```bash
# 1. Entrar na pasta do Frontend
cd frontend

# 2. Build (se necessário)
npm run build

# 3. Deploy via Cloudflare Pages
```

### 13.5 Conectar Domínio Customizado

1. Acessar Cloudflare Dashboard
2. Ir em Workers & Pages > cms-site
3. Custom domains > Add custom domain
4. Digitar: `planacdistribuidora.com.br`
5. Seguir instruções de DNS

---

## 📝 CHANGELOG

### v1.0.0 (03/01/2026)
- Documentação inicial criada
- Arquitetura definida
- Banco de dados estruturado
- API implementada
- Recursos Cloudflare criados

---

## 📞 CONTATO

**Desenvolvedor:** CodieHost  
**Cliente Piloto:** Planac Distribuidora  
**Domínio:** planacdistribuidora.com.br

---

*Documento atualizado em: 03/01/2026*
