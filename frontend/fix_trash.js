const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelPostBubble.tsx', 'utf8');

content = content.replace(
  'className="absolute top-2 right-2 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1.5 rounded-full"',
  'className="absolute top-2 left-2 text-slate-500 hover:text-red-500 transition-colors p-1.5 rounded-full"'
);

fs.writeFileSync('src/components/ChannelPostBubble.tsx', content);
