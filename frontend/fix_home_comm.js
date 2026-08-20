const fs = require('fs');
let content = fs.readFileSync('src/app/home/page.tsx', 'utf8');
content = content.replace(".select('*, is_onboarded')", ".select('*')");
fs.writeFileSync('src/app/home/page.tsx', content);
