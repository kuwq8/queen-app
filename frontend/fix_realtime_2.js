const fs = require('fs');
let lines = fs.readFileSync('src/app/home/page.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes("channel = supabase.channel('home-posts')"));
const end = lines.findIndex((l, i) => i > start && l.includes('.subscribe('));

if (start !== -1 && end !== -1) {
  const newCode = [
    "      channel = supabase.channel('home-posts')",
    "        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {",
    "          setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));",
    "        })",
    "        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {",
    "          // Fetch to get joined data",
    "          fetchPosts();",
    "        })",
    "        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {",
    "          setPosts(prev => prev.filter(p => p.id !== payload.old.id));",
    "        })"
  ];
  
  lines.splice(start, end - start, ...newCode);
  fs.writeFileSync('src/app/home/page.tsx', lines.join('\n'));
  console.log("Successfully replaced lines");
} else {
  console.log("Could not find start/end bounds");
}
