# 🚀 CMS Site

Sistema de Gerenciamento de Conteúdo construído na infraestrutura Cloudflare.

## 📁 Estrutura do Projeto

```
cms-site/
├── api/                    # API Backend (Cloudflare Worker)
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── routes/         # Rotas da API
│   │   │   ├── auth.ts     # Autenticação
│   │   │   ├── pages.ts    # Páginas
│   │   │   ├── menus.ts    # Menus
│   │   │   ├── media.ts    # Mídia/Upload
│   │   │   ├── settings.ts # Configurações
│   │   │   ├── themes.ts   # Temas
│   │   │   ├── contacts.ts # Contatos/Leads
│   │   │   └── public.ts   # Endpoints públicos
│   │   ├── middleware/     # Middlewares
│   │   ├── services/       # Serviços
│   │   └── utils/          # Utilitários
│   ├── wrangler.toml       # Config do Worker
│   ├── package.json
│   └── tsconfig.json
│
├── admin/                  # Painel Administrativo (Cloudflare Pages)
│   ├── public/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas do admin
│   │   ├── services/       # Chamadas à API
│   │   ├── styles/         # CSS/Tailwind
│   │   └── utils/          # Utilitários
│   └── package.json
│
├── frontend/               # Site Público (Cloudflare Pages)
│   ├── public/
│   ├── src/
│   │   ├── components/     # Componentes
│   │   ├── pages/          # Templates de página
│   │   ├── styles/         # CSS
│   │   └── utils/          # Utilitários
│   └── package.json
│
└── docs/                   # Documentação
    └── README.md           # Documentação completa
```

## ⚡ Tecnologias

| Componente | Tecnologia |
|------------|------------|
| API Backend | Cloudflare Workers + Hono |
| Banco de Dados | Cloudflare D1 (SQLite) |
| Armazenamento | Cloudflare R2 |
| Cache | Cloudflare KV |
| Frontend | Cloudflare Pages |
| Otimização de Imagens | Cloudflare Images |
| Analytics | Cloudflare Zaraz |

## 🔧 Configuração

### Pré-requisitos

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Conta Cloudflare com Workers Paid

### Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/cms-site.git
cd cms-site

# Instalar dependências da API
cd api
npm install

# Configurar secret JWT
wrangler secret put JWT_SECRET

# Deploy da API
npm run deploy
```

## 📖 Documentação

Veja a documentação completa em [docs/README.md](./docs/README.md)

## 📄 Licença

Proprietário - CodieHost
