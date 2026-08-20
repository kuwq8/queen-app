const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');

if (!content.includes('import { use }')) {
  content = content.replace("import { useState, useEffect, useRef } from 'react';", "import { useState, useEffect, useRef, use } from 'react';");
}

content = content.replace(
  'export default function CommunityPage({ params }: { params: { id: string } }) {',
  'export default function CommunityPage({ params }: { params: any }) {\n  const resolvedParams = params instanceof Promise ? use(params) : params;\n  const id = resolvedParams.id;'
);

fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
