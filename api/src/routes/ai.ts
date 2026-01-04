/**
 * Rotas de IA (Workers AI)
 * Geração de conteúdo, SEO, descrições
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import type { Env } from '../index';

export const aiRoutes = new Hono<{ Bindings: Env }>();

// Middleware de autenticação
const authMiddleware = async (c: any, next: any) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return c.json({ error: 'Não autenticado' }, 401);
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Token inválido' }, 401);
  }
};

aiRoutes.use('*', authMiddleware);

// Modelo padrão para geração de texto
const TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

// ==================== GERAR CONTEÚDO ====================

// Gerar conteúdo de post/página
aiRoutes.post('/generate-content', async (c) => {
  try {
    const { title, topic, tone, length, type } = await c.req.json();

    if (!title && !topic) {
      return c.json({ error: 'Título ou tópico é obrigatório' }, 400);
    }

    const toneMap: Record<string, string> = {
      professional: 'profissional e formal',
      casual: 'casual e amigável',
      technical: 'técnico e detalhado',
      persuasive: 'persuasivo e convincente',
    };

    const lengthMap: Record<string, string> = {
      short: '2-3 parágrafos curtos',
      medium: '4-5 parágrafos',
      long: '6-8 parágrafos detalhados',
    };

    const prompt = `Você é um redator especialista em criar conteúdo para websites em português brasileiro.

Crie um conteúdo ${type === 'post' ? 'de blog post' : 'de página institucional'} sobre: "${title || topic}"

Requisitos:
- Tom: ${toneMap[tone] || 'profissional'}
- Tamanho: ${lengthMap[length] || 'médio'}
- Use subtítulos (##) para organizar o conteúdo
- Inclua uma introdução envolvente
- Termine com uma conclusão ou call-to-action
- Escreva em português brasileiro
- Use formatação Markdown

Gere apenas o conteúdo, sem explicações adicionais.`;

    const response = await c.env.AI.run(TEXT_MODEL, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });

    const content = response.response || '';

    return c.json({ 
      success: true, 
      data: { content }
    });
  } catch (error) {
    console.error('Generate content error:', error);
    return c.json({ error: 'Erro ao gerar conteúdo' }, 500);
  }
});

// ==================== GERAR SEO ====================

// Gerar meta title e description
aiRoutes.post('/generate-seo', async (c) => {
  try {
    const { title, content, type } = await c.req.json();

    if (!title) {
      return c.json({ error: 'Título é obrigatório' }, 400);
    }

    const contentPreview = content ? content.substring(0, 500) : '';

    const prompt = `Você é um especialista em SEO. Gere meta tags otimizadas para o seguinte conteúdo:

Título: ${title}
Tipo: ${type === 'post' ? 'Blog Post' : 'Página'}
${contentPreview ? `Prévia do conteúdo: ${contentPreview}` : ''}

Gere em formato JSON válido (sem markdown):
{
  "meta_title": "título otimizado com até 60 caracteres",
  "meta_description": "descrição otimizada com até 160 caracteres"
}

Requisitos:
- Meta title: máximo 60 caracteres, inclua palavra-chave principal
- Meta description: máximo 160 caracteres, seja descritivo e inclua call-to-action
- Escreva em português brasileiro
- Retorne APENAS o JSON, sem explicações`;

    const response = await c.env.AI.run(TEXT_MODEL, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    });

    let result = response.response || '';
    
    // Tentar extrair JSON da resposta
    try {
      // Remove possíveis backticks de markdown
      result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const seo = JSON.parse(result);
      return c.json({ success: true, data: seo });
    } catch {
      // Se não conseguir parsear, retorna valores padrão
      return c.json({ 
        success: true, 
        data: {
          meta_title: title.substring(0, 60),
          meta_description: `Saiba mais sobre ${title}`.substring(0, 160)
        }
      });
    }
  } catch (error) {
    console.error('Generate SEO error:', error);
    return c.json({ error: 'Erro ao gerar SEO' }, 500);
  }
});

// ==================== GERAR EXCERPT ====================

// Gerar resumo/excerpt
aiRoutes.post('/generate-excerpt', async (c) => {
  try {
    const { title, content } = await c.req.json();

    if (!title && !content) {
      return c.json({ error: 'Título ou conteúdo é obrigatório' }, 400);
    }

    const prompt = `Crie um resumo/excerpt curto e envolvente para um post de blog.

Título: ${title || 'Sem título'}
${content ? `Conteúdo: ${content.substring(0, 1000)}` : ''}

Requisitos:
- Máximo 2 frases (até 200 caracteres)
- Seja envolvente e desperte curiosidade
- Português brasileiro
- Retorne APENAS o texto do resumo, sem aspas ou explicações`;

    const response = await c.env.AI.run(TEXT_MODEL, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    });

    const excerpt = (response.response || '').trim().replace(/^["']|["']$/g, '');

    return c.json({ success: true, data: { excerpt } });
  } catch (error) {
    console.error('Generate excerpt error:', error);
    return c.json({ error: 'Erro ao gerar resumo' }, 500);
  }
});

// ==================== MELHORAR TEXTO ====================

// Melhorar/reescrever texto
aiRoutes.post('/improve-text', async (c) => {
  try {
    const { text, action } = await c.req.json();

    if (!text) {
      return c.json({ error: 'Texto é obrigatório' }, 400);
    }

    const actionPrompts: Record<string, string> = {
      improve: 'Melhore este texto, tornando-o mais claro e profissional',
      simplify: 'Simplifique este texto, tornando-o mais fácil de entender',
      expand: 'Expanda este texto, adicionando mais detalhes e exemplos',
      summarize: 'Resuma este texto em uma versão mais curta',
      formal: 'Reescreva este texto em tom mais formal',
      casual: 'Reescreva este texto em tom mais casual e amigável',
    };

    const instruction = actionPrompts[action] || actionPrompts.improve;

    const prompt = `${instruction}:

"${text}"

Requisitos:
- Mantenha o significado original
- Português brasileiro
- Retorne APENAS o texto melhorado, sem explicações`;

    const response = await c.env.AI.run(TEXT_MODEL, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
    });

    const improved = (response.response || '').trim();

    return c.json({ success: true, data: { text: improved } });
  } catch (error) {
    console.error('Improve text error:', error);
    return c.json({ error: 'Erro ao melhorar texto' }, 500);
  }
});

// ==================== GERAR ALT TEXT ====================

// Gerar alt text para imagem (baseado no contexto)
aiRoutes.post('/generate-alt', async (c) => {
  try {
    const { filename, context } = await c.req.json();

    if (!filename) {
      return c.json({ error: 'Nome do arquivo é obrigatório' }, 400);
    }

    const prompt = `Gere um texto alternativo (alt text) descritivo para uma imagem.

Nome do arquivo: ${filename}
${context ? `Contexto de uso: ${context}` : ''}

Requisitos:
- Máximo 125 caracteres
- Seja descritivo mas conciso
- Português brasileiro
- Retorne APENAS o alt text, sem aspas ou explicações`;

    const response = await c.env.AI.run(TEXT_MODEL, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
    });

    const alt_text = (response.response || '').trim().replace(/^["']|["']$/g, '');

    return c.json({ success: true, data: { alt_text } });
  } catch (error) {
    console.error('Generate alt error:', error);
    return c.json({ error: 'Erro ao gerar alt text' }, 500);
  }
});
