# 📘 CMS SITE - DOCUMENTAÇÃO OFICIAL CONSOLIDADA

**Versão:** 2.0.0  
**Data:** 03/01/2026  
**Status:** Em Desenvolvimento  

---

## 📋 ÍNDICE

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Banco de Dados](#4-banco-de-dados)
5. [Sistema de Blocos (Page Builder)](#5-sistema-de-blocos-page-builder)
6. [Sistema de Temas](#6-sistema-de-temas)
7. [Pipeline de Imagens](#7-pipeline-de-imagens)
8. [API - Endpoints](#8-api---endpoints)
9. [Frontend com Astro](#9-frontend-com-astro)
10. [Admin Panel](#10-admin-panel)
11. [SEO e Performance](#11-seo-e-performance)
12. [Multi-Tenant (SaaS)](#12-multi-tenant-saas)
13. [Roadmap](#13-roadmap)
14. [Recursos Cloudflare](#14-recursos-cloudflare)

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 O que é o CMS Site?

O **CMS Site** é um Sistema de Gerenciamento de Conteúdo moderno para criação de sites institucionais e páginas de anúncios, com foco em:

- **Geração de leads** (telefone, e-mail, WhatsApp, rotas)
- **Alta performance** (PageSpeed 90+)
- **SEO orgânico** (compliance Google)
- **Múltiplos temas** editáveis
- **Arquitetura SaaS** (multi-cliente)

### 1.2 Proposta de Valor

| Característica | Benefício |
|----------------|-----------|
| **Performance** | Sites com nota 90+ no PageSpeed |
| **Simplicidade** | Interface intuitiva para não-programadores |
| **Escalabilidade** | Arquitetura preparada para multi-tenant (SaaS) |
| **IA Integrada** | Geração de conteúdo personalizado (futuro) |
| **Custo Baixo** | ~$10-15/mês por cliente |

### 1.3 Público-Alvo

- Empresas que precisam de sites institucionais
- Negócios focados em geração de leads
- Agências que gerenciam múltiplos sites

### 1.4 Cliente Piloto

- **Empresa:** Planac Distribuidora
- **Domínio:** planacdistribuidora.com.br
- **Segmento:** Materiais de construção (Drywall, acabamentos)
- **Localização:** Londrina, PR

---

## 2. STACK TECNOLÓGICA

### 2.1 Backend (API)

| Tecnologia | Versão | Função |
|------------|--------|--------|
| **Cloudflare Workers** | - | Runtime serverless edge |
| **Hono** | 4.x | Framework HTTP (14KB, ultra-leve) |
| **TypeScript** | 5.x | Linguagem tipada |
| **D1** | - | Banco de dados SQL (SQLite) |
| **R2** | - | Object storage (imagens/mídia) |
| **KV** | - | Key-Value store (cache/sessões) |

### 2.2 Frontend Público (Site)

| Tecnologia | Função |
|------------|--------|
| **Astro** | Framework SSG (Static Site Generation) |
| **HTML5 Semântico** | Estrutura otimizada para SEO |
| **CSS Custom Properties** | Sistema de temas via variáveis |
| **JavaScript Vanilla** | Interatividade mínima (só onde necessário) |
| **Cloudflare Pages** | Hospedagem com CDN global |

### 2.3 Admin Panel

| Tecnologia | Versão | Função |
|------------|--------|--------|
| **React** | 18.x | Framework UI |
| **Vite** | 5.x | Build tool |
| **Tailwind CSS** | 3.x | Estilização |
| **React Router** | 6.x | Navegação SPA |
| **TanStack Query** | 5.x | Cache de API |
| **dnd-kit** | - | Drag and drop |
| **Tiptap** | 2.x | Editor de texto rico |
| **Lucide React** | - | Ícones |

### 2.4 Serviços Cloudflare

| Serviço | Custo | Função |
|---------|-------|--------|
| Workers Paid | $5/mês | API Backend |
| Pages | Grátis | Hospedagem frontend |
| D1 | Grátis* | Banco de dados |
| R2 | Grátis* | Storage de mídia |
| KV | Grátis* | Cache |
| Images | $5/mês | Otimização de imagens |
| Zaraz | Contratado | Analytics server-side |

*Dentro dos limites do free tier

**Custo total estimado:** ~$10-15/mês por site

---

## 3. ARQUITETURA DO SISTEMA

### 3.1 Diagrama Geral

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
│  │ • Image Resizing + Ponto Focal (WebP/AVIF automático)           │    │
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
│      (Astro SSG)              │   │    (React SPA)                │
│                               │   │                               │
│ • HTML estático gerado        │   │ • Editor de páginas           │
│ • Componentes .astro          │   │ • Drag-and-drop blocos        │
│ • CSS por tokens (temas)      │   │ • Upload com ponto focal      │
│ • JS mínimo (defer)           │   │ • Gerenciador de temas        │
│ • Imagens responsivas         │   │ • Configurações               │
│                               │   │                               │
│ URL: cms-site.pages.dev       │   │ URL: cms-site-admin.pages.dev │
└───────────────────────────────┘   └───────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API BACKEND                                     │
│                   (Cloudflare Worker + Hono)                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • /api/public/*    → Dados públicos (cache KV)                  │    │
│  │ • /api/auth/*      → Autenticação (JWT)                         │    │
│  │ • /api/pages/*     → CRUD páginas + blocos                      │    │
│  │ • /api/menus/*     → CRUD menus hierárquicos                    │    │
│  │ • /api/media/*     → Upload + ponto focal                       │    │
│  │ • /api/settings/*  → Configurações                              │    │
│  │ • /api/themes/*    → Temas                                      │    │
│  │ • /images/*        → Proxy com presets de tamanho               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌───────────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│      D1 (SQLite)      │ │    R2 (S3)      │ │      KV (Cache)         │
│                       │ │                 │ │                         │
│ • users               │ │ • Imagens       │ │ • cms-site-cache        │
│ • pages               │ │   originais     │ │   (dados públicos)      │
│ • page_sections       │ │ • Documentos    │ │                         │
│ • menus               │ │ • Uploads       │ │ • cms-site-sessions     │
│ • media (com focal)   │ │                 │ │   (sessões JWT)         │
│ • settings            │ │                 │ │                         │
│ • themes              │ │                 │ │                         │
│ • contacts            │ │                 │ │                         │
│                       │ │                 │ │                         │
│ ID: 8961e5db-...      │ │ cms-site-media  │ │                         │
└───────────────────────┘ └─────────────────┘ └─────────────────────────┘
```

### 3.2 Fluxo de Requisição - Site Público

```
1. Visitante acessa planacdistribuidora.com.br
2. Cloudflare Edge verifica cache
   └── HIT: Retorna HTML cacheado (< 50ms)
   └── MISS: Continua para Pages
3. Astro serve HTML estático pré-gerado
4. Browser carrega CSS/JS (cacheados 1 ano)
5. Imagens carregam via Image Resizing:
   - Aplica preset (ex: banner_desktop)
   - Usa ponto focal para crop inteligente
   - Converte para WebP/AVIF automaticamente
6. Zaraz injeta analytics (0 JS bloqueante)
```

---

## 4. BANCO DE DADOS

### 4.1 Diagrama ER

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   users     │     │   themes    │     │  settings   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ email       │     │ name        │     │ key         │
│ password    │     │ slug        │     │ value       │
│ name        │     │ colors      │     │ type        │
│ role        │     │ fonts       │     │ group_name  │
└─────────────┘     │ is_active   │     └─────────────┘
                    └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   menus     │     │   pages     │     │ page_sections   │
├─────────────┤     ├─────────────┤     ├─────────────────┤
│ id (PK)     │◄────┤ menu_id(FK) │     │ id (PK)         │
│ name        │     │ id (PK)     │────►│ page_id (FK)    │
│ slug        │     │ title       │     │ type            │
│ parent_id   │──┐  │ slug        │     │ layout          │
│ position    │  │  │ content     │     │ variant         │
│ is_visible  │  │  │ status      │     │ content (JSON)  │
└─────────────┘  │  │ seo_*       │     │ settings (JSON) │
      ▲          │  └─────────────┘     │ position        │
      └──────────┘                      └─────────────────┘
    (self-ref)

┌──────────────────┐     ┌─────────────┐
│   media          │     │  contacts   │
├──────────────────┤     ├─────────────┤
│ id (PK)          │     │ id (PK)     │
│ file_name        │     │ name        │
│ url              │     │ email       │
│ width            │     │ phone       │
│ height           │     │ message     │
│ focal_x (0-1)    │     │ status      │
│ focal_y (0-1)    │     │ source_page │
│ alt_text         │     └─────────────┘
│ folder           │
└──────────────────┘
```

### 4.2 Schema SQL Completo

```sql
-- =============================================
-- USUÁRIOS
-- =============================================
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

-- =============================================
-- CONFIGURAÇÕES
-- =============================================
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

-- =============================================
-- TEMAS
-- =============================================
CREATE TABLE themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    colors TEXT NOT NULL,      -- JSON com tokens de cor
    fonts TEXT,                -- JSON com tokens de fonte
    spacing TEXT,              -- JSON com tokens de espaçamento
    borders TEXT,              -- JSON com tokens de borda
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- MENUS
-- =============================================
CREATE TABLE menus (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    parent_id TEXT,
    position INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE SET NULL
);

-- =============================================
-- PÁGINAS
-- =============================================
CREATE TABLE pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    page_type TEXT DEFAULT 'content' CHECK (page_type IN ('home', 'content', 'product', 'contact', 'blog', 'blog_post', 'custom')),
    
    -- Banner Principal
    banner_image TEXT,
    banner_title TEXT,
    banner_subtitle TEXT,
    banner_cta_text TEXT,
    banner_cta_url TEXT,
    
    -- Conteúdo
    content TEXT,
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
    
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- =============================================
-- SEÇÕES DAS PÁGINAS (BLOCOS)
-- =============================================
CREATE TABLE page_sections (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL,
    
    -- Tipo e Variações
    section_type TEXT NOT NULL CHECK (section_type IN (
        'hero_banner',
        'text',
        'media_text',
        'features',
        'gallery',
        'carousel',
        'product_grid',
        'cta',
        'faq',
        'contact_form',
        'testimonials',
        'stats',
        'team',
        'blog_list',
        'map',
        'custom_html'
    )),
    
    layout TEXT DEFAULT 'default',   -- 'default', 'media-left', 'media-right', 'stacked', etc.
    variant TEXT DEFAULT 'default',  -- 'default', 'compact', 'featured', 'dark', etc.
    
    -- Conteúdo
    title TEXT,
    content TEXT,                    -- JSON com props específicas do bloco
    settings TEXT,                   -- JSON com configurações extras
    
    -- Organização
    position INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

-- =============================================
-- MÍDIA (COM PONTO FOCAL)
-- =============================================
CREATE TABLE media (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    file_name TEXT UNIQUE NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'document', 'video')),
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    url TEXT NOT NULL,
    
    -- Dimensões originais
    width INTEGER,
    height INTEGER,
    
    -- PONTO FOCAL (para crop inteligente)
    focal_x REAL DEFAULT 0.5,  -- 0.0 (esquerda) a 1.0 (direita)
    focal_y REAL DEFAULT 0.5,  -- 0.0 (topo) a 1.0 (base)
    
    -- Metadados
    alt_text TEXT,
    caption TEXT,
    folder TEXT DEFAULT 'general',
    
    -- Audit
    uploaded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- =============================================
-- CONTATOS/LEADS
-- =============================================
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

-- =============================================
-- LOGS DE AUDITORIA
-- =============================================
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_menu ON pages(menu_id);
CREATE INDEX idx_menus_parent ON menus(parent_id);
CREATE INDEX idx_menus_slug ON menus(slug);
CREATE INDEX idx_sections_page ON page_sections(page_id);
CREATE INDEX idx_sections_type ON page_sections(section_type);
CREATE INDEX idx_media_folder ON media(folder);
CREATE INDEX idx_contacts_status ON contacts(status);
```

---

## 5. SISTEMA DE BLOCOS (PAGE BUILDER)

### 5.1 Conceito

As páginas são compostas por **blocos configuráveis**, não HTML livre. Cada bloco tem:

- **type**: Tipo do bloco (hero, faq, gallery, etc.)
- **layout**: Disposição visual (left, right, stacked, etc.)
- **variant**: Variação de estilo (default, compact, dark, etc.)
- **content**: JSON com dados específicos
- **settings**: JSON com configurações extras

### 5.2 Blocos Disponíveis

| Bloco | Tipo | Descrição |
|-------|------|-----------|
| Hero Banner | `hero_banner` | Banner principal com imagem, título, CTA |
| Texto Rico | `text` | Bloco de texto com formatação |
| Mídia + Texto | `media_text` | Imagem lado a lado com texto |
| Features | `features` | Grid de recursos/benefícios com ícones |
| Galeria | `gallery` | Grade de imagens |
| Carrossel | `carousel` | Slider de imagens/cores |
| Grid de Produtos | `product_grid` | Cards de produtos |
| CTA | `cta` | Chamada para ação (WhatsApp, telefone) |
| FAQ | `faq` | Perguntas frequentes (com Schema.org) |
| Formulário | `contact_form` | Formulário de contato |
| Depoimentos | `testimonials` | Avaliações de clientes |
| Estatísticas | `stats` | Números e métricas |
| Equipe | `team` | Membros da equipe |
| Lista Blog | `blog_list` | Posts recentes |
| Mapa | `map` | Google Maps / Rotas |
| HTML Custom | `custom_html` | HTML personalizado |

### 5.3 Contratos JSON dos Blocos

#### Hero Banner
```json
{
  "section_type": "hero_banner",
  "layout": "centered",  // centered, left-aligned, split
  "variant": "overlay-dark",  // overlay-dark, overlay-light, no-overlay
  "content": {
    "mediaId": "img_123",
    "title": "Título Principal",
    "subtitle": "Subtítulo descritivo",
    "cta": {
      "text": "Solicite Orçamento",
      "url": "/contato",
      "style": "primary"  // primary, secondary, outline
    },
    "secondaryCta": {
      "text": "Conheça Produtos",
      "url": "/produtos",
      "style": "outline"
    }
  },
  "settings": {
    "fullHeight": true,
    "parallax": false,
    "overlayOpacity": 0.5
  }
}
```

#### Mídia + Texto
```json
{
  "section_type": "media_text",
  "layout": "media-left",  // media-left, media-right, stacked
  "variant": "default",  // default, compact, featured
  "content": {
    "mediaId": "img_456",
    "mediaType": "image",  // image, video
    "title": "Título da Seção",
    "text": "<p>Conteúdo HTML...</p>",
    "cta": {
      "text": "Saiba mais",
      "url": "/pagina",
      "style": "primary"
    }
  },
  "settings": {
    "backgroundColor": "surface",  // background, surface, primary
    "mediaRounded": true,
    "mediaShadow": true
  }
}
```

#### Carrossel de Cores/Imagens
```json
{
  "section_type": "carousel",
  "layout": "full-width",  // full-width, contained, compact
  "variant": "default",
  "content": {
    "title": "Cores Disponíveis",
    "items": [
      {
        "mediaId": "img_cor1",
        "label": "Branco Neve",
        "code": "#FFFFFF"
      },
      {
        "mediaId": "img_cor2",
        "label": "Cinza Claro",
        "code": "#E0E0E0"
      }
    ]
  },
  "settings": {
    "autoplay": true,
    "autoplaySpeed": 3000,
    "showDots": true,
    "showArrows": true,
    "slidesPerView": 4,
    "slidesPerViewMobile": 2
  }
}
```

#### FAQ (com Schema.org)
```json
{
  "section_type": "faq",
  "layout": "accordion",  // accordion, list, two-columns
  "variant": "default",
  "content": {
    "title": "Perguntas Frequentes",
    "subtitle": "Tire suas dúvidas",
    "items": [
      {
        "question": "Qual o prazo de entrega?",
        "answer": "<p>O prazo varia de 3 a 7 dias úteis dependendo da região...</p>"
      },
      {
        "question": "Vocês fazem instalação?",
        "answer": "<p>Sim, temos equipe própria de instaladores certificados...</p>"
      },
      {
        "question": "Qual a garantia dos produtos?",
        "answer": "<p>Todos os produtos possuem garantia de fábrica...</p>"
      }
    ]
  },
  "settings": {
    "generateSchema": true,  // Gera FAQPage Schema.org
    "allowMultipleOpen": false,
    "defaultOpen": 0  // Índice do item aberto por padrão (-1 para nenhum)
  }
}
```

#### CTA (WhatsApp/Telefone)
```json
{
  "section_type": "cta",
  "layout": "centered",  // centered, split, inline
  "variant": "primary",  // primary, secondary, dark
  "content": {
    "title": "Pronto para começar sua obra?",
    "description": "Entre em contato e solicite um orçamento sem compromisso",
    "buttons": [
      {
        "type": "whatsapp",
        "text": "WhatsApp",
        "number": "5543999999999",
        "message": "Olá! Gostaria de um orçamento."
      },
      {
        "type": "phone",
        "text": "Ligar Agora",
        "number": "4333333333"
      },
      {
        "type": "link",
        "text": "Ver Rotas",
        "url": "https://maps.google.com/...",
        "target": "_blank"
      }
    ]
  },
  "settings": {
    "backgroundColor": "primary",
    "showIcons": true
  }
}
```

#### Features (Benefícios)
```json
{
  "section_type": "features",
  "layout": "grid",  // grid, list, carousel
  "variant": "icons",  // icons, images, numbers
  "content": {
    "title": "Por que escolher a Planac?",
    "subtitle": "Diferenciais que fazem a diferença",
    "items": [
      {
        "icon": "shield-check",
        "title": "Qualidade Garantida",
        "description": "Produtos certificados e de primeira linha"
      },
      {
        "icon": "truck",
        "title": "Entrega Rápida",
        "description": "Entregamos em toda região de Londrina"
      },
      {
        "icon": "headphones",
        "title": "Suporte Técnico",
        "description": "Equipe especializada para te ajudar"
      }
    ]
  },
  "settings": {
    "columns": 3,
    "columnsMobile": 1,
    "showDividers": false
  }
}
```

#### Formulário de Contato
```json
{
  "section_type": "contact_form",
  "layout": "with-info",  // simple, with-info, split
  "variant": "default",
  "content": {
    "title": "Entre em Contato",
    "subtitle": "Preencha o formulário abaixo",
    "fields": [
      { "name": "name", "label": "Nome", "type": "text", "required": true },
      { "name": "email", "label": "E-mail", "type": "email", "required": true },
      { "name": "phone", "label": "Telefone", "type": "tel", "required": false },
      { "name": "city", "label": "Cidade", "type": "text", "required": false },
      { "name": "message", "label": "Mensagem", "type": "textarea", "required": true }
    ],
    "submitText": "Enviar Mensagem",
    "successMessage": "Mensagem enviada com sucesso! Entraremos em contato em breve.",
    "contactInfo": {
      "phone": "(43) 3333-3333",
      "whatsapp": "(43) 99999-9999",
      "email": "contato@planac.com.br",
      "address": "Rua Example, 123 - Londrina/PR"
    }
  },
  "settings": {
    "showContactInfo": true,
    "showMap": false
  }
}
```

---

## 6. SISTEMA DE TEMAS

### 6.1 Conceito

**Tema = Aparência**, não conteúdo. Temas são baseados em **CSS Custom Properties** (tokens), permitindo troca instantânea.

### 6.2 Estrutura de Tokens

```json
{
  "id": "theme_planac",
  "name": "Planac Vermelho",
  "slug": "planac-vermelho",
  "colors": {
    "primary": "#AA000E",
    "primaryHover": "#8B000B",
    "secondary": "#3D3D3D",
    "secondaryHover": "#2D2D2D",
    "accent": "#20A838",
    "background": "#FFFFFF",
    "surface": "#F6F8FB",
    "surfaceHover": "#E8ECF1",
    "text": "#333333",
    "textLight": "#666666",
    "textMuted": "#999999",
    "border": "#E0E0E0",
    "success": "#22C55E",
    "warning": "#F59E0B",
    "error": "#EF4444"
  },
  "fonts": {
    "heading": "Poppins",
    "body": "Barlow",
    "headingWeight": "600",
    "bodyWeight": "400"
  },
  "spacing": {
    "sectionY": "5rem",
    "sectionYMobile": "3rem",
    "containerWidth": "1200px"
  },
  "borders": {
    "radius": "8px",
    "radiusLarge": "16px",
    "radiusSmall": "4px"
  },
  "is_active": true
}
```

### 6.3 Aplicação no CSS

```css
:root {
  /* Cores */
  --color-primary: #AA000E;
  --color-primary-hover: #8B000B;
  --color-secondary: #3D3D3D;
  --color-background: #FFFFFF;
  --color-surface: #F6F8FB;
  --color-text: #333333;
  --color-text-light: #666666;
  --color-border: #E0E0E0;
  
  /* Fontes */
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Barlow', sans-serif;
  --font-heading-weight: 600;
  --font-body-weight: 400;
  
  /* Espaçamento */
  --section-padding: 5rem;
  --container-width: 1200px;
  
  /* Bordas */
  --radius: 8px;
  --radius-lg: 16px;
  --radius-sm: 4px;
}

/* Uso nos componentes */
.btn-primary {
  background-color: var(--color-primary);
  border-radius: var(--radius);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}
```

### 6.4 Temas Pré-definidos

| Tema | Primary | Uso Recomendado |
|------|---------|-----------------|
| **Vermelho Corporativo** | #AA000E | Construção, indústria |
| **Azul Profissional** | #0066CC | Tecnologia, serviços |
| **Verde Natural** | #2E7D32 | Agricultura, sustentabilidade |
| **Laranja Energia** | #E65100 | Energia, logística |
| **Roxo Criativo** | #6A1B9A | Agências, design |

### 6.5 Editor de Temas no Admin

O usuário pode:
- Escolher tema pré-definido
- Personalizar cores principais
- Trocar fontes (Google Fonts)
- Ajustar bordas e espaçamentos
- Ver preview em tempo real

---

## 7. PIPELINE DE IMAGENS

### 7.1 Conceito

- **Armazenar:** Imagem original no R2 (máxima qualidade)
- **Transformar:** On-the-fly com Cloudflare Images
- **Cachear:** Agressivamente no edge
- **Ponto Focal:** Crop inteligente baseado na área importante

### 7.2 Presets Oficiais (Whitelist)

```typescript
const IMAGE_PRESETS = {
  // Banners
  banner_desktop: { w: 1920, h: 710, fit: 'cover', q: 85 },
  banner_tablet: { w: 1200, h: 500, fit: 'cover', q: 80 },
  banner_mobile: { w: 768, h: 540, fit: 'cover', q: 75 },
  
  // Produtos
  product_large: { w: 1200, h: 1200, fit: 'cover', q: 85 },
  product_card: { w: 800, h: 800, fit: 'cover', q: 80 },
  product_thumb: { w: 400, h: 400, fit: 'cover', q: 75 },
  
  // Galeria
  gallery_large: { w: 1600, h: 1000, fit: 'cover', q: 85 },
  gallery_medium: { w: 800, h: 500, fit: 'cover', q: 80 },
  gallery_thumb: { w: 400, h: 300, fit: 'cover', q: 75 },
  
  // Social/SEO
  og_image: { w: 1200, h: 630, fit: 'cover', q: 80 },
  
  // Avatars
  avatar_large: { w: 200, h: 200, fit: 'cover', q: 80 },
  avatar_small: { w: 80, h: 80, fit: 'cover', q: 75 },
};
```

### 7.3 Ponto Focal

O ponto focal define o centro do crop inteligente:

```
┌─────────────────────────────────────────┐
│                                         │
│    focal_x: 0.0        focal_x: 1.0     │
│    (esquerda)          (direita)        │
│                                         │
│         focal_y: 0.0 (topo)             │
│                  │                      │
│                  ▼                      │
│                  ●  ← Ponto focal       │
│                  ▲    (0.7, 0.3)        │
│                  │                      │
│         focal_y: 1.0 (base)             │
│                                         │
└─────────────────────────────────────────┘
```

### 7.4 URL de Transformação

```
/cdn-cgi/image/width=1920,height=710,fit=cover,gravity=0.7x0.3,format=auto,quality=85/original.jpg
```

Parâmetros:
- `width`, `height`: Dimensões do preset
- `fit=cover`: Preenche área cortando se necessário
- `gravity=0.7x0.3`: Ponto focal (focal_x, focal_y)
- `format=auto`: WebP ou AVIF automático
- `quality=85`: Qualidade da compressão

### 7.5 HTML Responsivo

```html
<picture>
  <!-- Mobile -->
  <source 
    media="(max-width: 768px)" 
    srcset="/images/banner?preset=banner_mobile">
  
  <!-- Tablet -->
  <source 
    media="(max-width: 1200px)" 
    srcset="/images/banner?preset=banner_tablet">
  
  <!-- Desktop -->
  <img 
    src="/images/banner?preset=banner_desktop"
    width="1920" 
    height="710"
    alt="Banner principal"
    loading="eager"
    fetchpriority="high">
</picture>
```

---

## 8. API - ENDPOINTS

### 8.1 Base URL

```
Produção: https://cms-site-api.{account}.workers.dev
```

### 8.2 Autenticação

Header: `Authorization: Bearer <token>`
Ou Cookie: `auth_token=<token>`

### 8.3 Endpoints Públicos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/public/settings` | Configurações do site |
| GET | `/api/public/theme` | Tema ativo |
| GET | `/api/public/navigation` | Menu de navegação |
| GET | `/api/public/pages` | Páginas publicadas |
| GET | `/api/public/pages/:slug` | Página com blocos |
| GET | `/api/public/home` | Página inicial |
| POST | `/api/public/contact` | Enviar lead |
| GET | `/api/public/sitemap.xml` | Sitemap |
| GET | `/api/public/search?q=` | Busca |

### 8.4 Endpoints de Imagens

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/images/:id` | Imagem original |
| GET | `/images/:id?preset=banner_desktop` | Com preset |
| GET | `/images/:id?w=800&h=600&fit=cover` | Customizado |

### 8.5 Endpoints Autenticados

Ver documentação completa da API.

---

## 9. FRONTEND COM ASTRO

### 9.1 Por que Astro?

- **Performance máxima**: Gera HTML estático
- **SEO perfeito**: HTML indexável pelo Google
- **JS mínimo**: Só carrega onde precisa
- **Temas organizados**: Componentes e layouts estruturados
- **Build otimizado**: CSS crítico, assets otimizados

### 9.2 Estrutura de Pastas

```
site/
├── astro.config.mjs
├── package.json
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── layouts/
│   │   ├── Base.astro          # Layout base HTML
│   │   └── Page.astro          # Layout de página
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   ├── Navigation.astro
│   │   │   └── WhatsAppFloat.astro
│   │   │
│   │   └── blocks/             # Blocos do Page Builder
│   │       ├── HeroBanner.astro
│   │       ├── TextBlock.astro
│   │       ├── MediaText.astro
│   │       ├── Features.astro
│   │       ├── Gallery.astro
│   │       ├── Carousel.astro
│   │       ├── ProductGrid.astro
│   │       ├── CTA.astro
│   │       ├── FAQ.astro
│   │       ├── ContactForm.astro
│   │       ├── Testimonials.astro
│   │       ├── Stats.astro
│   │       └── Map.astro
│   │
│   ├── pages/
│   │   ├── index.astro         # Homepage
│   │   ├── [...slug].astro     # Páginas dinâmicas
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   └── 404.astro
│   │
│   ├── styles/
│   │   ├── global.css          # Reset + tokens
│   │   ├── components.css      # Estilos de componentes
│   │   └── utilities.css       # Classes utilitárias
│   │
│   └── lib/
│       ├── api.ts              # Cliente da API
│       └── helpers.ts          # Funções auxiliares
│
└── _headers                    # Headers Cloudflare
```

### 9.3 Componente de Bloco (Exemplo)

```astro
---
// src/components/blocks/FAQ.astro
interface Props {
  title?: string;
  subtitle?: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
  generateSchema?: boolean;
}

const { title, subtitle, items, generateSchema = true } = Astro.props;
---

<section class="faq-section">
  <div class="container">
    {title && <h2 class="section-title">{title}</h2>}
    {subtitle && <p class="section-subtitle">{subtitle}</p>}
    
    <div class="faq-list">
      {items.map((item, index) => (
        <details class="faq-item" open={index === 0}>
          <summary class="faq-question">{item.question}</summary>
          <div class="faq-answer" set:html={item.answer} />
        </details>
      ))}
    </div>
  </div>
</section>

{generateSchema && (
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer.replace(/<[^>]*>/g, '')
      }
    }))
  })} />
)}

<style>
  .faq-section {
    padding: var(--section-padding) 0;
  }
  
  .faq-item {
    border-bottom: 1px solid var(--color-border);
    padding: 1rem 0;
  }
  
  .faq-question {
    font-weight: var(--font-heading-weight);
    cursor: pointer;
    list-style: none;
  }
  
  .faq-question::marker {
    display: none;
  }
  
  .faq-answer {
    padding-top: 1rem;
    color: var(--color-text-light);
  }
</style>
```

---

## 10. ADMIN PANEL

### 10.1 Telas Principais

1. **Login**
2. **Dashboard** - Estatísticas, últimos leads, atalhos
3. **Páginas** - CRUD com editor de blocos
4. **Menus** - Árvore hierárquica drag-and-drop
5. **Mídia** - Upload com ponto focal
6. **Contatos** - Leads com status e notas
7. **Configurações** - Dados do site, contato, social
8. **Temas** - Escolher e personalizar tema
9. **Usuários** - Gerenciar acessos (admin)

### 10.2 Editor de Página

```
┌─────────────────────────────────────────────────────────────────┐
│  EDITOR DE PÁGINA                                               │
├─────────────────────────────────────────────────────────────────┤
│  [Salvar Rascunho] [Publicar] [Preview] [SEO]                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐  ┌───────────────────────────────────┐ │
│  │ BLOCOS              │  │ PREVIEW                           │ │
│  │                     │  │                                   │ │
│  │ ≡ Hero Banner       │  │ ┌───────────────────────────────┐ │ │
│  │   [editar] [×]      │  │ │      BANNER PRINCIPAL         │ │ │
│  │                     │  │ │                               │ │ │
│  │ ≡ Features          │  │ └───────────────────────────────┘ │ │
│  │   [editar] [×]      │  │                                   │ │
│  │                     │  │ ┌───────────────────────────────┐ │ │
│  │ ≡ FAQ               │  │ │      FEATURES                 │ │ │
│  │   [editar] [×]      │  │ └───────────────────────────────┘ │ │
│  │                     │  │                                   │ │
│  │ ≡ CTA WhatsApp      │  │ ┌───────────────────────────────┐ │ │
│  │   [editar] [×]      │  │ │      FAQ                      │ │ │
│  │                     │  │ └───────────────────────────────┘ │ │
│  │                     │  │                                   │ │
│  │ [+ Adicionar Bloco] │  │ ┌───────────────────────────────┐ │ │
│  │                     │  │ │      CTA                      │ │ │
│  └─────────────────────┘  │ └───────────────────────────────┘ │ │
│                           └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Upload com Ponto Focal

```
┌─────────────────────────────────────────────────────────────────┐
│  UPLOAD DE IMAGEM                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                    [IMAGEM ORIGINAL]                    │    │
│  │                                                         │    │
│  │                         ●  ← Arraste para definir       │    │
│  │                            o ponto focal                │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Previews:                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────┐              │
│  │   Desktop     │  │    Mobile     │  │  Thumb  │              │
│  │   1920x710    │  │    768x540    │  │ 400x400 │              │
│  └───────────────┘  └───────────────┘  └─────────┘              │
│                                                                 │
│  Alt text: [___________________________]                        │
│                                                                 │
│  [Cancelar]                              [Salvar]               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. SEO E PERFORMANCE

### 11.1 Metas de Performance

| Métrica | Meta | Descrição |
|---------|------|-----------|
| **LCP** | < 2.5s | Largest Contentful Paint |
| **FID** | < 100ms | First Input Delay |
| **CLS** | < 0.1 | Cumulative Layout Shift |
| **PageSpeed** | > 90 | Desktop e Mobile |

### 11.2 Checklist SEO

- [x] HTML5 semântico
- [x] Heading hierarchy (H1 único)
- [x] Meta tags (title, description)
- [x] Open Graph tags
- [x] Schema.org (Organization, FAQPage)
- [x] Sitemap.xml automático
- [x] robots.txt
- [x] URLs limpas
- [x] Alt em imagens
- [x] HTTPS

### 11.3 Checklist Performance

- [x] HTML estático (Astro SSG)
- [x] CSS crítico inline
- [x] JS defer (não bloqueante)
- [x] Imagens responsivas (srcset)
- [x] WebP/AVIF automático
- [x] width/height em imagens (CLS)
- [x] Lazy loading abaixo do fold
- [x] Font-display: swap
- [x] Cache headers otimizados
- [x] Zaraz (analytics server-side)

---

## 12. MULTI-TENANT (SaaS) - FASE 2

### 12.1 Modelo de Dados

```sql
-- Clientes
CREATE TABLE tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'basic',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Domínios (1 tenant : N domínios)
CREATE TABLE tenant_domains (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    is_primary INTEGER DEFAULT 0,
    ssl_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

### 12.2 Resolução de Tenant

```typescript
// Middleware no Worker
async function resolveTenant(request: Request, db: D1Database) {
  const host = new URL(request.url).hostname;
  
  const domain = await db.prepare(
    'SELECT tenant_id FROM tenant_domains WHERE domain = ?'
  ).bind(host).first();
  
  if (!domain) throw new Error('Tenant not found');
  
  return domain.tenant_id;
}
```

### 12.3 Cache por Tenant

Todas as chaves KV seguem o padrão:
```
tenant:{tenant_id}:{recurso}
```

Exemplo:
- `tenant:planac:public:navigation`
- `tenant:planac:page:/drywall`
- `tenant:planac:theme:active`

---

## 13. ROADMAP

### Fase 1: MVP ⏳ (Em andamento)
- [x] Arquitetura definida
- [x] Banco de dados D1 criado
- [x] API Backend (código pronto)
- [ ] Deploy da API
- [ ] Admin Panel (React)
- [ ] Frontend (Astro)
- [ ] Sistema de temas
- [ ] Pipeline de imagens
- [ ] Testes PageSpeed
- [ ] Deploy produção
- [ ] Domínio Planac

### Fase 2: Multi-Tenant
- [ ] Tabelas tenant/domains
- [ ] Resolução por domínio
- [ ] Super Admin
- [ ] Planos e limites
- [ ] Billing

### Fase 3: IA Generativa
- [ ] Workers AI
- [ ] Vectorize por tenant
- [ ] Gerador de conteúdo
- [ ] SEO automático

### Fase 4: Escala
- [ ] Marketplace de temas
- [ ] API pública
- [ ] White-label
- [ ] Integrações

---

## 14. RECURSOS CLOUDFLARE

### 14.1 Recursos Criados

| Tipo | Nome | ID |
|------|------|-----|
| D1 Database | cms-site-db | `8961e5db-b486-4bc5-bf35-be81240be063` |
| R2 Bucket | cms-site-media | - |
| KV Namespace | cms-site-cache | `bcdc2b754e8049d38da38f0e004c7104` |
| KV Namespace | cms-site-sessions | `1e35f7e79bc645d09441f6200efb0183` |

### 14.2 A Criar

| Tipo | Nome | Função |
|------|------|--------|
| Worker | cms-site-api | API Backend |
| Pages | cms-site | Site público (Astro) |
| Pages | cms-site-admin | Admin Panel (React) |

---

## 📝 CHANGELOG

### v2.0.0 (03/01/2026)
- Adicionado Astro como framework do frontend
- Adicionado sistema de ponto focal para imagens
- Adicionado presets de imagem (whitelist)
- Adicionado campos layout/variant em page_sections
- Documentado todos os blocos com contratos JSON
- Documentado FAQ com Schema.org
- Atualizado roadmap

### v1.0.0 (03/01/2026)
- Documentação inicial
- Arquitetura definida
- Banco de dados estruturado

---

**Desenvolvido por:** CodieHost  
**Cliente Piloto:** Planac Distribuidora  

*Documento atualizado em: 03/01/2026*
