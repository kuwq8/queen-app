'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, ShieldX } from 'lucide-react';
import Link from 'next/link';

export default function BlockedUsersList() {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('blocks')
        .select(`
          blocked_id,
          blocked_user:profiles!blocks_blocked_id_fkey(username, first_name, last_name, avatar_url)
        `)
        .eq('blocker_id', session.user.id);
        
      setBlockedUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    await supabase.from('blocks').delete().eq('blocker_id', session.user.id).eq('blocked_id', blockedId);
    setBlockedUsers(prev => prev.filter(u => u.blocked_id !== blockedId));
  };

  return (
    <div className="bg-[#111] border border-slate-800 rounded-2xl overflow-hidden mt-6">
      <div className="p-4 border-b border-slate-800">
        <h4 className="font-bold text-white text-[15px] flex items-center gap-2">
          <ShieldX size={18} className="text-red-500" /> الحسابات المحظورة
        </h4>
        <p className="text-slate-500 text-xs mt-1">لن يتمكن هؤلاء المستخدمون من التفاعل معك أو مشاهدة منشوراتك.</p>
      </div>
      
      <div className="divide-y divide-slate-800">
        {isLoading ? (
          <div className="p-4 text-center text-slate-500 text-sm">جاري التحميل...</div>
        ) : blockedUsers.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">لا توجد حسابات محظورة.</div>
        ) : (
          blockedUsers.map((b) => (
            <div key={b.blocked_id} className="p-4 flex items-center justify-between hover:bg-slate-900/50 transition-colors">
              <Link href={`/${b.blocked_user?.username}`} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
                  {b.blocked_user?.avatar_url ? (
                    <img src={b.blocked_user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={20} /></div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-white text-[15px]" dir="ltr">
                    {b.blocked_user?.first_name ? `${b.blocked_user.first_name} ${b.blocked_user.last_name||''}` : b.blocked_user?.username}
                  </div>
                  <div className="text-slate-500 text-xs" dir="ltr">@{b.blocked_user?.username}</div>
                </div>
              </Link>
              <button 
                onClick={() => handleUnblock(b.blocked_id)}
                className="text-sm font-bold text-cyan-500 hover:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-full transition-colors"
              >
                إلغاء الحظر
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
