const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:/Users/DELL/.gemini/antigravity/scratch/gemini_social/backend/db_audit.json', 'utf8'));

const targetTables = ['messages', 'calls', 'call_signals', 'posts', 'comments', 'likes', 'follows'];

for (const table of data.tables) {
  if (targetTables.includes(table.tablename)) {
    console.log(`\\nTable: ${table.tablename}`);
    console.log(table.columns.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }
}
