const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelPostBubble.tsx', 'utf8');

const lines = content.split(/\r?\n/);
lines.splice(174, 0, '        )}');

fs.writeFileSync('src/components/ChannelPostBubble.tsx', lines.join('\n'));
