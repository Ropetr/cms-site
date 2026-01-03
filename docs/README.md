# 📚 CMS Site - Documentação

## Visão Geral

O **CMS Site** é um sistema de gerenciamento de conteúdo moderno construído inteiramente na infraestrutura Cloudflare, oferecendo alta performance, escalabilidade e custo reduzido.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE EDGE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Frontend   │  │    Admin     │  │        API           │   │
│  │   (Pages)    │  │   (Pages)    │  │     (Worker)         │   │
│  │              │  │              │  │                      │   │
│  │ Site público │  │ Painel admin │  │ Endpoints REST       │   │
│  │ HTML estático│  │ React SPA    │  │ Autenticação JWT     │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                │                 │
│                    ┌───────────────────────────┼───────────┐     │
│                    │                           │           │     │
│                    ▼                           ▼           ▼     │
│              ┌──────────┐              ┌──────────┐ ┌──────────┐ │
│              │    D1    │              │    R2    │ │    KV    │ │
│              │ (SQLite) │              │ (Storage)│ │ (Cache)  │ │
│              │          │              │          │ │          │ │
│              │ Páginas  │              │ Imagens  │ │ Sessões  │ │
│              │ Menus    │              │ Uploads  │ │ Cache    │ │
│              │ Settings │              │          │ │          │ │
│              └──────────┘              └──────────┘ └──────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Recursos Cloudflare

| Recurso | Nome | ID | Função |
|---------|------|-----|--------|
| D1 Database | cms-site-db | `8961e5db-b486-4bc5-bf35-be81240be063` | Banco de dados SQL |
| R2 Bucket | cms-site-media | - | Armazenamento de mídia |
| KV Namespace | cms-site-cache | `bcdc2b754e8049d38da38f0e004c7104` | Cache de dados |
| KV Namespace | cms-site-sessions | `1e35f7e79bc645d09441f6200efb0183` | Sessões de usuário |

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas

#### `users` - Usuários do sistema
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | TEXT | ID único |
| email | TEXT | Email (único) |
| password_hash | TEXT | Hash da senha |
| name | TEXT | Nome do usuário |
| role | TEXT | admin, editor, viewer |
| avatar_url | TEXT | URL do avatar |
| active | INTEGER | 1=ativo, 0=inativo |

#### `settings` - Configurações do site
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | TEXT | ID único |
| key | TEXT | Chave da config (ex: site_name) |
| value | TEXT | Valor |
| type | TEXT | string, number, boolean, json, image |
| group_name | TEXT | Grupo: general, contact, social, analytics |

#### `themes` - Temas visuais
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | TEXT | ID único |
| name | TEXT | Nome do tema |
| slug | TEXT | Slug único |
| colors | TEXT | JSON com cores |
| fonts | TEXT | JSON com fontes |
| is_active | INTEGER | 1=ativo |

#### `menus` - Estrutura de navegação
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | TEXT | ID único |
| name | TEXT | Nome do menu |
| slug | TEXT | Slug único |
| parent_id | TEXT | ID do menu pai (para submenus) |
| position | INTEGER | Ordem de exibição |
| is_visible | INTEGER | 1=visível |

#### `pages` - Páginas do site
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | TEXT | ID único |
| title | TEXT | Título da página |
| slug | TEXT | Slug único (URL) |
| page_type | TEXT | home, content, product, contact |
| banner_image | TEXT | URL da imagem do banner |
| banner_title | TEXT | Título do banner |
| banner_subtitle | TEXT | Subtítulo do banner |
| content | TEXT | Conteúdo HTML |
| menu_id | TEXT | Menu onde está vinculada |
| status | TEXT | draft, published, archived |

#### `page_sections` - Seções/blocos das páginas
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | TEXT | ID único |
| page_id | TEXT | ID da página |
| section_type | TEXT | text, features, gallery, cta, faq |
| content | TEXT | JSON com dados da seção |
| position | INTEGER | Ordem |

#### `media` - Arquivos de mídia
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | TEXT | ID único |
| original_name | TEXT | Nome original do arquivo |
| file_name | TEXT | Nome no R2 |
| file_type | TEXT | image, document, video |
| url | TEXT | URL de acesso |
| folder | TEXT | Pasta organizacional |

