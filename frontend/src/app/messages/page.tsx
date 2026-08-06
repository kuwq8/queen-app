'use client';


import { API_URL, getToken } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Users, Plus, Search, Check } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

export default function MessagesPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'private' | 'group'>('private');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return router.push('/');
    fetchRooms(token);
  }, []);

  useEffect(() => {
    if (isNewChatOpen) {
      handleSearch(''); // Fetch default contacts
    }
  }, [isNewChatOpen]);

  const fetchRooms = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/chat/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRooms(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    // Allow empty search to fetch contacts
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/users/search?q=${q}&followingOnly=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSearchResults(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const startChat = async (userToChatWith?: any) => {
    let usernames = [];
    let isGroup = false;
    let name = null;

    if (chatMode === 'private') {
      if (!userToChatWith) return;
      usernames = [userToChatWith.username];
    } else {
      if (selectedUsers.length === 0) return alert('يرجى تحديد مستخدم واحد على الأقل');
      if (!groupName.trim()) return alert('يرجى كتابة اسم للمجموعة');
      usernames = selectedUsers.map(u => u.username);
      isGroup = true;
      name = groupName.trim();
    }

    setIsCreating(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ usernames, isGroup, name })
      });
      
      if (res.ok) {
        const room = await res.json();
        setIsNewChatOpen(false);
        setSelectedUsers([]);
        setGroupName('');
        setSearchQuery('');
        setSearchResults([]);
        router.push(`/messages/${room.id}`);
      } else {
        const err = await res.json();
        alert('خطأ: ' + err.message);
      }
    } catch (e) {
      alert('حدث خطأ في الشبكة.');
    } finally {
      setIsCreating(false);
    }
  };

  const closeNewChat = () => {
    setIsNewChatOpen(false);
    setSelectedUsers([]);
    setGroupName('');
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 sm:pb-0 sm:pr-[275px] font-sans text-right">
      <div className="max-w-[600px] border-x border-slate-800 min-h-screen relative mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">الرسائل</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => { setChatMode('private'); setIsNewChatOpen(true); }}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors flex items-center gap-1"
              title="دردشة خاصة جديدة"
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => { setChatMode('group'); setIsNewChatOpen(true); }}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors flex items-center gap-1 text-cyan-500 bg-cyan-900/20"
              title="مجموعة جديدة"
            >
              <Users size={18} />
              <span className="text-sm font-bold ml-1">مجموعة</span>
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="divide-y divide-slate-800">
          {rooms.map(room => {
            const token = getToken();
            const currentUserId = token ? JSON.parse(atob(token.split('.')[1])).sub : null;
            const otherParticipants = room.participants.filter((p: any) => p.user.id !== currentUserId);
            const isGroup = room.isGroup;
            const title = isGroup ? room.name : (otherParticipants[0]?.user.username || 'مجهول');
            const avatar = isGroup ? null : otherParticipants[0]?.user.profile?.avatarUrl;
            const lastMsg = room.messages[0];

            return (
              <div 
                key={room.id}
                onClick={() => router.push(`/messages/${room.id}`)}
                className="p-4 flex items-center gap-4 hover:bg-slate-900 cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {avatar ? (
                    <img src={avatar} className="w-full h-full object-cover" />
                  ) : isGroup ? (
                    <Users size={20} className="text-slate-400" />
                  ) : (
                    <span className="font-bold text-lg" dir="ltr">{title.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-white truncate" dir="ltr">{title}</h3>
                    {lastMsg && (
                      <span className="text-xs text-slate-500">
                        {new Date(lastMsg.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </span>
                    )}
                  </div>
                  {lastMsg ? (
                    <p className="text-slate-400 text-sm truncate">
                      {lastMsg.sender.id === currentUserId ? 'أنت: ' : <span dir="ltr">{`${lastMsg.sender.username}: `}</span>}
                      {lastMsg.content || (lastMsg.mediaUrl ? (lastMsg.mediaUrl.endsWith('.webm') ? '🎤 رسالة صوتية' : '📎 وسائط') : '')}
                    </p>
                  ) : (
                    <p className="text-slate-500 text-sm italic">محادثة جديدة</p>
                  )}
                </div>
              </div>
            );
          })}
          {rooms.length === 0 && (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <MessageSquare size={48} className="mb-4 text-slate-700" />
              <p className="font-bold">أهلاً بك في صندوق الرسائل!</p>
              <p className="text-sm mt-2">تواصل وشارك المنشورات والمزيد عبر المحادثات الخاصة.</p>
              <button 
                onClick={() => { setChatMode('private'); setIsNewChatOpen(true); }}
                className="mt-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
              >
                اكتب رسالة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex justify-center items-start pt-16 sm:pt-24 px-4 text-right">
          <div className="bg-[#111] w-full max-w-[500px] rounded-2xl border border-slate-800 p-4 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <button onClick={closeNewChat} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800">✕</button>
              <h3 className="text-lg font-bold">
                {chatMode === 'group' ? 'إنشاء مجموعة جديدة' : 'رسالة جديدة'}
              </h3>
            </div>
            
            {chatMode === 'group' && (
              <p className="text-xs text-slate-400 mb-4 px-2">
                اختر المستخدمين واكتب اسم المجموعة بالأسفل.
              </p>
            )}

            <div className="bg-slate-900 rounded-xl p-3 flex items-center gap-3 mb-4 border border-slate-700 focus-within:border-cyan-500 transition-colors">
              <Search size={18} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="البحث في جهات الاتصال..." 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent text-white focus:outline-none flex-1"
              />
            </div>

            {chatMode === 'group' && selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                {selectedUsers.map(u => (
                  <div key={u.id} className="bg-cyan-600/20 border border-cyan-600/50 text-cyan-400 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <button onClick={() => setSelectedUsers(selectedUsers.filter(user => user.id !== u.id))} className="hover:text-white">✕</button>
                    <span className="font-bold" dir="ltr">{u.username}</span>
                  </div>
                ))}
              </div>
            )}

            {chatMode === 'group' && (
              <input
                type="text"
                placeholder="اسم المجموعة (مطلوب)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-slate-900 p-3 rounded-xl focus:outline-none border border-slate-800 focus:border-cyan-500 mb-4 transition-colors text-right"
              />
            )}

            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {searchResults.length === 0 && (
                <div className="text-center text-slate-500 py-8 text-sm font-bold">
                  {searchQuery ? 'لا يوجد مستخدمين.' : 'ليس لديك جهات اتصال. تابع أشخاصاً لتتمكن من مراسلتهم!'}
                </div>
              )}
              {searchResults.map(user => {
                const isSelected = selectedUsers.find(u => u.id === user.id);
                return (
                  <div 
                    key={user.id} 
                    onClick={() => {
                      if (chatMode === 'private') {
                        startChat(user); // Start chat immediately for private
                      } else {
                        // Toggle selection for group
                        if (isSelected) {
                          setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
                        } else {
                          setSelectedUsers([...selectedUsers, user]);
                        }
                      }
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-slate-800`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user.profile?.avatarUrl ? (
                        <img src={user.profile.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-lg" dir="ltr">{user.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg" dir="ltr">{user.username}</div>
                      <div className="text-slate-500 text-sm" dir="ltr">@{user.username}</div>
                    </div>
                    {chatMode === 'group' && (
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                        {isSelected && <Check size={16} strokeWidth={4} className="text-black" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {chatMode === 'group' && (
              <button 
                onClick={() => startChat()}
                disabled={selectedUsers.length === 0 || !groupName.trim() || isCreating}
                className="w-full py-3 bg-white text-black font-bold rounded-full disabled:opacity-50 hover:bg-slate-200 transition-colors"
              >
                {isCreating ? 'جاري الإنشاء...' : 'إنشاء المجموعة'}
              </button>
            )}
          </div>
        </div>
      )}

      <BottomNav activeTab="messages" />
    </div>
  );
}
