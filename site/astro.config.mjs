import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  build: {
    assets: '_assets'
  },
  vite: {
    define: {
      'import.meta.env.API_URL': JSON.stringify(process.env.API_URL || 'https://cms-site-api.planacacabamentos.workers.dev')
    }
  }
});
