import { build } from '../../../node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/lib/main.js';
import path from 'node:path';

const entry = path.resolve('.open-next/server-functions/default/index.mjs');

try {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    target: 'esnext',
    platform: 'node',
    plugins: [
      {
        name: 'trace-sharp',
        setup(build) {
          build.onResolve({ filter: /^sharp$/ }, (args) => {
            console.log('===> BARE SHARP IMPORTED BY:', args.importer, 'from path:', args.resolveDir);
          });
        },
      },
    ],
  });
  console.log('Build succeeded!');
} catch (err) {
  if (err.errors) {
    for (const error of err.errors) {
      console.log('ERROR:', error.text);
      console.log('LOCATION:', error.location);
    }
  }
}
