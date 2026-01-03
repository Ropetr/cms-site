# ✅ CMS SITE - CHECKLIST DE DESENVOLVIMENTO v5

**Última atualização:** 03/01/2026 - 19:20

---

## 📊 STATUS GERAL

| Fase | Progresso | Status |
|------|-----------|--------|
| Fase 1: MVP | 70% | 🔄 Em andamento |
| Fase 2: Blog | 0% | ⏳ Aguardando |
| Fase 3: IA Generativa | 0% | ⏳ Aguardando |
| Fase 4: Multi-Tenant | 0% | ⏳ Aguardando |

---

## 🌐 URLs DO PROJETO

| Recurso | URL | Status |
|---------|-----|--------|
| **API** | https://cms-site-api.planacacabamentos.workers.dev | ✅ Online |
| **Admin** | https://cms-site-admin.pages.dev | ✅ Online |
| **Site** | https://cms-site.pages.dev | ✅ Online |
| **GitHub** | https://github.com/Ropetr/cms-site | ✅ Online |

**Credenciais Admin:** `admin@cmssite.com` / `Planac@Admin2026`

---

## 🎯 FASE 1: MVP - CMS DE PÁGINAS

### 1.1 Infraestrutura Cloudflare ✅ COMPLETO
- [x] Conta Cloudflare configurada
- [x] D1 Database criado (cms-site-db)
- [x] R2 Bucket criado (cms-site-media)
- [x] KV Namespace criado (cms-site-cache)
- [x] KV Namespace criado (cms-site-sessions)
- [x] Workers Paid ativo
- [ ] Cloudflare Images (não integrado ainda)

### 1.2 Banco de Dados ✅ COMPLETO
- [x] Schema completo definido
- [x] Tabela `users`
- [x] Tabela `settings`
- [x] Tabela `themes`
- [x] Tabela `menus`
- [x] Tabela `pages`
- [x] Tabela `page_sections`
- [x] Tabela `media` (com focal_x, focal_y)
- [x] Tabela `contacts`
- [x] Tabela `audit_logs`
- [x] Dados iniciais inseridos
- [x] Índices de performance
- [ ] Tabela `posts` (blog) - **FALTA**

### 1.3 API Backend (Worker) ✅ FUNCIONAL
- [x] Setup Hono + TypeScript
- [x] CORS configurado
- [x] Autenticação JWT
- [x] Deploy automático

#### Rotas Testadas e Funcionando:
| Rota | Método | Status | Observação |
|------|--------|--------|------------|
| `/api/auth/login` | POST | ✅ | Retorna token JWT |
| `/api/auth/me` | GET | ✅ | Requer auth |
| `/api/public/pages` | GET | ✅ | Lista páginas publicadas |
| `/api/public/pages/:slug` | GET | ✅ | Página com seções |
| `/api/public/settings` | GET | ✅ | Configurações do site |
| `/api/public/theme` | GET | ✅ | Tema ativo |
| `/api/public/menus` | GET | ⚠️ | Erro intermitente |
| `/api/pages` | CRUD | ✅ | Requer auth |
| `/api/pages/:id/sections` | CRUD | ✅ | Requer auth |
| `/api/menus` | CRUD | ✅ | Requer auth |
| `/api/media` | CRUD | ✅ | Requer auth |
| `/api/media/upload` | POST | ✅ | Upload para R2 |
| `/api/contacts` | CRUD | ✅ | Requer auth |
| `/api/themes` | CRUD | ✅ | Requer auth |
| `/api/settings` | CRUD | ✅ | Requer auth |
| `/api/users` | CRUD | ✅ | Requer auth |

#### Rotas que FALTAM:
| Rota | Descrição |
|------|-----------|
| `/api/images/:preset/:filename` | Proxy de imagens com presets |
| `/api/posts/*` | CRUD de posts do blog |
| `/api/ai/generate-content` | Geração de conteúdo com IA |
| `/api/ai/generate-seo` | Geração de SEO com IA |

### 1.4 Admin Panel (React) ✅ FUNCIONAL

