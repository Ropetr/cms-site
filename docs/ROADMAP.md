# 🗺️ CMS SITE - ROADMAP DE IMPLEMENTAÇÃO

**Última atualização:** 03/01/2026

Este documento detalha as funcionalidades que precisam ser implementadas, em ordem de prioridade.

---

## 📍 ONDE ESTAMOS

### ✅ Implementado e Funcionando
- API Backend completa (Cloudflare Worker)
- Admin Panel com 11 páginas
- Site Público (Astro SSG)
- Autenticação JWT
- CRUD de páginas, menus, mídia, contatos, temas, configurações, usuários
- Editor de páginas com 13 tipos de blocos
- Sistema de ponto focal para imagens (UI)
- Preview de páginas com toggle de viewport
- CI/CD automático via GitHub Actions

### ❌ O que está quebrado/incompleto
- Campos de imagem são input text (deveria ser seletor)
- Imagens não são otimizadas (sem WebP/AVIF)
- Faltam 3 blocos: carousel, product_grid, blog_list
- Não existe sistema de blog
- Não existe IA para geração de conteúdo

---

## 🎯 ROADMAP DETALHADO

---

## SPRINT 1: FUNDAÇÃO DE IMAGENS
**Tempo estimado:** 2-3 horas
**Prioridade:** 🔴 CRÍTICA

### 1.1 Criar Componente MediaPicker
**Arquivo:** `admin/src/components/MediaPicker.jsx`

```
Funcionalidades:
- Modal que abre biblioteca de mídia
- Grid de imagens existentes
- Upload de nova imagem
- Seleção de imagem
- Retorna: { id, url, alt_text, focal_x, focal_y }
- Preview da imagem selecionada
```

### 1.2 Criar Endpoint de Imagens Otimizadas
**Arquivo:** `api/src/routes/images.ts`

```
Rota: GET /api/images/:preset/:filename

Presets (whitelist):
- banner_desktop: 1920x710
- banner_tablet: 1200x500
- banner_mobile: 768x540
- product_large: 1200x1200
- product_card: 800x800
- product_thumb: 400x400
- gallery_large: 1600x1000
- gallery_medium: 800x500
- gallery_thumb: 400x300
- og_image: 1200x630
- avatar_large: 200x200
- avatar_small: 80x80

Funcionalidades:
- Busca imagem do R2
- Aplica dimensões do preset
- Usa ponto focal para crop
- Converte para WebP (Accept header)
- Cache headers otimizados
```

### 1.3 Integrar MediaPicker no Editor de Blocos
**Arquivo:** `admin/src/pages/PageEditorPage.jsx`

```
Substituir campos de imagem por MediaPicker:
- hero_banner: background_image
- media_text: image
- gallery: images[]
- testimonials: avatar
- team: photo
- Todos os blocos que têm imagem
```

---

## SPRINT 2: BLOCOS FALTANTES
**Tempo estimado:** 2 horas
**Prioridade:** 🔴 CRÍTICA

### 2.1 Bloco Carousel
**Admin:** Adicionar em BLOCK_TYPES no PageEditorPage
**Site:** Criar `site/src/components/blocks/Carousel.astro`

```json
{
  "section_type": "carousel",
  "content": {
    "title": "Título",
    "items": [
      { "image": "url", "title": "Slide 1", "description": "..." },
      { "image": "url", "title": "Slide 2", "description": "..." }
    ]
  },
  "settings": {
    "autoplay": true,
    "interval": 5000,
    "showDots": true,
    "showArrows": true
  }
}
```

### 2.2 Bloco Product Grid
**Admin:** Adicionar em BLOCK_TYPES
**Site:** Criar `site/src/components/blocks/ProductGrid.astro`

```json
{
  "section_type": "product_grid",
  "content": {
    "title": "Nossos Produtos",
    "products": [
      { "image": "url", "name": "Produto 1", "description": "...", "category": "Cat1" }
    ]
  },
  "settings": {
    "columns": 3,
    "showCategory": true
  }
}
```

### 2.3 Bloco Blog List
**Admin:** Adicionar em BLOCK_TYPES
**Site:** Criar `site/src/components/blocks/BlogList.astro`

```json
{
  "section_type": "blog_list",
  "content": {
    "title": "Blog",
    "source": "latest"
  },
  "settings": {
    "postsCount": 3,
    "showExcerpt": true,
    "showDate": true
  }
}
```

---

## SPRINT 3: SISTEMA DE BLOG COMPLETO
**Tempo estimado:** 3-4 horas
**Prioridade:** 🟡 ALTA

### 3.1 Banco de Dados
**Arquivo:** Executar SQL no D1

```sql
CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    featured_image TEXT,
    category_id TEXT,
    author_id TEXT,
    status TEXT DEFAULT 'draft',
    meta_title TEXT,
    meta_description TEXT,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_category ON posts(category_id);
```

### 3.2 API Routes
**Arquivo:** `api/src/routes/posts.ts`

```
Rotas autenticadas:
- GET /api/posts - Lista posts
- GET /api/posts/:id - Get post
- POST /api/posts - Criar post
- PUT /api/posts/:id - Atualizar post
- DELETE /api/posts/:id - Deletar post

Rotas públicas:
- GET /api/public/posts - Lista publicados
- GET /api/public/posts/:slug - Get por slug
- GET /api/public/categories - Lista categorias
```

### 3.3 Admin - Página de Posts
**Arquivo:** `admin/src/pages/PostsPage.jsx`