#### `contacts` - Leads/contatos do formulário
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | TEXT | ID único |
| name | TEXT | Nome |
| email | TEXT | Email |
| phone | TEXT | Telefone |
| message | TEXT | Mensagem |
| status | TEXT | new, contacted, converted, closed |

---

## 🔌 API Endpoints

### Públicos (sem autenticação)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/public/settings` | Configurações do site |
| GET | `/api/public/theme` | Tema ativo |
| GET | `/api/public/navigation` | Menu de navegação |
| GET | `/api/public/pages` | Lista de páginas |
| GET | `/api/public/pages/:slug` | Página por slug |
| GET | `/api/public/home` | Página inicial |
| POST | `/api/public/contact` | Enviar formulário de contato |
| GET | `/api/public/sitemap.xml` | Sitemap XML |
| GET | `/api/public/search?q=` | Buscar no site |

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Dados do usuário logado |
| POST | `/api/auth/change-password` | Alterar senha |
| POST | `/api/auth/users` | Criar usuário (admin) |

### Páginas (autenticado)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/pages` | Listar páginas |
| GET | `/api/pages/:id` | Buscar página |
| POST | `/api/pages` | Criar página |
| PUT | `/api/pages/:id` | Atualizar página |
| DELETE | `/api/pages/:id` | Deletar página |
| POST | `/api/pages/reorder` | Reordenar páginas |

### Menus (autenticado)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/menus` | Listar menus (hierárquico) |
| GET | `/api/menus/:id` | Buscar menu |
| POST | `/api/menus` | Criar menu |
| PUT | `/api/menus/:id` | Atualizar menu |
| DELETE | `/api/menus/:id` | Deletar menu |
| POST | `/api/menus/reorder` | Reordenar menus |

### Mídia (autenticado)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/media` | Listar mídia |
| POST | `/api/media/upload` | Upload de arquivo |
| PUT | `/api/media/:id` | Atualizar metadados |
| DELETE | `/api/media/:id` | Deletar arquivo |

### Configurações (autenticado - admin)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/settings` | Listar configurações |
| PUT | `/api/settings/:key` | Atualizar configuração |
| PUT | `/api/settings` | Atualizar múltiplas |

### Temas (autenticado - admin)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/themes` | Listar temas |
| POST | `/api/themes` | Criar tema |
| PUT | `/api/themes/:id` | Atualizar tema |
| POST | `/api/themes/:id/activate` | Ativar tema |
| DELETE | `/api/themes/:id` | Deletar tema |

---

## 🖼️ Otimização de Imagens

As imagens são automaticamente otimizadas usando Cloudflare Image Resizing:

```html
<!-- Original -->
<img src="/images/banner.jpg">

<!-- Otimizada para desktop -->
<img src="/images/banner.jpg?w=1920&f=auto">

<!-- Otimizada para mobile -->
<img src="/images/banner.jpg?w=640&q=80&f=auto">
```

**Parâmetros disponíveis:**
- `w` ou `width`: Largura máxima
- `q` ou `quality`: Qualidade (1-100)
- `f` ou `format`: Formato (auto, webp, avif)

---

## 🚀 Deploy

### API (Worker)
```bash
cd api
npm install
wrangler secret put JWT_SECRET  # Definir secret
npm run deploy
```

### Admin (Pages)
```bash
cd admin
npm install
npm run build
# Deploy automático via GitHub
```

### Frontend (Pages)
```bash
cd frontend
npm install
npm run build
# Deploy automático via GitHub
```

---

## 🔐 Segurança

1. **Autenticação**: JWT com expiração de 24h
2. **Senhas**: Hash SHA-256 com salt
3. **CORS**: Configurado para origens específicas
4. **Headers**: Secure headers via Hono

---

## 📝 Changelog

### v1.0.0 (2026-01-03)
- Estrutura inicial do CMS
- API completa com CRUD
- Sistema de autenticação
- Gerenciamento de mídia
- Temas personalizáveis
- Cache com KV

---

## 👥 Cliente

**Planac Distribuidora**
- Domínio: `planacdistribuidora.com.br`
- Cidade: Londrina, PR
- Segmento: Materiais de construção

---

## 📞 Suporte

Desenvolvido por: **CodieHost**
