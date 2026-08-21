const fs = require('fs');
let content = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');

// replace supabase.channel('bottom_nav_changes') with supabase.channel(`bottom_nav_changes_${Math.random()}`)
content = content.replace("supabase.channel('bottom_nav_changes')", "supabase.channel(`bottom_nav_changes_${Math.random()}`)");

fs.writeFileSync('src/components/BottomNav.tsx', content);
