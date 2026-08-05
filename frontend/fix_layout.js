const fs = require('fs');

let code = fs.readFileSync('src/app/c/[slug]/admin/page.tsx', 'utf8');

const mainContentStart = `      {/* Main Content (Order 1 so it appears on the right in RTL, making sidebar on the left) */}
      <div className="flex-1 overflow-y-auto order-1">


      {/* Sidebar (Order 2 so it appears on the left in RTL) */}`;

if (code.includes(mainContentStart)) {
  code = code.replace(mainContentStart, '      {/* Sidebar (Order 2 so it appears on the left in RTL) */}');
  
  const headerStart = `{/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center shadow-sm">`;
        
  code = code.replace(headerStart, `      {/* Main Content (Order 1 so it appears on the right in RTL, making sidebar on the left) */}
      <div className="flex-1 overflow-y-auto order-1">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center shadow-sm">`);
}

fs.writeFileSync('src/app/c/[slug]/admin/page.tsx', code);
console.log('Layout fixed');
