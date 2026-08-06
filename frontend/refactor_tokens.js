const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('frontend/src');

files.forEach(f => {
  if (f.endsWith('.tsx') || f.endsWith('.ts')) {
    if (f.replace(/\\/g, '/').includes('lib/api.ts')) return;
    
    let content = fs.readFileSync(f, 'utf8');
    let originalContent = content;

    // We already added `try/catch` in a few files manually (like entry/page.tsx, home/page.tsx). 
    // Let's normalize them back to const token = getToken();
    content = content.replace(/let token = null;\s*try\s*\{\s*token = localStorage\.getItem\('token'\);\s*\}\s*catch\s*\(e\)\s*\{\s*(console\.warn\('[^']+'\);)?\s*\}/g, 'const token = getToken();');

    // Replace all other usages
    content = content.replace(/localStorage\.getItem\('token'\)/g, 'getToken()');
    content = content.replace(/localStorage\.getItem\("token"\)/g, 'getToken()');

    if (content !== originalContent) {
      // Ensure import { getToken } is added
      if (!content.includes('getToken')) {
        // This shouldn't happen since we just replaced it, but safe check
      }
      
      // If the file already imports API_URL from '@/lib/api', append getToken
      if (content.includes("import { API_URL } from '@/lib/api';")) {
        content = content.replace("import { API_URL } from '@/lib/api';", "import { API_URL, getToken } from '@/lib/api';");
      } else if (content.includes("import { API_URL, getToken } from '@/lib/api';")) {
        // do nothing
      } else {
        const importStmt = "import { getToken } from '@/lib/api';\n";
        if (content.match(/^(["']use client["'];?\s*)/)) {
          content = content.replace(/^(["']use client["'];?\s*)/, `$1\n${importStmt}`);
        } else {
          content = importStmt + content;
        }
      }
      
      fs.writeFileSync(f, content);
      console.log('Updated tokens in', f);
    }
  }
});
