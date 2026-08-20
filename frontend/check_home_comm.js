const fs = require('fs');
const lines = fs.readFileSync('src/app/home/page.tsx', 'utf8').split('\n');
const match = lines.findIndex(l => l.includes("from('communities')"));
for(let i=match-5; i<=match+15; i++) {
  if(lines[i]) console.log(i + ':', lines[i]);
}
