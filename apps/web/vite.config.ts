import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Base path resolution:
// 1. VITE_BASE_PATH, if set, wins (useful for local subpath testing).
// 2. Inside GitHub Actions, derive `/<repo-name>/` from GITHUB_REPOSITORY so the
//    build works under https://<user>.github.io/<repo-name>/.
// 3. Otherwise serve from `/` for local dev.
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base =
  process.env.VITE_BASE_PATH ??
  (process.env.GITHUB_ACTIONS === 'true' && repoName ? `/${repoName}/` : '/');

// GitHub Pages serves 404.html for unknown paths. Copying index.html there means a
// refresh or deep link under the subpath still boots the single-page app instead of
// showing the GitHub 404 page. `.nojekyll` keeps Pages from running Jekyll on the output.
function githubPagesFallback(): Plugin {
  let outDir = 'dist';
  return {
    name: 'github-pages-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const index = resolve(outDir, 'index.html');
      if (existsSync(index)) copyFileSync(index, resolve(outDir, '404.html'));
      writeFileSync(resolve(outDir, '.nojekyll'), '');
    },
  };
}

export default defineConfig({
  plugins: [react(), githubPagesFallback()],
  base,
});
