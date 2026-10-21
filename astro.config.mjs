import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://minervo.studio',
  trailingSlash: 'ignore',
  // CSS en línea: evita una petición que bloquea el primer pintado
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') && !page.includes('/prototipos/') && !page.includes('/lab/') })],
});
