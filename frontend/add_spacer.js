const fs = require('fs');

function addSpacer(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<\/main>/, '  {/* Spacer for dropdown */} <div className="h-64" />\n      </main>');
  fs.writeFileSync(file, content);
}
addSpacer('src/app/communities/[id]/ClientPage.tsx');
addSpacer('src/app/home/page.tsx');
addSpacer('src/app/[username]/ClientPage.tsx');
addSpacer('src/app/post/[id]/ClientPage.tsx');
