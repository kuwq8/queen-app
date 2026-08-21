const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');

// 1. Change root container from min-h-[100dvh] to h-[100dvh]
content = content.replace(
  'className="w-full flex flex-col relative min-h-[100dvh] bg-[#0b141a] font-sans text-right"',
  'className="w-full flex flex-col relative h-[100dvh] bg-[#0b141a] font-sans text-right"'
);

// 2. Fix Header
content = content.replace(
  'className="sticky top-0 z-50 bg-[#202c33] flex items-center px-2 py-2 gap-3 shadow-md"',
  'className="sticky top-0 z-50 bg-[#202c33]/85 backdrop-blur-md flex items-center px-4 py-3 gap-4 shadow-lg border-b border-[#2a3942]"'
);

// 3. Fix Footer (make it absolute instead of fixed, and improve max-w)
content = content.replace(
  'className="fixed bottom-0 left-0 w-full z-40 bg-[#0b141a] p-2 sm:p-4"',
  'className="absolute bottom-0 left-0 w-full z-40 bg-[#182229] border-t border-[#2a3942] p-3 sm:p-4"'
);

// Update max-w-2xl to max-w-3xl in the footer items
content = content.replace(/max-w-2xl/g, 'max-w-3xl');

fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
