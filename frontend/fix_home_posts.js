const fs = require('fs');

function checkFile(file) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes("from('posts')")) {
    console.log(file, 'has posts query');
  }
}

checkFile('src/app/home/page.tsx');
checkFile('src/app/explore/page.tsx');
checkFile('src/app/[username]/ClientPage.tsx');

// Fix home/page.tsx
let homeContent = fs.readFileSync('src/app/home/page.tsx', 'utf8');
homeContent = homeContent.replace(
  /\.order\('created_at', \{ ascending: false \}\)/g,
  ".is('community_id', null)\n        .order('created_at', { ascending: false })"
);
fs.writeFileSync('src/app/home/page.tsx', homeContent);
console.log('Fixed home');

// Fix explore/page.tsx
let exploreContent = fs.readFileSync('src/app/explore/page.tsx', 'utf8');
exploreContent = exploreContent.replace(
  /\.order\('created_at', \{ ascending: false \}\)/g,
  ".is('community_id', null)\n        .order('created_at', { ascending: false })"
);
fs.writeFileSync('src/app/explore/page.tsx', exploreContent);
console.log('Fixed explore');

