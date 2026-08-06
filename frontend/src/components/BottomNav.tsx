import { API_URL, getToken } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Home, Search, Bell, MessageCircle, User } from 'lucide-react';
import CoffeeButton from './CoffeeButton';

interface BottomNavProps {
  activeTab: 'home' | 'explore' | 'notifications' | 'messages' | 'profile' | '';
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    
    fetch(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : { count: 0 })
    .then(data => setUnreadCount(data.count))
    .catch(() => {});
  }, [activeTab]);

  return (
    <nav className="fixed bottom-0 w-full max-w-[600px] bg-black/90 backdrop-blur-md border-t border-slate-800 flex justify-around items-center h-[60px] z-50">
      <Link href="/home" className={`p-2 transition-colors flex items-center justify-center ${activeTab === 'home' ? 'text-white' : 'text-slate-500 hover:text-white'}`}>
        <Home size={26} fill={activeTab === 'home' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'home' ? 0 : 2} />
      </Link>
      
      <Link href="/explore" className={`p-3 rounded-full transition-colors ${activeTab === 'explore' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
        <Search size={24} strokeWidth={activeTab === 'explore' ? 2.5 : 2} />
      </Link>
      
      <CoffeeButton />

      <Link href="/notifications" className={`relative p-3 rounded-full transition-colors ${activeTab === 'notifications' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
        <Bell size={24} strokeWidth={activeTab === 'notifications' ? 2.5 : 2} />
        {unreadCount > 0 && (
          <span className="absolute top-2 left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      <Link href="/messages" className={`p-3 rounded-full transition-colors ${activeTab === 'messages' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
        <MessageCircle size={26} strokeWidth={activeTab === 'messages' ? 2.5 : 1.5} />
      </Link>
    </nav>
  );
}
