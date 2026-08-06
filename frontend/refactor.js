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

const files = walk('src');

files.forEach(f => {
  if (f.endsWith('.tsx') || f.endsWith('.ts')) {
    if (f.replace(/\\/g, '/').includes('lib/api.ts')) return;
    
    let content = fs.readFileSync(f, 'utf8');
    let originalContent = content;
    
    // Replace single quotes
    content = content.replace(/'https:\/\/queen-app-api\.onrender\.com([^']*)'/g, '\`${API_URL}$1\`');
    // Replace backticks
    content = content.replace(/`https:\/\/queen-app-api\.onrender\.com([^`]*)`/g, '\`${API_URL}$1\`');
    // Replace double quotes
    content = content.replace(/"https:\/\/queen-app-api\.onrender\.com([^"]*)"/g, '\`${API_URL}$1\`');
    
    if (content !== originalContent) {
      const importStmt = "import { API_URL } from '@/lib/api';\n";
      if (!content.includes("import { API_URL }")) {
         if (content.match(/^(["']use client["'];?\s*)/)) {
           content = content.replace(/^(["']use client["'];?\s*)/, `$1\n${importStmt}`);
         } else {
           content = importStmt + content;
         }
      }
      fs.writeFileSync(f, content);
      console.log('Modified', f);
    }
  }
});
