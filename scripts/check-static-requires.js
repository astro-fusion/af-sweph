const fs = require('fs');
const path = require('path');

const loaderPath = path.resolve(__dirname, '../dist/native-loader.js');
const content = fs.readFileSync(loaderPath, 'utf8');

const staticRequires = ["require('swisseph-v2')", "require('node-gyp-build')"];
const found = staticRequires.filter(req => content.includes(req));

if (found.length > 0) {
  console.error(`ERROR: Static require found in dist/native-loader.js: ${found.join(', ')}`);
  process.exit(1);
}

console.log('✅ No static requires detected in dist/native-loader.js');
