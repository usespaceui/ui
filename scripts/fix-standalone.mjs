import fs from 'node:fs';
import path from 'node:path';

// Fix monorepo path mismatch for OpenNext on Windows
const standaloneNextServer = path.resolve('.next/standalone/.next/server');
if (!fs.existsSync(standaloneNextServer)) {
  fs.mkdirSync(standaloneNextServer, { recursive: true });
  console.log('[fix-standalone] Created directory:', standaloneNextServer);
}

// If monorepo standalone folder has files, also make sure base standalone has access
const monorepoServer = path.resolve('.next/standalone/apps/www/.next/server');
if (fs.existsSync(monorepoServer)) {
  for (const file of fs.readdirSync(monorepoServer)) {
    const src = path.join(monorepoServer, file);
    const dest = path.join(standaloneNextServer, file);
    if (!fs.existsSync(dest)) {
      try {
        fs.copyFileSync(src, dest);
      } catch {}
    }
  }
  console.log('[fix-standalone] Synced standalone server files.');
}
