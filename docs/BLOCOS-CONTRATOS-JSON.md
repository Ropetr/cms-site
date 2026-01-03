# 📦 CMS SITE - CONTRATOS JSON DOS BLOCOS

Este documento define a estrutura JSON de cada bloco do Page Builder.

---

## ÍNDICE DE BLOCOS

1. [Hero Banner](#1-hero-banner)
2. [Texto Rico](#2-texto-rico)
3. [Mídia + Texto](#3-mídia--texto)
4. [Features](#4-features)
5. [Galeria](#5-galeria)
6. [Carrossel](#6-carrossel)
7. [Grid de Produtos](#7-grid-de-produtos)
8. [CTA](#8-cta)
9. [FAQ](#9-faq)
10. [Formulário de Contato](#10-formulário-de-contato)
11. [Depoimentos](#11-depoimentos)
12. [Estatísticas](#12-estatísticas)
13. [Equipe](#13-equipe)
14. [Lista de Blog](#14-lista-de-blog)
15. [Mapa](#15-mapa)
16. [HTML Customizado](#16-html-customizado)

---

## 1. Hero Banner

**section_type:** `hero_banner`

### Layouts Disponíveis
- `centered` - Texto centralizado sobre imagem
- `left-aligned` - Texto alinhado à esquerda
- `split` - Metade imagem, metade conteúdo

### Variantes
- `overlay-dark` - Overlay escuro sobre imagem
- `overlay-light` - Overlay claro sobre imagem
- `no-overlay` - Sem overlay

### Contrato JSON

```json
{
  "section_type": "hero_banner",
  "layout": "centered",
  "variant": "overlay-dark",
  "content": {
    "mediaId": "media_abc123",
    "title": "Título Principal do Banner",
    "subtitle": "Subtítulo descritivo que complementa o título",
    "cta": {
      "text": "Solicite Orçamento",
      "url": "/contato",
      "style": "primary"
    },
    "secondaryCta": {
      "text": "Conheça Produtos",
      "url": "/produtos",
      "style": "outline"
    }
  },
  "settings": {
    "fullHeight": true,
    "minHeight": "70vh",
    "parallax": false,
    "overlayOpacity": 0.5,
    "textColor": "#FFFFFF"
  }
}
```

---

## 2. Texto Rico

**section_type:** `text`

### Layouts Disponíveis
- `default` - Largura normal
- `narrow` - Largura reduzida (leitura)
- `wide` - Largura total

### Variantes
- `default` - Fundo padrão
- `highlighted` - Fundo colorido
- `bordered` - Com borda

### Contrato JSON

```json
{
  "section_type": "text",
  "layout": "default",
  "variant": "default",
  "content": {
    "title": "Título da Seção (opcional)",
    "subtitle": "Subtítulo (opcional)",
    "html": "<p>Conteúdo em HTML formatado...</p><p>Segundo parágrafo...</p><ul><li>Item 1</li><li>Item 2</li></ul>"
  },
  "settings": {
    "backgroundColor": "background",
    "paddingTop": "normal",
    "paddingBottom": "normal",
    "textAlign": "left"
  }
}
```

---

## 3. Mídia + Texto

**section_type:** `media_text`

### Layouts Disponíveis
- `media-left` - Imagem à esquerda, texto à direita
- `media-right` - Imagem à direita, texto à esquerda
- `stacked` - Imagem em cima, texto embaixo

### Variantes
- `default` - Padrão
- `compact` - Menos espaçamento
- `featured` - Destaque (maior)

### Contrato JSON

```json
{
  "section_type": "media_text",
  "layout": "media-left",
  "variant": "default",
  "content": {
    "mediaId": "media_xyz789",
    "mediaType": "image",
    "title": "Título da Seção",
    "text": "<p>Descrição em HTML...</p>",
    "cta": {
      "text": "Saiba mais",
      "url": "/pagina",
      "style": "primary"
    },
    "list": [
      "Benefício ou característica 1",
      "Benefício ou característica 2",
      "Benefício ou característica 3"
    ]
  },
  "settings": {
    "backgroundColor": "background",
    "mediaRounded": true,
    "mediaShadow": true,
    "mediaSize": "50",
    "verticalAlign": "center"
  }
}
```

---

## 4. Features

**section_type:** `features`

### Layouts Disponíveis
- `grid` - Grade de cards
- `list` - Lista vertical
- `carousel` - Carrossel

### Variantes
- `icons` - Com ícones
- `images` - Com imagens
- `numbers` - Com números

### Contrato JSON

```json
{
  "section_type": "features",
  "layout": "grid",
  "variant": "icons",
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
      },
      {
        "icon": "badge-check",
        "title": "Garantia",
        "description": "Todos os produtos com garantia de fábrica"
      }
    ]
  },
  "settings": {
    "columns": 4,
    "columnsMobile": 2,
    "showDividers": false,
    "cardStyle": "flat",
    "iconSize": "large",
    "backgroundColor": "surface"
  }
}
```

### Ícones Disponíveis (Lucide)
```
shield-check, truck, headphones, badge-check, clock, 
map-pin, phone, mail, star, heart, award, target,
zap, users, settings, tool, package, home, building
```

---

## 5. Galeria

**section_type:** `gallery`

### Layouts Disponíveis
- `grid` - Grade uniforme
- `masonry` - Masonry (alturas variadas)
- `slider` - Slider horizontal

### Variantes
- `default` - Padrão
- `lightbox` - Com lightbox ao clicar
- `hover-zoom` - Zoom no hover

### Contrato JSON

```json
{
  "section_type": "gallery",
  "layout": "grid",
  "variant": "lightbox",
  "content": {
    "title": "Galeria de Projetos",
    "subtitle": "Conheça nossos trabalhos realizados",
    "images": [
      {
        "mediaId": "media_img1",
        "alt": "Projeto residencial",
        "caption": "Apartamento em Londrina"
      },
      {
        "mediaId": "media_img2",
        "alt": "Projeto comercial",
        "caption": "Loja no centro"
      },
      {
        "mediaId": "media_img3",
        "alt": "Projeto industrial",
        "caption": "Galpão logístico"
      }
    ]
  },
  "settings": {
    "columns": 4,
    "columnsMobile": 2,
    "gap": "normal",
    "aspectRatio": "4:3",
    "showCaptions": true,
    "enableLightbox": true
  }
}
```

---

## 6. Carrossel

**section_type:** `carousel`

### Layouts Disponíveis
- `full-width` - Largura total
- `contained` - Dentro do container
- `compact` - Compacto

### Variantes
- `default` - Padrão
- `thumbnails` - Com miniaturas abaixo
- `cards` - Estilo cards

### Contrato JSON

```json
{
  "section_type": "carousel",
  "layout": "contained",
  "variant": "default",
  "content": {
    "title": "Cores Disponíveis",
    "subtitle": "Escolha a cor ideal para seu projeto",
    "items": [
      {
        "mediaId": "media_cor1",
        "label": "Branco Neve",
        "code": "#FFFFFF",
        "description": "Cor clássica e versátil"
      },
      {
        "mediaId": "media_cor2",
        "label": "Cinza Claro",
        "code": "#E0E0E0",
        "description": "Moderno e elegante"
      },
      {
        "mediaId": "media_cor3",
        "label": "Bege Natural",
        "code": "#F5F5DC",
        "description": "Aconchegante e neutro"
      }
    ]
  },
  "settings": {
    "autoplay": true,
    "autoplaySpeed": 4000,
    "showDots": true,
    "showArrows": true,
    "slidesPerView": 4,
    "slidesPerViewTablet": 3,
    "slidesPerViewMobile": 1,
    "loop": true,
    "showColorCode": true
  }
}
```

---

## 7. Grid de Produtos

**section_type:** `product_grid`

### Layouts Disponíveis
- `grid` - Grade padrão
- `list` - Lista
- `featured` - Com destaque

### Variantes
- `cards` - Cards com sombra
- `minimal` - Minimalista
- `detailed` - Com mais informações

### Contrato JSON

```json
{
  "section_type": "product_grid",
  "layout": "grid",
  "variant": "cards",
  "content": {
    "title": "Nossos Produtos",
    "subtitle": "Materiais de qualidade para sua obra",
    "products": [
      {
        "mediaId": "media_prod1",
        "name": "Placa de Gesso Drywall",
        "description": "Placa ST 12,5mm para ambientes secos",
        "category": "Drywall",
        "url": "/produtos/drywall-st",
        "badge": "Mais vendido"
      },
      {
        "mediaId": "media_prod2",
        "name": "Perfil Montante",
        "description": "Perfil de aço galvanizado 70mm",
        "category": "Perfis",
        "url": "/produtos/perfil-montante"
      },
      {
        "mediaId": "media_prod3",
        "name": "Massa para Drywall",
        "description": "Massa pronta para acabamento",
        "category": "Acabamentos",
        "url": "/produtos/massa-drywall"
      }
    ],
    "cta": {
      "text": "Ver todos os produtos",
      "url": "/produtos"
    }
  },
  "settings": {
    "columns": 3,
    "columnsMobile": 1,
    "showCategory": true,
    "showDescription": true,
    "imageAspectRatio": "1:1",
    "maxProducts": 6
  }
}
```

---

## 8. CTA

**section_type:** `cta`

### Layouts Disponíveis
- `centered` - Centralizado
- `split` - Dividido (texto + botões)
- `inline` - Em linha
- `banner` - Estilo banner

### Variantes
- `primary` - Cor primária
- `secondary` - Cor secundária
- `dark` - Fundo escuro
- `gradient` - Com gradiente

### Contrato JSON

```json
{
  "section_type": "cta",
  "layout": "centered",
  "variant": "primary",
  "content": {
    "title": "Pronto para começar sua obra?",
    "description": "Entre em contato e solicite um orçamento sem compromisso",
    "buttons": [
      {
        "type": "whatsapp",
        "text": "WhatsApp",
        "icon": "message-circle",
        "number": "5543999999999",
        "message": "Olá! Gostaria de um orçamento para minha obra."
      },
      {
        "type": "phone",
        "text": "Ligar Agora",
        "icon": "phone",
        "number": "4333333333"
      },
      {
        "type": "email",
        "text": "Enviar E-mail",
        "icon": "mail",
        "address": "contato@planac.com.br",
        "subject": "Solicitação de Orçamento"
      },
      {
        "type": "link",
        "text": "Ver Rotas",
        "icon": "map-pin",
        "url": "https://maps.google.com/?q=...",
        "target": "_blank"
      }
    ]
  },
  "settings": {
    "backgroundColor": "primary",
    "textColor": "#FFFFFF",
    "showIcons": true,
    "buttonSize": "large",
    "fullWidth": false
  }
}
```

---

## 9. FAQ

**section_type:** `faq`

### Layouts Disponíveis
- `accordion` - Acordeão (um aberto por vez)
- `list` - Lista expandida
- `two-columns` - Duas colunas

### Variantes
- `default` - Padrão
- `bordered` - Com bordas
- `cards` - Estilo cards

### Contrato JSON

```json
{
  "section_type": "faq",
  "layout": "accordion",
  "variant": "default",
  "content": {
    "title": "Perguntas Frequentes",
    "subtitle": "Tire suas dúvidas sobre nossos produtos e serviços",
    "items": [
      {
        "question": "Qual o prazo de entrega?",
        "answer": "<p>O prazo de entrega varia de <strong>3 a 7 dias úteis</strong> dependendo da região e disponibilidade do produto.</p><p>Para Londrina e região metropolitana, o prazo médio é de 3 dias úteis.</p>"
      },
      {
        "question": "Vocês fazem instalação?",
        "answer": "<p>Sim! Temos uma equipe própria de <strong>instaladores certificados</strong> que podem realizar a instalação completa do seu projeto.</p><p>Solicite um orçamento incluindo instalação.</p>"
      },
      {
        "question": "Qual a garantia dos produtos?",
        "answer": "<p>Todos os nossos produtos possuem <strong>garantia de fábrica</strong>. O período varia conforme o fabricante:</p><ul><li>Placas de gesso: 5 anos</li><li>Perfis metálicos: 10 anos</li><li>Acessórios: 2 anos</li></ul>"
      },
      {
        "question": "Vocês emitem nota fiscal?",
        "answer": "<p>Sim, emitimos <strong>nota fiscal eletrônica (NF-e)</strong> para todas as vendas, tanto para pessoa física quanto jurídica.</p>"
      },
      {
        "question": "Quais formas de pagamento?",
        "answer": "<p>Aceitamos diversas formas de pagamento:</p><ul><li>Cartão de crédito (até 12x)</li><li>Boleto bancário</li><li>PIX</li><li>Transferência bancária</li></ul><p>Para obras maiores, consulte condições especiais.</p>"
      }
    ]
  },
  "settings": {
    "generateSchema": true,
    "allowMultipleOpen": false,
    "defaultOpen": 0,
    "showNumbers": false,
    "iconStyle": "chevron"
  }
}
```

### Schema.org Gerado Automaticamente

Quando `generateSchema: true`, o sistema gera:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Qual o prazo de entrega?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O prazo de entrega varia de 3 a 7 dias úteis..."
      }
    }
    // ... demais perguntas
  ]
}
</script>
```

---

## 10. Formulário de Contato

**section_type:** `contact_form`

### Layouts Disponíveis
- `simple` - Apenas formulário
- `with-info` - Formulário + informações de contato
- `split` - Dividido 50/50

### Variantes
- `default` - Padrão
- `boxed` - Em caixa
- `floating` - Labels flutuantes

### Contrato JSON

```json
{
  "section_type": "contact_form",
  "layout": "with-info",
  "variant": "default",
  "content": {
    "title": "Entre em Contato",
    "subtitle": "Preencha o formulário e retornaremos em breve",
    "fields": [
      {
        "name": "name",
        "label": "Nome completo",
        "type": "text",
        "placeholder": "Seu nome",
        "required": true,
        "width": "full"
      },
      {
        "name": "email",
        "label": "E-mail",
        "type": "email",
        "placeholder": "seu@email.com",
        "required": true,
        "width": "half"
      },
      {
        "name": "phone",
        "label": "Telefone",
        "type": "tel",
        "placeholder": "(43) 99999-9999",
        "required": false,
        "width": "half"
      },
      {
        "name": "city",
        "label": "Cidade",
        "type": "text",
        "placeholder": "Sua cidade",
        "required": false,
        "width": "half"
      },
      {
        "name": "project_type",
        "label": "Tipo de Projeto",
        "type": "select",
        "required": false,
        "width": "half",
        "options": [
          { "value": "", "label": "Selecione..." },
          { "value": "residencial", "label": "Residencial" },
          { "value": "comercial", "label": "Comercial" },
          { "value": "industrial", "label": "Industrial" }
        ]
      },
      {
        "name": "message",
        "label": "Mensagem",
        "type": "textarea",
        "placeholder": "Descreva seu projeto ou dúvida...",
        "required": true,
        "width": "full",
        "rows": 5
      }
    ],
    "submitText": "Enviar Mensagem",
    "successMessage": "Mensagem enviada com sucesso! Entraremos em contato em breve.",
    "errorMessage": "Erro ao enviar. Tente novamente ou entre em contato por telefone.",
    "contactInfo": {
      "phone": "(43) 3333-3333",
      "whatsapp": "(43) 99999-9999",
      "email": "contato@planac.com.br",
      "address": "Rua Example, 123 - Centro",
      "city": "Londrina - PR",
      "hours": "Seg a Sex: 8h às 18h | Sáb: 8h às 12h"
    }
  },
  "settings": {
    "showContactInfo": true,
    "showMap": false,
    "backgroundColor": "surface",
    "formBackgroundColor": "background",
    "redirectAfterSubmit": null,
    "sendToEmail": true
  }
}
```

---

## 11. Depoimentos

**section_type:** `testimonials`

### Layouts Disponíveis
- `carousel` - Carrossel
- `grid` - Grade
- `featured` - Um destaque + grid

### Variantes
- `cards` - Cards com sombra
- `quotes` - Estilo citação
- `minimal` - Minimalista

### Contrato JSON

```json
{
  "section_type": "testimonials",
  "layout": "carousel",
  "variant": "cards",
  "content": {
    "title": "O que nossos clientes dizem",
    "subtitle": "Depoimentos de quem já comprou conosco",
    "items": [
      {
        "text": "Excelente atendimento e produtos de qualidade. A entrega foi rápida e a instalação ficou perfeita!",
        "author": "João Silva",
        "role": "Arquiteto",
        "company": "Silva Arquitetura",
        "avatarId": "media_avatar1",
        "rating": 5
      },
      {
        "text": "Preço justo e material de primeira. Recomendo para qualquer obra.",
        "author": "Maria Santos",
        "role": "Engenheira Civil",
        "company": "Construtora ABC",
        "avatarId": "media_avatar2",
        "rating": 5
      }
    ]
  },
  "settings": {
    "showRating": true,
    "showAvatar": true,
    "showCompany": true,
    "autoplay": true,
    "autoplaySpeed": 5000
  }
}
```

---

## 12. Estatísticas

**section_type:** `stats`

### Layouts Disponíveis
- `row` - Em linha
- `grid` - Grade
- `cards` - Cards separados

### Variantes
- `default` - Padrão
- `highlighted` - Destacado
- `minimal` - Minimalista

### Contrato JSON

```json
{
  "section_type": "stats",
  "layout": "row",
  "variant": "highlighted",
  "content": {
    "title": "Números que falam por nós",
    "items": [
      {
        "value": "15",
        "suffix": "+",
        "label": "Anos de experiência"
      },
      {
        "value": "5000",
        "suffix": "+",
        "label": "Clientes atendidos"
      },
      {
        "value": "50000",
        "suffix": "m²",
        "label": "Instalados"
      },
      {
        "value": "98",
        "suffix": "%",
        "label": "Satisfação"
      }
    ]
  },
  "settings": {
    "animated": true,
    "animationDuration": 2000,
    "backgroundColor": "primary",
    "textColor": "#FFFFFF"
  }
}
```

---

## 13. Equipe

**section_type:** `team`

### Layouts Disponíveis
- `grid` - Grade de cards
- `carousel` - Carrossel
- `list` - Lista

### Variantes
- `cards` - Cards com foto
- `minimal` - Minimalista
- `detailed` - Com bio

### Contrato JSON

```json
{
  "section_type": "team",
  "layout": "grid",
  "variant": "cards",
  "content": {
    "title": "Nossa Equipe",
    "subtitle": "Profissionais dedicados ao seu projeto",
    "members": [
      {
        "mediaId": "media_team1",
        "name": "Carlos Ferreira",
        "role": "Diretor Comercial",
        "bio": "20 anos de experiência no setor de construção civil.",
        "social": {
          "linkedin": "https://linkedin.com/in/...",
          "email": "carlos@planac.com.br"
        }
      },
      {
        "mediaId": "media_team2",
        "name": "Ana Paula",
        "role": "Gerente Técnica",
        "bio": "Engenheira especializada em drywall e acabamentos.",
        "social": {
          "linkedin": "https://linkedin.com/in/...",
          "email": "ana@planac.com.br"
        }
      }
    ]
  },
  "settings": {
    "columns": 4,
    "showBio": true,
    "showSocial": true,
    "imageStyle": "circle"
  }
}
```

---

## 14. Lista de Blog

**section_type:** `blog_list`

### Layouts Disponíveis
- `grid` - Grade de posts
- `list` - Lista vertical
- `featured` - Um destaque + lista

### Variantes
- `cards` - Cards
- `minimal` - Minimalista
- `magazine` - Estilo revista

### Contrato JSON

```json
{
  "section_type": "blog_list",
  "layout": "grid",
  "variant": "cards",
  "content": {
    "title": "Blog",
    "subtitle": "Dicas e novidades do setor",
    "source": "latest",
    "cta": {
      "text": "Ver todos os posts",
      "url": "/blog"
    }
  },
  "settings": {
    "postsCount": 3,
    "columns": 3,
    "showExcerpt": true,
    "showDate": true,
    "showAuthor": false,
    "showCategory": true,
    "excerptLength": 120
  }
}
```

---

## 15. Mapa

**section_type:** `map`

### Layouts Disponíveis
- `full-width` - Largura total
- `with-info` - Mapa + informações
- `embedded` - Incorporado menor

### Variantes
- `default` - Padrão
- `dark` - Tema escuro
- `satellite` - Satélite

### Contrato JSON

```json
{
  "section_type": "map",
  "layout": "with-info",
  "variant": "default",
  "content": {
    "title": "Onde Estamos",
    "subtitle": "Venha nos visitar",
    "address": {
      "street": "Rua Example, 123",
      "neighborhood": "Centro",
      "city": "Londrina",
      "state": "PR",
      "zip": "86000-000"
    },
    "coordinates": {
      "lat": -23.3045,
      "lng": -51.1696
    },
    "contactInfo": {
      "phone": "(43) 3333-3333",
      "whatsapp": "(43) 99999-9999",
      "email": "contato@planac.com.br",
      "hours": "Seg a Sex: 8h às 18h"
    }
  },
  "settings": {
    "height": "400px",
    "zoom": 15,
    "showMarker": true,
    "showDirectionsButton": true,
    "lazyLoad": true
  }
}
```

---

## 16. HTML Customizado

**section_type:** `custom_html`

### Layouts Disponíveis
- `full-width` - Largura total
- `contained` - Dentro do container
- `narrow` - Largura reduzida

### Variantes
- `default` - Padrão
- `no-padding` - Sem padding

### Contrato JSON

```json
{
  "section_type": "custom_html",
  "layout": "contained",
  "variant": "default",
  "content": {
    "html": "<div class=\"custom-content\">Conteúdo HTML customizado...</div>",
    "css": ".custom-content { padding: 2rem; background: #f5f5f5; }",
    "js": "// JavaScript opcional (cuidado com performance)"
  },
  "settings": {
    "sanitize": true,
    "allowScripts": false,
    "backgroundColor": "transparent"
  }
}
```

⚠️ **Atenção:** Blocos custom_html devem ser usados com cautela para não comprometer performance e segurança.

---

## RESUMO DOS TIPOS

| section_type | Descrição |
|--------------|-----------|
| `hero_banner` | Banner principal |
| `text` | Texto rico |
| `media_text` | Mídia + Texto |
| `features` | Features/benefícios |
| `gallery` | Galeria de imagens |
| `carousel` | Carrossel |
| `product_grid` | Grid de produtos |
| `cta` | Call to Action |
| `faq` | Perguntas frequentes |
| `contact_form` | Formulário |
| `testimonials` | Depoimentos |
| `stats` | Estatísticas |
| `team` | Equipe |
| `blog_list` | Lista de posts |
| `map` | Mapa |
| `custom_html` | HTML customizado |

---

*Documento atualizado em: 03/01/2026*
