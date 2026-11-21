/**
 * Bundle the Sharetribe Flex JS SDK for Campus Connect browser pages.
 * Output: campus/vendor/sharetribe-sdk.js exposing window.sharetribeSdk
 *
 * Usage: node scripts/build-campus.js
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'campus', 'vendor');
const outFile = path.join(outDir, 'sharetribe-sdk.js');
const entry = path.join(outDir, '_sdk-entry.js');

fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  entry,
  `import * as sharetribeSdk from 'sharetribe-flex-sdk';
window.sharetribeSdk = sharetribeSdk;
`
);

esbuild
  .build({
    entryPoints: [entry],
    bundle: true,
    outfile: outFile,
    format: 'iife',
    platform: 'browser',
    target: ['es2018'],
    minify: true,
    sourcemap: false,
    logLevel: 'info',
  })
  .then(() => {
    fs.unlinkSync(entry);
    const size = fs.statSync(outFile).size;
    console.log(`Wrote ${outFile} (${Math.round(size / 1024)} KB)`);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
