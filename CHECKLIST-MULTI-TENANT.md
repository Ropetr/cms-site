# CMS SaaS Multi-Tenant - Checklist de Implementacao

Este documento rastreia o progresso da transformacao do CMS em uma plataforma SaaS multi-tenant.

## Fase 1: Multi-Tenant no Banco + API (Fundacao)

### 1.1 Estrutura do Banco (D1)

- [ ] Criar tabela `organizations` (agencias)
- [ ] Criar tabela `sites` (sites de cada cliente/agencia)
- [ ] Criar tabela `site_users` (permissoes por site)
- [ ] Adicionar coluna `site_id` na tabela `pages`
- [ ] Adicionar coluna `site_id` na tabela `page_sections`
- [ ] Adicionar coluna `site_id` na tabela `menus`
- [ ] Adicionar coluna `site_id` na tabela `media`
- [ ] Adicionar coluna `site_id` na tabela `posts`
- [ ] Adicionar coluna `site_id` na tabela `categories`
- [ ] Adicionar coluna `site_id` na tabela `contacts`
- [ ] Adicionar coluna `site_id` na tabela `themes`
- [ ] Adicionar coluna `site_id` na tabela `settings`
- [ ] Criar indices para `site_id` em todas as tabelas
- [ ] Criar migration para aplicar mudancas

### 1.2 API Multi-Tenant

- [ ] Criar middleware de tenant (extrai site_id do contexto)
- [ ] Atualizar middleware de autenticacao para incluir `site_id`
- [ ] Atualizar todas as queries de `pages` para filtrar por `site_id`
- [ ] Atualizar todas as queries de `page_sections` para filtrar por `site_id`
- [ ] Atualizar todas as queries de `menus` para filtrar por `site_id`
- [ ] Atualizar todas as queries de `media` para filtrar por `site_id`
- [ ] Atualizar todas as queries de `posts` para filtrar por `site_id`
- [ ] Atualizar todas as queries de `categories` para filtrar por `site_id`
- [ ] Atualizar todas as queries de `contacts` para filtrar por `site_id`
- [ ] Atualizar todas as queries de `themes` para filtrar por `site_id`
- [ ] Atualizar todas as queries de `settings` para filtrar por `site_id`
- [ ] Criar endpoints CRUD para `organizations`
- [ ] Criar endpoints CRUD para `sites`
- [ ] Criar endpoint para listar sites do usuario logado

### 1.3 Cloudflare for SaaS (Custom Hostnames)

- [ ] Habilitar Cloudflare for SaaS na zona Pro
- [ ] Criar endpoint `POST /api/sites/:id/domain` para adicionar Custom Hostname
- [ ] Criar endpoint `GET /api/sites/:id/domain/status` para verificar status
- [ ] Criar endpoint `DELETE /api/sites/:id/domain` para remover dominio
- [ ] Implementar verificacao automatica de CNAME
- [ ] Configurar fallback origin para o Worker SSR

---

## Fase 2: SSR Multi-Tenant + Cache

### 2.1 Migracao para SSR

- [ ] Instalar `@astrojs/cloudflare` adapter
- [ ] Alterar `astro.config.mjs` de `output: 'static'` para `output: 'server'`
- [ ] Configurar bindings do Worker (D1, KV, R2)
- [ ] Atualizar `lib/api.ts` para usar bindings diretos em vez de fetch
- [ ] Testar todos os 16 tipos de blocos no modo SSR
- [ ] Configurar wrangler.toml para deploy do site como Worker

### 2.2 Resolucao de Tenant por Host

- [ ] Criar middleware que extrai `Host` header
- [ ] Implementar lookup de `site_id` por dominio
- [ ] Cachear mapeamento `domain -> site_id` no KV
- [ ] Retornar 404 para dominios nao cadastrados
- [ ] Implementar fallback para subdominio padrao

### 2.3 Cache na Edge

- [ ] Implementar cache de HTML por `(host + slug)`
- [ ] Configurar TTL apropriado (ex: 1 hora)
- [ ] Criar funcao de invalidacao de cache por pagina
- [ ] Criar funcao de invalidacao de cache por site inteiro
- [ ] Integrar invalidacao no endpoint de publicacao
- [ ] Cachear settings/theme/navigation por site no KV

### 2.4 SEO Dinamico por Site

- [ ] Gerar `<link rel="canonical">` com dominio correto
- [ ] Gerar `robots.txt` dinamico por site
- [ ] Gerar `sitemap.xml` dinamico por site
- [ ] Gerar Schema.org (JSON-LD) com dados do site
- [ ] Implementar meta robots (index/noindex) por pagina

---

## Fase 3: Admin Multi-Tenant

### 3.1 Seletor de Site

- [ ] Criar componente `SiteSelector` no header
- [ ] Implementar context/state para site ativo
- [ ] Persistir site selecionado no localStorage
- [ ] Filtrar todos os dados pelo site selecionado
- [ ] Mostrar nome/logo do site no header

### 3.2 Gerenciamento de Sites

