const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');

const oldPriv = `onClick={() => { setIsPrivate(true); setIsMenuOpen(false); alert('تم تحويل القناة إلى خاصة'); }}`;
const newPriv = `onClick={async () => { 
                      setIsPrivate(true); 
                      setIsMenuOpen(false); 
                      const { createClient } = await import('@/utils/supabase/client');
                      await createClient().from('communities').update({ is_private: true }).eq('id', community.id);
                      alert('تم تحويل القناة إلى خاصة'); 
                    }}`;

const oldPub = `onClick={() => { setIsPrivate(false); setIsMenuOpen(false); alert('تم تحويل القناة إلى عامة'); }}`;
const newPub = `onClick={async () => { 
                      setIsPrivate(false); 
                      setIsMenuOpen(false); 
                      const { createClient } = await import('@/utils/supabase/client');
                      await createClient().from('communities').update({ is_private: false }).eq('id', community.id);
                      alert('تم تحويل القناة إلى عامة'); 
                    }}`;

content = content.replace(oldPriv, newPriv).replace(oldPub, newPub);

content = content.replace('const [isPrivate, setIsPrivate] = useState(false);', 'const [isPrivate, setIsPrivate] = useState(community?.is_private || false);');

fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
