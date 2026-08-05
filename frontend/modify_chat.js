const fs = require('fs');

let code = fs.readFileSync('src/app/c/[slug]/chat/page.tsx', 'utf8');

// 1. Add fakeUsers state
if (!code.includes('const [fakeUsers, setFakeUsers]')) {
  code = code.replace(
    'const [activePane, setActivePane] = useState',
    `const [fakeUsers, setFakeUsers] = useState<any[]>([]);\n  const [activePane, setActivePane] = useState`
  );
}

// 2. Fetch fakeUsers in useEffect alongside server
if (!code.includes('fake-users')) {
  code = code.replace(
    /fetch\(\`\/api\/community\/\$\{slug\}\`\)\s*\.then\(r => r\.json\(\)\)\s*\.then\(s => setServer\(s\)\);/,
    `fetch(\`/api/community/\${slug}\`).then(r => r.json()).then(s => {
        setServer(s);
        const token = localStorage.getItem('token');
        fetch(\`/api/community/\${slug}/fake-users\`, { headers: token ? { Authorization: \`Bearer \${token}\` } : undefined })
          .then(r => r.json())
          .then(f => {
            setFakeUsers(f || []);
            // Inject Welcome Message
            if (f && f.length > 0) {
              const bot = f[0];
              const welcomeMsg = { 
                id: 'welcome-bot-' + Date.now(), 
                content: (s.settings?.welcomeMessage || 'أهلاً بك في الشات!'), 
                senderId: bot.id, 
                sender: { id: bot.id, username: bot.name, profile: { avatarUrl: bot.avatarUrl } }, 
                createdAt: new Date().toISOString(), 
                isFake: true 
              };
              setMessages(prev => [...prev, welcomeMsg]);
            }
          }).catch(e => console.error(e));
      });`
  );
}

// 3. Merge fakeUsers into filteredMembers
if (!code.includes('const combinedMembers =')) {
  code = code.replace(
    /const filteredMembers = server\.members\?\.filter[^\n]+;/,
    `const combinedMembers = [...(server?.members || []), ...fakeUsers.map(f => ({ id: 'fake_'+f.id, isFake: true, user: { id: f.id, username: f.name, profile: { avatarUrl: f.avatarUrl } }, status: f.status || 'متصل', roleId: f.roleId, role: server?.roles?.find((r:any) => r.id === f.roleId) }))];
  const filteredMembers = combinedMembers.filter((m: any) => m.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()));`
  );
}

fs.writeFileSync('src/app/c/[slug]/chat/page.tsx', code);
console.log('Success chat modified');
