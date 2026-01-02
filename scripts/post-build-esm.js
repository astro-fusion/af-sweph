const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const esmDir = path.resolve(__dirname, '../dist-esm');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Process ESM files
if (fs.existsSync(esmDir)) {
  const files = fs.readdirSync(esmDir).filter(f => f.endsWith('.js'));
  
  files.forEach(file => {
    const src = path.join(esmDir, file);
    const dest = path.join(distDir, file.replace('.js', '.mjs'));
    
    let content = fs.readFileSync(src, 'utf8');
    
    // 1. Inject ESM compatibility shims for utils.js (which becomes utils.mjs)
    if (file === 'utils.js') {
      const shim = [
        "import { createRequire } from 'module';",
        "import { fileURLToPath } from 'url';",
        "import { dirname } from 'path';",
        "",
        "const require = createRequire(import.meta.url);",
        "const __filename = fileURLToPath(import.meta.url);",
        "const __dirname = dirname(__filename);",
        "",
        ""
      ].join('\n');
      
      content = shim + content;
      console.log(`✅ Injected ESM shims into ${file.replace('.js', '.mjs')}`);
    }

    // 2. Add .js extensions to relative imports/exports
    // Matches: import ... from './foo' or export ... from './foo'
    // Capture group 1: import/export statement part
    // Capture group 2: quote
    // Capture group 3: path (starting with . or ..)
    // Capture group 4: quote
    // We only want to append .js if it doesn't already have an extension (simplistic check)
    // Actually simpler regex: replacing /from\s+['"](\..*?)['"]/g
    
    content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, importPath) => {
      if (!importPath.endsWith('.js') && !importPath.endsWith('.mjs')) {
        return `from '${importPath}.js'`;
      }
      return match;
    });

    // Also handle dynamic imports() if any (not present in this lib likely, but good practice)
    content = content.replace(/import\s*\(['"](\.[^'"]+)['"]\)/g, (match, importPath) => {
       if (!importPath.endsWith('.js') && !importPath.endsWith('.mjs')) {
        return `import('${importPath}.js')`;
      }
      return match;
    });
    
    fs.writeFileSync(dest, content);
  });
  
  // Cleanup temp esm dir
  fs.rmSync(esmDir, { recursive: true, force: true });
  console.log('✅ ESM build completed successfully with extension fix');
} else {
  console.log('⚠️ dist-esm directory not found, skipping ESM post-processing');
}
