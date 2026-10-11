import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const skipNextBuild = args.includes('--skipNextBuild') || process.env.SKIP_NEXT_APP_BUILD === '1';

console.log('🚀 [build-cloudflare] Starting Cloudflare Worker build pipeline...');

if (!skipNextBuild) {
  console.log('📦 [build-cloudflare] Running Next.js build...');
  execSync('npx next build', { stdio: 'inherit' });
} else {
  console.log('⏩ [build-cloudflare] Skipping Next.js build (--skipNextBuild).');
}

console.log('🔧 [build-cloudflare] Running standalone & stub fixes...');
execSync('node scripts/fix-standalone.mjs', { stdio: 'inherit' });

console.log('⚡ [build-cloudflare] Running OpenNext Cloudflare bundle...');
execSync('npx opennextjs-cloudflare build --skipNextBuild', { stdio: 'inherit' });

const handlerPath = path.resolve('.open-next/server-functions/default/handler.mjs');
if (fs.existsSync(handlerPath)) {
  // Pre-minify patch: Next.js getMiddlewareManifest attempts to dynamically require middleware-manifest.json
  // which does not exist as a physical file on workerd. Replace it with the inlined manifest structure.
  let handlerCode = fs.readFileSync(handlerPath, 'utf8');
  handlerCode = handlerCode.replace(
    /require\s*\(\s*this\.middlewareManifestPath\s*\)/g,
    '({version:3,middleware:{},sortedMiddleware:[],functions:{}})'
  );
  fs.writeFileSync(handlerPath, handlerCode);

  console.log('🗜️  [build-cloudflare] Minifying handler.mjs to guarantee size < 64 MiB...');
  execSync(`npx esbuild "${handlerPath}" --minify --allow-overwrite --outfile="${handlerPath}"`, {
    stdio: 'inherit',
  });

  // Post-minify patch: esbuild re-introduces __require which throws "Dynamic require ... is not supported".
  // Restore __require to real require (workerd nodejs_compat) and ensure middleware-manifest is not dynamically required.
  let minCode = fs.readFileSync(handlerPath, 'utf8');
  minCode = minCode
    .replace(/(?<![.#$\w])__require\d?\(/g, 'require(')
    .replace(/(?<![.#$\w])__require\d?\./g, 'require.');
  minCode = minCode.replace(
    /require\s*\(\s*this\.middlewareManifestPath\s*\)/g,
    '({version:3,middleware:{},sortedMiddleware:[],functions:{}})'
  );
  fs.writeFileSync(handlerPath, minCode);

  const stats = fs.statSync(handlerPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 [build-cloudflare] Final handler.mjs size: ${sizeMb} MiB`);

  if (stats.size > 64 * 1024 * 1024) {
    console.error(`❌ [build-cloudflare] ERROR: handler.mjs exceeds Cloudflare limit (64 MiB): ${sizeMb} MiB`);
    process.exit(1);
  }
  console.log(`✅ [build-cloudflare] Worker bundle verified successfully (${sizeMb} MiB <= 64 MiB)!`);
} else {
  console.error('❌ [build-cloudflare] ERROR: handler.mjs not found at .open-next/server-functions/default/handler.mjs');
  process.exit(1);
}
