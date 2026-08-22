const fs = require('fs');
let content = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');

// I'll replace the nav className
const oldClass = "bg-black/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around w-full max-w-md sm:max-w-lg fixed bottom-0 left-1/2 -translate-x-1/2 z-50 px-3 h-14";
const newClass = "fixed bottom-0 inset-x-0 mx-auto max-w-lg w-full backdrop-blur-md bg-black/80 border-t border-zinc-800 z-50 flex items-center justify-around h-14";
content = content.replace(oldClass, newClass);

fs.writeFileSync('src/components/BottomNav.tsx', content);
console.log('done');
