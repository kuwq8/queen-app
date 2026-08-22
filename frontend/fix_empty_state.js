const fs = require('fs');
let content = fs.readFileSync('src/app/messages/MessagesSidebar.tsx', 'utf8');

content = content.replace(
  '<div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4">\n              <MessageCircle size={32} className="text-slate-700" />\n            </div>',
  '<div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 mb-4">\n              <MessageCircle size={32} />\n            </div>'
);
content = content.replace(
  '<p className="text-sm">ابدأ محادثة جديدة للتواصل مع الآخرين.</p>',
  '<p className="text-zinc-500 text-sm">ابدأ محادثة جديدة للتواصل مع الآخرين.</p>'
);

fs.writeFileSync('src/app/messages/MessagesSidebar.tsx', content);
