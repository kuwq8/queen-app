const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');

const regex = /<div className="flex justify-end items-center text-\[10px\] text-slate-400 gap-1 mt-1 font-bold\">\s*قناة \{post\.community\.name\}\s*<\/div>/;

if (regex.test(content)) {
  content = content.replace(regex, '');
  fs.writeFileSync('src/components/PostItem.tsx', content);
  console.log('Successfully removed channel name label from bubble.');
} else {
  console.log('Regex did not match.');
}
