const fs = require('fs');
let file = 'frontend/src/app/c/[slug]/entry/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/if\s*\(isLoading\)\s*\{\s*return <div className="min-h-screen flex items-center justify-center bg-\[#E5E4E2\]"><div className="animate-spin"><RefreshCcw size=\{32\} className="text-\[#8B5A2B\]"\/><\/div><\/div>;\s*\}/, '');
content = content.replace(/if\s*\(!server\)\s*\{/, 'if (!server && !isLoading) {');
content = content.replace(/return \(\s*<div className="min-h-screen bg-\[#FDF5E6\] font-sans flex justify-center py-4 sm:py-10" dir="rtl">/s, `const srv = server || { name: 'جاري التحميل...', members: [], _count: { members: 0 } };\n\n  return (\n    <div className="min-h-screen bg-[#FDF5E6] font-sans flex justify-center py-4 sm:py-10" dir="rtl">`);
content = content.replace(/server\./g, 'srv.');
// But wait, setServer shouldn't be setsrv
content = content.replace(/setsrv\./g, 'setServer.'); // restore just in case, but it's setServer(data) not setServer.
fs.writeFileSync(file, content);

file = 'frontend/src/app/[username]/page.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(/if\s*\(isLoading\)\s*\{\s*return <div className="min-h-screen flex items-center justify-center bg-black"><div className="animate-pulse text-cyan-500 font-bold">جاري تحميل الحساب\.\.\.<\/div><\/div>;\s*\}/, '');
content = content.replace(/if\s*\(!profile\)\s*\{/, 'if (!profile && !isLoading) {');
content = content.replace(/const isOwnProfile = currentUsername === username;/, `const prof = profile || { username: username, profile: {}, _count: {} };\n\n  const isOwnProfile = currentUsername === username;`);
content = content.replace(/profile\./g, 'prof.');
content = content.replace(/setprof\./g, 'setProfile.');
// also restore fetchProfile
content = content.replace(/fetchprof\./g, 'fetchProfile.');
fs.writeFileSync(file, content);

file = 'frontend/src/app/post/[id]/page.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(/if\s*\(isLoading\)\s*\{\s*return <div className="min-h-screen flex items-center justify-center bg-black text-cyan-500">Loading\.\.\.<\/div>;\s*\}/, '');
content = content.replace(/if\s*\(!post\)\s*\{/, 'if (!post && !isLoading) {');
content = content.replace(/return \(\s*<div className="min-h-screen flex justify-center bg-black">/s, `const p = post || { author: { username: '' }, content: 'جاري التحميل...', _count: {} };\n\n  return (\n    <div className="min-h-screen flex justify-center bg-black">`);
content = content.replace(/post=\{post\}/g, 'post={p}');
fs.writeFileSync(file, content);