#### Páginas Implementadas:
| Página | URL | Status | Observações |
|--------|-----|--------|-------------|
| Login | `/login` | ✅ Funcional | JWT auth |
| Dashboard | `/` | ✅ Funcional | Stats básicos |
| Páginas | `/pages` | ✅ Funcional | Lista com busca |
| Editor de Página | `/pages/:id` | ⚠️ Parcial | Ver problemas abaixo |
| Preview | `/preview/:slug` | ✅ Funcional | Toggle viewport |
| Menus | `/menus` | ✅ Funcional | Drag reorder |
| Mídia | `/media` | ⚠️ Parcial | Ver problemas abaixo |
| Contatos | `/contacts` | ✅ Funcional | Leads com status |
| Temas | `/themes` | ✅ Funcional | Editor de cores/fontes |
| Configurações | `/settings` | ✅ Funcional | Site settings |
| Usuários | `/users` | ✅ Funcional | CRUD usuários |

#### 🔴 PROBLEMAS NO EDITOR DE PÁGINA:
| Problema | Severidade | Descrição |
|----------|------------|-----------|
| Campos de imagem são INPUT TEXT | 🔴 Alta | Deveria ser MediaPicker com upload |
| Sem editor de texto rico | 🟡 Média | Campos textarea simples, deveria ser TipTap |
| Drag-and-drop básico | 🟡 Média | Só botões up/down, sem drag real |
| Faltam 3 tipos de bloco | 🔴 Alta | carousel, product_grid, blog_list |

#### 🔴 PROBLEMAS NA MÍDIA:
| Problema | Severidade | Descrição |
|----------|------------|-----------|
| Upload funciona | ✅ OK | Envia para R2 |
| Ponto focal funciona | ✅ OK | Editor visual |
| Imagens não são otimizadas | 🔴 Alta | Falta endpoint `/api/images` |
| Sem conversão WebP/AVIF | 🔴 Alta | Falta Cloudflare Images |

### 1.5 Site Público (Astro) ✅ ONLINE

#### Status:
- [x] Build funcionando
- [x] Deploy no Cloudflare Pages
- [x] Renderiza páginas dinâmicas
- [x] Aplica tema (cores/fontes)

#### Componentes de Blocos:
| Bloco | Arquivo | Status |
|-------|---------|--------|
| hero_banner | HeroBanner.astro | ✅ |
| text | TextBlock.astro | ✅ |
| media_text | MediaText.astro | ✅ |
| features | Features.astro | ✅ |
| gallery | Gallery.astro | ✅ |
| cta | CTA.astro | ✅ |
| faq | FAQ.astro | ✅ |
| testimonials | Testimonials.astro | ✅ |
| contact_form | ContactForm.astro | ✅ |
| stats | Stats.astro | ✅ |
| team | Team.astro | ✅ |
| map | MapBlock.astro | ✅ |
| custom_html | CustomHTML.astro | ✅ |
| carousel | - | ❌ FALTA |
| product_grid | - | ❌ FALTA |
| blog_list | - | ❌ FALTA |

#### 🔴 PROBLEMAS NO SITE:
| Problema | Severidade | Descrição |
|----------|------------|-----------|
| Imagens não otimizadas | 🔴 Alta | Carrega original, sem WebP |
| Falta WhatsApp Float | 🟡 Média | Botão flutuante |
| Falta Schema.org | 🟡 Média | SEO estruturado |
| Falta sitemap.xml | 🟡 Média | Para Google |
| Falta robots.txt | 🟢 Baixa | Arquivo básico |

---

## 🔴 FASE 2: BLOG (NÃO INICIADO)

### 2.1 Backend
- [ ] Tabela `posts` no D1
- [ ] Tabela `categories` no D1
- [ ] Rotas `/api/posts/*`
- [ ] Rotas `/api/categories/*`
- [ ] Rotas públicas `/api/public/posts/*`

### 2.2 Admin
- [ ] Página "Posts" (listagem)
- [ ] Editor de Post (com TipTap)
- [ ] Gerenciador de Categorias
- [ ] Upload de imagem destacada

