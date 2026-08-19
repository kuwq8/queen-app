'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, MessageCircle, Repeat, UserPlus, Mail, PhoneOff, X } from 'lucide-react';

export default function NotificationToast() {
  const [toast, setToast] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let channel: any = null;

    const setupListener = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;

        channel = supabase.channel(`public:notifications:user_id=eq.${session.user.id}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          }, async (payload) => {
            const notif = payload.new;
            
            // Suppress message toast if we are currently in that chat room
            if (notif.type === 'message' && pathname === `/messages/${notif.reference_id}`) {
              return;
            }

            // Fetch actor details
            const { data: actor } = await supabase.from('profiles').select('username, avatar_url').eq('id', notif.actor_id).single();
            
            let message = '';
            let icon = null;
            let link = '/notifications';

            switch(notif.type) {
              case 'like':
                message = 'أعجب بمنشورك';
                icon = <Heart size={18} className="text-pink-500 fill-pink-500" />;
                link = `/post/${notif.reference_id}`;
                break;
              case 'comment':
                message = 'رد على منشورك';
                icon = <MessageCircle size={18} className="text-sky-500 fill-sky-500" />;
                link = `/post/${notif.reference_id}`;
                break;
              case 'repost':
                message = 'أعاد نشر منشورك';
                icon = <Repeat size={18} className="text-emerald-500" />;
                link = `/post/${notif.reference_id}`;
                break;
              case 'follow':
                message = 'بدأ بمتابعتك';
                icon = <UserPlus size={18} className="text-blue-500" />;
                link = `/${actor?.username}`;
                break;
              case 'message':
                message = 'أرسل لك رسالة جديدة';
                icon = <Mail size={18} className="text-purple-500" />;
                link = `/messages/${notif.reference_id}`;
                break;
              case 'missed_call':
                message = 'مكالمة فائتة';
                icon = <PhoneOff size={18} className="text-red-500" />;
                link = `/messages`;
                break;
            }

            setToast({
              id: notif.id,
              actorName: actor?.username || 'مستخدم',
              actorAvatar: actor?.avatar_url,
              message,
              icon,
              link
            });

            // Auto dismiss
            setTimeout(() => {
              setToast((prev: any) => prev?.id === notif.id ? null : prev);
            }, 5000);

            // Also dispatch a custom event to update the badge in BottomNav
            window.dispatchEvent(new CustomEvent('new-notification'));

          })
          .subscribe();
      } catch (err) {
        console.error('Notification setup error:', err);
      }
    };

    setupListener();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm animate-in slide-in-from-top-4 fade-in duration-300" dir="rtl">
      <div 
        onClick={() => {
          router.push(toast.link);
          setToast(null);
        }}
        className="bg-[#181824] border border-slate-700 shadow-xl shadow-cyan-900/10 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700 relative">
          {toast.actorAvatar ? (
            <img src={toast.actorAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
              {toast.actorName?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-[#181824] rounded-full p-0.5">
            {toast.icon}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{toast.actorName}</p>
          <p className="text-slate-400 text-sm">{toast.message}</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setToast(null); }}
          className="p-2 hover:bg-slate-700 rounded-full text-slate-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
