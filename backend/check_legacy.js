const { Client } = require('pg');
const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function checkLegacy() {
  const client = new Client({ connectionString });
  await client.connect();

  const tables = [
    'Post', 'Comment', 'Like', 'Follows', 'Bookmark', 'Notification',
    'ChatRoom', 'User', 'CommunityRoom', 'ChatMessage', 'ChatParticipant',
    'CommunityServer', 'CommunitySettings', 'CommunityRole', 'CommunityMember',
    'CommunityMessage', 'CommunityShortcut', 'CommunityBot', 'CommunityGift',
    'CommunityBanner', 'UserIgnore', 'CommunityEmoji', 'CommunityBan',
    'CommunityDomain', 'CommunityFakeUser', 'CommunityLog', 'Profile'
  ];

  try {
    for (const table of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM public."${table}"`);
        console.log(`Table ${table}: ${res.rows[0].count} rows`);
      } catch (e) {
        console.log(`Table ${table}: ERROR (${e.message})`);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

checkLegacy();
