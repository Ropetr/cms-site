/**
 * Design Templates - Temas Predefinidos para o CMS
 * 
 * Cada template inclui:
 * - name: Nome do template
 * - description: Descricao do estilo
 * - preview: Cor principal para preview
 * - colors: Configuracoes de cores
 * - fonts: Configuracoes de tipografia
 */

export const designTemplates = [
  {
    id: 'vermelho-corporativo',
    name: 'Vermelho Corporativo',
    description: 'Tema profissional com vermelho institucional e visual elegante',
    preview: '#AA000E',
    colors: {
      primary_color: '#AA000E',
      secondary_color: '#1a1a1a',
      accent_color: '#D4A574',
      background_color: '#ffffff',
      text_color: '#1f2937',
    },
    fonts: {
      heading_font: 'Montserrat',
      body_font: 'Inter',
      base_font_size: '16',
      border_radius: '8',
    },
  },
  {
    id: 'moderno-azul',
    name: 'Moderno Azul',
    description: 'Design contemporaneo com tons de azul, ideal para tecnologia e servicos',
    preview: '#2563eb',
    colors: {
      primary_color: '#2563eb',
      secondary_color: '#1e3a5f',
      accent_color: '#06b6d4',
      background_color: '#f8fafc',
      text_color: '#0f172a',
    },
    fonts: {
      heading_font: 'Poppins',
      body_font: 'Open Sans',
      base_font_size: '16',
      border_radius: '12',
    },
  },
  {
    id: 'elegante-escuro',
    name: 'Elegante Escuro',
    description: 'Tema sofisticado com fundo escuro e detalhes dourados, perfeito para luxo',
    preview: '#18181b',
    colors: {
      primary_color: '#d4af37',
      secondary_color: '#18181b',
      accent_color: '#f59e0b',
      background_color: '#27272a',
      text_color: '#fafafa',
    },
    fonts: {
      heading_font: 'Playfair Display',
      body_font: 'Lato',
      base_font_size: '17',
      border_radius: '4',
    },
  },
  {
    id: 'natural-verde',
    name: 'Natural Verde',
    description: 'Estilo organico com verdes naturais, otimo para sustentabilidade e saude',
    preview: '#059669',
    colors: {
      primary_color: '#059669',
      secondary_color: '#064e3b',
      accent_color: '#84cc16',
      background_color: '#f0fdf4',
      text_color: '#14532d',
    },
    fonts: {
      heading_font: 'Raleway',
      body_font: 'Source Sans Pro',
      base_font_size: '16',
      border_radius: '16',
    },
  },
  {
    id: 'minimalista-clean',
    name: 'Minimalista Clean',
    description: 'Design limpo e minimalista com muito espaco em branco e tipografia elegante',
    preview: '#374151',
    colors: {
      primary_color: '#374151',
      secondary_color: '#6b7280',
      accent_color: '#ec4899',
      background_color: '#ffffff',
      text_color: '#111827',
    },
    fonts: {
      heading_font: 'Inter',
      body_font: 'Inter',
      base_font_size: '15',
      border_radius: '6',
    },
  },
];

export default designTemplates;
