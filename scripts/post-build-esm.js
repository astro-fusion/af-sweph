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
    
    // Inject ESM compatibility shims for utils.js (which becomes utils.mjs)
    // failing which `require` and `__dirname` would be undefined
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
      
      // Inject after imports (simplistic approach: prepend to file or after first few lines?)
      // Since tsc output puts imports at top, prepending works IF there are no shell shebangs (unlikely for library).
      // However, imports must come before other code.
      // But we are injecting imports ourselves.
      // The issue is if existing imports rely on `require`? No, existing imports are ESM `import ...`.
      // `require` is used in the BODY.
      // So prepending imports is fine.
      
      content = shim + content;
      console.log(`✅ Injected ESM shims into ${file.replace('.js', '.mjs')}`);
    }
    
    fs.writeFileSync(dest, content);
  });
  
  // Cleanup temp esm dir
  fs.rmSync(esmDir, { recursive: true, force: true });
  console.log('✅ ESM build completed successfully');
} else {
  console.log('⚠️ dist-esm directory not found, skipping ESM post-processing');
}
