const fs = require('fs');

function fixFAB(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace('className="absolute bottom-20 left-4', 'className="fixed bottom-24 left-4');
  fs.writeFileSync(filePath, content);
}

fixFAB('src/app/home/page.tsx');
fixFAB('src/app/communities/[id]/ClientPage.tsx');