```
Funcionalidades:
- Lista de posts com busca e filtros
- Status: draft, published
- Ações: editar, publicar, deletar
```

### 3.4 Admin - Editor de Post
**Arquivo:** `admin/src/pages/PostEditorPage.jsx`

```
Funcionalidades:
- Título, slug (auto-generate)
- Editor TipTap para conteúdo
- Imagem destacada (MediaPicker)
- Categoria (select)
- Excerpt
- Meta title/description
- Botão publicar/despublicar
- Botão "✨ Gerar com IA"
```

### 3.5 Site - Páginas de Blog
**Arquivos:**
- `site/src/pages/blog/index.astro` - Lista de posts
- `site/src/pages/blog/[slug].astro` - Post individual

---

## SPRINT 4: EDITOR DE TEXTO RICO (TipTap)
**Tempo estimado:** 2 horas
**Prioridade:** 🟡 ALTA

### 4.1 Instalar TipTap
```bash
cd admin
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
```

### 4.2 Criar Componente RichTextEditor
**Arquivo:** `admin/src/components/RichTextEditor.jsx`

```
Funcionalidades:
- Toolbar: Bold, Italic, Underline, Strike
- Headings: H2, H3, H4
- Lists: Bullet, Numbered
- Link: Inserir/editar link
- Image: Inserir via MediaPicker
- Blockquote
- Code block
- Undo/Redo
```

### 4.3 Integrar no Editor de Blocos
Substituir `<textarea>` por `<RichTextEditor>` nos blocos:
- text (campo content)
- media_text (campo content)
- Qualquer campo de texto longo

---

## SPRINT 5: INTELIGÊNCIA ARTIFICIAL
**Tempo estimado:** 3-4 horas
**Prioridade:** 🟡 ALTA

### 5.1 Configurar Workers AI
**Arquivo:** `api/wrangler.toml`

```toml
[ai]
binding = "AI"
```

### 5.2 Criar Rotas de IA
**Arquivo:** `api/src/routes/ai.ts`

```typescript
// POST /api/ai/generate-content
// Body: { type: 'block'|'post', context: string, tone: string }
// Retorna: { content: string }

// POST /api/ai/generate-seo
// Body: { title: string, content: string }
// Retorna: { meta_title: string, meta_description: string }

// POST /api/ai/describe-image
// Body: { image_url: string }
// Retorna: { alt_text: string, description: string }

// POST /api/ai/improve-content
// Body: { content: string, instruction: string }
// Retorna: { improved: string, suggestions: string[] }
```

### 5.3 Integrar no Admin

#### No Editor de Blocos:
- Botão "✨ Gerar" ao lado de cada campo de texto
- Modal para configurar: tom, tamanho, contexto
- Preview antes de aplicar

#### No Editor de Posts:
- Botão "✨ Gerar Artigo" na toolbar
- Botão "✨ Gerar SEO" na aba de SEO
- Sugestões de melhoria inline

#### Na Mídia:
- Botão "✨ Descrever" em cada imagem
- Gera alt_text automaticamente

---

## SPRINT 6: SEO & PERFORMANCE
**Tempo estimado:** 2 horas
**Prioridade:** 🟢 MÉDIA

### 6.1 Schema.org
**Arquivos:** Componentes Astro

```
- Organization (em todas as páginas)
- FAQPage (no bloco FAQ)
- BlogPosting (nos posts)
- BreadcrumbList (navegação)
```

### 6.2 Sitemap.xml
**Arquivo:** `site/src/pages/sitemap.xml.ts`

```
- Lista todas as páginas publicadas
- Lista todos os posts publicados
- Atualiza automaticamente
```

### 6.3 robots.txt
**Arquivo:** `site/public/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://cms-site.pages.dev/sitemap.xml
```

### 6.4 WhatsApp Float
**Arquivo:** `site/src/components/WhatsAppFloat.astro`

```
- Botão flutuante no canto inferior direito
- Número configurável via settings
- Animação de pulse
```

---

## SPRINT 7: MELHORIAS UX
**Tempo estimado:** 2 horas
**Prioridade:** 🟢 MÉDIA

### 7.1 Drag-and-Drop Real
**Biblioteca:** @dnd-kit/core

```
- Arrastar blocos para reordenar
- Visual feedback durante drag
- Drop zones claras
```

### 7.2 Autosave
```
- Salvar rascunho automaticamente a cada 30s
- Indicador "Salvando..." / "Salvo"
- Recuperar rascunho não salvo
```

### 7.3 Histórico de Versões
```
- Tabela page_versions no D1
- Salvar versão a cada publicação
- Interface para comparar/restaurar
```

---

## 📅 CRONOGRAMA SUGERIDO

| Sprint | Funcionalidade | Tempo | Ordem |
|--------|---------------|-------|-------|
| 1 | MediaPicker + Imagens | 2-3h | 1º |
| 2 | Blocos Faltantes | 2h | 2º |
| 3 | Sistema de Blog | 3-4h | 3º |
| 4 | TipTap Editor | 2h | 4º |
| 5 | Inteligência Artificial | 3-4h | 5º |
| 6 | SEO & Performance | 2h | 6º |
| 7 | Melhorias UX | 2h | 7º |

**Total estimado:** 16-19 horas

---

## 🔧 DEPENDÊNCIAS A INSTALAR

### Admin (React)
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### API (Worker)
```bash
# Workers AI já está disponível, só precisa do binding
```

---

*Este roadmap deve ser atualizado conforme o progresso das implementações.*
