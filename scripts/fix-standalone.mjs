import fs from 'node:fs';
import path from 'node:path';

// Fix monorepo path mismatch for OpenNext across OS environments (Windows, Linux CI)
const monorepoDotNext = path.resolve('.next/standalone/apps/www/.next');
const standaloneDotNext = path.resolve('.next/standalone/.next');
const sourceServer = path.resolve('.next/server');

// Ensure both standalone roots exist
const targetServers = [
  path.resolve('.next/standalone/.next/server'),
  path.resolve('.next/standalone/apps/www/.next/server'),
];

for (const targetServer of targetServers) {
  fs.mkdirSync(targetServer, { recursive: true });

  if (fs.existsSync(sourceServer)) {
    // Copy missing top-level files from .next/server to targetServer
    const files = fs.readdirSync(sourceServer);
    for (const file of files) {
      const src = path.join(sourceServer, file);
      const dest = path.join(targetServer, file);
      if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
    }
  }

  // Next 16 Node proxy/middleware fix: ensure server/middleware.js and .nft.json exist
  const mwDest = path.join(targetServer, 'middleware.js');
  if (!fs.existsSync(mwDest)) {
    const mwSrc = path.join(sourceServer, 'middleware.js');
    if (fs.existsSync(mwSrc)) {
      fs.copyFileSync(mwSrc, mwDest);
    } else {
      fs.writeFileSync(mwDest, 'module.exports = { default: () => new Response(null, { status: 200 }) };');
    }
  }

  const nftDest = path.join(targetServer, 'middleware.js.nft.json');
  if (!fs.existsSync(nftDest)) {
    const nftSrc = path.join(sourceServer, 'middleware.js.nft.json');
    if (fs.existsSync(nftSrc)) {
      fs.copyFileSync(nftSrc, nftDest);
    } else {
      fs.writeFileSync(nftDest, JSON.stringify({ version: 1, files: [] }));
    }
  }
}

if (fs.existsSync(monorepoDotNext)) {
  fs.cpSync(monorepoDotNext, standaloneDotNext, { recursive: true });
  console.log('[fix-standalone] Mirrored monorepo standalone .next directory successfully.');
} else if (fs.existsSync(standaloneDotNext)) {
  fs.cpSync(standaloneDotNext, monorepoDotNext, { recursive: true });
  console.log('[fix-standalone] Mirrored root standalone .next directory to monorepo successfully.');
}


// Ensure sharp stubs exist to prevent native C++ addon (.node) failures during Cloudflare Worker bundling
function ensureSharpStub(targetDir) {
  const sharpDir = path.join(targetDir, 'sharp');
  const imgDir = path.join(targetDir, '@img', 'sharp-win32-x64');
  
  fs.mkdirSync(sharpDir, { recursive: true });
  fs.writeFileSync(
    path.join(sharpDir, 'package.json'),
    JSON.stringify({ name: 'sharp', version: '0.35.4', main: 'index.js' }, null, 2)
  );
  fs.writeFileSync(
    path.join(sharpDir, 'index.js'),
    `module.exports = function sharp() {
  return {
    resize: () => ({ png: () => ({ toBuffer: () => Promise.resolve(Buffer.alloc(0)) }) }),
    metadata: () => Promise.resolve({ width: 0, height: 0 }),
  };
};`
  );

  fs.mkdirSync(imgDir, { recursive: true });
  fs.writeFileSync(
    path.join(imgDir, 'package.json'),
    JSON.stringify({ name: '@img/sharp-win32-x64', version: '0.35.4', main: 'index.js' }, null, 2)
  );
  fs.writeFileSync(path.join(imgDir, 'index.js'), 'module.exports = {};');
}

ensureSharpStub(path.resolve('node_modules'));
ensureSharpStub(path.resolve('.next/standalone/node_modules'));
if (fs.existsSync('.next/standalone/apps/www/node_modules')) {
  ensureSharpStub(path.resolve('.next/standalone/apps/www/node_modules'));
}

