const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');

// Add alert to handleDelete
content = content.replace("setIsDeleting(false);", "setIsDeleting(false);\n        alert('فشل الحذف: ' + error.message);");
fs.writeFileSync('src/components/PostItem.tsx', content);
