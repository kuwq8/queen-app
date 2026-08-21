const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');
content = content.replace("if (!window.confirm('هل أنت متأكد من حذف هذه القناة؟')) return;", "// window.confirm removed");
fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
