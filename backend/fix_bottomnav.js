const fs = require('fs');
let content = fs.readFileSync('../frontend/src/components/BottomNav.tsx', 'utf8');

const replacement = `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
         fetchUnread();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
         fetchUnread();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, () => {
         fetchUnread();
      })`;

content = content.replace(`.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
         fetchUnread();
      })`, replacement);

fs.writeFileSync('../frontend/src/components/BottomNav.tsx', content);
console.log('Updated BottomNav.tsx');
