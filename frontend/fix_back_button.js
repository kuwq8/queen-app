const fs = require('fs');
let content = fs.readFileSync('src/app/messages/[id]/page.tsx', 'utf8');

content = content.replace(
  '<Link href="/messages" className="md:hidden text-slate-400 hover:text-white p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors">',
  '<Link href="/messages" className="text-slate-400 hover:text-white p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors">'
);

fs.writeFileSync('src/app/messages/[id]/page.tsx', content);
console.log('done');
