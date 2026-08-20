'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Repeat, UserPlus, Mail, PhoneOff, ArrowRight, Bell } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchNotifications = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/');
          return;
        }

        // 1. Fetch notifications with actor info
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*, actor:profiles!actor_id(username, avatar_url)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (!isMounted) return;

        if (notifs) {
          setNotifications(notifs);
        }
        setIsLoading(false);

        // 2. Mark all as read
        const unreadIds = notifs?.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds && unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
            
          // Dispatch event to update BottomNav badge
          window.dispatchEvent(new CustomEvent('new-notification'));
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchNotifications();
    
    return () => { isMounted = false; };
  }, [router]);



  const getIcon = (type: string) => {
    switch(type) {
      case 'like': return <Heart size={20} className="text-pink-500 fill-pink-500" />;
      case 'comment': return <MessageCircle size={20} className="text-sky-500 fill-sky-500" />;
      case 'repost': return <Repeat size={20} className="text-emerald-500" />;
      case 'follow': return <UserPlus size={20} className="text-blue-500" />;
      case 'message': return <Mail size={20} className="text-purple-500" />;
      case 'missed_call': return <PhoneOff size={20} className="text-red-500" />;
      default: return <Bell size={20} className="text-slate-500" />;
    }
  };

  const getMessage = (type: string) => {
    switch(type) {
      case 'like': return 'أعجب بمنشورك';
      case 'comment': return 'رد على منشورك';
      case 'repost': return 'أعاد نشر منشورك';
      case 'follow': return 'بدأ بمتابعتك';
      case 'follow_request': return 'طلب متابعتك';
      case 'follow_accept': return 'وافق على طلب متابعتك';
      case 'message': return 'أرسل لك رسالة جديدة';
      case 'missed_call': return 'مكالمة لم يرد عليها';
      default: return 'إشعار جديد';
    }
  };

  const handleNotificationClick = (notif: any) => {
    switch(notif.type) {
      case 'like':
      case 'comment':
      case 'repost':
        notif.reference_id && router.push(`/post/${notif.reference_id}`);
        break;
      case 'follow':
        notif.actor?.username && router.push(`/${notif.actor.username}`);
        break;
      case 'message':
        router.push(`/messages/${notif.reference_id}`);
        break;
      case 'missed_call':
        router.push(`/messages`);
        break;
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-black font-sans text-right relative pb-20">
      <div className="w-full max-w-[600px] flex flex-col relative border-x border-slate-800 min-h-screen bg-black" dir="rtl">
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md flex items-center px-4 py-3 gap-6 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white tracking-tight">الإشعارات</h1>
          </div>
        </header>

        {/* Notifications List */}
        <div className="flex-1">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 border-b border-slate-800/50 flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-800"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="text-center p-12">
              <h2 className="text-xl font-bold text-slate-300 mb-2">لا توجد إشعارات بعد</h2>
              <p className="text-slate-500">عندما يتفاعل الآخرون معك، ستجد إشعاراتك هنا.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 border-b border-slate-800/50 flex gap-4 cursor-pointer hover:bg-slate-900 transition-colors ${!notif.is_read ? 'bg-[#0f172a]/50' : ''}`}
              >
                <div className="w-10 flex flex-col items-center">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="w-10 h-10 rounded-full bg-slate-800 mb-2 overflow-hidden border border-slate-700">
                    {notif.actor?.avatar_url ? (
                      <img src={notif.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                        {notif.actor?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <p className="text-white text-[15px] leading-relaxed">
                    <span className="font-bold hover:underline" onClick={(e) => {
                      e.stopPropagation();
                      notif.actor?.username && router.push(`/${notif.actor.username}`);
                    }}>
                      {notif.actor?.username}
                    </span>{' '}
                    <span className="text-slate-300">{getMessage(notif.type)}</span>
                  </p>
                  
                  {notif.type === 'follow_request' && (
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const { createClient } = await import('@/utils/supabase/client');
                            const supabase = createClient();
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) return;
                            
                            await supabase.from('follows')
                              .update({ status: 'accepted' })
                              .eq('follower_id', notif.actor_id)
                              .eq('following_id', session.user.id);
                              
                            // Mark notification as handled visually
                            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, type: 'follow' } : n));
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
                      >
                        قبول
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const { createClient } = await import('@/utils/supabase/client');
                            const supabase = createClient();
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) return;
                            
                            await supabase.from('follows')
                              .delete()
                              .eq('follower_id', notif.actor_id)
                              .eq('following_id', session.user.id);
                              
                            // Hide notification
                            setNotifications(prev => prev.filter(n => n.id !== notif.id));
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
                      >
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <BottomNav activeTab="notifications" />
      </div>
    </div>
  );
}