- [ ] Criar pagina `SitesPage` para listar sites
- [ ] Criar pagina `SiteSettingsPage` para configurar site
- [ ] Implementar wizard de criacao de novo site
- [ ] Implementar fluxo de configuracao de dominio
- [ ] Mostrar status do dominio (pendente, ativo, erro)
- [ ] Implementar instrucoes de configuracao DNS

### 3.3 Gerenciamento de Organizacoes (Agencias)

- [ ] Criar pagina `OrganizationPage` para configurar agencia
- [ ] Implementar convite de usuarios para organizacao
- [ ] Implementar listagem de sites da organizacao
- [ ] Implementar limites por plano (sites, paginas, storage)

---

## Fase 4: SEO Compliance (Google)

### 4.1 Metatags (Base.astro)

- [x] Adicionar `<link rel="canonical">` dinamico
- [x] Adicionar `<meta name="robots">` configuravel
- [x] Adicionar Twitter Cards (twitter:card, twitter:title, etc.)
- [x] Garantir og:image com fallback padrao
- [x] Adicionar og:url e og:site_name

### 4.2 Dados Estruturados (Schema.org)

- [x] Implementar Organization/LocalBusiness por site
- [x] Implementar WebPage em todas as paginas
- [x] Implementar BreadcrumbList para navegacao
- [ ] Implementar Article para posts do blog
- [ ] Implementar FAQPage para blocos de FAQ

### 4.3 Core Web Vitals

- [ ] Adicionar width/height em todas as imagens
- [ ] Implementar lazy loading com `loading="lazy"`
- [ ] Implementar `fetchpriority="high"` para hero images
- [ ] Otimizar carregamento de fontes (preload/font-display)
- [ ] Minimizar JavaScript no site publico

### 4.4 Validacoes no Admin

- [ ] Campo obrigatorio para meta title (max 60 chars)
- [ ] Campo obrigatorio para meta description (max 160 chars)
- [ ] Contador de caracteres nos campos SEO
- [ ] Aviso se alt text de imagem estiver vazio
- [ ] Preview de snippet do Google (SERP preview)

---

## Fase 5: RBAC + Seguranca

### 5.1 Roles e Permissoes

- [ ] Criar tabela `roles` (super_admin, agency_admin, agency_editor, client_admin, client_editor)
- [ ] Criar tabela `permissions` (create_page, edit_page, delete_page, etc.)
- [ ] Criar tabela `role_permissions`
- [ ] Implementar middleware de verificacao de permissoes
- [ ] Atualizar UI para esconder acoes nao permitidas

### 5.2 Seguranca Multi-Tenant

- [ ] Sanitizar bloco `custom_html` (remover scripts maliciosos)
- [ ] Implementar rate limiting por tenant
- [ ] Implementar audit log de acoes
- [ ] Validar isolamento de dados entre tenants
- [ ] Implementar backup automatico por site

---

## Fase 6: Recursos Avancados (Opcional)

### 6.1 Durable Objects

- [ ] Implementar DO para serializar writes por tenant
- [ ] Implementar DO para coordenar invalidacao de cache
- [ ] Implementar DO para edicao colaborativa (opcional)

### 6.2 Queues

- [ ] Criar queue para geracao de sitemap
- [ ] Criar queue para processamento de imagens
- [ ] Criar queue para envio de emails
- [ ] Criar queue para imports em massa

### 6.3 Workers AI

- [ ] Integrar geracao de texto para blocos
- [ ] Integrar sugestoes de SEO
- [ ] Integrar geracao de alt text para imagens

---

## Infraestrutura

### Deploy e CI/CD

- [ ] Atualizar GitHub Actions para deploy do site SSR
- [ ] Configurar variaveis de ambiente para multi-tenant
- [ ] Implementar deploy hook para invalidacao de cache
- [ ] Configurar monitoramento de erros (Sentry ou similar)

### Testes

- [ ] Criar testes E2E para fluxo multi-tenant
- [ ] Criar testes de isolamento entre tenants
- [ ] Criar testes de performance (cache hit/miss)
- [ ] Criar testes de SEO (metatags, sitemap, robots)

---

## Prioridade de Implementacao

1. **Fase 1** - Fundacao (sem isso, nada funciona)
2. **Fase 4** - SEO (compliance Google - parcialmente implementado)
3. **Fase 2** - SSR (permite escalar)
4. **Fase 3** - Admin (UX para agencias)
5. **Fase 5** - Seguranca (antes de ir para producao)
6. **Fase 6** - Recursos avancados (conforme necessidade)

---

## Custos Estimados (Cloudflare)

Para 100 agencias com media de 5 clientes cada (500 sites):

| Item | Custo Mensal |
|------|--------------|
| Workers Paid ($5/mes) | $5 |
| D1 Paid ($5/mes) | $5 |
| R2 (10GB incluido) | $0 |
| KV (incluido no Workers) | $0 |
| Custom Hostnames (400 extras x $0.10) | $40 |
| **Total** | **~$50/mes** |

Para 1000 sites: ~$100/mes
Para 5000 sites: ~$500/mes
