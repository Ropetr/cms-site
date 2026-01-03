# 🚀 CMS Site

Sistema de Gerenciamento de Conteúdo construído na infraestrutura Cloudflare.

## 🌐 Links do Projeto

| Recurso | URL | Status |
|---------|-----|--------|
| **API** | https://cms-site-api.planacacabamentos.workers.dev | ✅ Online |
| **Admin** | https://cms-site-admin.pages.dev | ✅ Online |
| **Site** | https://cms-site.pages.dev | ✅ Online |

**Credenciais Admin:** `admin@cmssite.com` / `Planac@Admin2026`

---

## 📁 Estrutura do Projeto

```
cms-site/
├── api/                    # API Backend (Cloudflare Worker)
│   ├── src/
│   │   ├── index.ts        # Entry point + Hono app
│   │   └── routes/         # Rotas da API
│   │       ├── auth.ts     # Autenticação JWT
│   │       ├── pages.ts    # CRUD páginas + seções
│   │       ├── menus.ts    # CRUD menus
│   │       ├── media.ts    # Upload + mídia
│   │       ├── settings.ts # Configurações
│   │       ├── themes.ts   # Temas
│   │       ├── contacts.ts # Leads/contatos
│   │       └── public.ts   # Endpoints públicos
│   ├── wrangler.toml
│   └── package.json
│
├── admin/                  # Painel Administrativo (React + Vite)
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   │   ├── ui/         # Button, Input, Modal, etc
│   │   │   └── layout/     # AdminLayout, Sidebar
│   │   ├── pages/          # 11 páginas do admin
│   │   ├── services/       # Chamadas à API
│   │   ├── contexts/       # AuthContext
│   │   └── styles/         # Tailwind CSS
│   └── package.json
│
├── site/                   # Site Público (Astro SSG)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/     # Header, Footer
│   │   │   └── blocks/     # 13 blocos de página
│   │   ├── layouts/        # Base.astro
│   │   ├── pages/          # [...slug].astro
│   │   └── lib/            # API client
│   └── package.json
│
├── docs/                   # Documentação
│   ├── CHECKLIST.md        # Status do desenvolvimento
│   ├── ROADMAP.md          # Plano de implementação
│   └── BLOCOS-CONTRATOS-JSON.md
│
└── .github/
    └── workflows/          # CI/CD
        ├── ci.yml
        ├── deploy.yml
        └── security.yml
```

---

## ⚡ Tecnologias

| Componente | Tecnologia |
|------------|------------|
| API Backend | Cloudflare Workers + Hono |
| Banco de Dados | Cloudflare D1 (SQLite) |
| Armazenamento | Cloudflare R2 |
| Cache | Cloudflare KV |
| Admin Panel | React + Vite + Tailwind + TanStack Query |
| Site Público | Astro (SSG) |
| CI/CD | GitHub Actions |

---

## 📊 Status do Projeto

### ✅ Implementado
- [x] API Backend completa (Worker)
- [x] Autenticação JWT
- [x] Admin Panel (11 páginas)
- [x] Editor de Páginas (13 blocos)
- [x] Sistema de Temas
- [x] Upload de Mídia (R2)
- [x] Ponto Focal para Imagens
- [x] Preview de Páginas
- [x] Site Público (Astro)
- [x] CI/CD Automático

### 🔄 Em Desenvolvimento
- [ ] MediaPicker (seletor de imagens)
- [ ] Otimização de imagens (WebP/AVIF)
- [ ] Blocos: carousel, product_grid, blog_list
- [ ] Sistema de Blog completo
- [ ] Editor de texto rico (TipTap)
- [ ] IA para geração de conteúdo

### 📋 Documentação Detalhada
- [CHECKLIST.md](./docs/CHECKLIST.md) - Status detalhado
- [ROADMAP.md](./docs/ROADMAP.md) - Plano de implementação
- [BLOCOS-CONTRATOS-JSON.md](./docs/BLOCOS-CONTRATOS-JSON.md) - Contratos dos blocos

---

## 🔧 Configuração Local

### Pré-requisitos
- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Conta Cloudflare

### API
```bash
cd api
npm install
wrangler secret put JWT_SECRET
npm run dev
```

### Admin
```bash
cd admin
npm install
npm run dev
```

### Site
```bash
cd site
npm install
npm run dev
```

---

## 🚀 Deploy

O deploy é automático via GitHub Actions:
- Push na `main` → Deploy automático
- API → Cloudflare Workers
- Admin → Cloudflare Pages
- Site → Cloudflare Pages

---

## 📄 Licença

Proprietário - CodieHost
