const fs = require('fs');
let content = fs.readFileSync('src/app/[username]/ClientPage.tsx', 'utf8');
const matches = content.match(/\.from\('posts'\)[\s\S]*?\.select\('.*?'\)/g);
console.log(matches);
