import { defineMiddleware } from 'astro:middleware';

const API_URL = import.meta.env.API_URL || 'https://cms-site-api.planacacabamentos.workers.dev';

interface SiteInfo {
  id: string;
  name: string;
  domain: string;
  subdomain: string;
}

async function resolveTenant(host: string): Promise<SiteInfo | null> {
  try {
    const response = await fetch(`${API_URL}/api/public/resolve-tenant?host=${encodeURIComponent(host)}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error resolving tenant:', error);
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const host = context.request.headers.get('host') || '';
  
  const site = await resolveTenant(host);
  
  if (site) {
    context.locals.siteId = site.id;
    context.locals.siteName = site.name;
    context.locals.siteDomain = site.domain || host;
  } else {
    context.locals.siteId = '1';
    context.locals.siteName = 'Default Site';
    context.locals.siteDomain = host;
  }
  
  return next();
});
