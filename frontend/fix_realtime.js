const fs = require('fs');
let content = fs.readFileSync('src/app/home/page.tsx', 'utf8');

// Replace the single UPDATE channel with UPDATE, INSERT, DELETE
const oldChannel = `.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {
          setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
        })`;

const newChannel = `.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {
          setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
          fetchPosts(); // re-fetch to get author details and place at top
        })`;

content = content.replace(oldChannel, newChannel);
fs.writeFileSync('src/app/home/page.tsx', content);
