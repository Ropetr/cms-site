# ✅ CMS SITE - CHECKLIST DE DESENVOLVIMENTO v3

**Última atualização:** 03/01/2026 - 14:05

---

## 📊 STATUS GERAL

| Fase | Progresso | Status |
|------|-----------|--------|
| Fase 1: MVP | 45% | 🔄 Em andamento |
| Fase 2: Multi-Tenant | 0% | ⏳ Aguardando |
| Fase 3: IA Generativa | 0% | ⏳ Aguardando |
| Fase 4: Monetização | 0% | ⏳ Aguardando |

---

## 🎯 FASE 1: MVP - CMS DE PÁGINAS

### 1.1 Infraestrutura Cloudflare
- [x] Conta Cloudflare configurada
- [x] Cloudflare Images contratado ($5/mês)
- [x] Workers Paid contratado ($5/mês)
- [x] Zaraz contratado
- [x] D1 Database criado (cms-site-db)
- [x] R2 Bucket criado (cms-site-media)
- [x] KV Namespace criado (cms-site-cache)
- [x] KV Namespace criado (cms-site-sessions)

### 1.2 Banco de Dados
- [x] Schema completo definido
- [x] Tabela `users` criada
- [x] Tabela `settings` criada
- [x] Tabela `themes` criada
- [x] Tabela `menus` criada
- [x] Tabela `pages` criada
- [x] Tabela `page_sections` criada (com layout, variant, settings)
- [x] Tabela `media` criada (com focal_x, focal_y)
- [x] Tabela `contacts` criada
- [x] Tabela `audit_logs` criada
- [x] Dados iniciais inseridos (tema, settings, admin, menus, home)
- [x] Índices de performance criados

### 1.3 Documentação
- [x] Arquitetura do sistema
- [x] Stack tecnológica definida
- [x] Diagrama do banco de dados
- [x] Sistema de blocos (Page Builder) - 16 blocos
- [x] Contratos JSON de todos os blocos
- [x] Sistema de temas (tokens CSS)
- [x] Pipeline de imagens (presets + ponto focal)
- [x] SEO e Performance guidelines
- [x] Roadmap definido

### 1.4 Repositório GitHub
- [x] Repositório criado (Ropetr/cms-site)
- [x] Código da API commitado
- [x] Documentação commitada
- [x] CI/CD configurado (Cloudflare Pages connected)

