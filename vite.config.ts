import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, type Plugin} from 'vite';

// Generates dist/sw.js (offline support) from pwa/sw.template.js with the real list of built files.
function pwaServiceWorker(): Plugin {
  return {
    name: 'lockdown13-pwa-sw',
    apply: 'build',
    generateBundle(_options, bundle) {
      const publicDir = path.resolve(__dirname, 'public');
      const walk = (dir: string, prefix = ''): string[] =>
        fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) =>
          e.isDirectory() ? walk(path.join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]
        );
      const publicFiles = walk(publicDir);
      const python = publicFiles.filter((f) => f.startsWith('pyodide/'));
      const core = [
        'index.html',
        './',
        ...Object.keys(bundle).filter((f) => f !== 'sw.js'),
        ...publicFiles.filter((f) => !f.startsWith('pyodide/') && f !== 'sw.js'),
      ];
      const template = fs.readFileSync(path.resolve(__dirname, 'pwa/sw.template.js'), 'utf8');
      const source = template
        .replace('__VERSION__', Date.now().toString(36))
        .replace('__CORE_FILES__', JSON.stringify([...new Set(core)]))
        .replace('__PYTHON_FILES__', JSON.stringify(python));
      this.emitFile({type: 'asset', fileName: 'sw.js', source});
    },
  };
}

export default defineConfig(() => {
  return {
    // Relative base so the game works on GitHub Pages sub-paths, Vercel, Netlify or any static host.
    base: './',
    plugins: [react(), tailwindcss(), pwaServiceWorker()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
