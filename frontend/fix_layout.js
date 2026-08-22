const fs = require('fs');
let content = fs.readFileSync('src/app/messages/ClientMessagesLayout.tsx', 'utf8');

content = content.replace(
  /<div className=\{\`hidden md:flex flex-1 flex-col h-full bg-black \$\{isRoot \? 'items-center justify-center' : ''\}\`\}>/,
  "<div className={`flex-1 flex flex-col h-full bg-black md:pb-14 ${isRoot ? 'hidden md:flex items-center justify-center' : 'flex'}`}>\n"
);

// Also let's make absolutely sure there is no old code hanging around
fs.writeFileSync('src/app/messages/ClientMessagesLayout.tsx', content);
console.log('done');
