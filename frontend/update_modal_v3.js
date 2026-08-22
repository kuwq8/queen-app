const fs = require('fs');

let content = fs.readFileSync('src/app/messages/MessagesSidebar.tsx', 'utf8');

const newModalJSX = `{/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md md:h-[600px] md:rounded-2xl md:border md:border-zinc-800 animate-fade-in-up">
          
          {/* الترويسة العلوية */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <button onClick={() => setIsNewChatOpen(false)} className="text-sm font-semibold text-white hover:underline">إلغاء</button>
            <h2 className="text-base font-bold text-white">دردشة جديدة</h2>
            <div className="w-8" />
          </div>

          {/* شريط البحث */}
          <div className="p-3 border-b border-zinc-800 relative">
            <Search size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() !== '') {
                  searchUsers(e.target.value);
                }
              }}
              className="w-full bg-zinc-900 text-white rounded-full pr-10 pl-4 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all border border-zinc-800"
              autoFocus
            />
          </div>

          {/* جسم القائمة مع دعم التمرير */}
          <div className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-900">
            {/* زر إنشاء مجموعة البارز والمطلوب */}
            {!searchQuery && (
              <button
                onClick={() => {
                  alert('سيتم إضافة ميزة المجموعات قريباً!');
                }}
                className="w-full flex items-center justify-between p-3 hover:bg-zinc-900 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <Users size={18} />
                  </div>
                  <span className="font-bold text-white text-sm">إنشاء مجموعة</span>
                </div>
                <ChevronLeft size={16} className="text-zinc-500" />
              </button>
            )}

            {/* قائمة المستخدمين المقترحين */}
            {isSearching ? (
              <div className="text-center py-6 text-zinc-500 text-[15px]">جاري البحث...</div>
            ) : (searchQuery ? searchResults : suggestedUsers).length > 0 ? (
              (searchQuery ? searchResults : suggestedUsers).map(user => (
                <div
                  key={user.id}
                  onClick={() => handleStartChat(user.id)}
                  className="flex items-center gap-3 p-3 hover:bg-zinc-900 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-800">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-zinc-400">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-bold text-sm truncate">
                        {user.first_name ? \`\${user.first_name} \${user.last_name||''}\` : user.username}
                      </span>
                      {user.is_verified && (
                        <Verified size={14} className="text-sky-500 fill-sky-500/20" />
                      )}
                    </div>
                    <span className="text-zinc-500 text-xs truncate">@{user.username}</span>
                  </div>
                </div>
              ))
            ) : searchQuery ? (
              <div className="text-center py-6 text-zinc-500 text-[15px]">لم يتم العثور على أي أشخاص.</div>
            ) : null}
          </div>
        </div>
      )}`;

const splitIndex = content.indexOf('{/* New Chat Modal */}');
const endModalIndex = content.lastIndexOf('  );');

if (splitIndex !== -1 && endModalIndex !== -1) {
  content = content.substring(0, splitIndex) + newModalJSX + '\n    </div>\n' + content.substring(endModalIndex);
  fs.writeFileSync('src/app/messages/MessagesSidebar.tsx', content);
  console.log('done');
} else {
  console.log('boundaries not found');
}
