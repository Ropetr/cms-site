# FIO - Landing Page

**F.I.O. — Formatação, Interface e Otimização**

Landing page de vendas para o criador de sites FIO.

## 🎨 Identidade Visual

### Slogan
> **Formate. Publique. Otimize.**

### Paleta de Cores Oficial
| Cor | Hex | Uso |
|-----|-----|-----|
| Preto Premium | `#0B0B0D` | Fundo principal |
| Grafite | `#14161A` | Fundos secundários |
| Dourado | `#D4AF37` | Acentos premium, CTAs secundários |
| Vermelho | `#E11D2E` | CTAs principais |
| Prata | `#C9CED6` | Textos secundários, bordas |
| Branco | `#F2F4F7` | Textos principais |

### Fundo Premium
O fundo utiliza gradientes radiais sutis com:
- Brilho dourado (75% 30%)
- Brilho vermelho (20% 65%)
- Brilho prata (50% 110%)
- Vinheta e textura "film grain" leve

### Tipografia
- **Display**: Outfit (títulos, badges, botões)
- **Body**: Space Grotesk (textos, parágrafos)

## 📁 Estrutura de Arquivos

```
landingpage/
├── index.html                      # Landing page principal
├── README.md                       # Esta documentação
└── assets/
    ├── logo-fio.png               # Logo oficial (459x258)
    └── fundo-premium-referencia.html  # Código de referência do fundo
```

## ✅ Compliance Google

### SEO (Google Search Central)
- HTML5 semântico
- Meta tags completas (title, description, robots, canonical)
- Open Graph e Twitter Cards
- Schema.org estruturado (SoftwareApplication, FAQPage)
- Hierarquia de headings correta (H1 único)
- Atributos `aria-*` para acessibilidade

### PageSpeed Insights (Core Web Vitals)
- CSS crítico inline
- JavaScript mínimo com `defer`
- Logo embutida em base64 (elimina requisição extra)
- Fontes com `display=swap`
- Animações CSS puras
- **Score esperado: 90+**

## 📋 Seções

1. **Header** - Logo FIO oficial, navegação, Login/Cadastro
2. **Hero** - "Formate. Publique. Otimize." + mockup do editor
3. **Funcionalidades** - 6 cards de features
4. **Planos** - 3 opções de preços (Starter, Profissional, Enterprise)
5. **FAQ** - 6 perguntas frequentes (accordion)
6. **CTA** - Chamada final para ação
7. **Footer** - Logo, links e informações

## 📱 Responsividade

- Desktop (1024px+)
- Tablet (768px - 1024px)
- Mobile (até 768px) - Menu hamburger com Login/Cadastro integrado

## 🚀 Deploy

Este arquivo pode ser servido diretamente por:
- Cloudflare Workers
- Cloudflare Pages
- Qualquer servidor estático

## 📅 Histórico

- **2026-01-04**: Criação inicial da landing page
- **2026-01-04**: Atualização com logo oficial e fundo premium FIO