### 1.5 API Backend (Worker) ✅ DEPLOYED
- [x] Setup do projeto (Hono + TypeScript)
- [x] Configurar wrangler.toml
- [x] CORS configurado
- [x] Autenticação JWT implementada
- [x] Rotas de autenticação (/api/auth/*)
- [x] Rotas de páginas (/api/pages/*)
- [x] Rotas de menus (/api/menus/*)
- [x] Rotas de mídia (/api/media/*)
- [x] Rotas de configurações (/api/settings/*)
- [x] Rotas de temas (/api/themes/*)
- [x] Rotas de contatos (/api/contacts/*)
- [x] Rotas públicas (/api/public/*)
- [x] **Deploy do Worker** ✅
- [x] **JWT_SECRET configurado** ✅
- [x] **Bindings (D1, R2, KV) conectados** ✅
- [ ] Endpoint de imagens com presets
- [ ] Endpoint de imagens com ponto focal
- [ ] Testes completos de todos endpoints

**URL da API:** `https://cms-site-api.planacacabamentos.workers.dev`

### 1.6 Frontend Público (Astro SSG) 🆕
- [ ] Setup do projeto Astro
- [ ] Configuração astro.config.mjs
- [ ] Layout base (Base.astro)
- [ ] Componentes comuns:
  - [ ] Header.astro
  - [ ] Footer.astro
  - [ ] Navigation.astro
  - [ ] WhatsAppFloat.astro
- [ ] Componentes de blocos (16 total):
  - [ ] HeroBanner.astro
  - [ ] TextBlock.astro
  - [ ] MediaText.astro
  - [ ] Features.astro
  - [ ] Gallery.astro
  - [ ] Carousel.astro
  - [ ] ProductGrid.astro
  - [ ] CTA.astro
  - [ ] FAQ.astro (com Schema.org)
  - [ ] ContactForm.astro
  - [ ] Testimonials.astro
  - [ ] Stats.astro
  - [ ] Team.astro
  - [ ] BlogList.astro
  - [ ] Map.astro
  - [ ] CustomHTML.astro
- [ ] Sistema de temas (CSS tokens)
- [ ] Páginas dinâmicas ([...slug].astro)
- [ ] Imagens responsivas (picture + srcset)
- [ ] Ponto focal nas imagens
- [ ] Lazy loading
- [ ] Deploy no Cloudflare Pages

### 1.7 Admin Panel (React)
- [ ] Setup do projeto (Vite + React + Tailwind)
- [ ] Estrutura de pastas
- [ ] Componentes de UI base:
  - [ ] Button
  - [ ] Input
  - [ ] Select
  - [ ] Modal
  - [ ] Card
  - [ ] Table
  - [ ] Dropdown
  - [ ] Toast/Notifications
  - [ ] Tabs
  - [ ] Badge
- [ ] Layout principal:
  - [ ] Sidebar
  - [ ] Header
  - [ ] Breadcrumbs
- [ ] Contexto de autenticação
- [ ] Serviços de API
- [ ] Páginas:
  - [ ] Login
  - [ ] Dashboard
  - [ ] Listagem de páginas
  - [ ] Editor de página (Page Builder)
  - [ ] Gerenciador de menus (drag-and-drop)
  - [ ] Biblioteca de mídia (com ponto focal)
  - [ ] Configurações do site
  - [ ] Editor de temas
  - [ ] Listagem de contatos
  - [ ] Gerenciamento de usuários
- [ ] Editor de página:
  - [ ] Lista de blocos (drag-and-drop)
  - [ ] Adicionar bloco (modal com 16 tipos)
  - [ ] Editar bloco (formulário dinâmico)
  - [ ] Configurar layout/variant do bloco
  - [ ] Editor de texto rico (TipTap)
  - [ ] Seletor de mídia
  - [ ] Configurações SEO
  - [ ] Preview
- [ ] Upload de mídia:
  - [ ] Drag-and-drop
  - [ ] Seletor de ponto focal
  - [ ] Preview desktop/mobile
  - [ ] Edição de metadados (alt, caption)
- [ ] Deploy no Cloudflare Pages

### 1.8 Pipeline de Imagens
- [ ] Criar presets de tamanho (whitelist)
- [ ] Implementar ponto focal no Worker
- [ ] Integrar com Cloudflare Images
- [ ] Conversão automática WebP/AVIF
- [ ] Cache headers otimizados
- [ ] Testar todos os presets

### 1.9 Performance e SEO
- [ ] CSS crítico inline
- [ ] CSS async loading
- [ ] JS defer (não bloqueante)
- [ ] Imagens otimizadas (WebP/AVIF)
- [ ] Width/height em todas as imagens
- [ ] Lazy loading abaixo do fold
- [ ] Preconnect para fontes
- [ ] Font-display: swap
- [ ] Headers de cache (_headers)
- [ ] robots.txt
- [ ] Sitemap.xml dinâmico
- [ ] Meta tags completas
- [ ] Open Graph tags
- [ ] Schema.org (Organization, FAQPage)
- [ ] Teste PageSpeed Desktop > 90
- [ ] Teste PageSpeed Mobile > 90
- [ ] Core Web Vitals aprovados

### 1.10 Integração e Deploy Final
- [x] Conectar repositório GitHub
- [x] CI/CD Worker configurado (auto-deploy)
- [ ] CI/CD Pages Admin configurado
- [ ] CI/CD Pages Site configurado
- [ ] Domínio planacdistribuidora.com.br
- [ ] SSL/HTTPS ativo
- [ ] Zaraz configurado (GA4, Pixel)
- [ ] Testes finais
- [ ] Go-live

---

## 🔄 FASE 2: MULTI-TENANT (SaaS)

### 2.1 Banco de Dados
- [ ] Tabela `tenants`
- [ ] Tabela `tenant_domains`
- [ ] Migração de dados existentes

### 2.2 API
- [ ] Middleware de resolução de tenant
- [ ] Cache com prefixo de tenant
- [ ] Isolamento de dados

### 2.3 Admin
- [ ] Super Admin Panel
- [ ] CRUD de tenants
- [ ] CRUD de domínios
- [ ] Métricas por tenant

### 2.4 Planos e Limites
- [ ] Definir planos (Basic, Pro, Enterprise)
- [ ] Limites por plano (páginas, storage, etc)
- [ ] Verificação de limites na API

### 2.5 Billing
- [ ] Integração com gateway de pagamento
- [ ] Gestão de assinaturas
- [ ] Faturas e histórico

---

## 🤖 FASE 3: IA GENERATIVA

### 3.1 Infraestrutura
- [ ] Workers AI configurado
- [ ] Vectorize (banco vetorial) por tenant
- [ ] R2 para documentos de contexto

### 3.2 Onboarding de Cliente
- [ ] Upload de documentos (catálogo, materiais)
- [ ] Processamento e extração de texto
- [ ] Criação de embeddings
- [ ] Indexação no Vectorize

### 3.3 Geração de Conteúdo
- [ ] RAG (Retrieval Augmented Generation)
- [ ] Gerador de textos de página
- [ ] Gerador de descrições de produto
- [ ] Gerador de posts de blog
- [ ] Sugestões de melhorias

### 3.4 SEO Automático
- [ ] Gerador de meta titles
- [ ] Gerador de meta descriptions
- [ ] Sugestões de palavras-chave
- [ ] Análise de concorrência

---

## 💰 FASE 4: MONETIZAÇÃO

### 4.1 Marketplace
- [ ] Marketplace de temas
- [ ] Sistema de templates
- [ ] Temas premium

### 4.2 White-label
- [ ] Remoção de branding
- [ ] Domínios customizados ilimitados
- [ ] API para integrações

### 4.3 Integrações
- [ ] WhatsApp Business API
- [ ] Google Meu Negócio
- [ ] RD Station / HubSpot
- [ ] Zapier

---

## 📋 PRÓXIMAS AÇÕES IMEDIATAS

### ✅ Concluído Agora
1. ~~Deploy da API no Cloudflare Workers~~
2. ~~Configurar JWT_SECRET~~
3. ~~Testar endpoint público~~

### 🔜 Próximo (Escolher)
1. **Opção A: Admin Panel** - Criar interface de gestão (React)
2. **Opção B: Site Público** - Criar frontend (Astro)
3. **Opção C: Testar API** - Validar todos os endpoints

### Recomendação
Sugiro começar pelo **Admin Panel** pois:
- Permite cadastrar conteúdo real
- Testa a API completa
- Site público depende de ter conteúdo

---

## 🗂️ ESTRUTURA DO PROJETO

```
cms-site/
├── api/                          # ✅ Worker API (DEPLOYED)
│   ├── src/
│   │   ├── index.ts
│   │   └── routes/
│   │       ├── auth.ts
│   │       ├── pages.ts
│   │       ├── menus.ts
│   │       ├── media.ts
│   │       ├── settings.ts
│   │       ├── themes.ts
│   │       ├── contacts.ts
│   │       └── public.ts
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
│
├── site/                         # ⏳ Astro (a criar)
│   ├── src/
│   │   ├── layouts/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── blocks/           # 16 blocos
│   │   ├── pages/
│   │   ├── styles/
│   │   └── lib/
│   ├── public/
│   ├── astro.config.mjs
│   └── package.json
│
├── admin/                        # ⏳ React (a criar)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                         # ✅ Documentação
│   ├── CMS-SITE-DOCUMENTACAO-OFICIAL-V2.md
│   ├── BLOCOS-CONTRATOS-JSON.md
│   └── CHECKLIST.md
│
├── README.md
└── .gitignore
```

---

## 🌐 URLs DO PROJETO

| Recurso | URL | Status |
|---------|-----|--------|
| **API** | https://cms-site-api.planacacabamentos.workers.dev | ✅ Online |
| **Admin** | https://cms-site-admin.pages.dev | ⏳ A criar |
| **Site** | https://cms-site.pages.dev | ⏳ A criar |
| **Produção** | https://planacdistribuidora.com.br | ⏳ A configurar |
| **GitHub** | https://github.com/Ropetr/cms-site | ✅ Online |

---

## 🐛 BUGS CONHECIDOS

| Bug | Severidade | Status |
|-----|------------|--------|
| - | - | - |

---

## 📝 HISTÓRICO DE DESENVOLVIMENTO

### 03/01/2026 - Sessão 2
- ✅ Repositório GitHub criado e configurado
- ✅ Deploy da API no Cloudflare Workers (auto-deploy)
- ✅ API testada e funcionando
- ✅ Checklist atualizado para v3

### 03/01/2026 - Sessão 1
- ✅ Análise comparativa com documentação ChatGPT
- ✅ Decisão: Adotar Astro para frontend público
- ✅ Adicionado sistema de ponto focal para imagens
- ✅ Adicionado presets de imagem (whitelist)
- ✅ Documentação v2 consolidada
- ✅ Contratos JSON de todos os 16 blocos definidos
- ✅ Campos adicionados no banco: focal_x, focal_y, layout, variant, settings

### 03/01/2026 - Sessão Inicial
- ✅ Documentação inicial criada
- ✅ Arquitetura definida
- ✅ API backend implementada (código)
- ✅ Recursos Cloudflare criados (D1, R2, KV)
- ✅ Banco de dados populado com dados iniciais

---

## 📚 ARQUIVOS DE DOCUMENTAÇÃO

| Arquivo | Descrição |
|---------|-----------|
| `CMS-SITE-DOCUMENTACAO-OFICIAL-V2.md` | Documentação completa do sistema |
| `BLOCOS-CONTRATOS-JSON.md` | Contratos JSON de todos os 16 blocos |
| `CHECKLIST.md` | Este arquivo - acompanhamento |

---

*Atualizar este documento conforme progresso do desenvolvimento*
