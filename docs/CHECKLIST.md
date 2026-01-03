# ✅ CMS SITE - CHECKLIST DE DESENVOLVIMENTO v2

**Última atualização:** 03/01/2026

---

## 📊 STATUS GERAL

| Fase | Progresso | Status |
|------|-----------|--------|
| Fase 1: MVP | 35% | 🔄 Em andamento |
| Fase 2: Multi-Tenant | 0% | ⏳ Aguardando |
| Fase 3: IA Generativa | 0% | ⏳ Aguardando |
| Fase 4: Monetização | 0% | ⏳ Aguardando |

---

## 🎯 FASE 1: MVP - CMS DE PÁGINAS

### 1.1 Infraestrutura Cloudflare
- [x] Criar conta Cloudflare configurada
- [x] Contratar Cloudflare Images ($5/mês)
- [x] Contratar Workers Paid ($5/mês)
- [x] Contratar Zaraz
- [x] Criar D1 Database (cms-site-db)
- [x] Criar R2 Bucket (cms-site-media)
- [x] Criar KV Namespace (cms-site-cache)
- [x] Criar KV Namespace (cms-site-sessions)

### 1.2 Banco de Dados
- [x] Estruturar schema das tabelas
- [x] Criar tabela `users`
- [x] Criar tabela `settings`
- [x] Criar tabela `themes`
- [x] Criar tabela `menus`
- [x] Criar tabela `pages`
- [x] Criar tabela `page_sections`
- [x] Criar tabela `media`
- [x] Criar tabela `contacts`
- [x] Criar tabela `audit_logs`
- [x] Inserir dados iniciais (tema, settings, admin)
- [x] Criar índices de performance

### 1.3 API Backend (Worker)
- [x] Setup do projeto (Hono + TypeScript)
- [x] Configurar wrangler.toml
- [x] Implementar CORS
- [x] Implementar autenticação JWT
- [x] Rotas de autenticação (/api/auth/*)
- [x] Rotas de páginas (/api/pages/*)
- [x] Rotas de menus (/api/menus/*)
- [x] Rotas de mídia (/api/media/*)
- [x] Rotas de configurações (/api/settings/*)
- [x] Rotas de temas (/api/themes/*)
- [x] Rotas de contatos (/api/contacts/*)
- [x] Rotas públicas (/api/public/*)
- [x] Proxy de imagens com otimização
- [ ] Deploy do Worker
- [ ] Configurar JWT_SECRET
- [ ] Testar endpoints

### 1.4 Admin Panel (React)
- [ ] Setup do projeto (Vite + React + Tailwind)
- [ ] Estrutura de pastas
- [ ] Componentes de UI base
  - [ ] Button
  - [ ] Input
  - [ ] Modal
  - [ ] Card
  - [ ] Table
  - [ ] Dropdown
  - [ ] Toast/Notifications
- [ ] Layout principal
  - [ ] Sidebar
  - [ ] Header
  - [ ] Breadcrumbs
- [ ] Contexto de autenticação
- [ ] Serviços de API
- [ ] Páginas:
  - [ ] Login
  - [ ] Dashboard
  - [ ] Listagem de páginas
  - [ ] Editor de página
  - [ ] Gerenciador de menus
  - [ ] Biblioteca de mídia
  - [ ] Configurações do site
  - [ ] Editor de temas
  - [ ] Listagem de contatos
  - [ ] Gerenciamento de usuários
- [ ] Editor de página:
  - [ ] Editor de banner
  - [ ] Adição de seções
  - [ ] Editor de texto rico (TipTap)
  - [ ] Drag-and-drop de seções
  - [ ] Seletor de mídia
  - [ ] Configurações SEO
  - [ ] Preview
- [ ] Gerenciador de menus:
  - [ ] Árvore hierárquica
  - [ ] Drag-and-drop
  - [ ] Vinculação de páginas
- [ ] Biblioteca de mídia:
  - [ ] Upload com drag-and-drop
  - [ ] Grid de arquivos
  - [ ] Pastas
  - [ ] Edição de metadados
- [ ] Deploy no Cloudflare Pages

### 1.5 Frontend (Site Público)
- [ ] Setup do projeto
- [ ] Estrutura de pastas
- [ ] Template HTML base
- [ ] CSS Architecture (ITCSS + BEM)
- [ ] CSS crítico (inline)
- [ ] CSS principal
- [ ] Componentes de seção:
  - [ ] Header/Nav
  - [ ] Banner
  - [ ] Seção de texto
  - [ ] Seção de features
  - [ ] Seção de galeria
  - [ ] Seção CTA
  - [ ] Seção FAQ
  - [ ] Formulário de contato
  - [ ] Footer
- [ ] WhatsApp flutuante
- [ ] Menu mobile (hamburger)
- [ ] Sistema de temas (CSS variables)
- [ ] Imagens responsivas (srcset)
- [ ] Lazy loading
- [ ] Deploy no Cloudflare Pages

### 1.6 Performance e SEO
- [ ] CSS crítico inline (< 14KB)
- [ ] CSS async loading
- [ ] JS defer
- [ ] Imagens otimizadas (WebP via Cloudflare)
- [ ] Width/height em todas as imagens
- [ ] Lazy loading abaixo do fold
- [ ] Preconnect para fontes
- [ ] Font-display: swap
- [ ] Headers de cache (_headers)
- [ ] robots.txt
- [ ] Sitemap.xml dinâmico
- [ ] Meta tags completas
- [ ] Open Graph tags
- [ ] Schema.org (JSON-LD)
- [ ] Teste PageSpeed Desktop > 90
- [ ] Teste PageSpeed Mobile > 90
- [ ] Core Web Vitals aprovados

### 1.7 Integração e Deploy
- [ ] Conectar repositório GitHub
- [ ] CI/CD configurado
- [ ] Domínio planacdistribuidora.com.br
- [ ] SSL/HTTPS ativo
- [ ] Zaraz configurado (GA4, Pixel)
- [ ] Testes finais
- [ ] Go-live

---

## 📋 PRÓXIMAS AÇÕES IMEDIATAS

1. **Deploy da API** 
   - Fazer deploy do Worker
   - Configurar JWT_SECRET
   - Testar todos os endpoints

2. **Criar Admin Panel**
   - Setup Vite + React + Tailwind
   - Implementar login
   - Implementar CRUD de páginas

3. **Criar Frontend**
   - Templates HTML otimizados
   - CSS com sistema de temas
   - Teste de performance

---

## 🐛 BUGS CONHECIDOS

| Bug | Severidade | Status |
|-----|------------|--------|
| - | - | - |

---

## 💡 MELHORIAS FUTURAS (Backlog)

- [ ] Editor visual drag-and-drop (tipo Elementor)
- [ ] Preview em tempo real
- [ ] Histórico de versões das páginas
- [ ] Agendamento de publicação
- [ ] A/B testing
- [ ] Integração com WhatsApp API
- [ ] Chat integrado
- [ ] Relatórios de analytics no dashboard
- [ ] Backup automático
- [ ] Importação de conteúdo

---

## 📝 NOTAS DE DESENVOLVIMENTO

### 03/01/2026
- Documentação completa criada
- Estrutura do banco de dados definida
- API backend implementada (código pronto, falta deploy)
- Recursos Cloudflare criados (D1, R2, KV)

---

*Atualizar este documento conforme progresso do desenvolvimento*
