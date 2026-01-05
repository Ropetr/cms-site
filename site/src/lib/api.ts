const API_URL = import.meta.env.API_URL || 'https://cms-site-api.planacacabamentos.workers.dev';

export async function fetchAPI(endpoint: string, siteId?: string) {
  const headers: Record<string, string> = {};
  if (siteId) {
    headers['X-Site-Id'] = siteId;
  }
  const res = await fetch(`${API_URL}${endpoint}`, { headers });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  return res.json();
}

export async function getSettings(siteId?: string) {
  const data = await fetchAPI('/api/public/settings', siteId);
  return data.data || data;
}

export async function getTheme(siteId?: string) {
  const data = await fetchAPI('/api/public/theme', siteId);
  return data.data || data;
}

export async function getNavigation(siteId?: string) {
  const data = await fetchAPI('/api/public/navigation', siteId);
  return data.data || data;
}

export async function getPage(slug: string, siteId?: string) {
  const data = await fetchAPI(`/api/public/pages/${slug}`, siteId);
  return data.data || data;
}

export async function getPreviewPage(slug: string, siteId?: string) {
  const data = await fetchAPI(`/api/public/preview/${slug}`, siteId);
  return data.data || data;
}

export async function getAllPages(siteId?: string) {
  const data = await fetchAPI('/api/public/pages', siteId);
  return data.data || [];
}

export async function getPosts(siteId?: string) {
  const data = await fetchAPI('/api/public/posts', siteId);
  return data.data || [];
}

export async function getPost(slug: string, siteId?: string) {
  const data = await fetchAPI(`/api/public/posts/${slug}`, siteId);
  return data.data || data;
}

export async function getCategories(siteId?: string) {
  const data = await fetchAPI('/api/public/categories', siteId);
  return data.data || [];
}
