const fs = require('fs');

function fixClientPage(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  if (!content.includes('const resolvedParams')) {
    if (!content.includes('import { use } from')) {
      content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, use } from 'react';");
      content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect, use } from 'react';");
    }
    
    // For ClientPageProps
    content = content.replace(/export default function ClientPage\(\{ params \}: ClientPageProps\) \{/, "export default function ClientPage({ params }: ClientPageProps) {\n  const resolvedParams = params instanceof Promise ? use(params) : params;\n  const id = resolvedParams.id || (resolvedParams as any).username;");
    
    // If it doesn't have ClientPageProps
    content = content.replace(/export default function ClientPage\(\{ params \}: \{ params: any \}\) \{/, "export default function ClientPage({ params }: { params: any }) {\n  const resolvedParams = params instanceof Promise ? use(params) : params;\n  const id = resolvedParams.id || (resolvedParams as any).username;");

    // Replace all params.id with id
    content = content.replace(/params\.id/g, 'id');
    // Replace all params.username with id (since we mapped it above)
    content = content.replace(/params\.username/g, 'id');

    fs.writeFileSync(filepath, content);
    console.log('Fixed', filepath);
  }
}

fixClientPage('src/app/communities/[id]/ClientPage.tsx');
fixClientPage('src/app/post/[id]/ClientPage.tsx');
fixClientPage('src/app/[username]/ClientPage.tsx');