### 2.3 Site
- [ ] Página `/blog` (listagem)
- [ ] Página `/blog/:slug` (post individual)
- [ ] Bloco `blog_list` para páginas
- [ ] Schema.org BlogPosting

---

## 🔴 FASE 3: IA GENERATIVA (NÃO INICIADO)

### 3.1 Infraestrutura
- [ ] Workers AI configurado
- [ ] Modelo de texto (llama/claude)

### 3.2 Funcionalidades
- [ ] Botão "✨ Gerar com IA" no Editor de Blocos
- [ ] Botão "✨ Gerar com IA" no Editor de Posts
- [ ] Botão "✨ Gerar SEO" (meta title/description)
- [ ] Botão "✨ Descrever Imagem" (alt text)
- [ ] Sugestões de melhorias de conteúdo

### 3.3 Rotas API
- [ ] `POST /api/ai/generate-content`
- [ ] `POST /api/ai/generate-seo`
- [ ] `POST /api/ai/describe-image`

---

## ⏳ FASE 4: MULTI-TENANT (FUTURO)

- [ ] Tabela `tenants`
- [ ] Middleware de resolução
- [ ] Isolamento de dados
- [ ] Planos e limites
- [ ] Billing

---

## 📋 LISTA DE TAREFAS PRIORITÁRIAS

### 🔴 Prioridade CRÍTICA
1. **MediaPicker** - Substituir inputs de texto por seletor de mídia
2. **Endpoint /api/images** - Proxy com presets e otimização
3. **Integração Cloudflare Images** - WebP/AVIF automático
4. **Blocos faltantes** - carousel, product_grid, blog_list

### 🟡 Prioridade ALTA
5. **Sistema de Blog completo** - Posts, categorias, páginas
6. **TipTap Editor** - Editor de texto rico
7. **IA Generativa** - Workers AI para conteúdo

### 🟢 Prioridade MÉDIA
8. **WhatsApp Float** - Botão flutuante no site
9. **Schema.org** - SEO estruturado
10. **Sitemap.xml** - Geração dinâmica
11. **Drag-and-drop real** - Biblioteca dnd-kit

---

## 📝 HISTÓRICO DE DESENVOLVIMENTO

### 03/01/2026 - Sessão 4 (atual)
- ✅ Preview Page criado com toggle de viewport
- ✅ Análise completa do que falta
- ✅ Documentação v5 atualizada
- 🔄 Identificados problemas: MediaPicker, endpoint imagens, blocos faltantes

### 03/01/2026 - Sessão 3
- ✅ Admin Panel 100% páginas criadas
- ✅ Site Público Astro deployado
- ✅ CI/CD funcionando
- ✅ PRs #1, #2, #3 merged

### 03/01/2026 - Sessão 2
- ✅ Deploy da API
- ✅ Início do Admin Panel
- ✅ Editor de páginas básico

### 03/01/2026 - Sessão 1
- ✅ Documentação criada
- ✅ Arquitetura definida
- ✅ Recursos Cloudflare criados

---

## 📊 MÉTRICAS DO PROJETO

| Métrica | Valor |
|---------|-------|
| Commits | ~50 |
| PRs Merged | 3 |
| Páginas Admin | 11 |
| Blocos Implementados | 13/16 |
| Endpoints API | ~30 |
| Testes Automatizados | ⚠️ Básicos |

---

## 🔧 CONFIGURAÇÕES IMPORTANTES

### Cloudflare Account
- **Account ID:** f14d821b52a4f6ecbad7fb0e0afba8e5
- **D1 Database:** cms-site-db
- **R2 Bucket:** cms-site-media
- **KV Cache:** cms-site-cache
- **KV Sessions:** cms-site-sessions

### Worker
- **Nome:** cms-site-api
- **JWT_SECRET:** Configurado via wrangler secret

### GitHub
- **Repo:** Ropetr/cms-site
- **Branch principal:** main
- **CI/CD:** GitHub Actions → Cloudflare Pages

---

*Atualizar este documento conforme progresso do desenvolvimento*
