// Bundles each Lambda into a single self-contained file with esbuild.
//
// Why bundle instead of zipping node_modules: the Lambda source folders are
// captured by the root Nx workspace glob (`libs/**`), so `yarn install` hoists
// their dependencies (jsonwebtoken, jwks-rsa, ...) to the ROOT node_modules
// rather than a local one. Zipping `<lambda>/node_modules` therefore shipped an
// (almost) empty folder. Bundling resolves every dependency at build time and
// emits one file, removing that fragility entirely.
//
// esbuild is provided by the toolchain (transitive dependency of the Nx/Angular
// build packages) and resolved from the root node_modules.
import { build } from 'esbuild';

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  // The AWS SDK v3 is preinstalled in the Lambda Node.js runtime — keep it
  // external so we don't ship (a large, duplicate) copy.
  external: ['@aws-sdk/*'],
  // Bundled CommonJS deps (e.g. jsonwebtoken) call require() for Node built-ins
  // like 'buffer'/'crypto'. ESM output has no require in scope, so synthesize
  // one from import.meta.url; esbuild's interop shim then uses it.
  banner: {
    js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);",
  },
};

const lambdas = [
  {
    entry: 'libs/backend/lambdas/src/dynamodb/index.mjs',
    outfile: 'dist/lambdas/dynamodb/index.mjs',
  },
  {
    entry: 'libs/backend/lambdas/src/yahoo/index.mjs',
    outfile: 'dist/lambdas/yahoo/index.mjs',
  },
];

for (const { entry, outfile } of lambdas) {
  await build({ ...shared, entryPoints: [entry], outfile });
  console.log(`Bundled ${entry} -> ${outfile}`);
}
