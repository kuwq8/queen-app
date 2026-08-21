const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelPostBubble.tsx', 'utf8');

content = content.replace(
  'className="absolute bottom-full right-0 mb-2 shadow-2xl z-50"',
  'className="fixed bottom-0 left-0 w-full z-[100] sm:absolute sm:bottom-full sm:left-auto sm:right-0 sm:w-auto sm:mb-2 shadow-2xl slide-up"'
);
content = content.replace('width={300}', 'width="100%"');

// Add a close overlay for mobile
const closeOverlay = `
            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-[90] sm:hidden" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }}></div>
                <div className="fixed bottom-0 left-0 w-full z-[100] sm:absolute sm:bottom-full sm:left-auto sm:right-0 sm:w-auto sm:mb-2 shadow-2xl animate-in slide-in-from-bottom-10">
                  <EmojiPicker 
                    theme={Theme.DARK}
                    onEmojiClick={(emojiData) => handleToggleReaction(emojiData.emoji)}
                    searchPlaceHolder="ابحث عن إيموجي..."
                    width="100%"
                    height={350}
                  />
                </div>
              </>
            )}
`;

content = content.replace(/\{showEmojiPicker && \([\s\S]*?<EmojiPicker[\s\S]*?\/>\s*<\/div>\s*\)\}/, closeOverlay.trim());

fs.writeFileSync('src/components/ChannelPostBubble.tsx', content);
