import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [tailwind()],
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  build: {
    assets: '_assets'
  },
  vite: {
    define: {
      'import.meta.env.API_URL': JSON.stringify(process.env.API_URL || 'https://cms-site-api.planacacabamentos.workers.dev')
    }
  }
});
