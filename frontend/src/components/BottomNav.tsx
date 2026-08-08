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
  }, [activeTab]);

  return (
    <nav className="fixed bottom-0 w-full max-w-[600px] bg-black/90 backdrop-blur-md border-t border-slate-800 flex justify-around items-center h-[60px] z-50">
      <Link href="/home" className={`p-2 transition-colors flex items-center justify-center ${activeTab === 'home' ? 'text-white' : 'text-slate-500 hover:text-white'}`}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke={activeTab === 'home' ? 'none' : 'currentColor'} strokeWidth={activeTab === 'home' ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
          <path d={activeTab === 'home' 
            ? "M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696z" 
            : "M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM19 19.5c0 .276-.224.5-.5.5h-13c-.276 0-.5-.224-.5-.5V8.429l7-4.375 7 4.375V19.5z"} 
          />
        </svg>
      </Link>
      
      <Link href="/explore" className={`p-2 rounded-full transition-colors ${activeTab === 'explore' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
        <Search size={26} strokeWidth={activeTab === 'explore' ? 2.5 : 2} />
      </Link>
      
      <CoffeeButton />

      <Link href="/notifications" className={`relative p-2 rounded-full transition-colors ${activeTab === 'notifications' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
        <Bell size={26} strokeWidth={activeTab === 'notifications' ? 2.5 : 2} />
        {unreadCount > 0 && (
          <span className="absolute top-1 left-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      <Link href="/messages" className={`relative p-2 rounded-full transition-colors ${activeTab === 'messages' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
        <MessageCircle size={26} strokeWidth={activeTab === 'messages' ? 2.5 : 1.5} />
        {unreadMessagesCount > 0 && (
          <span className="absolute top-1 left-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center text-[9px] font-bold text-white">
            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
          </span>
        )}
      </Link>
    </nav>
  );
}
