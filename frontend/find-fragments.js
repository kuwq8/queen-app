const fs = require('fs');
const content = fs.readFileSync('src/app/[username]/page.tsx', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('<>') || line.includes('</>')) {
    console.log(`${i+1}: ${line}`);
  }
});
