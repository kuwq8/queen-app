const fs = require('fs');
let content = fs.readFileSync('src/app/home/page.tsx', 'utf8');
content = content.replace('if (!error) {', 'if (error) { alert("فشل النشر: " + error.message); console.error(error); } else {');
fs.writeFileSync('src/app/home/page.tsx', content);
