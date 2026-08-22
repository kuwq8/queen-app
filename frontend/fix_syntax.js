const fs = require('fs');
let content = fs.readFileSync('src/app/community/page.tsx', 'utf8');
content = content.replace("const [createError, setCreateError] = useState('');| 'explore'>('joined');", "const [createError, setCreateError] = useState('');");
fs.writeFileSync('src/app/community/page.tsx', content);
console.log('done');
