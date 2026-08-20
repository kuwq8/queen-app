const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');
content = content.replace("if (!window.confirm('هل أنت متأكد من حذف هذا المنشور؟')) return;", "// window.confirm removed");
fs.writeFileSync('src/components/PostItem.tsx', content);
