const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'src/app/c/[slug]/chat/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Delete Top Header block
// Search for:
// {/* Top Header */}
// <div className="shrink-0 w-full h-8 text-white px-3 pt-0 pb-1 m-0 top-0 flex items-center justify-center z-[60] shadow-md border-b border-[#3e2b22] relative" style={{ backgroundColor: settings.primaryColor }}>
//   <span className="font-bold text-[14px] leading-none m-0 p-0 text-center">شات {server?.name || 'العرب'}</span>
// </div>
const topHeaderRegex = /\s*\{\/\* Top Header \*\/\}\s*<div className="shrink-0 w-full h-8 text-white px-3 pt-0 pb-1 m-0 top-0 flex items-center justify-center z-\[60\] shadow-md border-b border-\[#3e2b22\] relative" style=\{\{ backgroundColor: settings\.primaryColor \}\}>\s*<span className="font-bold text-\[14px\] leading-none m-0 p-0 text-center">شات \{server\?\.name \|\| 'العرب'\}<\/span>\s*<\/div>/;
content = content.replace(topHeaderRegex, '');

// 2. Replace top-8 with top-0 and calc(100dvh-72px) with calc(100dvh-40px)
// Members Drawer Backdrop: fixed top-8 left-0 right-0 h-[calc(100dvh-72px)]
content = content.replace(/fixed top-8 left-0 right-0 h-\[calc\(100dvh-72px\)\]/g, 'fixed top-0 left-0 right-0 h-[calc(100dvh-40px)]');

// Members Drawer: fixed top-8 right-0 h-[calc(100dvh-72px)]
content = content.replace(/fixed top-8 right-0 h-\[calc\(100dvh-72px\)\]/g, 'fixed top-0 right-0 h-[calc(100dvh-40px)]');

// Right Sidebar Backdrop: fixed top-8 left-0 right-0 h-[calc(100dvh-72px)]
// (Covered by the first replacement)

// Right Sidebar container: fixed sm:relative top-8 sm:top-auto right-0 h-[calc(100dvh-72px)]
content = content.replace(/fixed sm:relative top-8 sm:top-auto right-0 h-\[calc\(100dvh-72px\)\]/g, 'fixed sm:relative top-0 sm:top-auto right-0 h-[calc(100dvh-40px)]');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Modifications completed.');
