const API_URL = import.meta.env.API_URL || 'https://cms-site-api.planacacabamentos.workers.dev';

export async function fetchAPI(endpoint: string) {
  const res = await fetch(`${API_URL}${endpoint}`);
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  return res.json();
}

export async function getSettings() {
  const data = await fetchAPI('/api/public/settings');
  return data.data || data;
}

export async function getTheme() {
  const data = await fetchAPI('/api/public/theme');
  return data.data || data;
}

export async function getNavigation() {
  const data = await fetchAPI('/api/public/navigation');
  return data.data || data;
}

export async function getPage(slug: string) {
  const data = await fetchAPI(`/api/public/pages/${slug}`);
  return data.data || data;
}

export async function getAllPages() {
  const data = await fetchAPI('/api/public/pages');
  return data.data || [];
}
