const fs = require('fs');
let content = fs.readFileSync('src/app/layout.tsx', 'utf8');

content = content.replace(
  "import NotificationToast from '../components/NotificationToast';",
  "import NotificationToast from '../components/NotificationToast';\nimport LayoutWrapper from '../components/LayoutWrapper';"
);

const oldDiv = '<div className="w-full max-w-md sm:max-w-lg min-h-screen bg-black border-x border-white/10 flex flex-col relative shadow-2xl">\n          {children}\n        </div>';
content = content.replace(oldDiv, '<LayoutWrapper>\n          {children}\n        </LayoutWrapper>');

fs.writeFileSync('src/app/layout.tsx', content);
