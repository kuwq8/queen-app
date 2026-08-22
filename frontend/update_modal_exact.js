const fs = require('fs');
let content = fs.readFileSync('src/app/messages/MessagesSidebar.tsx', 'utf8');

// 1. Add ChevronLeft and Verified to imports if missing
if (!content.includes('ChevronLeft')) {
  content = content.replace(
    "from 'lucide-react';",
    ", ChevronLeft, Verified } from 'lucide-react';"
  );
} else if (!content.includes('Verified')) {
    content = content.replace(
      "ChevronLeft }",
      "ChevronLeft, Verified }"
    );
}

// 2. Add suggestedUsers and isCreatingGroup to state
const stateToAdd = `
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  
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
      setIsCreatingGroup(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isNewChatOpen, currentUserId]);
`;

if (!content.includes('suggestedUsers')) {
  content = content.replace(
    "const [isSearching, setIsSearching] = useState(false);",
    "const [isSearching, setIsSearching] = useState(false);\n" + stateToAdd
  );
}

// 3. Update searchUsers to include is_verified
if (!content.includes('avatar_url, is_verified')) {
  content = content.replace(
    ".select('id, username, first_name, last_name, avatar_url')",
    ".select('id, username, first_name, last_name, avatar_url, is_verified')"
  );
}


// 4. Replace the modal JSX
const newModalJSX = `{/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md md:h-[600px] md:rounded-2xl md:border md:border-zinc-800 animate-fade-in-up">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <button onClick={() => setIsNewChatOpen(false)} className="text-[15px] font-bold text-white hover:underline shrink-0">إلغاء</button>
            <h2 className="text-[17px] font-bold text-white flex-1 text-center pr-8">دردشة جديدة</h2>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-zinc-800 relative">
            <Search size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="بحث عن أشخاص..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() !== '') {
                  searchUsers(e.target.value);
                }
              }}
              className="w-full bg-zinc-900 text-white rounded-full pr-10 pl-4 py-2.5 text-[15px] outline-none placeholder:text-zinc-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all border border-zinc-800"
              autoFocus
            />
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-2">
            {/* Create Group Row */}
            {!searchQuery && (
              <button
                onClick={() => {
                  setIsCreatingGroup(true);
                  alert('سيتم إضافة ميزة المجموعات قريباً!');
                }}
                className="w-full flex items-center justify-between p-3 hover:bg-zinc-900 rounded-xl transition cursor-pointer mb-2 border-b border-zinc-800/50 pb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                    <Users size={20} />
                  </div>
                  <span className="font-bold text-white text-[16px]">إنشاء مجموعة</span>
                </div>
                <ChevronLeft size={20} className="text-zinc-500" />
              </button>
            )}

            {/* Suggested/Searched Users List */}
            {isSearching ? (
               <div className="text-center py-6 text-zinc-500 text-[15px]">جاري البحث...</div>
            ) : (searchQuery ? searchResults : suggestedUsers).length > 0 ? (
               <div className="flex flex-col gap-1">
                 {(searchQuery ? searchResults : suggestedUsers).map(user => (
                    <div
                      key={user.id}
                      onClick={() => handleStartChat(user.id)}
                      className="flex items-center gap-3 p-3 hover:bg-zinc-900 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="w-11 h-11 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-800">
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
                            <Verified size={15} className="text-sky-500 fill-sky-500/20" />
                          )}
                        </div>
                        <span className="text-zinc-500 text-[14px] truncate">@{user.username}</span>
                      </div>
                    </div>
                 ))}
               </div>
            ) : searchQuery ? (
               <div className="text-center py-6 text-zinc-500 text-[15px]">لم يتم العثور على أي أشخاص.</div>
            ) : null}
          </div>
        </div>
      )}`;

const splitIndex = content.indexOf('{/* New Chat Modal */}');
const endModalIndex = content.indexOf('  );', splitIndex);

if (splitIndex !== -1 && endModalIndex !== -1) {
  content = content.substring(0, splitIndex) + newModalJSX + '\n    </div>\n' + content.substring(endModalIndex);
  fs.writeFileSync('src/app/messages/MessagesSidebar.tsx', content);
  console.log('done');
} else {
  console.log('boundaries not found');
}
