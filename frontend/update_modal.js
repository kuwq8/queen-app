const fs = require('fs');

let content = fs.readFileSync('src/app/messages/MessagesSidebar.tsx', 'utf8');

// 1. Add ChevronLeft, ArrowRight
content = content.replace(
  "from 'lucide-react';",
  ", ChevronLeft, ArrowRight, Verified } from 'lucide-react';"
);

// 2. Add Group Mode State
const stateRegex = /const \[isNewChatOpen, setIsNewChatOpen\] = useState\(false\);/;
const newState = `
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  
  // Fetch suggested users when modal opens
  useEffect(() => {
    if (isNewChatOpen) {
      const fetchSuggested = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url, is_verified')
          .neq('id', currentUserId)
          .limit(15);
        setSuggestedUsers(data || []);
      };
      fetchSuggested();
    } else {
      // Reset state when closed
      setIsGroupMode(false);
      setSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isNewChatOpen, currentUserId]);
`;
content = content.replace(stateRegex, newState);

// 3. Fix the search users query to fetch is_verified
content = content.replace(
  ".select('id, username, first_name, last_name, avatar_url')",
  ".select('id, username, first_name, last_name, avatar_url, is_verified')"
);

// 4. Create handleToggleSelectUser for group mode
const searchUsersRegex = /const handleStartChat = async/;
const handleStartGroupChat = `
  const handleToggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };
  
  const handleStartGroupChat = async () => {
    if (selectedUsers.length === 0) return;
    alert('سيتم إضافة إنشاء المجموعات قريباً!');
    setIsNewChatOpen(false);
  };
  
  const handleStartChat = async`;
content = content.replace(searchUsersRegex, handleStartGroupChat);

// 5. Replace Modal JSX
const modalStartRegex = /\{\/\* New Chat Modal \*\/\}[\s\S]*?\}\)/;
const modalJSX = `{/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex justify-center items-center sm:items-start sm:pt-10 px-0 sm:px-4 animate-fade-in" onClick={() => setIsNewChatOpen(false)}>
          <div className="bg-[#111] w-full h-full sm:h-auto sm:max-w-[600px] sm:rounded-2xl flex flex-col sm:max-h-[85vh] animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
              <div className="w-16 flex justify-start">
                {isGroupMode && selectedUsers.length > 0 ? (
                  <button onClick={handleStartGroupChat} className="text-white font-bold bg-white text-black px-4 py-1.5 rounded-full text-sm hover:bg-zinc-200 transition-colors">
                    التالي
                  </button>
                ) : (
                  <button onClick={() => setIsNewChatOpen(false)} className="text-white font-bold text-[15px] hover:underline">
                    إلغاء
                  </button>
                )}
              </div>
              
              <h2 className="text-[17px] font-bold text-white flex-1 text-center">
                {isGroupMode ? 'مجموعة جديدة' : 'دردشة جديدة'}
              </h2>
              
              <div className="w-16 flex justify-end">
                {isGroupMode && (
                  <button onClick={() => setIsGroupMode(false)} className="text-white hover:bg-zinc-800 p-2 rounded-full transition-colors">
                    <ArrowRight size={20} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Search Input */}
            <div className="px-4 pb-2 border-b border-zinc-800">
              <div className="relative flex items-center bg-transparent border border-zinc-700/50 rounded-full overflow-hidden focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all">
                <div className="pl-2 pr-3 flex items-center justify-center text-zinc-500">
                  <Search size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder={isGroupMode ? "البحث عن أشخاص لإضافتهم..." : "بحث عن أشخاص..."}
                  className="w-full bg-transparent py-2.5 text-white placeholder-zinc-500 text-[15px] focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim() !== '') {
                      searchUsers(e.target.value);
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto">
              
              {/* Create Group Row */}
              {!isGroupMode && !searchQuery && (
                <div 
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 cursor-pointer transition-colors border-b border-zinc-800"
                  onClick={() => setIsGroupMode(true)}
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                    <Users size={18} />
                  </div>
                  <span className="text-white font-bold text-[15px] flex-1">إنشاء مجموعة</span>
                  <ChevronLeft size={20} className="text-zinc-500" />
                </div>
              )}

              {/* Users List */}
              <div className="py-2">
                {isSearching ? (
                  <div className="text-center py-6 text-zinc-500 text-[15px]">جاري البحث...</div>
                ) : (searchQuery ? searchResults : suggestedUsers).length > 0 ? (
                  <div className="flex flex-col">
                    {(searchQuery ? searchResults : suggestedUsers).map(user => {
                      const isSelected = selectedUsers.includes(user.id);
                      return (
                        <div 
                          key={user.id} 
                          className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 cursor-pointer transition-colors"
                          onClick={() => isGroupMode ? handleToggleSelectUser(user.id) : handleStartChat(user.id)}
                        >
                          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-zinc-400">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-white font-bold text-[15px] truncate">
                                {user.first_name ? \`\${user.first_name} \${user.last_name||''}\` : user.username}
                              </span>
                              {user.is_verified && (
                                <Verified size={14} className="text-sky-500 fill-sky-500/20" />
                              )}
                            </div>
                            <span className="text-zinc-500 text-[14px] truncate">@{user.username}</span>
                          </div>
                          
                          {isGroupMode && (
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors ml-2">
                              {isSelected ? (
                                <div className="w-full h-full rounded-full bg-sky-500 border-sky-500 flex items-center justify-center">
                                  <Check size={14} className="text-white" strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-full h-full rounded-full border-zinc-600"></div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-6 text-zinc-500 text-[15px]">لم يتم العثور على أي أشخاص.</div>
                ) : null}
              </div>
              
            </div>
          </div>
        </div>
      )}`;
      
content = content.replace(modalStartRegex, modalJSX);

fs.writeFileSync('src/app/messages/MessagesSidebar.tsx', content);
console.log('done');
