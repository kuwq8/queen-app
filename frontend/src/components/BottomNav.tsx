import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Home, Search, Bell, MessageCircle, User } from 'lucide-react';
import CoffeeButton from './CoffeeButton';
import { createClient } from '@/utils/supabase/client';

interface BottomNavProps {
  activeTab: 'home' | 'explore' | 'notifications' | 'messages' | 'profile' | '';
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Fetch generic notifications
      const { count } = await supabase
        .from('social_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);
        
      if (count !== null) setUnreadCount(count);

      if (count !== null) setUnreadCount(count);

      // Fetch unread messages
      const { data: myMemberships } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', session.user.id);

      if (myMemberships && myMemberships.length > 0) {
        const channelIds = myMemberships.map(m => m.channel_id);
        
        // Filter to only private channels
        const { data: privateChannels } = await supabase
          .from('channels')
          .select('id')
          .in('id', channelIds)
          .eq('is_group', false);
          
        if (privateChannels && privateChannels.length > 0) {
          const privateChannelIds = privateChannels.map(c => c.id);
          const { data: unreadMsgs } = await supabase
            .from('messages')
            .select('id, message_viewers(user_id)')
            .in('channel_id', privateChannelIds)
            .neq('sender_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(100);
            
          if (unreadMsgs) {
             const actualUnread = unreadMsgs.filter(m => !m.message_viewers.some((v: any) => v.user_id === session.user.id)).length;
             setUnreadMessagesCount(actualUnread);
          }
        }
      }
    };
    
    fetchUnread();

    const supabase = createClient();
    const subscription = supabase.channel('bottom_nav_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
         fetchUnread();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_viewers' }, () => {
         fetchUnread();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeTab]);

  return (
  return (
    <nav className="bg-black/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around w-full fixed bottom-0 z-50 px-3 h-14">
      <Link href="/home" className={`p-2 hover:bg-white/5 rounded-full transition-all flex items-center justify-center ${activeTab === 'home' ? 'text-white' : 'text-gray-500'}`}>
        <svg viewBox="0 0 24 24" width="25" height="25" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke={activeTab === 'home' ? 'none' : 'currentColor'} strokeWidth={activeTab === 'home' ? 0 : 1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d={activeTab === 'home' 
            ? "M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696z" 
            : "M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM19 19.5c0 .276-.224.5-.5.5h-13c-.276 0-.5-.224-.5-.5V8.429l7-4.375 7 4.375V19.5z"} 
          />
        </svg>
      </Link>
      
      <Link href="/explore" className={`p-2 hover:bg-white/5 rounded-full transition-all flex items-center justify-center ${activeTab === 'explore' ? 'text-white' : 'text-gray-500'}`}>
        <Search size={25} strokeWidth={activeTab === 'explore' ? 2.5 : 1.75} />
      </Link>
      
      <div className="flex items-center justify-center">
        <CoffeeButton />
      </div>

      <Link href="/notifications" className={`relative p-2 hover:bg-white/5 rounded-full transition-all flex items-center justify-center ${activeTab === 'notifications' ? 'text-white' : 'text-gray-500'}`}>
        <Bell size={25} strokeWidth={activeTab === 'notifications' ? 2.5 : 1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2 bg-sky-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      <Link href="/messages" className={`relative p-2 hover:bg-white/5 rounded-full transition-all flex items-center justify-center ${activeTab === 'messages' ? 'text-white' : 'text-gray-500'}`}>
        <MessageCircle size={25} strokeWidth={activeTab === 'messages' ? 2.5 : 1.75} />
        {unreadMessagesCount > 0 && (
          <span className="absolute top-1 right-2 bg-sky-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-black">
            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
          </span>
        )}
      </Link>
    </nav>
  );
}
