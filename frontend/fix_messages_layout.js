const fs = require('fs');
let content = fs.readFileSync('src/app/messages/ClientMessagesLayout.tsx', 'utf8');
content = content.replace('className="flex h-screen bg-black overflow-hidden font-sans text-right"', 'className="fixed inset-0 z-[40] flex h-screen w-screen bg-black overflow-hidden font-sans text-right"');
fs.writeFileSync('src/app/messages/ClientMessagesLayout.tsx', content);
