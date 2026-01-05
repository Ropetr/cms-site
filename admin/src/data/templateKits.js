/**
 * Template Kits - Kits Completos para o CMS
 * 
 * Cada kit inclui:
 * - theme: Configuracoes de cores e tipografia
 * - pages: Templates de paginas com blocos pre-configurados
 * - menus: Estrutura de navegacao
 * 
 * Otimizado para PageSpeed e SEO do Google:
 * - Blocos essenciais apenas (sem excesso)
 * - Meta tags e Schema.org configurados
 * - Hierarquia de titulos correta (H1 > H2 > H3)
 * - Estrutura semantica
 */

export const templateKits = [
  {
    id: 'corporativo-profissional',
    name: 'Corporativo Profissional',
    description: 'Kit completo para empresas e servicos profissionais. Design serio e confiavel.',
    category: 'business',
    preview: '#1e40af',
    theme: {
      colors: {
        primary_color: '#1e40af',
        secondary_color: '#1e3a8a',
        accent_color: '#3b82f6',
        background_color: '#ffffff',
        text_color: '#1f2937',
      },
      fonts: {
        heading_font: 'Montserrat',
        body_font: 'Open Sans',
        base_font_size: '16',
        border_radius: '8',
      },
    },
    menus: [
      { name: 'Inicio', slug: 'inicio', position: 0 },
      { name: 'Servicos', slug: 'servicos', position: 1 },
      { name: 'Sobre', slug: 'sobre', position: 2 },
      { name: 'Contato', slug: 'contato', position: 3 },
    ],
    pages: [
      {
        title: 'Inicio',
        slug: 'inicio',
        page_type: 'home',
        meta_title: 'Empresa | Solucoes Profissionais',
        meta_description: 'Oferecemos solucoes profissionais de alta qualidade. Entre em contato para um orcamento.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Principal',
            layout: 'centered',
            content: {
              title: 'Solucoes Profissionais para seu Negocio',
              subtitle: 'Qualidade e confianca em cada projeto',
              cta_text: 'Solicite Orcamento',
              cta_url: '/contato',
            },
          },
          {
            section_type: 'features',
            title: 'Diferenciais',
            layout: 'grid-3',
            content: {
              title: 'Por que nos escolher?',
              items: [
                { icon: 'shield-check', title: 'Qualidade', description: 'Produtos e servicos de alta qualidade' },
                { icon: 'clock', title: 'Agilidade', description: 'Entrega rapida e eficiente' },
                { icon: 'headphones', title: 'Suporte', description: 'Atendimento especializado' },
              ],
            },
          },
          {
            section_type: 'cta',
            title: 'Chamada para Acao',
            layout: 'centered',
            content: {
              title: 'Pronto para comecar?',
              description: 'Entre em contato e solicite um orcamento sem compromisso',
              cta_text: 'Fale Conosco',
              cta_url: '/contato',
            },
          },
        ],
      },
      {
        title: 'Servicos',
        slug: 'servicos',
        page_type: 'content',
        meta_title: 'Nossos Servicos | Empresa',
        meta_description: 'Conheca nossos servicos profissionais. Solucoes completas para sua necessidade.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Servicos',
            layout: 'contained',
            content: {
              title: 'Nossos Servicos',
              subtitle: 'Solucoes completas para voce',
            },
          },
          {
            section_type: 'features',
            title: 'Lista de Servicos',
            layout: 'grid-3',
            content: {
              title: 'O que oferecemos',
              items: [
                { icon: 'briefcase', title: 'Servico 1', description: 'Descricao do servico' },
                { icon: 'settings', title: 'Servico 2', description: 'Descricao do servico' },
                { icon: 'zap', title: 'Servico 3', description: 'Descricao do servico' },
              ],
            },
          },
          {
            section_type: 'cta',
            title: 'CTA Servicos',
            layout: 'centered',
            content: {
              title: 'Interessado em nossos servicos?',
              cta_text: 'Solicite Orcamento',
              cta_url: '/contato',
            },
          },
        ],
      },
      {
        title: 'Sobre',
        slug: 'sobre',
        page_type: 'content',
        meta_title: 'Sobre Nos | Empresa',
        meta_description: 'Conheca nossa historia, missao e valores. Empresa comprometida com a excelencia.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Sobre',
            layout: 'contained',
            content: {
              title: 'Sobre Nos',
              subtitle: 'Conheca nossa historia',
            },
          },
          {
            section_type: 'media_text',
            title: 'Nossa Historia',
            layout: 'media-left',
            content: {
              title: 'Nossa Historia',
              content: '<p>Conte aqui a historia da sua empresa, seus valores e missao.</p>',
            },
          },
          {
            section_type: 'stats',
            title: 'Numeros',
            layout: 'row',
            content: {
              items: [
                { value: '10+', label: 'Anos de Experiencia' },
                { value: '500+', label: 'Clientes Atendidos' },
                { value: '100%', label: 'Satisfacao' },
              ],
            },
          },
        ],
      },
      {
        title: 'Contato',
        slug: 'contato',
        page_type: 'contact',
        meta_title: 'Contato | Empresa',
        meta_description: 'Entre em contato conosco. Estamos prontos para atender voce.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Contato',
            layout: 'contained',
            content: {
              title: 'Entre em Contato',
              subtitle: 'Estamos prontos para atender voce',
            },
          },
          {
            section_type: 'contact_form',
            title: 'Formulario',
            layout: 'default',
            content: {
              title: 'Envie sua Mensagem',
              description: 'Preencha o formulario abaixo',
              button_text: 'Enviar',
            },
          },
          {
            section_type: 'map',
            title: 'Localizacao',
            layout: 'fullwidth',
            content: {
              title: 'Nossa Localizacao',
              address: 'Seu endereco aqui',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'moderno-startup',
    name: 'Moderno Startup',
    description: 'Kit dinamico para startups e empresas de tecnologia. Visual moderno e inovador.',
    category: 'tech',
    preview: '#7c3aed',
    theme: {
      colors: {
        primary_color: '#7c3aed',
        secondary_color: '#5b21b6',
        accent_color: '#a78bfa',
        background_color: '#faf5ff',
        text_color: '#1f2937',
      },
      fonts: {
        heading_font: 'Poppins',
        body_font: 'Inter',
        base_font_size: '16',
        border_radius: '12',
      },
    },
    menus: [
      { name: 'Home', slug: 'home', position: 0 },
      { name: 'Produto', slug: 'produto', position: 1 },
      { name: 'Precos', slug: 'precos', position: 2 },
      { name: 'Contato', slug: 'contato', position: 3 },
    ],
    pages: [
      {
        title: 'Home',
        slug: 'home',
        page_type: 'home',
        meta_title: 'Startup | Inovacao e Tecnologia',
        meta_description: 'Solucoes inovadoras em tecnologia. Transforme seu negocio com nossa plataforma.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Hero Principal',
            layout: 'split',
            content: {
              title: 'Transforme seu Negocio',
              subtitle: 'Plataforma inovadora para impulsionar seus resultados',
              cta_text: 'Comece Gratis',
              cta_url: '/contato',
            },
          },
          {
            section_type: 'features',
            title: 'Beneficios',
            layout: 'grid-3',
            content: {
              title: 'Por que nossa plataforma?',
              items: [
                { icon: 'zap', title: 'Rapido', description: 'Performance otimizada' },
                { icon: 'shield-check', title: 'Seguro', description: 'Dados protegidos' },
                { icon: 'trending-up', title: 'Escalavel', description: 'Cresca sem limites' },
              ],
            },
          },
          {
            section_type: 'testimonials',
            title: 'Depoimentos',
            layout: 'slider',
            content: {
              title: 'O que dizem nossos clientes',
              items: [],
            },
          },
          {
            section_type: 'cta',
            title: 'CTA Final',
            layout: 'centered',
            content: {
              title: 'Pronto para inovar?',
              description: 'Comece hoje mesmo gratuitamente',
              cta_text: 'Criar Conta Gratis',
              cta_url: '/contato',
            },
          },
        ],
      },
      {
        title: 'Produto',
        slug: 'produto',
        page_type: 'content',
        meta_title: 'Nosso Produto | Startup',
        meta_description: 'Conheca nossa plataforma e todas as funcionalidades disponiveis.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Produto',
            layout: 'centered',
            content: {
              title: 'Nossa Plataforma',
              subtitle: 'Tudo que voce precisa em um so lugar',
            },
          },
          {
            section_type: 'media_text',
            title: 'Funcionalidade 1',
            layout: 'media-left',
            content: {
              title: 'Funcionalidade Principal',
              content: '<p>Descreva aqui a principal funcionalidade do seu produto.</p>',
            },
          },
          {
            section_type: 'media_text',
            title: 'Funcionalidade 2',
            layout: 'media-right',
            content: {
              title: 'Outra Funcionalidade',
              content: '<p>Descreva aqui outra funcionalidade importante.</p>',
            },
          },
          {
            section_type: 'faq',
            title: 'FAQ Produto',
            layout: 'accordion',
            content: {
              title: 'Perguntas Frequentes',
              items: [
                { question: 'Como funciona?', answer: '<p>Explique como funciona.</p>' },
                { question: 'Quanto custa?', answer: '<p>Veja nossos planos.</p>' },
              ],
            },
          },
        ],
      },
      {
        title: 'Precos',
        slug: 'precos',
        page_type: 'content',
        meta_title: 'Precos e Planos | Startup',
        meta_description: 'Conheca nossos planos e precos. Opcoes para todos os tamanhos de negocio.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Precos',
            layout: 'centered',
            content: {
              title: 'Planos e Precos',
              subtitle: 'Escolha o plano ideal para voce',
            },
          },
          {
            section_type: 'features',
            title: 'Planos',
            layout: 'grid-3',
            content: {
              title: 'Nossos Planos',
              items: [
                { icon: 'star', title: 'Basico', description: 'Para comecar' },
                { icon: 'zap', title: 'Pro', description: 'Para crescer' },
                { icon: 'crown', title: 'Enterprise', description: 'Para escalar' },
              ],
            },
          },
          {
            section_type: 'faq',
            title: 'FAQ Precos',
            layout: 'accordion',
            content: {
              title: 'Duvidas sobre Precos',
              items: [
                { question: 'Posso cancelar a qualquer momento?', answer: '<p>Sim, sem multa.</p>' },
                { question: 'Tem periodo de teste?', answer: '<p>Sim, 14 dias gratis.</p>' },
              ],
            },
          },
        ],
      },
      {
        title: 'Contato',
        slug: 'contato',
        page_type: 'contact',
        meta_title: 'Contato | Startup',
        meta_description: 'Entre em contato com nossa equipe. Estamos prontos para ajudar.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Contato',
            layout: 'contained',
            content: {
              title: 'Fale Conosco',
              subtitle: 'Nossa equipe esta pronta para ajudar',
            },
          },
          {
            section_type: 'contact_form',
            title: 'Formulario',
            layout: 'default',
            content: {
              title: 'Envie sua Mensagem',
              button_text: 'Enviar',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'elegante-premium',
    name: 'Elegante Premium',
    description: 'Kit sofisticado para marcas de luxo e servicos premium. Visual refinado.',
    category: 'luxury',
    preview: '#78350f',
    theme: {
      colors: {
        primary_color: '#78350f',
        secondary_color: '#451a03',
        accent_color: '#d97706',
        background_color: '#fffbeb',
        text_color: '#1c1917',
      },
      fonts: {
        heading_font: 'Playfair Display',
        body_font: 'Lato',
        base_font_size: '17',
        border_radius: '4',
      },
    },
    menus: [
      { name: 'Inicio', slug: 'inicio', position: 0 },
      { name: 'Colecao', slug: 'colecao', position: 1 },
      { name: 'Sobre', slug: 'sobre', position: 2 },
      { name: 'Contato', slug: 'contato', position: 3 },
    ],
    pages: [
      {
        title: 'Inicio',
        slug: 'inicio',
        page_type: 'home',
        meta_title: 'Marca Premium | Elegancia e Sofisticacao',
        meta_description: 'Produtos exclusivos de alta qualidade. Descubra nossa colecao premium.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Hero Elegante',
            layout: 'fullwidth',
            content: {
              title: 'Elegancia em Cada Detalhe',
              subtitle: 'Colecao exclusiva para quem aprecia o melhor',
              cta_text: 'Explorar Colecao',
              cta_url: '/colecao',
            },
          },
          {
            section_type: 'media_text',
            title: 'Destaque',
            layout: 'media-left',
            content: {
              title: 'Qualidade Incomparavel',
              content: '<p>Cada peca e cuidadosamente selecionada para garantir a mais alta qualidade.</p>',
            },
          },
          {
            section_type: 'gallery',
            title: 'Galeria',
            layout: 'grid',
            content: {
              title: 'Nossa Colecao',
              images: [],
            },
          },
          {
            section_type: 'testimonials',
            title: 'Depoimentos',
            layout: 'slider',
            content: {
              title: 'Clientes Satisfeitos',
              items: [],
            },
          },
        ],
      },
      {
        title: 'Colecao',
        slug: 'colecao',
        page_type: 'content',
        meta_title: 'Nossa Colecao | Marca Premium',
        meta_description: 'Explore nossa colecao exclusiva de produtos premium.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Colecao',
            layout: 'contained',
            content: {
              title: 'Nossa Colecao',
              subtitle: 'Pecas exclusivas selecionadas',
            },
          },
          {
            section_type: 'gallery',
            title: 'Produtos',
            layout: 'masonry',
            content: {
              title: 'Destaques',
              images: [],
            },
          },
          {
            section_type: 'cta',
            title: 'CTA Colecao',
            layout: 'centered',
            content: {
              title: 'Interessado em uma peca?',
              cta_text: 'Entre em Contato',
              cta_url: '/contato',
            },
          },
        ],
      },
      {
        title: 'Sobre',
        slug: 'sobre',
        page_type: 'content',
        meta_title: 'Nossa Historia | Marca Premium',
        meta_description: 'Conheca a historia por tras da nossa marca e nosso compromisso com a excelencia.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Sobre',
            layout: 'contained',
            content: {
              title: 'Nossa Historia',
              subtitle: 'Tradicao e excelencia',
            },
          },
          {
            section_type: 'text',
            title: 'Historia',
            layout: 'default',
            content: {
              title: 'Uma Jornada de Excelencia',
              content: '<p>Conte aqui a historia da sua marca, seus valores e compromisso com a qualidade.</p>',
            },
          },
          {
            section_type: 'stats',
            title: 'Numeros',
            layout: 'row',
            content: {
              items: [
                { value: '20+', label: 'Anos de Tradicao' },
                { value: '1000+', label: 'Clientes Exclusivos' },
                { value: '100%', label: 'Artesanal' },
              ],
            },
          },
        ],
      },
      {
        title: 'Contato',
        slug: 'contato',
        page_type: 'contact',
        meta_title: 'Contato | Marca Premium',
        meta_description: 'Entre em contato para atendimento exclusivo e personalizado.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Contato',
            layout: 'contained',
            content: {
              title: 'Atendimento Exclusivo',
              subtitle: 'Estamos a disposicao',
            },
          },
          {
            section_type: 'contact_form',
            title: 'Formulario',
            layout: 'default',
            content: {
              title: 'Fale Conosco',
              description: 'Atendimento personalizado para voce',
              button_text: 'Enviar Mensagem',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'verde-sustentavel',
    name: 'Verde Sustentavel',
    description: 'Kit eco-friendly para empresas sustentaveis e produtos naturais. Visual organico.',
    category: 'eco',
    preview: '#059669',
    theme: {
      colors: {
        primary_color: '#059669',
        secondary_color: '#047857',
        accent_color: '#34d399',
        background_color: '#ecfdf5',
        text_color: '#064e3b',
      },
      fonts: {
        heading_font: 'Raleway',
        body_font: 'Source Sans Pro',
        base_font_size: '16',
        border_radius: '16',
      },
    },
    menus: [
      { name: 'Inicio', slug: 'inicio', position: 0 },
      { name: 'Produtos', slug: 'produtos', position: 1 },
      { name: 'Sustentabilidade', slug: 'sustentabilidade', position: 2 },
      { name: 'Contato', slug: 'contato', position: 3 },
    ],
    pages: [
      {
        title: 'Inicio',
        slug: 'inicio',
        page_type: 'home',
        meta_title: 'Empresa Sustentavel | Produtos Naturais',
        meta_description: 'Produtos naturais e sustentaveis. Cuidando do planeta e de voce.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Hero Eco',
            layout: 'centered',
            content: {
              title: 'Natureza em Primeiro Lugar',
              subtitle: 'Produtos sustentaveis para um mundo melhor',
              cta_text: 'Conheca Nossos Produtos',
              cta_url: '/produtos',
            },
          },
          {
            section_type: 'features',
            title: 'Diferenciais Eco',
            layout: 'grid-3',
            content: {
              title: 'Nosso Compromisso',
              items: [
                { icon: 'leaf', title: '100% Natural', description: 'Ingredientes naturais' },
                { icon: 'recycle', title: 'Reciclavel', description: 'Embalagens sustentaveis' },
                { icon: 'heart', title: 'Cruelty Free', description: 'Nao testamos em animais' },
              ],
            },
          },
          {
            section_type: 'media_text',
            title: 'Missao',
            layout: 'media-right',
            content: {
              title: 'Nossa Missao',
              content: '<p>Criar produtos que respeitam o meio ambiente e promovem um estilo de vida sustentavel.</p>',
            },
          },
          {
            section_type: 'cta',
            title: 'CTA Eco',
            layout: 'centered',
            content: {
              title: 'Faca parte dessa mudanca',
              cta_text: 'Conheca Nossos Produtos',
              cta_url: '/produtos',
            },
          },
        ],
      },
      {
        title: 'Produtos',
        slug: 'produtos',
        page_type: 'content',
        meta_title: 'Produtos Naturais | Empresa Sustentavel',
        meta_description: 'Linha completa de produtos naturais e sustentaveis.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Produtos',
            layout: 'contained',
            content: {
              title: 'Nossos Produtos',
              subtitle: 'Naturais e sustentaveis',
            },
          },
          {
            section_type: 'features',
            title: 'Categorias',
            layout: 'grid-3',
            content: {
              title: 'Categorias',
              items: [
                { icon: 'droplet', title: 'Cuidados Pessoais', description: 'Produtos para seu bem-estar' },
                { icon: 'home', title: 'Casa', description: 'Produtos para sua casa' },
                { icon: 'sun', title: 'Bem-estar', description: 'Produtos para sua saude' },
              ],
            },
          },
          {
            section_type: 'cta',
            title: 'CTA Produtos',
            layout: 'centered',
            content: {
              title: 'Quer saber mais?',
              cta_text: 'Fale Conosco',
              cta_url: '/contato',
            },
          },
        ],
      },
      {
        title: 'Sustentabilidade',
        slug: 'sustentabilidade',
        page_type: 'content',
        meta_title: 'Sustentabilidade | Empresa Sustentavel',
        meta_description: 'Conheca nossas praticas sustentaveis e compromisso com o meio ambiente.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Sustentabilidade',
            layout: 'contained',
            content: {
              title: 'Sustentabilidade',
              subtitle: 'Nosso compromisso com o planeta',
            },
          },
          {
            section_type: 'text',
            title: 'Texto Sustentabilidade',
            layout: 'default',
            content: {
              title: 'Nossas Praticas',
              content: '<p>Descreva aqui suas praticas sustentaveis e compromisso ambiental.</p>',
            },
          },
          {
            section_type: 'stats',
            title: 'Impacto',
            layout: 'row',
            content: {
              title: 'Nosso Impacto',
              items: [
                { value: '0', label: 'Plastico Descartavel' },
                { value: '100%', label: 'Energia Renovavel' },
                { value: '50%', label: 'Reducao de CO2' },
              ],
            },
          },
        ],
      },
      {
        title: 'Contato',
        slug: 'contato',
        page_type: 'contact',
        meta_title: 'Contato | Empresa Sustentavel',
        meta_description: 'Entre em contato conosco. Juntos por um mundo mais sustentavel.',
        sections: [
          {
            section_type: 'hero_banner',
            title: 'Banner Contato',
            layout: 'contained',
            content: {
              title: 'Fale Conosco',
              subtitle: 'Estamos aqui para ajudar',
            },
          },
          {
            section_type: 'contact_form',
            title: 'Formulario',
            layout: 'default',
            content: {
              title: 'Envie sua Mensagem',
              button_text: 'Enviar',
            },
          },
          {
            section_type: 'faq',
            title: 'FAQ',
            layout: 'accordion',
            content: {
              title: 'Perguntas Frequentes',
              items: [
                { question: 'Os produtos sao veganos?', answer: '<p>Sim, todos os nossos produtos sao 100% veganos.</p>' },
                { question: 'Fazem entregas?', answer: '<p>Sim, entregamos em todo o Brasil.</p>' },
              ],
            },
          },
        ],
      },
    ],
  },
];

export default templateKits;
