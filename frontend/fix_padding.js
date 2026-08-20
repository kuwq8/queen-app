const fs = require('fs');

function addPadding(file) {
  let content = fs.readFileSync(file, 'utf8');
  // First, undo any previous partial replaces
  content = content.replace(/min-h-screen pb-32/g, 'min-h-screen');
  
  // Now add pb-32 to the MAIN wrapper. Usually it's the one that has flex flex-col relative or similar.
  // Actually we can just add pb-32 to ANY min-h-screen just to be safe, except pb-32 overrides pb-[60px]?
  // If it has pb-[60px], let's change it to pb-[120px].
  content = content.replace(/pb-\[60px\]/g, 'pb-[120px]');
  fs.writeFileSync(file, content);
}
addPadding('src/app/home/page.tsx');
addPadding('src/app/communities/[id]/ClientPage.tsx');
addPadding('src/app/[username]/ClientPage.tsx');