// Neutralize any native binaries in monorepo root .pnpm
const rootPnpm = path.resolve('../../node_modules/.pnpm');
if (fs.existsSync(rootPnpm)) {
  const entries = fs.readdirSync(rootPnpm);
  for (const entry of entries) {
    if (entry.startsWith('@img+sharp-')) {
      const pkgDir = path.join(rootPnpm, entry, 'node_modules');
      if (fs.existsSync(pkgDir)) {
        const subDirs = fs.readdirSync(pkgDir);
        for (const sub of subDirs) {
          const target = path.join(pkgDir, sub);
          if (fs.statSync(target).isDirectory()) {
            const innerDirs = fs.readdirSync(target);
            for (const inner of innerDirs) {
              const innerTarget = path.join(target, inner);
              const indexCjs = path.join(innerTarget, 'index.cjs');
              if (fs.existsSync(indexCjs)) {
                fs.writeFileSync(indexCjs, 'module.exports = {};');
              }
            }
          }
        }
      }
    } else if (entry.startsWith('sharp@')) {
      const sharpPkg = path.join(rootPnpm, entry, 'node_modules', 'sharp');
      const distSharpCjs = path.join(sharpPkg, 'dist', 'sharp.cjs');
      const distIndexCjs = path.join(sharpPkg, 'dist', 'index.cjs');
      const distIndexMjs = path.join(sharpPkg, 'dist', 'index.mjs');
      if (fs.existsSync(distSharpCjs)) {
        fs.writeFileSync(distSharpCjs, 'module.exports = {};');
      }
      if (fs.existsSync(distIndexCjs)) {
        fs.writeFileSync(distIndexCjs, `function sharp() {
  return {
    resize: () => ({ png: () => ({ toBuffer: () => Promise.resolve(Buffer.alloc(0)) }) }),
    metadata: () => Promise.resolve({ width: 0, height: 0 }),
  };
}
sharp.default = sharp;
module.exports = sharp;`);
      }
      if (fs.existsSync(distIndexMjs)) {
        fs.writeFileSync(distIndexMjs, `function sharp() {
  return {
    resize: () => ({ png: () => ({ toBuffer: () => Promise.resolve(Buffer.alloc(0)) }) }),
    metadata: () => Promise.resolve({ width: 0, height: 0 }),
  };
}
sharp.default = sharp;
export default sharp;`);
      }
    } else if (entry.startsWith('fumadocs-core@')) {
      const fumaFullJs = path.join(rootPnpm, entry, 'node_modules', 'fumadocs-core', 'dist', 'highlight', 'shiki', 'full.js');
      if (fs.existsSync(fumaFullJs)) {
        fs.writeFileSync(
          fumaFullJs,
          `const dummyHighlighter = {
  getBundledLanguages: () => ({}),
  getLoadedLanguages: () => [],
  loadLanguage: async () => {},
  loadTheme: async () => {},
  codeToHast: (code) => ({
    type: "element",
    tagName: "pre",
    properties: {},
    children: [{ type: "element", tagName: "code", properties: {}, children: [{ type: "text", value: code }] }],
  }),
};
const defaultShikiFactory = {
  getOrInit: async () => dummyHighlighter,
  init: async () => dummyHighlighter,
};
const wasmShikiFactory = defaultShikiFactory;
export { defaultShikiFactory, wasmShikiFactory };`
        );
      }
    } else if (entry.startsWith('shiki@')) {
      const shikiDist = path.join(rootPnpm, entry, 'node_modules', 'shiki', 'dist');
      if (fs.existsSync(shikiDist)) {
        const files = fs.readdirSync(shikiDist);
        for (const f of files) {
          if (f.startsWith('langs-bundle-full') && f.endsWith('.mjs')) {
            fs.writeFileSync(
              path.join(shikiDist, f),
              `const bundledLanguagesInfo = [];
const bundledLanguagesAlias = {};
const bundledLanguagesBase = {};
const bundledLanguages = {};
export { bundledLanguagesInfo as i, bundledLanguagesAlias as n, bundledLanguagesBase as r, bundledLanguages as t };`
            );
          }
        }
        const wasmMjs = path.join(shikiDist, 'wasm.mjs');
        if (fs.existsSync(wasmMjs)) {
          fs.writeFileSync(wasmMjs, 'export default {};');
        }
      }
    }
  }
}

console.log('[fix-standalone] Ensured sharp and shiki stubs in node_modules and .pnpm.');
