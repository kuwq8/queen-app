const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelPostBubble.tsx', 'utf8');

content = content.replace("import { format } from 'date-fns';\nimport { ar } from 'date-fns/locale';", "");

content = content.replace(
  "const timeString = format(new Date(post.created_at), 'h:mm a', { locale: ar });",
  "const timeString = new Intl.DateTimeFormat('ar-SA', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(post.created_at || post.createdAt));"
);

fs.writeFileSync('src/components/ChannelPostBubble.tsx', content);
