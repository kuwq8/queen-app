'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Settings, Users, Menu, Smile, X, Send, Heart, MessageSquare, Plus, Bell, Volume2, VolumeX, Mic, Lock, Image as ImageIcon, Reply, Camera, LogOut, Palette, BellOff, TrendingUp, Award, Mic2, MessageCircle, Grid, FileText, Eye, Trophy } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function ClassicChatPage() {
  const router = useRouter();
  const { slug } = useParams();
  
  const [server, setServer] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isOwnerRole = server?.members?.some((m: any) => m.user_id === currentUser?.id && ['owner', 'admin', 'OWNER', 'ADMIN'].includes(m.role));
  const isOnlyMember = server?.members?.length === 1 && server?.members?.[0].user_id === currentUser?.id;
  const isCurrentUserAdmin = isOwnerRole || isOnlyMember || currentUser?.role === 'admin';
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [fakeUsers, setFakeUsers] = useState<any[]>([]);
  const [activePane, setActivePane] = useState<'members' | 'settings' | 'wall' | 'addons' | 'games' | 'wall-trend' | 'wall-creator' | 'mic-stars' | 'notifications' | 'rooms' | 'private' | 'profile-design' | 'ludo-stars' | 'xo-stars' | 'likes-settings' | 'ludo-invites' | 'xo-invites' | 'profile-visitors' | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activePrivateChat, setActivePrivateChat] = useState<any>(null);
  const [ignoredUserIds, setIgnoredUserIds] = useState<string[]>([]);
  const [privateChatsList, setPrivateChatsList] = useState<any[]>([]);
  const [isRoomManageOpen, setIsRoomManageOpen] = useState(false);
  const [isNicksRevealOpen, setIsNicksRevealOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [activeMicMenu, setActiveMicMenu] = useState<number | null>(null);
  const [micsList, setMicsList] = useState<any[]>([
    { id: 1, user: null },
    { id: 2, user: null },
    { id: 3, user: null },
    { id: 4, user: null },
    { id: 5, user: null },
  ]);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  const [selectedMusicFile, setSelectedMusicFile] = useState<File | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMicsLocked, setIsMicsLocked] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isSuperAnnouncement, setIsSuperAnnouncement] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [userLink, setUserLink] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [alertText, setAlertText] = useState('');
  const [alertTargetUser, setAlertTargetUser] = useState<any>(null);
  const [userColors, setUserColors] = useState({ nameColor: '#000000', textColor: '#000000', bgColor: 'transparent' });
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [newPrivateMessage, setNewPrivateMessage] = useState('');
  const [receivedAlertData, setReceivedAlertData] = useState<{ sender: any, message: string } | null>(null);
  const [unreadWallCount, setUnreadWallCount] = useState(86);
  const [roomManageImage, setRoomManageImage] = useState('');
  const [fontSize, setFontSize] = useState(100);
  const [isPrivateChatDisabled, setIsPrivateChatDisabled] = useState(false);
  const [isNotificationsDisabled, setIsNotificationsDisabled] = useState(false);
  const [tempMicsLocked, setTempMicsLocked] = useState(false);
  const [settingsUsername, setSettingsUsername] = useState('');
  const [settingsStatus, setSettingsStatus] = useState('متواجد');
  const [isIdle, setIsIdle] = useState(false);
  const [likesThresholds, setLikesThresholds] = useState({ publicChat: 0, privateChat: 0, alert: 0, wall: 0, media: 0 });
  const [myLikes, setMyLikes] = useState(1000000);

  useEffect(() => {
    const loadThresholds = () => {
      const saved = localStorage.getItem(`likes_thresholds_${slug}`);
      if (saved) {
        try {
          setLikesThresholds(JSON.parse(saved));
        } catch(e) {}
      }
    };
    
    // Load initially
    loadThresholds();
    
    // Listen for storage events (if admin panel is in another tab)
    window.addEventListener('storage', loadThresholds);
    // Listen for custom events (if admin panel is in the same tab, though nextjs routing means it's usually unmounted, but good practice)
    window.addEventListener('likesThresholdsUpdated', loadThresholds);
    
    return () => {
      window.removeEventListener('storage', loadThresholds);
      window.removeEventListener('likesThresholdsUpdated', loadThresholds);
    };
  }, [slug]);
  
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIsIdle(true), 15000); // 15 ثانية للتجربة
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      clearTimeout(idleTimer);
    };
  }, []);
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeRoom && currentUser) {
        import('@/utils/supabase/client').then(({ createClient }) => {
          const supabase = createClient();
          supabase.from('messages').insert({
            channel_id: activeRoom.id,
            user_id: currentUser.id,
            content: '( هذا المستخدم خرج من الشات )'
          }).then(() => {});
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeRoom, currentUser]);

  const sendSystemMessage = (text: string) => {
    if (activeRoom) {
      socketRef.current?.emit('sendCommunityMessage', { roomId: activeRoom.id, content: text });
    }
  };

  const changeRoom = (room: any) => {
    if (activeRoom?.id === room.id) return;
    sendSystemMessage(`هذا المستخدم دخل الى [${room.name}]`);
    setActiveRoom(room);
    setActivePane(null);
  };

  useEffect(() => {
    const handleOffline = () => {
      sendSystemMessage('( هذا المستخدم قد غادر الدردشه )');
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [activeRoom]);

  const togglePane = (pane: 'members' | 'settings' | 'wall' | 'addons' | 'wall-trend' | 'wall-creator' | 'mic-stars' | 'notifications' | 'rooms' | 'private') => {
    if (pane === 'notifications') setUnreadNotifs(0);
    if (pane === 'wall') setUnreadWallCount(0);
    setActivePane(activePane === pane ? null : pane);
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const renderContentWithEmojis = (content: string) => {
    if (!content) return null;
    if (!server?.emojis || server.emojis.length === 0) return content;
    
    const emojisWithShortcuts = server.emojis.filter((e: any) => e.type === 'EMOJI' && e.shortcut);
    if (emojisWithShortcuts.length === 0) return content;
    
    const regexSource = emojisWithShortcuts.map((e: any) => escapeRegExp(e.shortcut)).join('|');
    const regex = new RegExp(`(${regexSource})`, 'g');
    
    const parts = content.split(regex);
    return parts.map((part, i) => {
      const emoji = emojisWithShortcuts.find((e: any) => e.shortcut === part);
      if (emoji) {
        return <img key={i} src={emoji.url} alt={emoji.shortcut} className="inline-block w-6 h-6 mx-1 object-contain" />;
      }
      return part;
    });
  };

  const MOCK_ROOMS = [
    { id: 1, name: 'الغرفة العامة (1)', desc: 'نورتونا ياهلا وسهلا 🌺', icon: 'https://api.dicebear.com/7.x/initials/svg?seed=G', hasMic: false, users: 3, max: 40, hasBanner: false },
    { id: 2, name: 'تعب قلبي', desc: 'عام .اصدقاء تعب', icon: 'https://api.dicebear.com/7.x/initials/svg?seed=T', hasMic: true, users: 1, max: 6, hasBanner: false },
    { id: 3, name: 'هــــــدوء', desc: 'استرخاء', icon: 'https://api.dicebear.com/7.x/initials/svg?seed=H', hasMic: true, users: 1, max: 6, hasBanner: false },
    { id: 4, name: 'عزيز', desc: '', icon: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=320&h=120&fit=crop', hasMic: false, users: 0, max: 3, hasBanner: true, isLocked: true },
    { id: 5, name: '• شوية عتب •', desc: '| Milan .. L', icon: 'https://api.dicebear.com/7.x/initials/svg?seed=S', hasMic: false, users: 0, max: 1, hasBanner: false },
    { id: 6, name: 'خفايا روح ~ 𝄞', desc: 'ي الجليس لا بالمكان الروح تسعد ❤️', icon: 'https://api.dicebear.com/7.x/initials/svg?seed=K', hasMic: false, users: 0, max: 10, hasBanner: false },
    { id: 7, name: '...', desc: '', icon: 'https://api.dicebear.com/7.x/initials/svg?seed=P', hasMic: true, users: 0, max: 2, hasBanner: false, isLocked: true }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [wallTab, setWallTab] = useState<'posts' | 'quick'>('posts');
  const [settings, setSettings] = useState({
    primaryColor: '#1e88e5',
    secondaryColor: '#005cb2',
    backgroundColor: '#f4f7f6',
    isMarqueeEnabled: true,
    marqueeText: 'مرحباً بكم في مجتمعنا ... مدعوم بتقنية Gemini ⚡',
    areAddonsEnabled: true
  });

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'avatar' | 'cover' | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadType) return;
    alert('ميزة رفع الصور جاري تحديثها لاستخدام الخوادم الجديدة (Supabase)!');
    setUploadType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return router.push('/');
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      setCurrentUser(profile);

      const { data: channelData } = await supabase
        .from('channels')
        .select(`
          id, name, slug,
          members:channel_members(*)
        `)
        .eq('id', slug as string)
        .single();
        
      if (channelData) {
        if (channelData.members && channelData.members.length > 0) {
          const userIds = channelData.members.map((m: any) => m.user_id);
          const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url, bio').in('id', userIds);
          channelData.members = channelData.members.map((m: any) => ({
            ...m,
            user: profiles?.find(p => p.id === m.user_id) || null
          }));
        }
        setServer(channelData);
        // By default, the main channel acts as the room
        setActiveRoom(channelData);
      }
    };
    init();
  }, [slug, router]);

  useEffect(() => {
    if (!activeRoom || !currentUser) return;

    const initMessages = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', activeRoom.id)
        .order('created_at', { ascending: true })
        .limit(50);
        
      if (data) {
        const senderIds = data.map((m: any) => m.user_id).filter(Boolean);
        let profiles: any[] = [];
        if (senderIds.length > 0) {
          const { data: p } = await supabase.from('profiles').select('*').in('id', senderIds);
          profiles = p || [];
        }
        
        const messagesWithProfiles = data.map((m: any) => ({
          ...m,
          sender: profiles.find(p => p.id === m.user_id) || null
        }));
        
        setMessages(messagesWithProfiles);
        scrollToBottom();
      }

      const channel = supabase.channel(`room:${activeRoom.id}`);
      
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeRoom.id}` },
        async (payload: any) => {
          const { data: senderData } = await supabase.from('profiles').select('*').eq('id', payload.new.user_id).single();
          const newMsg = { ...payload.new, sender: senderData };
          setMessages(prev => [...prev, newMsg].slice(-50));
          scrollToBottom();
        }
      ).subscribe();

      socketRef.current = {
        channel,
        disconnect: () => {
          channel.unsubscribe();
        },
        emit: async (event: string, payload: any) => {
          if (event === 'sendCommunityMessage') {
             await supabase.from('messages').insert({
                channel_id: payload.roomId,
                user_id: currentUser.id,
                content: payload.content
             });
          }
        }
      } as any;

      const joinKey = `hasJoined_${activeRoom.id}`;
      if (!sessionStorage.getItem(joinKey)) {
        sessionStorage.setItem(joinKey, 'true');
        setTimeout(() => {
          socketRef.current?.emit('sendCommunityMessage', { roomId: activeRoom.id, content: `هذا المستخدم دخل الى [${activeRoom.name}]` });
        }, 1000);
      }
    };
    initMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [activeRoom, currentUser]);




  useEffect(() => {
    if (activePrivateChat) {
      const fetchPrivate = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('channel_id', activePrivateChat.id)
          .order('created_at', { ascending: true })
          .limit(50);
        if (data) setPrivateMessages(data);
      };
      fetchPrivate();
    }
  }, [activePrivateChat]);

  const sendPrivateMessage = async () => {
    if (!newPrivateMessage.trim() || !activePrivateChat || !currentUser) return;
    if (likesThresholds.privateChat > 0 && myLikes < likesThresholds.privateChat) {
      alert(`تحتاج إلى ${likesThresholds.privateChat} لايك لتتمكن من إرسال رسائل خاصة.`);
      return;
    }
    
    const supabase = createClient();
    await supabase.from('messages').insert({
       channel_id: activePrivateChat.id,
       user_id: currentUser.id,
       content: newPrivateMessage
    });
    
    setNewPrivateMessage('');
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeRoom) return;
    if (likesThresholds.publicChat > 0 && myLikes < likesThresholds.publicChat) {
      alert(`تحتاج إلى ${likesThresholds.publicChat} لايك لتتمكن من الكتابة في العام.`);
      return;
    }

    // Word Filter Logic
    const badWords = ['غبي', 'كلب', 'حمار', 'مخالف', 'سبام'];
    const usedBadWords = badWords.filter(word => newMessage.includes(word));
    
    if (usedBadWords.length > 0) {
      setNotificationsList(prev => [
        {
          id: Date.now(),
          type: 'filter',
          text: `اكتشاف كلمة مفلترة: "${usedBadWords.join('، ')}" من العضو ${currentUser?.username || 'مجهول'}`,
          time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ]);
      setUnreadNotifs(prev => prev + 1);
    }

    socketRef.current?.emit('sendCommunityMessage', { roomId: activeRoom.id, content: newMessage });
    setNewMessage('');
  };

  if (!server) return <div className="min-h-screen bg-[#FDF5E6] flex items-center justify-center font-bold text-secondary text-xl font-sans" dir="rtl">جاري التحميل...</div>;

  const combinedMembers = [...(server?.members || []), ...fakeUsers.map(f => ({ id: 'fake_'+f.id, isFake: true, user: { id: f.id, username: f.name, profile: { avatarUrl: f.avatarUrl } }, status: f.status || 'متصل', roleId: f.roleId, role: server?.roles?.find((r:any) => r.id === f.roleId) }))];
  const filteredMembers = combinedMembers.filter((m: any) => m.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()));

  // Function to determine mock status based on username length just for UI demo purposes
  const getStatusDetails = (username: string) => {
    if (currentUser && username === currentUser.username) {
       if (isPrivateChatDisabled) return { color: 'border-red-500', text: 'مقفل الخاص' };
       if (isIdle) return { color: 'border-orange-500', text: 'بعيد عن الجهاز' };
       return { color: 'border-green-500', text: settingsStatus || 'متواجد' };
    }
    const statuses = [
      { color: 'border-green-500', text: 'متواجد' },
      { color: 'border-red-500', text: 'مقفل الخاص' },
      { color: 'border-orange-500', text: 'بعيد عن الجهاز' },
      { color: 'border-gray-500', text: 'فصل عنده الانترنت' }
    ];
    return statuses[username.length % 4];
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 inset-0 h-[100dvh] w-full flex flex-col bg-white font-sans text-sm m-0 p-0 overflow-hidden select-none" dir="rtl" style={{ '--theme-primary': settings.primaryColor, '--theme-secondary': settings.secondaryColor, '--theme-bg': settings.backgroundColor } as any}>

      {/* Top Marquee */}
      {settings.isMarqueeEnabled && settings.marqueeText && settings.marqueeText.trim().length > 0 && (
        <div className="h-6 text-white flex items-center px-2 shrink-0 text-xs font-bold shadow-md relative z-10 border-b border-[#3e2b22]" style={{ backgroundColor: settings.primaryColor }}>
          <div dangerouslySetInnerHTML={{ __html: `<marquee scrollamount="4">${settings.marqueeText}</marquee>` }} className="w-full" />
        </div>
      )}

      {/* Mic Bar */}
      {!isMicsLocked && (
        <div className="h-14 bg-[#7a6a58] border-b border-primary flex items-center px-2 gap-2 shrink-0 relative z-20 shadow-sm" dir="rtl">
            {/* Sound Toggle */}
            <button 
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className={`w-10 h-10 rounded-md border flex items-center justify-center shadow-inner flex-shrink-0 transition-colors ${isSoundMuted ? 'bg-[#d9534f] border-[#d43f3a] hover:bg-[#c9302c] text-white' : 'bg-[#5cb85c] border-[#4cae4c] hover:bg-[#449d44] text-black'}`}
            >
               {isSoundMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            
            {/* Mics */}
            <div className="flex items-center gap-1.5 flex-1 pr-2">
              {micsList.map((micSlot) => {
                const mic = micSlot.id;
                const userOnMic = micSlot.user;
                return (
                  <div key={mic} className="relative flex-shrink-0 z-50">
                    <button 
                      onClick={() => setActiveMicMenu(activeMicMenu === mic ? null : mic)}
                      className={`w-10 h-10 rounded-md border shadow-inner overflow-hidden relative flex flex-col items-center justify-center transition-colors ${userOnMic ? 'bg-white border-[#3e2b22]' : 'bg-[#918169] border-[#3e2b22] hover:bg-[#85755d]'}`}
                    >
                      {userOnMic ? (
                        <>
                          <img src={userOnMic.avatar} className="w-full h-full object-cover absolute inset-0" />
                          <div className="absolute bottom-0 w-full bg-black/60 text-white text-[9px] font-bold text-center truncate">{userOnMic.username}</div>
                        </>
                      ) : (
                        <Mic size={20} className="text-[#3e2b22]" />
                      )}
                    </button>

                    {/* Mic Dropdown Menu */}
                    {activeMicMenu === mic && (
                      <div className="absolute top-11 left-0 w-24 bg-white border border-gray-300 rounded-sm shadow-xl flex flex-col overflow-hidden z-[999] text-[11px] font-bold text-white text-center">
                        <button onClick={() => { 
                          setActiveMicMenu(null); 
                          setMicsList(micsList.map(m => m.id === mic ? { ...m, user: null } : m));
                        }} className="bg-[#d9534f] hover:bg-[#c9302c] py-1.5 border-b border-white/20">سحب المايك</button>
                        <button onClick={() => { setActiveMicMenu(null); setIsMusicPlayerOpen(true); }} className="bg-[#9c27b0] hover:bg-[#7b1fa2] py-1.5 border-b border-white/20">موسيقى</button>
                        <button onClick={() => { setActiveMicMenu(null); if(userOnMic) setSelectedUser(userOnMic); }} className="bg-secondary hover:bg-primary py-1.5">فتح البروفايل</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Music Player Popup */}
        {isMusicPlayerOpen && (
          <div className="absolute top-24 left-4 sm:left-32 w-80 max-w-[calc(100vw-32px)] bg-gray-600 rounded-xl shadow-2xl border-4 border-gray-500 p-3 z-40 flex flex-col font-sans" dir="rtl">
            <div className="flex justify-between items-center mb-4 gap-2">
              <span className="text-white text-[12px] font-bold truncate flex-1 text-right">{selectedMusicFile ? selectedMusicFile.name : 'لم يتم اختيار ملف'}</span>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => document.getElementById('musicFileInput')?.click()} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-[11px] font-bold rounded-sm shadow-sm">اختيار</button>
                <button onClick={() => setIsMusicPlayerOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-black px-3 py-1 text-[11px] font-bold rounded-sm shadow-sm">إخفاء</button>
              </div>
              <input type="file" id="musicFileInput" accept="audio/*,video/*" className="hidden" onChange={(e) => {
                if (e.target.files && e.target.files[0]) setSelectedMusicFile(e.target.files[0]);
              }} />
            </div>

            <div className="flex justify-center gap-1.5 mb-4">
              <button className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 text-[11px] font-bold rounded-full shadow-sm">تشغيل</button>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 text-[11px] font-bold rounded-full shadow-sm">إيقاف مؤقت</button>
              <button className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-3 py-1.5 text-[11px] font-bold rounded-full shadow-sm">كتم المايك</button>
              <button className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 text-[11px] font-bold rounded-full shadow-sm">حذف</button>
            </div>

            <input type="range" className="w-full accent-purple-500 cursor-pointer bg-gray-700 h-2 rounded-lg appearance-none" />
          </div>
        )}

        {/* Right Sidebar Backdrop Overlay */}
        {(activePane && activePane !== 'members') && (
          <div 
            className="fixed top-0 left-0 right-0 h-[calc(100dvh-40px)] bg-transparent z-[89] sm:hidden" 
            onClick={() => setActivePane(null)}
          />
        )}

        {/* Middle Area (Right Sidebar + Chat) */}
        <div className="flex-1 flex overflow-hidden bg-[#FDFDFD] relative">
          
          {/* 1. Right Sidebar (Settings, or Wall) */}
          <div className={`${activePane && activePane !== 'members' ? 'flex' : 'hidden'} fixed sm:relative top-0 sm:top-auto right-0 h-[calc(100dvh-40px)] sm:h-auto sm:inset-y-0 w-[68%] max-w-[68%] sm:w-[320px] sm:max-w-[320px] bg-[#FDFDFD] flex-shrink-0 flex-col border-l border-[#D2B48C] shadow-[-5px_0_15px_rgba(0,0,0,0.1)] sm:shadow-none z-[90] sm:z-20`}>
            
            {/* Settings Pane */}
            {activePane === 'settings' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">الإعدادات</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-chatbg p-1.5 space-y-1.5 text-[11px] font-bold text-primary">
                  {/* الزخرفة */}
                  <div className="border border-primary rounded-sm bg-white overflow-hidden text-center flex flex-col">
                    <div className="bg-secondary text-white py-1">الزخرفه</div>
                    <input type="text" value={settingsUsername || currentUser?.username || ''} onChange={e => setSettingsUsername(e.target.value)} className="w-full p-1.5 text-center focus:outline-none" />
                  </div>
                  
                  {/* الحالة */}
                  <div className="border border-primary rounded-sm bg-white overflow-hidden text-center flex flex-col">
                    <div className="bg-secondary text-white py-1">الحاله</div>
                    <input type="text" value={settingsStatus} onChange={e => setSettingsStatus(e.target.value)} className="w-full p-1.5 text-center focus:outline-none" />
                  </div>


                  
                  {/* Color Grid */}
                  <div className="border border-primary rounded-sm bg-[#FDFDFD] overflow-hidden shadow-sm flex flex-col">
                    <div className="flex border-b border-primary">
                      <div className="w-2/3 bg-secondary text-white text-center py-1 border-l border-primary">لون الإسم</div>
                      <div className="w-1/3 bg-white relative">
                         <input type="color" value={userColors.nameColor} onChange={e => setUserColors({...userColors, nameColor: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                         <div className="w-full h-full pointer-events-none" style={{ backgroundColor: userColors.nameColor }}></div>
                      </div>
                    </div>
                    <div className="flex border-b border-primary">
                      <div className="w-2/3 bg-secondary text-white text-center py-1 border-l border-primary">لون الخط</div>
                      <div className="w-1/3 bg-white relative">
                         <input type="color" value={userColors.textColor} onChange={e => setUserColors({...userColors, textColor: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                         <div className="w-full h-full pointer-events-none" style={{ backgroundColor: userColors.textColor }}></div>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-2/3 bg-secondary text-white text-center py-1 border-l border-primary">لون الخلفيه</div>
                      <div className="w-1/3 bg-white relative">
                         <input type="color" value={userColors.bgColor === 'transparent' ? '#ffffff' : userColors.bgColor} onChange={e => setUserColors({...userColors, bgColor: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                         <div className="w-full h-full pointer-events-none" style={{ backgroundColor: userColors.bgColor }}></div>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => {
                    if (settingsUsername) {
                       setCurrentUser((prev: any) => prev ? { ...prev, username: settingsUsername, status: settingsStatus } : prev);
                    }
                    socketRef.current?.emit('updateMemberColors', { slug, colors: userColors });
                    alert('تم حفظ الإعدادات بنجاح');
                  }} className="w-full bg-[#5cb85c] hover:bg-[#4cae4c] text-white py-1.5 rounded-sm border border-[#4cae4c] shadow-sm">حفظ الإعدادات</button>

                  <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full bg-secondary text-white py-1.5 px-2 rounded-sm border border-primary shadow-sm outline-none text-center appearance-none">
                    <option value={120}>حجم الخطوط - 120%</option>
                    <option value={110}>حجم الخطوط - 110%</option>
                    <option value={105}>حجم الخطوط - 105%</option>
                    <option value={100}>حجم الخطوط - 100%</option>
                    <option value={95}>حجم الخطوط - 95%</option>
                    <option value={90}>حجم الخطوط - 90%</option>
                    <option value={85}>حجم الخطوط - 85%</option>
                  </select>

                  <label className="w-full bg-white text-primary py-1.5 rounded-sm border border-primary shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50">
                    تغير الصوره
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const url = URL.createObjectURL(e.target.files[0]);
                        setCurrentUser((prev: any) => prev ? { ...prev, profile: { ...prev.profile, avatarUrl: url } } : prev);
                      }
                    }} />
                  </label>
                  
                  <button onClick={() => alert('تم حذف الصورة الشخصية بنجاح')} className="w-full bg-[#d9534f] text-white py-1.5 rounded-sm border border-[#d43f3a] shadow-sm flex items-center justify-center gap-2">
                    حذف الصوره
                  </button>

                  <button onClick={() => setIsPrivateChatDisabled(!isPrivateChatDisabled)} className="w-full bg-white text-primary py-1.5 rounded-sm border border-primary shadow-sm flex items-center justify-center gap-2">
                    تعطيل المحادثات الخاصه {isPrivateChatDisabled && <span className="text-green-500 font-bold">✔️</span>}
                  </button>
                  <button onClick={() => setIsNotificationsDisabled(!isNotificationsDisabled)} className="w-full bg-white text-primary py-1.5 rounded-sm border border-primary shadow-sm flex items-center justify-center gap-2">
                    تعطيل التنبيهات {isNotificationsDisabled && <span className="text-green-500 font-bold">✔️</span>}
                  </button>
                  
                  <button onClick={() => setActivePane('games')} className="w-full bg-[#8a2be2] text-white py-1.5 rounded-sm border border-[#7a1be2] shadow-sm">الألعاب</button>
                  
                  <button onClick={() => {
                    if (likesThresholds.media > 0 && myLikes < likesThresholds.media) {
                      alert(`تحتاج إلى ${likesThresholds.media} لايك لتتمكن من إضافة وسائط.`);
                      return;
                    }
                    setIsLinkModalOpen(true);
                  }} className="w-full bg-black text-white py-1.5 rounded-sm shadow-sm flex items-center justify-center gap-2 font-bold border border-gray-800">
                    اضافة رابط وسائط
                  </button>

                  <button onClick={() => setActivePane('addons')} className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-1.5 rounded-sm border border-pink-500 shadow-sm">الاضافات والميزات</button>

                  <button onClick={() => alert('جاري تغيير الرقم السري لعضويتك...')} className="w-full bg-white text-primary py-1.5 rounded-sm border border-primary shadow-sm">تغيير الرقم السري</button>
                  <button onClick={() => setIsAnnouncementOpen(true)} className="w-full bg-white text-primary py-1.5 rounded-sm border border-primary shadow-sm flex items-center justify-center gap-2">إرسال إعلان</button>
                  <button onClick={() => setIsRoomManageOpen(true)} className="w-full bg-white text-primary py-1.5 rounded-sm border border-primary shadow-sm flex items-center justify-center gap-2">إداره الغرفه</button>


                  {isCurrentUserAdmin && (
                    <button onClick={() => router.push(`/c/${slug}/admin`)} className="w-full bg-primary text-white py-1.5 rounded-sm border border-[#3e2b22] shadow-sm flex justify-center gap-2">لوحة الاداره</button>
                  )}
                  
                  <button onClick={() => { sendSystemMessage('تسجيل خروج'); setTimeout(() => router.push('/community'), 300); }} className="w-full bg-[#d9534f] text-white py-1.5 rounded-sm border border-[#d43f3a] shadow-sm mt-1">تسجيل خروج</button>
                </div>
              </>
            )}
            {/* Games Pane (الألعاب) */}
            {activePane === 'games' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">الألعاب</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#e3e2ff] to-[#f3e5f5] p-3 space-y-4 flex flex-col font-bold" dir="rtl">
                  
                  {/* Ludo Banner */}
                  <div className="bg-gradient-to-r from-[#17a2b8] to-[#0dcaf0] rounded-xl p-3 relative overflow-hidden shadow-md transition-shadow flex-shrink-0">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                    <div className="flex justify-between items-start relative z-10">
                      <div className="bg-[#20c997] text-white px-2 py-0.5 rounded-md text-[10px] font-black border border-[#198754]">2-4</div>
                      <div className="text-white text-right py-1">
                        <div className="text-[14px] font-black leading-normal">لودو ستار (نسخة مبسطة)</div>
                        <div className="text-[9px] opacity-90 mt-0.5">جماعية</div>
                      </div>
                    </div>
                    <button onClick={() => setActivePane('ludo-invites')} className="mt-2 w-full bg-white/20 hover:bg-white/30 text-white rounded-md py-1 text-[10px] font-bold border border-white/40 shadow-sm relative z-10 transition-colors">دعوة للعب 🎲</button>
                  </div>

                  {/* Tic Tac Toe Banner */}
                  <div className="bg-gradient-to-r from-[#6f42c1] to-[#a370f7] rounded-xl p-3 relative overflow-hidden shadow-md transition-shadow flex-shrink-0">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                    <div className="flex justify-between items-start relative z-10">
                      <div className="bg-[#e83e8c] text-white px-2 py-0.5 rounded-md text-[10px] font-black border border-[#d63384]">2</div>
                      <div className="text-white text-right py-1">
                        <div className="text-[14px] font-black leading-normal">لعبة إكس أو (X O)</div>
                        <div className="text-[9px] opacity-90 mt-0.5">تحدي ثنائي</div>
                      </div>
                    </div>
                    <button onClick={() => setActivePane('xo-invites')} className="mt-2 w-full bg-white/20 hover:bg-white/30 text-white rounded-md py-1 text-[10px] font-bold border border-white/40 shadow-sm relative z-10 transition-colors">دعوة للعب ❌⭕</button>
                  </div>

                  {/* Competitions Bot Banner */}
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col gap-2 flex-shrink-0">
                    <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-inner">
                        🏆
                      </div>
                      <div className="text-right flex-1 pr-3">
                        <div className="text-[13px] font-black text-gray-800">بوت المسابقات</div>
                        <div className="text-[9px] text-gray-500">غرفة المسابقات والحظ</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 text-[10px] rounded-md px-1 py-1 outline-none text-right" dir="rtl">
                        <option>الشات العام</option>
                        <option>روم المسابقات</option>
                        <option>حائط المنشورات</option>
                      </select>
                      <button onClick={() => alert('تم تشغيل بوت المسابقات بنجاح')} className="bg-[#4CAF50] hover:bg-[#45a049] text-white px-3 py-1 text-[10px] rounded-md font-bold shadow-sm">تشغيل البوت ▶️</button>
                    </div>
                  </div>

                  {/* Stars Section */}
                  <div className="pt-2 flex-shrink-0">
                    <h3 className="text-gray-500 text-[11px] mb-2 px-1 text-right">النجوم</h3>
                    
                    <div className="space-y-2">
                      <div onClick={() => setActivePane('ludo-stars')} className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 bg-[#2ecc71] rounded-lg flex items-center justify-center text-white text-lg shadow-inner">
                          🎮
                        </div>
                        <div className="text-right flex-1 pr-3">
                          <div className="text-[12px] font-black text-gray-800">نجم Ludo</div>
                          <div className="text-[9px] text-gray-500">ترتيب لاعبي Ludo</div>
                        </div>
                        <div className="text-gray-300 text-xs">◀</div>
                      </div>

                      <div onClick={() => setActivePane('xo-stars')} className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 bg-[#9b59b6] rounded-lg flex items-center justify-center text-white text-lg shadow-inner">
                          ✖
                        </div>
                        <div className="text-right flex-1 pr-3">
                          <div className="text-[12px] font-black text-gray-800">نجم X-O</div>
                          <div className="text-[9px] text-gray-500">ترتيب لاعبي X-O</div>
                        </div>
                        <div className="text-gray-300 text-xs">◀</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1"></div> {/* Spacer */}

                  {/* Toggle Invites */}
                  <div className="bg-white/60 rounded-xl p-3 shadow-sm border border-white flex items-center justify-between mt-4">
                    <div className="w-10 h-10 bg-[#e74c3c] rounded-full flex items-center justify-center text-white shadow-inner">
                      🚫
                    </div>
                    <div className="text-right flex-1 pr-3">
                      <div className="text-[12px] font-black text-[#e74c3c]">إيقاف دعوات الألعاب</div>
                      <div className="text-[9px] text-gray-600">لا تصلك دعوات Ludo أو X-O</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-2">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-10 h-5 bg-white peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-400 peer-checked:after:bg-white shadow-inner border border-gray-200"></div>
                    </label>
                  </div>

                </div>
              </>
            )}

            {/* Ludo Invites Pane */}
            {activePane === 'ludo-invites' && (
              <>
                <div className="h-8 bg-[#17a2b8] text-white flex items-center justify-between px-2 font-bold text-[13px] border-b border-[#138496] flex-shrink-0 shadow-md">
                  <span>دعوة للعب Ludo</span>
                  <button onClick={() => setActivePane('games')} className="bg-[#138496] hover:bg-[#117a8b] rounded-sm w-5 h-5 flex items-center justify-center font-bold text-white"><X size={14} /></button>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-50 p-2 space-y-1.5 flex flex-col font-bold" dir="rtl">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-md p-1.5 flex justify-between items-center shadow-sm hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=User${i}`} className="w-8 h-8 rounded-sm bg-gray-200" />
                        <span className="text-[11px] font-bold text-gray-800">العضو {i}</span>
                      </div>
                      <button onClick={(e) => { e.currentTarget.innerText = 'تمت الدعوة ✔️'; e.currentTarget.classList.add('bg-green-500', 'text-white', 'border-green-600'); }} className="bg-[#17a2b8] text-white text-[10px] font-bold py-1 px-3 rounded-sm border border-[#138496] shadow-sm">إرسال دعوة</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* XO Invites Pane */}
            {activePane === 'xo-invites' && (
              <>
                <div className="h-8 bg-[#6f42c1] text-white flex items-center justify-between px-2 font-bold text-[13px] border-b border-[#59339d] flex-shrink-0 shadow-md">
                  <span>دعوة للعب X-O</span>
                  <button onClick={() => setActivePane('games')} className="bg-[#59339d] hover:bg-[#4a2a82] rounded-sm w-5 h-5 flex items-center justify-center font-bold text-white"><X size={14} /></button>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-50 p-2 space-y-1.5 flex flex-col font-bold" dir="rtl">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-md p-1.5 flex justify-between items-center shadow-sm hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=User${i}`} className="w-8 h-8 rounded-sm bg-gray-200" />
                        <span className="text-[11px] font-bold text-gray-800">العضو {i}</span>
                      </div>
                      <button onClick={(e) => { e.currentTarget.innerText = 'تمت الدعوة ✔️'; e.currentTarget.classList.add('bg-green-500', 'text-white', 'border-green-600'); }} className="bg-[#6f42c1] text-white text-[10px] font-bold py-1 px-3 rounded-sm border border-[#59339d] shadow-sm">إرسال دعوة</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Addons Pane */}
            {activePane === 'addons' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">الاضافات والميزات</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-[#361e40] p-3 space-y-2 font-bold text-white">
                  
                  {/* Button 1 */}
                  <div onClick={() => setActivePane('profile-design')} className="bg-gradient-to-l from-[#a855f7] to-[#d946ef] rounded-full flex items-center justify-between p-1.5 shadow-md cursor-pointer hover:opacity-90 relative">
                    <span className="flex-1 text-center text-[12px] font-extrabold pr-10">تصميم العضوية</span>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><Palette size={18} /></div>
                    <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-[10px] absolute left-2">1</div>
                  </div>

                  <div className="text-center text-white/50 text-[10px] my-0.5">•••</div>

                  {/* Button 2 */}
                  <div onClick={() => togglePane('notifications')} className="bg-gradient-to-l from-[#e11d48] to-[#f43f5e] rounded-full flex items-center justify-between p-1.5 shadow-md cursor-pointer hover:opacity-90 relative">
                    <span className="flex-1 text-center text-[12px] font-extrabold pr-10">الإشعارات</span>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><BellOff size={18} /></div>
                    <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-[10px] absolute left-2">2</div>
                  </div>

                  <div className="text-center text-white/50 text-[10px] my-0.5">•••</div>

                  {/* Button 3 */}
                  {settings.showProfileVisitors !== false && (
                    <>
                      <div onClick={() => setActivePane('profile-visitors')} className="bg-gradient-to-l from-[#3b82f6] to-[#60a5fa] rounded-full flex items-center justify-between p-1.5 shadow-md cursor-pointer hover:opacity-90 relative">
                        <span className="flex-1 text-center text-[12px] font-extrabold pr-10">زائرين الملف الشخصي</span>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><Eye size={18} /></div>
                        <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-[10px] absolute left-2">3</div>
                      </div>
                      <div className="text-center text-white/50 text-[10px] my-0.5">•••</div>
                    </>
                  )}

                  <div className="text-center text-white/50 text-[10px] my-0.5">•••</div>

                  {/* Button 4 */}
                  {settings.showWallTrend !== false && (
                    <div onClick={() => setActivePane('wall-trend')} className="bg-gradient-to-l from-[#7e22ce] to-[#8b5cf6] rounded-full flex items-center justify-between p-1.5 shadow-md cursor-pointer hover:opacity-90 relative">
                      <span className="flex-1 text-center text-[12px] font-extrabold pr-10">ترند الحائط</span>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><TrendingUp size={18} /></div>
                      <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-[10px] absolute left-2">4</div>
                    </div>
                  )}

                  {/* Button 5 */}
                  {settings.showWallCreator !== false && (
                    <div onClick={() => setActivePane('wall-creator')} className="bg-gradient-to-l from-[#7e22ce] to-[#8b5cf6] rounded-full flex items-center justify-between p-1.5 shadow-md cursor-pointer hover:opacity-90 relative">
                      <span className="flex-1 text-center text-[12px] font-extrabold pr-10">مبدع الحائط</span>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><Award size={18} /></div>
                      <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-[10px] absolute left-2">5</div>
                    </div>
                  )}

                  {/* Button 6 */}
                  {settings.showMicStars !== false && (
                    <div onClick={() => setActivePane('mic-stars')} className="bg-gradient-to-l from-[#7e22ce] to-[#8b5cf6] rounded-full flex items-center justify-between p-1.5 shadow-md cursor-pointer hover:opacity-90 relative">
                      <span className="flex-1 text-center text-[12px] font-extrabold pr-10">نجوم المايك</span>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><Mic2 size={18} /></div>
                      <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-[10px] absolute left-2">6</div>
                    </div>
                  )}

                  <div className="text-center text-white/50 text-[10px] my-0.5">•••</div>

                  <div className="flex items-center gap-1 text-[11px] mb-2 px-1 text-white">
                    <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[9px]">7</div>
                    خيارات الكتم
                  </div>

                  {/* Button 7.1 */}
                  <div className="bg-gradient-to-l from-[#0ea5e9] to-[#38bdf8] rounded-full flex items-center justify-between p-1.5 shadow-md">
                    <div className="flex-1 text-right text-[11px] font-extrabold pl-2 whitespace-nowrap">كتم صوت الإشعارات</div>
                    <div className="w-10 h-5 bg-white rounded-full mx-1 flex items-center p-0.5 cursor-pointer">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><span className="text-[14px]">🔕</span></div>
                  </div>

                  {/* Button 7.2 */}
                  <div className="bg-gradient-to-l from-[#10b981] to-[#34d399] rounded-full flex items-center justify-between p-1.5 shadow-md">
                    <div className="flex-1 text-right text-[11px] font-extrabold pl-2 whitespace-nowrap">تعطيل إشعارات الحائط</div>
                    <div className="w-10 h-5 bg-white rounded-full mx-1 flex items-center p-0.5 cursor-pointer">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><span className="text-[14px]">📣</span></div>
                  </div>
                  
                </div>
              </>
            )}

            {/* Wall Trend Pane */}
            {activePane === 'wall-trend' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">ترند الحائط</span>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-[#FDFDFD] flex flex-col">
                  {/* Sub Header / Filters */}
                  <div className="bg-[#F8F9FA] p-3 border-b border-gray-200 shadow-sm flex flex-col items-center">
                    <div className="w-full flex justify-start mb-2">
                      <button onClick={() => setActivePane('addons')} className="text-blue-500 text-[11px] font-bold flex items-center gap-1 hover:underline">
                        <span>عودة</span> <span>⬅️</span>
                      </button>
                    </div>
                    
                    <div className="text-[12px] font-bold text-gray-700 mb-2">ترند الحائط ـــ يومي</div>
                    
                    <div className="flex gap-2 w-full max-w-[250px]">
                      <button className="flex-1 bg-[#FDE68A] text-[#92400E] border border-[#F59E0B] rounded-full py-1 text-[11px] font-bold shadow-sm">يومي</button>
                      <button className="flex-1 bg-white border border-gray-300 text-gray-600 rounded-full py-1 text-[11px] font-bold shadow-sm hover:bg-gray-50">أسبوعي</button>
                      <button className="flex-1 bg-white border border-gray-300 text-gray-600 rounded-full py-1 text-[11px] font-bold shadow-sm hover:bg-gray-50">شهري</button>
                    </div>
                  </div>

                  <div className="p-2 space-y-3">
                    {/* Card 1: Most Posted */}
                    <div className="border border-[#FCD34D] bg-[#FEF3C7]/30 rounded-lg p-2 relative shadow-sm">
                      <div className="text-right text-[11px] font-bold text-[#D97706] mb-2 px-1 flex items-center justify-end gap-1">الأكثر نشراً اليوم 📌</div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center bg-white p-1.5 rounded-md border border-[#FDE68A] shadow-sm">
                          <div className="bg-[#FEF3C7] text-[#D97706] px-3 py-1 rounded-full text-[10px] font-bold">منشور 35</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-700">جـمـيـلوز</span>
                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden"><img src="https://api.dicebear.com/7.x/initials/svg?seed=J" /></div>
                            <span>🥇</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center bg-white p-1.5 rounded-md border border-[#FDE68A] shadow-sm">
                          <div className="bg-[#FEF3C7] text-[#D97706] px-3 py-1 rounded-full text-[10px] font-bold">منشور 26</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-700">فؤاد</span>
                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden"><img src="https://api.dicebear.com/7.x/initials/svg?seed=F" /></div>
                            <span>🥈</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center bg-white p-1.5 rounded-md border border-[#FDE68A] shadow-sm">
                          <div className="bg-[#FEF3C7] text-[#D97706] px-3 py-1 rounded-full text-[10px] font-bold">منشور 14</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-700">majid</span>
                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden"><img src="https://api.dicebear.com/7.x/initials/svg?seed=M" /></div>
                            <span>🥉</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Most Liked */}
                    <div className="border border-[#FCA5A5] bg-[#FEE2E2]/30 rounded-lg p-2 relative shadow-sm">
                      <div className="text-right text-[11px] font-bold text-[#DC2626] mb-2 px-1 flex items-center justify-end gap-1">الأكثر حصولاً على إعجابات اليوم ❤️</div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center bg-white p-1.5 rounded-md border border-[#FECACA] shadow-sm">
                          <div className="bg-[#FEE2E2] text-[#DC2626] px-3 py-1 rounded-full text-[10px] font-bold">إعجاب 12</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-700">جـمـيـلوز</span>
                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden"><img src="https://api.dicebear.com/7.x/initials/svg?seed=J" /></div>
                            <span>🥇</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center bg-white p-1.5 rounded-md border border-[#FECACA] shadow-sm">
                          <div className="bg-[#FEE2E2] text-[#DC2626] px-3 py-1 rounded-full text-[10px] font-bold">إعجاب 10</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-700">فؤاد</span>
                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden"><img src="https://api.dicebear.com/7.x/initials/svg?seed=F" /></div>
                            <span>🥈</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Most Commented */}
                    <div className="border border-[#C4B5FD] bg-[#EDE9FE]/40 rounded-lg p-2 relative shadow-sm">
                      <div className="text-right text-[11px] font-bold text-[#7C3AED] mb-2 px-1 flex items-center justify-end gap-1">الأكثر حصولاً على تعليقات اليوم 💬</div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center bg-white p-1.5 rounded-md border border-[#DDD6FE] shadow-sm">
                          <div className="bg-[#EDE9FE] text-[#7C3AED] px-3 py-1 rounded-full text-[10px] font-bold">تعليق 1</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-700">جـمـيـلوز</span>
                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden"><img src="https://api.dicebear.com/7.x/initials/svg?seed=J" /></div>
                            <span>🥇</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            )}

            {/* Wall Creator Pane */}
            {activePane === 'wall-creator' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">مبدع الحائط</span>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#6b21a8] to-[#3b0764] flex flex-col text-white">
                  <div className="p-3 flex flex-col items-center">
                    <div className="w-full flex justify-start mb-2">
                      <button onClick={() => setActivePane('addons')} className="bg-white text-blue-600 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm hover:bg-gray-100">
                        <span>عودة</span> <span>⬅️</span>
                      </button>
                    </div>
                    
                    <div className="text-[12px] font-bold mb-3 text-white">مبدع الحائط ـــ يومي</div>
                    
                    <div className="flex gap-2 w-full max-w-[250px] mb-6">
                      <button className="flex-1 bg-[#FBBF24] text-[#78350F] rounded-full py-1 text-[11px] font-bold shadow-sm">يومي</button>
                      <button className="flex-1 bg-white/20 text-white rounded-full py-1 text-[11px] font-bold shadow-sm border border-white/30">أسبوعي</button>
                      <button className="flex-1 bg-white/20 text-white rounded-full py-1 text-[11px] font-bold shadow-sm border border-white/30">شهري</button>
                    </div>

                    {/* Podium */}
                    <div className="flex items-end justify-center gap-2 w-full mb-6 px-2">
                      {/* 2nd Place */}
                      <div className="flex flex-col items-center w-1/3 bg-white/10 rounded-t-xl pt-3 pb-2 border border-white/20">
                        <div className="text-[10px] font-bold mb-1">الثاني 🥈</div>
                        <img src="https://api.dicebear.com/7.x/initials/svg?seed=F" className="w-12 h-12 rounded-full border-2 border-gray-300 mb-1 bg-white" />
                        <span className="text-[11px] font-bold truncate w-full text-center px-1">فؤاد</span>
                        <div className="mt-1 bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold">26</div>
                      </div>
                      
                      {/* 1st Place */}
                      <div className="flex flex-col items-center w-1/3 bg-gradient-to-b from-[#b91c1c] to-[#991b1b] rounded-t-xl pt-4 pb-3 border border-red-400 transform -translate-y-4 shadow-lg z-10">
                        <div className="text-[11px] font-extrabold mb-1 text-yellow-300">الأول 🥇</div>
                        <img src="https://api.dicebear.com/7.x/initials/svg?seed=J" className="w-14 h-14 rounded-full border-2 border-yellow-400 mb-1 shadow-md bg-white" />
                        <span className="text-[12px] font-bold truncate w-full text-center px-1">جـمـيـلوز</span>
                        <div className="mt-2 bg-[#FBBF24] text-[#92400E] px-4 py-1 rounded-full text-[11px] font-extrabold shadow-sm">35</div>
                      </div>

                      {/* 3rd Place */}
                      <div className="flex flex-col items-center w-1/3 bg-white/10 rounded-t-xl pt-3 pb-2 border border-white/20">
                        <div className="text-[10px] font-bold mb-1">الثالث 🥉</div>
                        <img src="https://api.dicebear.com/7.x/initials/svg?seed=M" className="w-12 h-12 rounded-full border-2 border-[#b87333] mb-1 bg-white" />
                        <span className="text-[11px] font-bold truncate w-full text-center px-1">majid</span>
                        <div className="mt-1 bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold">17</div>
                      </div>
                    </div>

                    {/* List */}
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between bg-white/10 rounded-full p-1.5 border border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center text-[10px] font-bold">4</div>
                          <img src="https://api.dicebear.com/7.x/initials/svg?seed=A" className="w-8 h-8 rounded-full border border-white/30 bg-white" />
                          <span className="text-[11px] font-bold">موحا بارد</span>
                        </div>
                        <div className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold ml-2">15</div>
                      </div>
                      <div className="flex items-center justify-between bg-white/10 rounded-full p-1.5 border border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-cyan-400 text-cyan-900 flex items-center justify-center text-[10px] font-bold">5</div>
                          <img src="https://api.dicebear.com/7.x/initials/svg?seed=B" className="w-8 h-8 rounded-full border border-white/30 bg-white" />
                          <span className="text-[11px] font-bold">مـتـفـائـلـه</span>
                        </div>
                        <div className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold ml-2">7</div>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            )}

            {/* Mic Stars Pane */}
            {activePane === 'mic-stars' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">نجوم المايك</span>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1e40af] to-[#1e3a8a] flex flex-col text-white">
                  <div className="p-3 flex flex-col items-center">
                    <div className="w-full flex justify-start mb-2">
                      <button onClick={() => setActivePane('addons')} className="bg-white text-blue-600 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm hover:bg-gray-100">
                        <span>عودة</span> <span>⬅️</span>
                      </button>
                    </div>
                    
                    <div className="text-[12px] font-bold mb-3 text-white">نجوم المايك ـــ أسبوعي</div>
                    
                    <div className="flex gap-2 w-full max-w-[250px] mb-6">
                      <button className="flex-1 bg-white/20 text-white rounded-full py-1 text-[11px] font-bold shadow-sm border border-white/30">يومي</button>
                      <button className="flex-1 bg-[#3b82f6] text-white border border-[#2563eb] rounded-full py-1 text-[11px] font-bold shadow-sm">أسبوعي</button>
                      <button className="flex-1 bg-white/20 text-white rounded-full py-1 text-[11px] font-bold shadow-sm border border-white/30">شهري</button>
                    </div>

                    {/* Podium */}
                    <div className="flex items-end justify-center gap-2 w-full mb-6 px-2">
                      {/* 3rd Place */}
                      <div className="flex flex-col items-center w-1/3 bg-white/10 rounded-t-xl pt-3 pb-2 border border-white/20">
                        <div className="text-[10px] font-bold mb-1">الثالث 🥉</div>
                        <img src="https://api.dicebear.com/7.x/initials/svg?seed=U3" className="w-12 h-12 rounded-full border-2 border-[#b87333] mb-1 bg-white" />
                        <span className="text-[11px] font-bold truncate w-full text-center px-1">عضو</span>
                        <div className="mt-1 bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold">20</div>
                      </div>
                      
                      {/* 1st Place */}
                      <div className="flex flex-col items-center w-1/3 bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] rounded-t-xl pt-4 pb-3 border border-blue-400 transform -translate-y-4 shadow-lg z-10">
                        <div className="text-[11px] font-extrabold mb-1 text-yellow-300">الأول 🥇</div>
                        <img src="https://api.dicebear.com/7.x/initials/svg?seed=U1" className="w-14 h-14 rounded-full border-2 border-yellow-400 mb-1 shadow-md bg-white" />
                        <span className="text-[12px] font-bold truncate w-full text-center px-1">صاحي لهم</span>
                        <div className="mt-2 bg-white text-blue-800 px-4 py-1 rounded-full text-[11px] font-extrabold shadow-sm">70</div>
                      </div>

                      {/* 2nd Place */}
                      <div className="flex flex-col items-center w-1/3 bg-white/10 rounded-t-xl pt-3 pb-2 border border-white/20">
                        <div className="text-[10px] font-bold mb-1">الثاني 🥈</div>
                        <img src="https://api.dicebear.com/7.x/initials/svg?seed=M" className="w-12 h-12 rounded-full border-2 border-gray-300 mb-1 bg-white" />
                        <span className="text-[11px] font-bold truncate w-full text-center px-1">majid</span>
                        <div className="mt-1 bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold">52</div>
                      </div>
                    </div>

                    {/* List */}
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between bg-white/10 rounded-full p-1.5 border border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center text-[10px] font-bold">4</div>
                          <img src="https://api.dicebear.com/7.x/initials/svg?seed=A" className="w-8 h-8 rounded-full border border-white/30 bg-white" />
                          <span className="text-[11px] font-bold">أميرة</span>
                        </div>
                        <div className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold ml-2">17</div>
                      </div>
                      <div className="flex items-center justify-between bg-white/10 rounded-full p-1.5 border border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-cyan-400 text-cyan-900 flex items-center justify-center text-[10px] font-bold">5</div>
                          <img src="https://api.dicebear.com/7.x/initials/svg?seed=H" className="w-8 h-8 rounded-full border border-white/30 bg-white" />
                          <span className="text-[11px] font-bold">حلم</span>
                        </div>
                        <div className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold ml-2">8</div>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            )}

            {/* Profile Design Pane */}
            {activePane === 'profile-design' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">تصميم العضوية</span>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-[#FDFDFD] flex flex-col p-3 space-y-4 font-bold" dir="rtl">
                  <div className="w-full flex justify-start mb-2">
                    <button onClick={() => setActivePane('addons')} className="text-blue-500 text-[11px] font-bold flex items-center gap-1 hover:underline">
                      <span>عودة</span> <span>⬅️</span>
                    </button>
                  </div>
                  
                  <div className="text-[14px] font-black text-gray-800 text-center">قم بتخصيص مظهر عضويتك 🎨</div>
                  
                  {/* Frame Upload */}
                  <div className="bg-white border border-purple-200 shadow-sm rounded-lg p-3 text-center">
                    <div className="text-[12px] text-purple-800 mb-2 font-black">رفع إطار العضوية</div>
                    <div className="text-[10px] text-gray-500 mb-3">يظهر الإطار كدائرة حول صورتك الشخصية في المتواجدين</div>
                    <button onClick={() => alert('جاري فتح الاستديو لرفع الإطار...')} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md py-1.5 text-[11px] font-bold shadow-md hover:opacity-90">رفع إطار العضوية 🔲</button>
                  </div>

                  {/* Background Upload */}
                  <div className="bg-white border border-blue-200 shadow-sm rounded-lg p-3 text-center">
                    <div className="text-[12px] text-blue-800 mb-2 font-black">رفع خلفية العضوية (النك)</div>
                    <div className="text-[10px] text-gray-500 mb-3">تظهر كخلفية لاسمك في قائمة المتواجدين - المقاس الموصى به: 186 × 650</div>
                    <button onClick={() => alert('جاري فتح الاستديو لرفع خلفية العضوية...')} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-md py-1.5 text-[11px] font-bold shadow-md hover:opacity-90">رفع خلفية النك 🖼️</button>
                  </div>
                </div>
              </>
            )}

            {/* Ludo Stars Pane */}
            {activePane === 'ludo-stars' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">أبطال لودو</span>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#198754] to-[#20c997] flex flex-col text-white pb-4" dir="rtl">
                  <div className="p-3 w-full flex justify-start">
                    <button onClick={() => setActivePane('games')} className="bg-white/20 text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm hover:bg-white/30 border border-white/40">
                      <span>عودة</span> <span>⬅️</span>
                    </button>
                  </div>
                  <div className="text-center text-[16px] font-black mb-4">🏆 قائمة أبطال لودو 🏆</div>
                  <div className="px-3 space-y-2">
                    {[1,2,3,4,5,6,7,8,9,10].map((num) => (
                      <div key={num} className="bg-white/10 border border-white/20 rounded-md p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${num === 1 ? 'bg-yellow-400 text-yellow-900' : num === 2 ? 'bg-gray-300 text-gray-800' : num === 3 ? 'bg-amber-600 text-white' : 'bg-black/30 text-white'}`}>{num}</div>
                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=Ludo${num}`} className="w-8 h-8 rounded-sm bg-white" />
                          <span className="text-[12px] font-bold">بطل لودو {num}</span>
                        </div>
                        <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded-sm font-bold shadow-sm">{1000 - (num * 50)} فوز</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* XO Stars Pane */}
            {activePane === 'xo-stars' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">أبطال X-O</span>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#6f42c1] to-[#a370f7] flex flex-col text-white pb-4" dir="rtl">
                  <div className="p-3 w-full flex justify-start">
                    <button onClick={() => setActivePane('games')} className="bg-white/20 text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm hover:bg-white/30 border border-white/40">
                      <span>عودة</span> <span>⬅️</span>
                    </button>
                  </div>
                  <div className="text-center text-[16px] font-black mb-4">🏆 قائمة أبطال إكس أو 🏆</div>
                  <div className="px-3 space-y-2">
                    {[1,2,3,4,5,6,7,8,9,10].map((num) => (
                      <div key={num} className="bg-white/10 border border-white/20 rounded-md p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${num === 1 ? 'bg-yellow-400 text-yellow-900' : num === 2 ? 'bg-gray-300 text-gray-800' : num === 3 ? 'bg-amber-600 text-white' : 'bg-black/30 text-white'}`}>{num}</div>
                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=XO${num}`} className="w-8 h-8 rounded-sm bg-white" />
                          <span className="text-[12px] font-bold">بطل إكس أو {num}</span>
                        </div>
                        <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded-sm font-bold shadow-sm">{800 - (num * 40)} فوز</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notifications Pane */}
            {activePane === 'notifications' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">الإشعارات</span>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-[#FDFDFD] flex flex-col relative">
                  <div className="w-full flex justify-start p-2 border-b border-gray-100 shadow-sm z-10 bg-white">
                    <button onClick={() => setActivePane('addons')} className="text-blue-500 text-[11px] font-bold flex items-center gap-1 hover:underline">
                      <span>عودة</span> <span>⬅️</span>
                    </button>
                  </div>
                  
                  {notificationsList.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                        <span className="text-orange-500"><Bell fill="currentColor" size={32} /></span>
                      </div>
                      <div className="font-extrabold text-gray-800 text-[13px] mb-2">لا يوجد إشعارات بعد</div>
                      <div className="text-gray-500 text-[11px] font-bold text-center">ستصلك التنبيهات والإعجابات هنا</div>
                    </div>
                  ) : (
                    <div className="flex-1 p-2 space-y-2">
                      {notificationsList.map(notif => (
                        <div key={notif.id} className="bg-red-50 border border-red-200 p-2 rounded-md shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-red-500"><Bell size={14} /></span>
                            <span className="font-bold text-[11px] text-red-700">تنبيه فلتر الكلمات</span>
                            <span className="text-[9px] text-gray-500 mr-auto">{notif.time}</span>
                          </div>
                          <div className="text-[11px] font-bold text-gray-800">{notif.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Rooms Pane */}
            {activePane === 'rooms' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">{`غرف الدردشه : ${server?.rooms?.length || 0}`}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-[#FDFDFD] flex flex-col">
                  <div className="bg-[#5cb85c] text-white text-[12px] font-bold p-2 border-b border-[#4cae4c] flex items-center justify-start gap-1 cursor-pointer hover:bg-[#449d44] flex-shrink-0 shadow-sm">
                    غرفه جديده <Plus size={14} />
                  </div>

                  <div className="flex-1 overflow-y-auto flex flex-col pb-2">
                    {MOCK_ROOMS.map((room) => {
                      if (room.hasBanner) {
                        return (
                          <div key={room.id} onClick={() => changeRoom(room)} className="relative w-full h-28 border-b border-gray-300 cursor-pointer">
                            <img src={room.icon} alt={room.name} className="w-full h-full object-cover" />
                            {room.isLocked && <div className="absolute top-1 right-2 text-yellow-400 text-[12px] drop-shadow-md">🔒</div>}
                            <div className="absolute bottom-0 left-0 bg-black/80 text-white text-[11px] font-bold px-3 py-1 rounded-tr-md flex items-center gap-1">
                              {room.hasMic ? '🎤' : '👤'} {room.users}/{room.max}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={room.id} onClick={() => changeRoom(room)} className="flex items-center justify-between p-1.5 border-b border-gray-200 hover:bg-gray-50 cursor-pointer bg-white">
                          
                          <div className="flex flex-col justify-center">
                            <span className="text-[12px] font-bold text-gray-800 flex items-center gap-1">
                              {room.isLocked && <span className="text-yellow-500 text-[10px]">🔒</span>}
                              {room.name}
                            </span>
                            {room.desc && <span className="text-[10px] text-gray-500 max-w-[150px] truncate">{room.desc}</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-sm text-white text-[11px] font-bold shadow-sm ${room.hasMic ? 'bg-[#d9534f]' : 'bg-gray-500'}`}>
                              {room.hasMic ? '🎤' : '👤'} {room.users}/{room.max}
                            </div>
                            <img src={room.icon} alt={room.name} className="w-10 h-10 object-cover border border-gray-300 rounded-sm" />
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Wall Pane */}
            {activePane === 'wall' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">الحائط</span>
                </div>
                
                <div className="flex-1 flex flex-col overflow-hidden bg-[#F5DEB3]">
                  {/* Stories Section */}
                  {settings.showStory !== false && (
                    <div className="h-[90px] bg-white px-3 py-2 border-b border-gray-300 flex gap-2.5 overflow-x-auto no-scrollbar items-center flex-shrink-0">
                      
                      {/* Add Story Button (Current User) */}
                      <div className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group">
                        <div className="w-[64px] h-[64px] rounded-full border-2 border-gray-200 p-0.5 relative flex items-center justify-center transition-transform group-hover:scale-105">
                          <img src={currentUser?.profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.username}`} className="w-full h-full rounded-full object-cover" />
                          <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                            <Plus size={14} strokeWidth={4}/>
                          </div>
                        </div>
                      </div>

                      {/* Mock Story 1 (Unseen) */}
                      <div className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group">
                        <div className="w-[64px] h-[64px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[2px] transition-transform group-hover:scale-105">
                          <div className="w-full h-full bg-white rounded-full p-[2px]">
                            <img src="https://api.dicebear.com/7.x/initials/svg?seed=J" className="w-full h-full rounded-full object-cover" />
                          </div>
                        </div>
                      </div>

                      {/* Mock Story 2 (Unseen) */}
                      <div className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group">
                        <div className="w-[64px] h-[64px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[2px] transition-transform group-hover:scale-105">
                          <div className="w-full h-full bg-white rounded-full p-[2px]">
                            <img src="https://api.dicebear.com/7.x/initials/svg?seed=F" className="w-full h-full rounded-full object-cover" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Mock Story 3 (Unseen) */}
                      <div className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group">
                        <div className="w-[64px] h-[64px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[2px] transition-transform group-hover:scale-105">
                          <div className="w-full h-full bg-white rounded-full p-[2px]">
                            <img src="https://api.dicebear.com/7.x/initials/svg?seed=A" className="w-full h-full rounded-full object-cover" />
                          </div>
                        </div>
                      </div>

                      {/* Mock Story 4 (Seen) */}
                      <div className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 opacity-80 group">
                        <div className="w-[64px] h-[64px] rounded-full bg-gray-300 p-[2px] transition-transform group-hover:scale-105">
                          <div className="w-full h-full bg-white rounded-full p-[2px]">
                            <img src="https://api.dicebear.com/7.x/initials/svg?seed=M" className="w-full h-full rounded-full object-cover opacity-90" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="flex bg-chatbg border-b border-[#D2B48C] text-[12px] font-bold text-center h-[24px]">
                    <div onClick={() => setWallTab('quick')} className={`flex-1 flex items-center justify-center cursor-pointer ${wallTab === 'quick' ? 'bg-primary text-white' : 'text-secondary hover:bg-[#FFF8DC]'}`}>الدردشة السريعة</div>
                    <div onClick={() => setWallTab('posts')} className={`flex-1 flex items-center justify-center cursor-pointer ${wallTab === 'posts' ? 'bg-primary text-white' : 'text-secondary hover:bg-[#FFF8DC]'}`}>المنشورات</div>
                  </div>

                  {/* Wall Posts Area */}
                  <div className="flex-1 overflow-y-auto bg-white flex flex-col divide-y divide-gray-200">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex bg-white px-2 py-2 hover:bg-gray-50 transition-colors relative min-h-[55px]">
                        
                        <div className="flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-0.5">
                             <div className="font-bold text-[12px] text-primary leading-none">عضو مميز {i}</div>
                             <div className="text-[10px] text-gray-500 flex items-center font-bold" dir="ltr"><span className="text-[9px] mr-0.5 mt-0.5">س</span> {i}</div>
                          </div>
                          
                          <div className="text-[11px] text-gray-800 leading-tight break-words max-w-[260px] pb-1 text-right">هذا نص تجريبي للمنشور في الحائط، يمكن كتابة الخواطر هنا والتفاعل معها.</div>
                          
                          <div className="flex gap-1 justify-end w-full mt-1">
                            {wallTab === 'posts' && (
                              <>
                                <button className="w-[18px] h-[18px] flex items-center justify-center bg-gray-500 hover:bg-red-500 text-white rounded-[2px] transition-colors"><Heart size={10}/></button>
                                <button className="w-[18px] h-[18px] flex items-center justify-center bg-gray-500 hover:bg-blue-500 text-white rounded-[2px] transition-colors"><MessageSquare size={10}/></button>
                              </>
                            )}
                            <button className="w-[18px] h-[18px] flex items-center justify-center bg-gray-500 hover:bg-red-500 text-white rounded-[2px] transition-colors"><X size={10} strokeWidth={2.5}/></button>
                          </div>
                        </div>

                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=User${i}`} className="w-[38px] h-[38px] rounded-[3px] mr-2 border border-gray-300 flex-shrink-0 object-cover mt-0.5" />
                      </div>
                    ))}
                  </div>

                  {/* Wall Input Area */}
                  <div className="h-[48px] bg-chatbg p-1.5 px-3 border-t border-[#D2B48C] flex items-center gap-2 flex-shrink-0">
                    <button className="text-secondary hover:text-primary w-9 h-full bg-white border border-[#D2B48C] rounded-xl transition-colors shadow-sm flex items-center justify-center"><Smile size={18} /></button>
                    <input type="text" placeholder="اكتب رسالتك هنا..." className="flex-1 border border-[#D2B48C] rounded-xl px-3 py-1.5 text-[12px] focus:outline-none shadow-inner bg-white h-full" />
                    <button onClick={() => {
                      if (likesThresholds.wall > 0 && myLikes < likesThresholds.wall) {
                        alert(`تحتاج إلى ${likesThresholds.wall} لايك لتتمكن من إضافة مشاركة بالحائط.`);
                        return;
                      }
                      if (currentUser?.isWallMuted) {
                        alert('عفواً، تم منعك من النشر في الحائط بشكل دائم من قبل الإدارة.');
                        return;
                      }
                      alert('تم الإرسال (محاكاة)');
                    }} className="bg-primary hover:bg-[#3e2b22] text-white px-4 h-full rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors">إرسال <Send size={14} className="transform rotate-180"/></button>
                  </div>
                </div>
              </>
            )}

            {/* Private Chats Pane */}
            {activePane === 'private' && (
              <>
                <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => togglePane('private')} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">المحادثات الخاصة</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-[#FDFDFD] flex flex-col">
                  {privateChatsList.map(chat => (
                    <div onClick={() => setActivePrivateChat(chat)} key={chat.id} className="flex items-center justify-between p-1.5 border-b border-gray-200 hover:bg-gray-50 cursor-pointer bg-white group">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 border-l-[3px] border-green-500 rounded-r-sm overflow-hidden bg-white shadow-sm flex items-center justify-center relative p-0.5">
                          <img src={chat.avatar} className="w-full h-full object-cover rounded-sm" />
                        </div>
                        <div>
                          <div className="font-extrabold text-primary text-[12px]">{chat.username}</div>
                          <div className="text-[10px] text-gray-500 font-bold mt-0.5">{chat.lastMsg}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 pr-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrivateChatsList(prev => prev.filter(c => c.id !== chat.id));
                            if (activePrivateChat?.id === chat.id) setActivePrivateChat(null);
                          }}
                          className="bg-[#d9534f] text-white px-2 py-0.5 rounded-sm text-[9px] font-bold shadow-sm hover:bg-[#c9302c]"
                        >
                          حذف ✖
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Profile Visitors Pane */}
          {activePane === 'profile-visitors' && (
            <div className="absolute right-0 top-11 bottom-[49px] w-[300px] max-w-[80vw] bg-gradient-to-b from-[#6e2b6d] to-[#295c7a] flex flex-col border-l border-gray-300 shadow-xl z-20">
              <div className="flex items-center justify-between bg-black/20 w-full h-11 px-2 shrink-0 border-b border-white/10">
                <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                <span className="text-white px-2 font-bold text-[15px]">زائرين الملف الشخصي</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                 
                 <div className="flex justify-center gap-2 mb-2">
                   <button className="bg-white/20 hover:bg-white/30 text-white rounded-full px-4 py-1.5 text-xs font-bold transition-colors">شهري</button>
                   <button className="bg-white/20 hover:bg-white/30 text-white rounded-full px-4 py-1.5 text-xs font-bold transition-colors">اسبوعي</button>
                   <button className="bg-pink-500 text-white rounded-full px-4 py-1.5 text-xs font-bold shadow-md">يومي</button>
                 </div>

                 <div className="text-center font-bold text-white mb-2">الأكثر زيارة</div>

                 <div className="flex justify-center items-end gap-2 mb-6">
                    {/* Second Place */}
                    <div className="flex flex-col items-center bg-white/10 p-2 rounded-xl border border-white/20 shadow-sm relative w-[80px]">
                      <div className="absolute -top-3 left-1 bg-gray-300 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">2</div>
                      <img src="https://api.dicebear.com/7.x/initials/svg?seed=Latifa" className="w-12 h-12 rounded-full border-2 border-gray-300 object-cover mb-2 shadow-sm" />
                      <div className="text-white font-bold text-[11px] truncate w-full text-center mt-1">لـطيفة</div>
                      <div className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full mt-1">257</div>
                    </div>
                    {/* First Place */}
                    <div className="flex flex-col items-center bg-white/20 p-2 rounded-xl border border-white/30 shadow-md relative w-[90px] mb-4">
                      <div className="absolute -top-3 left-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-yellow-900 shadow-sm"><Trophy size={10}/></div>
                      <img src="https://api.dicebear.com/7.x/initials/svg?seed=Reem" className="w-14 h-14 rounded-full border-2 border-yellow-400 object-cover mb-2 shadow-sm" />
                      <div className="text-white font-bold text-[12px] truncate w-full text-center mt-1">عـيون الريم</div>
                      <div className="bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full mt-1">286</div>
                    </div>
                    {/* Third Place */}
                    <div className="flex flex-col items-center bg-white/10 p-2 rounded-xl border border-white/20 shadow-sm relative w-[80px]">
                      <div className="absolute -top-3 left-1 bg-amber-700 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white">3</div>
                      <img src="https://api.dicebear.com/7.x/initials/svg?seed=NAS" className="w-12 h-12 rounded-full border-2 border-amber-700 object-cover mb-2 shadow-sm" />
                      <div className="text-white font-bold text-[10px] truncate w-full text-center leading-tight mt-1">القـناص<br/>N A S</div>
                      <div className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full mt-1">22</div>
                    </div>
                 </div>

                 <div className="text-center font-bold text-white mb-2">آخر الزيارات</div>
                 <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center shadow-md">
                   <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-400 mb-4 border border-purple-200">
                     <Eye size={24} />
                   </div>
                   <div className="text-[#5C4033] font-bold text-sm mb-1">لا توجد زيارات بعد</div>
                   <div className="text-gray-400 text-xs text-center font-bold">ستظهر هنا عند زيارة اعضاء لملفك</div>
                 </div>
              </div>
            </div>
          )}

          {/* 2. Chat Messages (Center) */}
          <div className="flex-1 flex flex-col relative z-0" style={{ backgroundColor: settings.backgroundColor }} dir="ltr">
            <div className="flex-1 overflow-y-auto p-0" style={{ fontSize: `${fontSize}%` }}>
              {messages.filter(msg => !ignoredUserIds.includes(msg.sender?.id)).map((msg, idx) => {
                const parseRoomAction = (content: string) => {
                  const enterMatch = content.match(/هذا المستخدم قد دخل الغرفة \[(.*?)\]/);
                  const leaveMatch = content.match(/هذا المستخدم قد غادر الغرفة \[(.*?)\]/);
                  const movedMatch = content.match(/هذا المستخدم قد نُقل للغرفة \[(.*?)\]/);
                  const oldEnterMatch = content.match(/هذا المستخدم دخل الى \[(.*?)\]/);
                  
                  const targetMatch = enterMatch || leaveMatch || movedMatch || oldEnterMatch;
                  
                  if (targetMatch) {
                    const actionText = enterMatch ? 'هذا المستخدم قد دخل الغرفة ' : 
                                       leaveMatch ? 'هذا المستخدم قد غادر الغرفة ' : 
                                       movedMatch ? 'هذا المستخدم قد نُقل للغرفة ' :
                                       'هذا المستخدم دخل الى ';
                    const roomName = targetMatch[1]; 
                    return (
                      <>
                        {actionText}
                        <button onClick={() => {
                          const room = MOCK_ROOMS.find(r => r.name === roomName);
                          if (room) {
                            changeRoom(room);
                          }
                        }} className="text-white hover:bg-[#4a3f3e] mx-1 bg-[#5a4e4d] px-2 py-0.5 rounded-sm shadow-sm inline-flex items-center gap-1 cursor-pointer font-bold text-[11px] align-middle">
                          <Volume2 size={12} className="text-white" />
                          {roomName}
                        </button>
                      </>
                    );
                  }
                  return renderContentWithEmojis(content);
                };

                if (msg.isSystem || msg.isSystemMessage) {
                  return (
                    <div key={msg.id} className={`flex items-start gap-2 p-1.5 border-b border-gray-300 relative group ${idx % 2 === 0 ? 'bg-[#ebd576]' : 'bg-[#e3c75f]'}`} dir="ltr">
                      
                      {/* Avatar (Left) */}
                      <div className="w-10 h-10 flex-shrink-0 border border-gray-300 rounded-sm overflow-hidden bg-white p-0.5 shadow-sm">
                        <div className="w-full h-full flex items-center justify-center text-[22px]">👥</div>
                      </div>
                      
                      {/* Content (Middle, left aligned) */}
                      <div className="flex-1 min-w-0 flex flex-col items-start pt-0.5">
                        <div className="flex items-center gap-1 flex-wrap" dir="rtl">
                          <span className="font-extrabold text-gray-800 text-[13px]">{msg.sender.username || 'النظام'}</span>
                        </div>
                        <div className="text-[13px] text-gray-800 font-bold mt-0.5 flex items-center gap-1 justify-end text-left" dir="rtl">{parseRoomAction(msg.content)} 🚪</div>
                      </div>
                      
                      {/* Controls (Right) */}
                      <div className="flex flex-col items-end gap-1 w-10">
                         <div className="text-[10px] text-gray-500 font-bold">{idx + 1}</div>
                      </div>

                    </div>
                  );
                }

                if (msg.isAnnouncement) {
                  return (
                    <div key={msg.id} className="flex items-start gap-2 p-2 border-b border-[#e1e8ed] bg-[#d0f0fd]">
                      <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden border border-gray-300 bg-white shadow-sm flex items-center justify-center p-0.5">
                         <img src="https://api.dicebear.com/7.x/initials/svg?seed=AL-WEED" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center pt-1">
                        <div className="font-extrabold text-red-600 text-[14px]">{msg.isSuperAnnouncement ? 'إعلان خاص للسوابر' : 'توجيه إداري مُهمٌ'}</div>
                        <div className="text-[13px] text-gray-900 font-bold leading-relaxed whitespace-pre-wrap mt-0.5 break-words">{parseRoomAction(msg.content)}</div>
                      </div>
                    </div>
                  );
                }

                const isBotMessage = msg.sender?.role === 'bot' || msg.isBot;
                const messageBgClass = isBotMessage ? 'bg-[#d0f0fd]' : (idx % 2 === 0 ? 'bg-[#fdf7f0]' : 'bg-[#f5eede]');

                return (
                  <div key={msg.id} className={`flex items-start gap-2 p-1.5 border-b border-gray-300 relative group ${messageBgClass}`} dir="ltr" style={{ backgroundColor: (!isBotMessage && msg.sender.communityMembers?.[0]?.bgColor && msg.sender.communityMembers?.[0]?.bgColor !== 'transparent') ? msg.sender.communityMembers?.[0]?.bgColor : undefined }}>
                    
                    {/* 1. Avatar (Left) */}
                    <div onClick={() => setSelectedUser(msg.sender)} className="w-10 h-10 flex-shrink-0 border border-gray-300 rounded-sm overflow-hidden bg-white p-0.5 shadow-sm cursor-pointer hover:border-gray-400">
                      <img src={msg.sender.profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.sender.username}`} className="w-full h-full object-cover rounded-sm" />
                    </div>

                    {/* 2. Content (Middle) */}
                    <div className="flex-1 min-w-0 flex flex-col items-start pt-0.5 text-left">
                      <div className="flex items-center gap-1 flex-wrap" dir="rtl">
                        <span onClick={() => setSelectedUser(msg.sender)} className="font-extrabold text-[13px] cursor-pointer hover:underline" style={{ color: msg.sender.communityMembers?.[0]?.nameColor || 'black' }}>{msg.sender.username}</span>
                        {msg.sender.username === isCurrentUserAdmin ? currentUser?.username : null && <span className="text-[10px] bg-red-600 text-white px-1 py-0.5 rounded-sm font-bold shadow-sm">إدارة</span>}
                      </div>
                      <div className="text-[14px] font-bold leading-relaxed whitespace-pre-wrap mt-0.5 break-words text-left" dir="rtl" style={{ color: msg.sender.communityMembers?.[0]?.textColor || 'black' }}>
                        {parseRoomAction(msg.content)}
                        {msg.mediaUrl && (
                          <div className="mt-1">
                            <img src={msg.mediaUrl} className="max-w-[150px] max-h-[150px] object-contain rounded-md shadow-sm" alt="Media" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Controls (Right) */}
                    <div className="flex flex-col items-end gap-1 w-10">
                      <div className="text-[10px] text-gray-500 font-bold">{idx + 1}</div>
                      {(!msg.isSystem && !msg.isSystemMessage) && (
                        <>
                          <button onClick={() => setNewMessage('رد على @' + msg.sender.username + ': ')} className="bg-gray-400 hover:bg-gray-600 text-white w-5 h-5 flex items-center justify-center rounded-sm shadow-sm transition-colors" title="رد">
                            <Reply size={12} strokeWidth={3} className="transform scale-x-[-1]" />
                          </button>
                          <button onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))} className="bg-gray-400 hover:bg-red-600 text-white w-5 h-5 flex items-center justify-center rounded-sm shadow-sm transition-colors" title="حذف">
                            <X size={12} strokeWidth={3} />
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="bg-[#f0f0e8] p-1.5 border-t border-gray-300 flex items-center gap-1.5 flex-shrink-0 shadow-inner z-10 relative" dir="ltr">
              <button onClick={() => sendSystemMessage('( هذا المستخدم غادر الغرفه )')} className="text-gray-500 p-1 bg-white border border-gray-300 rounded-sm flex-shrink-0 hover:bg-red-50 hover:text-red-600 transition-colors" title="مغادرة الغرفة"><LogOut size={18} /></button>
              <button className="text-gray-500 p-1 bg-white border border-gray-300 rounded-sm flex-shrink-0 hover:bg-gray-50"><Smile size={18} /></button>
              <input 
                type="text" 
                placeholder="اكتب @ للإشارة إلى أحد المستخدمين" 
                className="flex-1 border border-gray-400 bg-white text-black rounded-sm px-2 py-1 h-8 text-[13px] font-bold focus:outline-none min-w-0 text-right leading-normal"
                dir="rtl"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <div className="relative flex-shrink-0 flex gap-1">
                <button onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)} className="bg-white border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700 p-1 rounded-sm shadow-sm"><Menu size={18} /></button>
                {/* Attachment Menu Popup */}
                {isAttachmentMenuOpen && (
                  <div className="absolute bottom-10 right-0 bg-white border border-gray-200 shadow-xl rounded-md p-2 flex flex-col gap-2 z-50 min-w-[150px]">
                     <div className="flex gap-1 justify-center border-b border-gray-100 pb-2">
                       <button className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-md text-blue-500 transition-colors border border-gray-100 shadow-sm">
                          <Camera size={16} />
                       </button>
                       <button className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-md text-red-500 transition-colors border border-gray-100 shadow-sm">
                          <ImageIcon size={16} />
                       </button>
                     </div>
                     <div className="text-[10px] text-gray-500 font-bold px-1">الملصقات:</div>
                     <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
                        {server?.emojis?.filter((e: any) => e.type === 'STICKER').map((sticker: any) => (
                           <button 
                             key={sticker.id}
                             onClick={() => {
                               socketRef.current?.emit('sendCommunityMessage', { roomId: activeRoom.id, mediaUrl: sticker.url, content: '' });
                               setIsAttachmentMenuOpen(false);
                             }}
                             className="w-8 h-8 hover:bg-gray-100 rounded p-0.5 flex items-center justify-center border border-gray-100"
                           >
                             <img src={sticker.url} className="w-full h-full object-contain" />
                           </button>
                        ))}
                        {server?.emojis?.filter((e: any) => e.type === 'STICKER').length === 0 && (
                          <div className="col-span-full text-[10px] text-gray-400 text-center">لا توجد ملصقات</div>
                        )}
                     </div>
                  </div>
                )}
                <button onClick={sendMessage} className="bg-[#5b4d42] border border-gray-400 text-white p-1 flex items-center justify-center rounded-sm hover:bg-[#3e2b22] px-3 shadow-sm gap-1 text-[13px] font-bold">
                  إرسال <Send size={12} className="transform rotate-180"/>
                </button>
              </div>
            </div>
          </div>
          
        </div>
        {/* Floating Notification Bell */}
        {!activePane && (
          <button 
            onClick={() => router.push(`/c/${slug}/admin?tab=filters`)}
            className="fixed z-[9999] w-[45px] h-[45px] rounded-full bg-[#ff5252] text-white flex flex-col items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.2)] hover:bg-[#ff3333] transition-colors"
            style={{ top: '50%', right: '20px', transform: 'translateY(-50%)' }}
            title="فلترة الكلمات"
          >
            <Bell size={20} fill="currentColor" />
          </button>
        )}

        {/* Bottom Toolbar */}
        <div className="h-10 flex items-center justify-between px-2 text-white flex-shrink-0 border-t border-[#3e2b22] shadow-[0_-2px_10px_rgba(0,0,0,0.2)] text-[11px] font-bold z-20 relative overflow-hidden" style={{ backgroundColor: settings.primaryColor }} dir="ltr">
          
          {/* Buttons on the Left */}
          <div className="flex items-center justify-between w-full h-full px-1 gap-1 relative z-10">
            <button 
              onClick={() => togglePane('members')}
              className={`flex-1 h-8 rounded-[3px] border border-[#3e2b22] flex items-center justify-center gap-1 shadow-sm whitespace-nowrap text-[11px] transition-colors ${activePane === 'members' ? 'bg-[#c89228] text-white' : 'bg-[#5a4e4d] hover:bg-[#6b5f5e]'}`}
            >
              <Users size={14} /> <span>{server.members?.length || 0}</span>
            </button>
            <button 
              onClick={() => togglePane('private')}
              className={`flex-1 h-8 rounded-[3px] border border-[#3e2b22] flex items-center justify-center gap-1 shadow-sm whitespace-nowrap text-[11px] transition-colors ${activePane === 'private' ? 'bg-[#c89228] text-white' : 'bg-[#5a4e4d] hover:bg-[#6b5f5e]'}`}
            >
               خاص <MessageCircle size={14} />
            </button>
            <button 
              onClick={() => togglePane('rooms')}
              className={`flex-1 h-8 rounded-[3px] border border-[#3e2b22] flex items-center justify-center gap-1 shadow-sm whitespace-nowrap text-[11px] transition-colors ${activePane === 'rooms' ? 'bg-[#c89228] text-white' : 'bg-[#5a4e4d] hover:bg-[#6b5f5e]'}`}
            >
               الغرف <Grid size={14} />
            </button>
            <button 
              onClick={() => togglePane('wall')}
              className={`flex-1 h-8 rounded-[3px] border border-[#3e2b22] flex items-center justify-center gap-1 shadow-sm whitespace-nowrap text-[11px] transition-colors ${activePane === 'wall' ? 'bg-[#c89228] text-white' : 'bg-[#5a4e4d] hover:bg-[#6b5f5e]'}`}
            >
               الحائط <FileText size={14} />
            </button>
            <button 
              onClick={() => togglePane('settings')}
              className={`flex-1 h-8 rounded-[3px] border border-[#3e2b22] flex items-center justify-center gap-1 shadow-sm whitespace-nowrap text-[11px] transition-colors ${activePane === 'settings' ? 'bg-[#c89228] text-white' : 'bg-[#5a4e4d] hover:bg-[#6b5f5e]'}`}
            >
               الضبط <Settings size={14} />
            </button>
          </div>

          {/* Social Network Link */}
          <a href="/home" className="hidden md:flex text-[#D2B48C] hover:text-white transition-colors text-[11px] items-center font-bold tracking-wider absolute left-1/2 transform -translate-x-1/2 z-0">
            🌐 مجتمع إكس (التواصل الاجتماعي)
          </a>
          
          {/* Spacer for right side */}
          <div className="hidden sm:block w-4"></div>
        </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-[#e5e5e5] w-full max-w-[340px] max-h-[95vh] overflow-y-auto rounded-xl shadow-2xl border-2 border-gray-400 font-sans text-sm relative no-scrollbar" dir="rtl">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            
            {/* Header */}
            <div className="h-8 bg-[#8b8b8b] text-white flex items-center justify-between px-3 font-bold shadow-sm sticky top-0 z-20 rounded-t-xl border-b border-gray-400">
              <span className="text-[12px] truncate max-w-[200px] drop-shadow-md">{selectedUser.username}</span>
              <button onClick={() => setSelectedUser(null)} className="hover:text-red-300 transition-colors bg-white/20 rounded-full p-0.5"><X size={14} /></button>
            </div>

            {/* Cover Image & Avatar */}
            <div 
              className="h-28 relative bg-[#f5f5f5] bg-cover bg-center border-b border-gray-300 group"
              style={{ backgroundImage: `url(${selectedUser.profile?.coverUrl || 'https://www.transparenttextures.com/patterns/white-floral-motif.png'})` }}
            >
              {currentUser?.id === selectedUser.id && (
                <button 
                  onClick={() => { setUploadType('cover'); fileInputRef.current?.click(); }}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  📷
                </button>
              )}
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full border-4 border-[#e5e5e5] overflow-hidden bg-white shadow-md z-10 group/avatar">
                <img src={selectedUser.profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.username}`} className="w-full h-full object-cover" />
                {currentUser?.id === selectedUser.id && (
                  <button 
                    onClick={() => { setUploadType('avatar'); fileInputRef.current?.click(); }}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    📷
                  </button>
                )}
              </div>
            </div>

            <div className="pt-12 px-4 pb-2 flex flex-col items-center">
              <div className="font-bold text-gray-800 text-[13px]">{selectedUser.username}</div>
              
              {/* Badges */}
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[18px]">🏅</span>
                <span className="text-[18px]">🎖️</span>
                <span className="text-[18px]">🏆</span>
                <span className="text-[18px]">⭐</span>
                <span className="text-[18px]">🌟</span>
              </div>
              
              {/* Stats */}
              <div className="w-full flex justify-between items-center px-4 mt-2 border-b border-gray-300 pb-2">
                <div className="flex items-center gap-1 text-blue-600 font-bold text-[11px]"><span className="text-[14px]">👁️</span> 0</div>
                <div className="flex items-center gap-1 text-yellow-500 font-bold text-[11px]">45 ⭐</div>
              </div>

              {/* Location */}
              <div className="mt-2 text-[11px] font-bold text-gray-700 flex items-center gap-1">
                المملكة العربية السعودية 🇸🇦
              </div>
            </div>

            {/* Game Buttons */}
                        <div className="px-3 flex gap-2 mt-2">
              <button className="flex-1 bg-[#eaeaea] border border-gray-300 rounded-full py-1.5 flex items-center justify-center gap-2 font-bold text-[11px] text-gray-800 shadow-sm hover:bg-gray-100">
                <span>تحدي X-O</span>
                <span className="text-blue-500">❌⭕</span>
              </button>
              <button className="flex-1 bg-[#eaeaea] border border-gray-300 rounded-full py-1.5 flex items-center justify-center gap-2 font-bold text-[11px] text-gray-800 shadow-sm hover:bg-gray-100">
                <span>تحدي Ludo</span>
                <span className="text-orange-500">🎲</span>
              </button>
            </div>

            {/* Action Grid */}
            <div className="p-3">
              <div className="grid grid-cols-3 gap-1.5">
                {/* Public Actions (Visible to everyone) */}
                <button 
                  onClick={async () => { 
                    const isAdmin = isCurrentUserAdmin;
                    if (!isAdmin && (currentUser?.likesCount || 0) < 50) {
                       alert('عفواً، لا يمكنك استخدام محادثة خاصة حتى تملك 50 لايك.');
                       return;
                    }
                    if (!isAdmin && selectedUser.id % 2 === 1) {
                      alert('هذا المستخدم عطل الخاص. تحتاج لصلاحية فتح الخاص لتجاوز هذا الإعداد.');
                      return;
                    }
                    try {
                      const supabase = createClient();
                      const { data: { session } } = await supabase.auth.getSession();
                      const u1 = session?.user?.id || 'a';
                      const u2 = selectedUser.id || 'b';
                      const dmId = [u1, u2].sort().join('_');
                      const newRoom = { id: dmId };
                      const chatObj = {
                        id: newRoom.id,
                        userId: selectedUser.id || 99,
                        username: selectedUser.username,
                        avatar: selectedUser.profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.username}`,
                        lastMsg: 'بدأ المحادثة'
                      };
                      if (!privateChatsList.find(c => c.id === chatObj.id)) {
                        setPrivateChatsList(prev => [chatObj, ...prev]);
                      }
                      setActivePrivateChat(chatObj); 
                      setSelectedUser(null);
                      setActivePane('private');
                    } catch (e) {
                      console.error(e);
                    }
                  }} 
                  className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-black shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">
                  محادثه خاصه 💬
                </button>
                <button onClick={() => { 
                   const isAdmin = isCurrentUserAdmin;
                   if (!isAdmin && (currentUser?.likesCount || 0) < 10) { alert('تحتاج 10 لايكات لإرسال تنبيه.'); return; }
                   setAlertTargetUser(selectedUser); setIsAlertOpen(true); setSelectedUser(null); 
                }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-black shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">تنبيه ✉️</button>
                <button 
                  onClick={() => { 
                    const isAdmin = isCurrentUserAdmin;
                    if (!isAdmin && (currentUser?.likesCount || 0) < 5) { alert('تحتاج 5 لايكات لمنح لايك.'); return; }
                    socketRef.current?.emit('sendAlert', { slug, targetUserId: selectedUser.id, type: 'like', message: 'هذا المستخدم أرسل لك ❤️' }); setSelectedUser(null); 
                  }} 
                  className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-red-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">
                  ♥️ إعجاب
                </button>
                
                <button className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-blue-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">ارسل هديه 💎</button>
                <button onClick={() => { 
                  const isAdmin = isCurrentUserAdmin;
                  if (!isAdmin && (currentUser?.likesCount || 0) < 20) { alert('تحتاج 20 لايك لتجاهل شخص.'); return; }
                  setIgnoredUserIds(prev => [...prev, selectedUser.id]);
                  socketRef.current?.emit('ignoreMember', { slug, targetUserId: selectedUser.id }); 
                  setSelectedUser(null); 
                  alert('تم تجاهل العضو.');
                }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-red-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">تجاهل 🚫</button>
                <button onClick={() => { setSelectedUser(null); setIsNicksRevealOpen(true); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-black shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">كشف النكات 🔍</button>
                
                {/* Admin Actions */}
                {(isCurrentUserAdmin) && (
                  <>
                    <button onClick={() => { socketRef.current?.emit('deleteProfileImage', { slug, targetUserId: selectedUser.id, type: 'avatar' }); setSelectedUser(null); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-red-700 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">الصوره 🚫</button>
                    <button onClick={() => { socketRef.current?.emit('clearDecorations', { slug, targetUserId: selectedUser.id }); setSelectedUser(null); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-pink-500 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">البنر 🌟</button>
                    <button onClick={() => { socketRef.current?.emit('clearDecorations', { slug, targetUserId: selectedUser.id }); setSelectedUser(null); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-green-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">الحالة 🔖</button>
                    
                    <button onClick={() => { socketRef.current?.emit('clearDecorations', { slug, targetUserId: selectedUser.id }); setSelectedUser(null); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-blue-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">الإطار 🖼️</button>
                    <button onClick={() => { socketRef.current?.emit('deleteProfileImage', { slug, targetUserId: selectedUser.id, type: 'cover' }); setSelectedUser(null); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-purple-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">الغلاف 🖼️</button>
                    <button onClick={() => { socketRef.current?.emit('muteWallMember', { slug, targetUserId: selectedUser.id }); setSelectedUser(null); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-red-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">اسكات ح 🔇</button>

                    <button onClick={() => { socketRef.current?.emit('kickMember', { slug, targetUserId: selectedUser.id }); setSelectedUser(null); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-red-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">طرد 🚫</button>
                    <button onClick={() => { socketRef.current?.emit('banMember', { slug, targetUserId: selectedUser.id, durationMinutes: 10 }); setSelectedUser(null); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-orange-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">طرد 10 دقايق ⏳</button>
                    <button onClick={() => { socketRef.current?.emit('muteMember', { slug, targetUserId: selectedUser.id }); setSelectedUser(null); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-red-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">اسكات 🔇</button>
                    
                    <button onClick={() => { socketRef.current?.emit('banMember', { slug, targetUserId: selectedUser.id, durationMinutes: 24*60 }); setSelectedUser(null); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-teal-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">باند مؤقت ⏱️</button>
                    <button onClick={() => { socketRef.current?.emit('banMember', { slug, targetUserId: selectedUser.id }); setSelectedUser(null); }} className="bg-[#f2f2f2] border border-gray-300 rounded-md py-1.5 text-[11px] font-bold text-red-600 shadow-sm hover:bg-gray-100 flex items-center justify-center gap-1">باند دائم 🛑</button>
                  </>
                )}
              </div>

              {/* Settings Inputs */}
              <div className="mt-3 bg-[#d1d1d1] p-2 border border-gray-300 rounded-md shadow-inner">
                {/* Decoration */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-white border border-gray-300 flex items-center px-2 py-1 rounded-sm shadow-inner">
                    <input type="text" defaultValue={selectedUser.username} className="w-full text-right outline-none text-[11px] font-bold text-gray-700 bg-transparent" />
                  </div>
                  <button className="bg-[#756a5e] text-white text-[10px] font-bold px-3 py-1.5 rounded-sm shadow-sm hover:bg-primary flex items-center gap-1 border border-primary">
                    تغيير 🔄
                  </button>
                </div>
                
                {/* Likes */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-white border border-gray-300 flex items-center px-2 py-1 rounded-sm shadow-inner justify-between">
                    <span className="text-red-500 font-bold text-[10px]">♥️ الايكات</span>
                    <input type="text" defaultValue="1000054" className="w-16 text-left outline-none text-[11px] font-bold text-gray-700 bg-transparent" />
                  </div>
                  <button className="bg-[#756a5e] text-white text-[10px] font-bold px-3 py-1.5 rounded-sm shadow-sm hover:bg-primary flex items-center gap-1 border border-primary">
                    حفظ ✔️
                  </button>
                </div>

                {/* Move Room */}
                <div className="mt-3 border-t border-gray-400 pt-2">
                  <div className="text-[10px] font-bold text-gray-700 mb-1">الغرفة</div>
                  <div className="flex gap-2 mb-1">
                    <select className="flex-1 bg-white border border-gray-300 rounded-sm text-[11px] font-bold p-1 outline-none text-right">
                      <option>الغرفة العامة (1) [01]</option>
                      <option>غرفة المسابقات</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="كلمة المرور (اختياري)" className="flex-1 bg-white border border-gray-300 rounded-sm text-[10px] p-1.5 outline-none text-right" />
                    <button className="bg-[#756a5e] text-white text-[10px] font-bold px-4 py-1.5 rounded-sm shadow-sm hover:bg-primary flex items-center gap-1 border border-primary">
                      نقل ➡️
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Room Management Modal */}
      {isRoomManageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" dir="rtl">
          <div className="bg-[#e4e4e4] w-full max-w-[340px] max-h-[95vh] overflow-y-auto rounded-md shadow-2xl border-2 border-gray-400 flex flex-col relative font-sans text-sm">
            <div className="h-8 bg-[#8b8b8b] text-white flex items-center justify-between px-2 font-bold text-[12px] shadow-sm">
              <span className="drop-shadow-md flex items-center gap-1"><span className="text-xl">☁</span> إدارة الغرفة</span>
              <button onClick={() => setIsRoomManageOpen(false)} className="hover:text-red-300 transition-colors bg-white/20 rounded-full p-0.5"><X size={12} /></button>
            </div>
            
            <div className="p-2 flex gap-2">
              
              {/* Right Column (Color & Image) - rendered on the right in RTL */}
              <div className="w-20 flex flex-col gap-1.5 pt-1">
                <div className="w-full h-10 bg-black border border-gray-400 shadow-inner rounded-sm cursor-pointer"></div>
                <div className="w-full aspect-square bg-white border border-gray-400 shadow-inner rounded-sm p-1 flex items-center justify-center">
                  <div className="w-full h-full border-2 border-gray-300 rounded-sm flex items-center justify-center text-[10px] font-extrabold text-gray-500 overflow-hidden relative">
                     {roomManageImage ? (
                       <img src={roomManageImage} className="w-full h-full object-cover" />
                     ) : (
                       <>
                         <span className="z-10">AL-WEED</span>
                         <div className="absolute inset-1 border border-gray-300 rounded-sm pointer-events-none"></div>
                       </>
                     )}
                  </div>
                </div>
                <button onClick={() => {
                  const url = prompt('أدخل رابط الصورة الجديدة:');
                  if (url) setRoomManageImage(url);
                }} className="w-full bg-[#f0f0f0] border border-gray-400 py-1 text-[10px] font-bold text-black rounded-sm hover:bg-gray-200 shadow-sm">تغيير الصورة</button>
                <button onClick={() => setRoomManageImage('')} className="w-full bg-[#f0f0f0] border border-gray-400 py-1 text-[10px] font-bold text-black rounded-sm hover:bg-gray-200 shadow-sm">حذف الصورة</button>
              </div>

              {/* Left Column (Inputs & Checks) - rendered on the left in RTL */}
              <div className="flex-1 flex flex-col gap-1.5">
                <input type="text" defaultValue="الغرفة العامة (1)" className="w-full text-center outline-none border border-gray-300 text-gray-800 text-[11px] font-bold py-1.5 rounded-sm shadow-inner" />
                <input type="text" defaultValue="نورتونا ياهلا وسهلا 🌺" className="w-full text-center outline-none border border-gray-300 text-gray-800 text-[11px] font-bold py-1.5 rounded-sm shadow-inner" />
                <input type="text" defaultValue="نورتونا" className="w-full text-center outline-none border border-gray-300 text-gray-800 text-[11px] font-bold py-1.5 rounded-sm shadow-inner" />
                <input type="text" defaultValue="0" className="w-full text-center outline-none border border-gray-300 text-gray-800 text-[11px] font-bold py-1.5 rounded-sm shadow-inner" />
                <input type="password" placeholder="كلمه المرور" className="w-full text-center outline-none border border-gray-300 text-gray-800 text-[11px] font-bold py-1.5 rounded-sm shadow-inner" />
                <input type="text" defaultValue="40" className="w-full text-center outline-none border border-gray-300 text-gray-800 text-[11px] font-bold py-1.5 rounded-sm shadow-inner" />
                
                {/* Number of mics (5 slots) */}
                <div className="flex justify-between mt-1" dir="ltr">
                   {[1,2,3,4,5].map(i => (
                     <button 
                       key={i} 
                       onClick={(e) => { e.currentTarget.innerText = e.currentTarget.innerText === '🔒' ? i.toString() : '🔒'; }}
                       className="w-7 h-5 bg-white border border-gray-400 rounded-sm flex items-center justify-center font-bold text-[10px] text-gray-800 shadow-inner hover:bg-gray-100 cursor-pointer"
                       title="اضغط لفتح/قفل المايك"
                     >
                       {i}
                     </button>
                   ))}
                </div>
                <div className="text-[10px] font-bold text-gray-700 mt-0.5 text-right">عدد المايكات: 5</div>

                {/* Checkboxes */}
                <div className="flex flex-col gap-1 mt-2 text-[10px] font-bold text-gray-800 text-right">
                  <label className="flex items-center gap-1.5 cursor-pointer justify-end flex-row-reverse">
                    <input type="checkbox" checked={!tempMicsLocked} onChange={(e) => setTempMicsLocked(!e.target.checked)} className="w-3 h-3 border-gray-400 rounded-sm" /> تفعيل المايك
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer justify-end flex-row-reverse">
                    <input type="checkbox" className="w-3 h-3 border-gray-400 rounded-sm" /> تفعيل البنر
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer justify-end flex-row-reverse">
                    <input type="checkbox" className="w-3 h-3 border-gray-400 rounded-sm" /> تفعيل البث المباشر
                  </label>
                </div>

                {/* Save and Delete Buttons */}
                <div className="flex items-center justify-end gap-1 mt-2 border-b border-gray-400 pb-2">
                  <button className="bg-[#d9534f] text-white border border-[#d43f3a] w-12 py-1 text-[11px] font-bold rounded-sm shadow-sm hover:bg-[#c9302c] flex items-center justify-center">
                    حذف ✖
                  </button>
                  <button onClick={() => { setIsMicsLocked(tempMicsLocked); setIsRoomManageOpen(false); alert('تم حفظ إعدادات الغرفة بنجاح'); }} className="flex-1 bg-[#756a5e] text-white border border-primary py-1 text-[11px] font-bold rounded-sm shadow-sm hover:bg-primary flex items-center justify-center gap-1">
                    حفظ التعديلات
                  </button>
                </div>

                {/* Unban Field */}
                <div className="mt-1 flex gap-1 justify-end">
                  <button className="bg-[#d9534f] text-white border border-[#d43f3a] w-8 h-7 flex items-center justify-center rounded-sm shadow-sm hover:bg-[#c9302c]">
                    ✖
                  </button>
                  <input type="text" defaultValue="فك المحظورين" className="flex-1 text-center outline-none border border-gray-300 text-gray-800 text-[11px] font-bold py-1 rounded-sm shadow-inner" readOnly/>
                </div>

              </div>

            </div>
            
          </div>
        </div>
      )}

      {/* Nicks Reveal Modal (كشف النكات) */}
      {isNicksRevealOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" dir="rtl">
          <div className="bg-[#8c9ca4] w-full max-w-[500px] max-h-[95vh] overflow-y-auto rounded-sm border-2 border-[#5c6c74] shadow-2xl flex flex-col relative font-tahoma">
            <div className="h-8 bg-[#4a5860] text-white flex items-center justify-between px-2 font-bold text-[12px] shadow-sm">
              <span className="drop-shadow-md">كشف النكات {`\u00A1`}</span>
              <button onClick={() => setIsNicksRevealOpen(false)} className="bg-[#d9534f] hover:bg-[#c9302c] border border-[#a94442] p-1 w-6 h-6 flex items-center justify-center rounded-sm transition-colors"><X size={14} /></button>
            </div>
            
            <div className="bg-white m-1 border border-gray-300">
              <div className="text-center font-bold text-[12px] p-2 bg-gray-50 border-b border-gray-300">
                عدد العضويات المسجلة: 4
              </div>
              
              <div className="grid grid-cols-12 text-white font-bold text-[11px] text-center divide-x divide-x-reverse" style={{backgroundColor: settings.primaryColor, borderColor: settings.primaryColor}}>
                <div className="col-span-1 py-1 flex items-center justify-center">🔍</div>
                <div className="col-span-3 py-1">اخر دخول</div>
                <div className="col-span-3 py-1">IP</div>
                <div className="col-span-2 py-1">الزخرفه</div>
                <div className="col-span-3 py-1">العضو</div>
              </div>

              {[
                { id: 1, name: 'نجم', decorated: 'نَـجْم', ip: '172.99.189.212', date: '01-08-2026', time: 'س 07:00' },
                { id: 2, name: 'majid', decorated: 'majid', ip: '82.167.150.96', date: '31-07-2026', time: 'م 02:57' },
                { id: 3, name: 'فؤاد', decorated: 'فُؤاد', ip: '82.167.148.72', date: '29-07-2026', time: 'م 02:24' },
                { id: 4, name: 'جـمـيـلوز', decorated: 'جـمـيـلوز', ip: '66.118.179.38', date: '27-07-2026', time: 'م 09:05' }
              ].map((row) => (
                <div key={row.id} className="flex flex-col border-b border-gray-300">
                  <div className="grid grid-cols-12 text-center text-[11px] divide-x divide-x-reverse divide-gray-200">
                    <div className="col-span-1 py-2 bg-gray-600 flex items-center justify-center text-white cursor-pointer hover:bg-gray-500">🔍</div>
                    <div className="col-span-3 py-2 text-blue-600 font-bold flex flex-col justify-center items-center">
                      <span>{row.date}</span>
                      <span className="text-orange-500">{row.time}</span>
                    </div>
                    <div className="col-span-3 py-2 font-bold flex items-center justify-center">{row.ip}</div>
                    <div className="col-span-2 py-2 flex items-center justify-center font-bold">{row.decorated}</div>
                    <div className="col-span-3 py-2 flex items-center justify-center text-blue-800 font-bold">{row.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {isAnnouncementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-chatbg w-full max-w-[300px] rounded-md shadow-2xl border-2 border-gray-400 font-sans text-[12px] relative" dir="rtl">
            <div className="h-8 bg-gray-600 text-white flex items-center justify-between px-2 font-bold shadow-md">
              <button onClick={() => setIsAnnouncementOpen(false)} className="hover:text-red-400 transition-colors"><X size={16} /></button>
              <div className="flex items-center gap-1"><MessageSquare size={14}/> إعلان</div>
            </div>
            <div className="p-3 bg-white m-2 border border-gray-400 shadow-inner flex flex-col gap-2">
              <textarea 
                value={announcementText} 
                onChange={(e) => setAnnouncementText(e.target.value)} 
                placeholder="اكتب رسالتك هنا" 
                className="w-full h-20 resize-none outline-none text-[12px] p-1 font-bold text-gray-800"
              ></textarea>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Smile size={18} className="text-yellow-500 cursor-pointer" />
                  <label className="flex items-center gap-1 cursor-pointer font-bold text-gray-700">
                    <input type="checkbox" className="w-3 h-3" checked={isSuperAnnouncement} onChange={(e) => setIsSuperAnnouncement(e.target.checked)} /> 
                    إعلان خاص للسوابر؟
                  </label>
                </div>
                <button 
                  onClick={() => {
                    if (announcementText.trim()) {
                      const newMsg = {
                        id: Date.now().toString(),
                        content: announcementText,
                        sender: { ...currentUser, username: 'إعلان' },
                        timestamp: new Date().toISOString(),
                        isAnnouncement: true,
                        isSuperAnnouncement: isSuperAnnouncement
                      };
                      setMessages(prev => [...prev, newMsg].slice(-50));
                      setAnnouncementText('');
                      setIsAnnouncementOpen(false);
                      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }
                  }}
                  className="bg-primary hover:bg-[#3e2b22] text-white px-4 py-1.5 rounded-sm font-bold shadow-sm flex items-center gap-1"
                >
                  إرسال <Send size={12} className="transform rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Private Chat Window Modal */}
      {activePrivateChat && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 pointer-events-none">
          <div className="bg-white w-[calc(100%-32px)] max-w-[400px] max-h-[70dvh] shadow-2xl border-2 border-primary flex flex-col pointer-events-auto" dir="rtl">
            <div className="h-8 bg-[#5b4d42] text-white flex items-center justify-between px-1 border-b border-[#3e2b22]">
              <div className="flex items-center gap-1">
                <div className="bg-gray-300 w-5 h-5 flex items-center justify-center rounded-sm"><Users size={12} className="text-black"/></div>
                <img src={activePrivateChat.avatar} className="w-5 h-5 rounded-sm object-cover" />
              </div>
              <div className="font-bold text-[12px] flex-1 text-center truncate px-2">{activePrivateChat.username}</div>
              <div className="flex items-center gap-0.5">
                <button className="bg-[#5bc0de] hover:bg-[#31b0d5] text-white w-6 h-6 flex items-center justify-center rounded-sm"><Menu size={12}/></button>
                <button onClick={() => setActivePrivateChat(null)} className="bg-[#d9534f] hover:bg-[#c9302c] text-white w-6 h-6 flex items-center justify-center rounded-sm"><X size={12}/></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-[#f9f9f9]">
              {privateMessages.map(msg => (
                <div key={msg.id} className="flex items-start gap-2 mb-3">
                  <img src={msg.sender.profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.sender.username}`} className="w-8 h-8 rounded-sm border border-gray-300" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[11px] text-primary">{msg.sender.username}</span>
                    </div>
                    <div className="text-[12px] text-gray-800 font-bold mt-1">{renderContentWithEmojis(msg.content)}</div>
                    {msg.mediaUrl && (
                      <div className="mt-1">
                        <img src={msg.mediaUrl} className="max-w-[100px] max-h-[100px] object-contain rounded-md shadow-sm" alt="Media" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-10 bg-[#5b4d42] p-1 flex items-center gap-1">
              <button className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white w-7 h-7 flex items-center justify-center rounded-sm"><Mic size={14}/></button>
              <button className="bg-secondary hover:bg-primary text-white w-7 h-7 flex items-center justify-center rounded-sm"><Plus size={14}/></button>
              <button className="bg-white border border-gray-300 w-7 h-7 flex items-center justify-center rounded-sm"><Smile size={16} className="text-yellow-500"/></button>
              <input type="text" value={newPrivateMessage} onChange={e => setNewPrivateMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendPrivateMessage()} placeholder="اكتب رسالتك هنا" className="flex-1 bg-white text-black h-7 px-2 text-[11px] outline-none rounded-sm border border-gray-300 font-bold" />
              <button onClick={sendPrivateMessage} className="bg-[#5b4d42] border border-gray-400 text-white w-8 h-7 flex items-center justify-center rounded-sm hover:bg-[#3e2b22]"><Send size={14} className="transform rotate-180"/></button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {isAlertOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-white w-[250px] shadow-2xl rounded-md border border-gray-400 flex flex-col pointer-events-auto absolute top-1/4" dir="rtl">
            <div className="h-7 bg-gray-600 text-white flex items-center justify-between px-2 font-bold text-[11px]">
              <div className="flex items-center gap-1">
                <MessageSquare size={12}/> إرسال تنبيه {alertTargetUser ? `إلى ${alertTargetUser.username}` : ''}
              </div>
              <div className="flex items-center gap-1">
                <button className="hover:text-gray-300"><Menu size={12}/></button>
                <button onClick={() => { setIsAlertOpen(false); setAlertTargetUser(null); }} className="hover:text-red-400"><X size={12}/></button>
              </div>
            </div>
            <div className="p-2 flex flex-col gap-2">
              <textarea 
                value={alertText}
                onChange={(e) => setAlertText(e.target.value)}
                placeholder="اكتب رسالتك هنا" 
                className="w-full h-16 resize-none outline-none text-[11px] text-black border border-gray-300 p-1 rounded-sm"
              ></textarea>
              <div className="flex items-center justify-between">
                <Smile size={18} className="text-yellow-500 cursor-pointer" />
                <button 
                  onClick={() => {
                    if (likesThresholds.alert > 0 && myLikes < likesThresholds.alert) {
                      alert(`تحتاج إلى ${likesThresholds.alert} لايك لتتمكن من إرسال التنبيهات.`);
                      return;
                    }
                    if (alertText.trim() && alertTargetUser) {
                      if (alertTargetUser.username === currentUser?.username && isNotificationsDisabled) {
                        alert('هذا المستخدم لا يستقبل التنبيهات');
                      } else {
                        socketRef.current?.emit('sendAlert', { slug, targetUserId: alertTargetUser.id, type: 'custom', message: alertText });
                        setReceivedAlertData({ sender: currentUser, message: alertText });
                      }
                      setAlertText('');
                      setIsAlertOpen(false);
                      setAlertTargetUser(null);
                    }
                  }}
                  className="bg-primary hover:bg-[#3e2b22] text-white px-3 py-1 rounded-sm font-bold shadow-sm flex items-center gap-1 text-[11px]"
                >
                  إرسال <Send size={10} className="transform rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Received Alert Modal (Floating) */}
      {receivedAlertData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none" dir="rtl">
          <div className="bg-[#f2f2f2] w-[260px] rounded-sm shadow-2xl border border-gray-400 flex flex-col pointer-events-auto relative mt-20 ml-20">
            <div className="h-6 bg-[#666666] text-white flex items-center justify-center font-bold text-[12px] rounded-t-sm shadow-sm relative">
               تنبيه
               <button onClick={() => setReceivedAlertData(null)} className="absolute right-1 hover:text-red-400 text-white"><X size={12}/></button>
            </div>
            <div className="p-3 flex flex-col items-center">
              <div className="flex items-center self-start gap-1 mb-2">
                <img src={receivedAlertData.sender.profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${receivedAlertData.sender.username}`} className="w-8 h-8 object-cover rounded-sm border border-gray-300 shadow-sm" />
                <span className="font-bold text-[11px] text-primary">{receivedAlertData.sender.username}</span>
              </div>
              <div className="text-[12px] text-gray-800 font-bold text-center w-full min-h-[40px] flex items-center justify-center">
                {receivedAlertData.message}
              </div>
            </div>
            <div className="flex justify-end p-2 bg-[#e0e0e0] border-t border-gray-300 rounded-b-sm">
               <button onClick={() => {
                 // Close alert and open private chat logic here
                 setReceivedAlertData(null);
               }} className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 px-3 py-1 rounded-sm font-bold shadow-sm flex items-center gap-1 text-[11px]">
                 <Reply size={10} className="transform scale-x-[-1] text-gray-600" /> رد
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Drawer Backdrop Overlay */}
      {activePane === 'members' && (
        <div 
          className="fixed top-0 left-0 right-0 h-[calc(100dvh-40px)] bg-transparent z-[99998]" 
          onClick={() => setActivePane(null)}
        />
      )}

      {/* Members Drawer (Refactored) */}
      {activePane === 'members' && (
        <div className="fixed top-0 right-0 h-[calc(100dvh-40px)] w-[68%] sm:w-[320px] z-[99999] bg-[#f0e2c8] flex flex-col p-0 m-0 shadow-2xl overflow-hidden border-none" dir="rtl">
          
          {/* Header */}
          <div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
            <button 
              onClick={() => setActivePane(null)} 
              className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
            <span className="text-white px-2 font-bold text-[15px]">المتواجدين</span>
          </div>

          {/* Search Bar */}
          <div className="shrink-0 bg-[#5c5751] z-10 w-full flex items-center justify-center border-b border-[#3e2b22]">
            <input 
              type="text" 
              placeholder="البحث .." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-[#5c5751] text-white placeholder-gray-300 border-none rounded-none text-[13px] px-3 py-1.5 font-bold outline-none focus:outline-none focus:ring-0 text-right shadow-none" 
            />
          </div>

          {/* Sub-header */}
          <div className="shrink-0 bg-[#7a6a58] text-white text-center text-[12px] font-bold py-1.5 shadow-sm z-10 w-full m-0">
            المتواجدين في الدردشه
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto">
            {filteredMembers.map((member: any) => {
              const status = getStatusDetails(member.user.username);
              return (
                <div key={member.id} onClick={() => setSelectedUser(member.user)} className="flex items-center justify-between p-1.5 border-b border-[#D2B48C] hover:bg-[#EED5A9] cursor-pointer transition-colors group">
                  
                  {/* Far Right: Flag or YouTube Icon */}
                  <div className="flex flex-col items-center justify-center w-10 flex-shrink-0 border-l border-gray-300">
                    {(userLink && member.user.username === currentUser?.username) || (member.user.username.charCodeAt(0) % 5 === 0) ? (
                      <div className="w-6 h-4 bg-red-600 rounded flex items-center justify-center text-white text-[8px]">▶</div>
                    ) : (
                      <>
                        <img src="https://flagcdn.com/w20/sa.png" alt="KSA" className="w-5 h-auto rounded-sm mb-0.5 shadow-sm" />
                        <div className="text-[9px] text-gray-500 font-bold mt-0.5">#{((member.user.username.charCodeAt(0) + member.user.username.length) % 99) + 1}</div>
                      </>
                    )}
                  </div>

                  {/* Middle: Text Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center px-2 text-left">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="font-extrabold text-[13px] text-primary truncate group-hover:text-black">{member.user.username}</span>
                    </div>
                    <div className="text-[10px] text-gray-600 truncate mt-0.5 font-bold">
                      {status.text}
                    </div>
                  </div>

                  {/* Far Left: Avatar */}
                  <div className="flex items-center gap-1.5 pl-1">
                    <div className="w-10 h-10 flex-shrink-0 border border-secondary rounded-sm p-[1px] bg-white shadow-sm overflow-hidden relative">
                      {member.user.profile?.avatarUrl ? (
                        <img src={member.user.profile.avatarUrl} className="w-full h-full object-cover rounded-sm" />
                      ) : (
                        <div className="w-full h-full bg-chatbg flex items-center justify-center font-bold text-secondary rounded-sm text-sm">{member.user.username.charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <div className={`w-[3px] h-10 ${status.color} border-l-[3px]`}></div>
                  </div>

                </div>
              );
            })}
            {filteredMembers.length === 0 && <div className="text-center p-4 text-[12px] font-bold text-[#7a6a58]">لا يوجد أعضاء</div>}
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 pointer-events-auto" dir="rtl">
          <div className="bg-[#fdfdfd] w-[380px] rounded-lg shadow-2xl overflow-hidden flex flex-col pointer-events-auto border border-gray-300">
            <div className="h-10 bg-[#5C4033] text-white flex items-center justify-between px-3 font-bold">
               <span>إضافة رابط وسائط</span>
               <button onClick={() => setIsLinkModalOpen(false)} className="hover:text-red-400 bg-red-600 rounded px-1.5 py-0.5"><X size={14}/></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-[12px] font-bold text-[#5C4033]">يمكنك إضافة روابط YouTube أو Instagram أو TikTok.</p>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">الرابط</label>
                <input type="text" value={userLink} onChange={e => setUserLink(e.target.value)} placeholder="...الصق الرابط هنا" className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033] text-[12px]" dir="ltr" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-3 bg-gray-50 border-t border-gray-200">
               <button onClick={() => setIsLinkModalOpen(false)} className="px-4 py-1.5 border border-red-500 text-red-500 rounded-md font-bold text-[12px] bg-white hover:bg-red-50">إلغاء</button>
               <button onClick={() => {
                 setIsLinkModalOpen(false);
                 alert('تم حفظ الرابط الخاص بك بنجاح.');
               }} className="px-4 py-1.5 bg-[#5C4033] text-white rounded-md font-bold text-[12px] hover:bg-[#3e2b22]">حفظ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
