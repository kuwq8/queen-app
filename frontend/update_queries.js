const fs = require('fs');

function addIsPrivateToQuery(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('community:communities(id, name)')) {
    content = content.replace(/community:communities\(id, name\)/g, 'community:communities(id, name, is_private)');
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + filePath);
  }
}

const files = [
  'src/app/home/page.tsx',
  'src/app/explore/page.tsx',
  'src/app/[username]/ClientPage.tsx',
  'src/app/post/[id]/page.tsx'
];

files.forEach(addIsPrivateToQuery);
