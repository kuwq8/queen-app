const fs = require('fs');

let content = fs.readFileSync('src/app/messages/MessagesSidebar.tsx', 'utf8');

// 1. Add lucide icons
content = content.replace(
  "import { MessageCircle, User, Plus, Search, X } from 'lucide-react';",
  "import { MessageCircle, User, Plus, Search, X, ChevronDown, Check, MessageSquare, Users, Settings, UserPlus, CheckCircle2 } from 'lucide-react';"
);

// 2. Add state for filter and dropdown
const stateToAdd = `
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('الكل');
  
  const handleMarkAllRead = async () => {
    try {
      const supabase = createClient();
      const unreadConvs = conversations.filter(c => c.latestMessage && !c.latestMessage.is_read && c.latestMessage.sender_id !== currentUserId);
      for (const conv of unreadConvs) {
        await supabase.from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', currentUserId);
      }
      setFilterDropdownOpen(false);
      fetchConversations();
    } catch(e) {}
  };
`;
content = content.replace("const [isSearching, setIsSearching] = useState(false);", "const [isSearching, setIsSearching] = useState(false);\n" + stateToAdd);

// 3. Update the render part
// We need to replace the entire <div className="flex flex-col h-full bg-[#0a0a0a]"> ... up to the New Chat Modal.
// So let's find the start of the return statement.
const newRender = `
  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (activeFilter === 'الكل') return true;
    if (activeFilter === 'غير مقروءة') return conv.unreadCount && conv.unreadCount > 0;
    if (activeFilter === 'مباشر') return true; // Currently all are 1-on-1
    if (activeFilter === 'المجموعات') return false; // Not implemented yet
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-black relative">
      {/* Twitter Style Header */}
      <div className="flex flex-col pt-3 pb-2 px-4 border-b border-zinc-800 shrink-0 sticky top-0 bg-black/90 backdrop-blur-md z-20">
        <div className="flex items-center justify-between mb-3 relative">
          <h2 className="text-xl font-bold text-white flex-1 text-center mr-8">الدردشة</h2>
          
          {/* Dropdown Toggle */}
          <button 
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            className="flex items-center gap-1 hover:bg-zinc-900 px-3 py-1.5 rounded-full transition-colors absolute right-0"
          >
            <span className="text-white text-sm font-bold">{activeFilter}</span>
            <ChevronDown size={16} className="text-zinc-400" />
          </button>
          
          {/* Dropdown Menu */}
          {filterDropdownOpen && (
            <div className="absolute top-10 right-0 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col p-1 animate-fade-in-up origin-top-right">
              
              <button onClick={() => { setActiveFilter('الكل'); setFilterDropdownOpen(false); }} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-right">
                <div className="flex items-center gap-3"><MessageCircle size={18} className="text-zinc-400"/> <span className="text-white font-bold text-[15px]">الكل</span></div>
                {activeFilter === 'الكل' && <Check size={18} className="text-white" />}
              </button>
              
              <button onClick={() => { setActiveFilter('غير مقروءة'); setFilterDropdownOpen(false); }} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-right">
                <div className="flex items-center gap-3"><MessageSquare size={18} className="text-zinc-400"/> <span className="text-white font-bold text-[15px]">غير مقروءة</span></div>
                {activeFilter === 'غير مقروءة' && <Check size={18} className="text-white" />}
              </button>
              
              <button onClick={() => { setActiveFilter('مباشر'); setFilterDropdownOpen(false); }} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-right">
                <div className="flex items-center gap-3"><User size={18} className="text-zinc-400"/> <span className="text-white font-bold text-[15px]">مباشر</span></div>
                {activeFilter === 'مباشر' && <Check size={18} className="text-white" />}
              </button>
              
              <button onClick={() => { setActiveFilter('المجموعات'); setFilterDropdownOpen(false); }} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-right">
                <div className="flex items-center gap-3"><Users size={18} className="text-zinc-400"/> <span className="text-white font-bold text-[15px]">المجموعات</span></div>
                {activeFilter === 'المجموعات' && <Check size={18} className="text-white" />}
              </button>
              
              <button onClick={() => { setActiveFilter('الطلبات'); setFilterDropdownOpen(false); }} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-right">
                <div className="flex items-center gap-3"><UserPlus size={18} className="text-zinc-400"/> <span className="text-white font-bold text-[15px]">الطلبات</span></div>
                {activeFilter === 'الطلبات' && <Check size={18} className="text-white" />}
              </button>
              
              <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-right">
                <Settings size={18} className="text-zinc-400"/> <span className="text-white font-bold text-[15px]">الإعدادات</span>
              </Link>
              
              <button onClick={handleMarkAllRead} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-right border-t border-zinc-800 mt-1 pt-2">
                <CheckCircle2 size={18} className="text-zinc-400"/> <span className="text-white font-bold text-[15px]">تحديد الكل كمقروء</span>
              </button>
              
            </div>
          )}
        </div>
        
        {/* Search Box */}
        <div className="relative">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="البحث في الرسائل..."
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full py-2 pr-10 pl-4 text-sm focus:outline-none focus:border-cyan-500 transition-colors text-right"
          />
        </div>
      </div>
      
      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-pulse text-sky-500 text-sm font-bold">جاري التحميل...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center p-8 text-zinc-500 flex flex-col items-center justify-center h-full">
            <h3 className="text-white text-3xl font-bold mb-4">مرحباً بك في صندوق الوارد!</h3>
            <p className="text-zinc-500 text-[15px] max-w-sm mb-6 leading-relaxed">أرسل رسالة نصية، شارك أفكارك، أو ابدأ محادثة جديدة. التفاعلات المباشرة تبدأ من هنا.</p>
            <button 
              onClick={() => setIsNewChatOpen(true)} 
              className="bg-sky-500 text-white font-bold px-8 py-4 rounded-full hover:bg-sky-600 transition-colors text-[17px] shadow-sm"
            >
              كتابة رسالة
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredConversations.map((conv) => {
              if (!conv.otherUser) return null;
              
              const isUnread = conv.latestMessage && !conv.latestMessage.is_read && conv.latestMessage.sender_id !== currentUserId;
              const isActive = activeChatId === conv.id;
              
              return (
                <Link href={\`/messages/\${conv.id}\`} key={conv.id} className="block group">
                  <div className={\`flex items-center gap-3 p-4 transition-all cursor-pointer \${isActive ? 'bg-zinc-900/50 border-r-4 border-sky-500' : 'hover:bg-zinc-900/50 border-r-4 border-transparent'}\`}>
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 overflow-hidden">
                      {conv.otherUser?.avatar_url ? (
                        <img src={conv.otherUser?.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    <div className="flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={\`font-bold text-[15px] truncate \${isUnread ? 'text-white' : 'text-zinc-200'}\`}>
                          {conv.otherUser?.first_name ? \`\${conv.otherUser?.first_name} \${conv.otherUser?.last_name||''}\` : conv.otherUser?.username}
                        </span>
                        {conv.latestMessage && (
                          <span className={\`text-[13px] shrink-0 \${isUnread ? 'text-sky-500 font-bold' : 'text-zinc-500'}\`}>
                            {new Date(conv.latestMessage.created_at).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className={\`text-[14px] truncate pr-1 \${isUnread ? 'text-white font-bold' : 'text-zinc-500'}\`}>
                          {conv.latestMessage ? conv.latestMessage.content : 'لا توجد رسائل بعد'}
                        </p>
                        {isUnread && (
                          <div className="w-2.5 h-2.5 bg-sky-500 rounded-full shrink-0 ml-1"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsNewChatOpen(true)}
        className="fixed bottom-20 start-6 w-14 h-14 bg-sky-500 hover:bg-sky-600 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.3)] flex items-center justify-center text-white z-40 transition-colors"
      >
        <div className="relative">
          <MessageCircle size={26} className="fill-white" />
          <div className="absolute -top-1 -right-1 bg-sky-500 rounded-full border-2 border-black w-4 h-4 flex items-center justify-center">
            <Plus size={12} strokeWidth={4} />
          </div>
        </div>
      </button>

      {/* New Chat Modal */}
`;

const oldRenderRegex = /return \([\s\S]*?\{\/\* New Chat Modal \*\//;
content = content.replace(oldRenderRegex, newRender + "      {/* New Chat Modal */");

fs.writeFileSync('src/app/messages/MessagesSidebar.tsx', content);
console.log('done');
