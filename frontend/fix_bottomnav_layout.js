const fs = require('fs');

// 1. Update ClientMessagesLayout.tsx
let layout = fs.readFileSync('src/app/messages/ClientMessagesLayout.tsx', 'utf8');
if (!layout.includes("import BottomNav")) {
  layout = layout.replace("import MessagesSidebar from './MessagesSidebar';", "import MessagesSidebar from './MessagesSidebar';\nimport BottomNav from '../../components/BottomNav';");
}
// Find the closing div of the layout
layout = layout.replace("    </div>\n  );\n}", "      <div className={`z-50 md:block ${isRoot ? 'block' : 'hidden'}`}>\n        <BottomNav activeTab=\"messages\" />\n      </div>\n    </div>\n  );\n}");
fs.writeFileSync('src/app/messages/ClientMessagesLayout.tsx', layout);

// 2. Remove from messages/page.tsx
let page = fs.readFileSync('src/app/messages/page.tsx', 'utf8');
page = page.replace(/<div className="md:hidden">\s*<BottomNav activeTab="messages" \/>\s*<\/div>/g, "");
// Remove import if unused
page = page.replace("import BottomNav from '../../components/BottomNav';\n", "");
fs.writeFileSync('src/app/messages/page.tsx', page);

// 3. Remove from MessagesSidebar.tsx
let sidebar = fs.readFileSync('src/app/messages/MessagesSidebar.tsx', 'utf8');
sidebar = sidebar.replace(/\{\/\* Only show bottom nav on mobile if we are on the root messages route .* \*\/\}\s*<div className="md:hidden">\s*<BottomNav activeTab="messages" \/>\s*<\/div>/g, "");
// Remove import
sidebar = sidebar.replace("import BottomNav from '../../components/BottomNav';\n", "");
fs.writeFileSync('src/app/messages/MessagesSidebar.tsx', sidebar);

console.log("Updated BottomNav logic");
