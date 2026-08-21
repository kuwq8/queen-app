const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');

// Add MoreVertical to imports
content = content.replace(
  "import { ArrowRight, Image as ImageIcon, Send, Trash2 } from 'lucide-react';",
  "import { ArrowRight, Image as ImageIcon, Send, Trash2, MoreVertical, Share2, Globe, Lock } from 'lucide-react';"
);

// Add state for menu
content = content.replace(
  "const [isSubmitting, setIsSubmitting] = useState(false);",
  "const [isSubmitting, setIsSubmitting] = useState(false);\n  const [isMenuOpen, setIsMenuOpen] = useState(false);\n  const [isPrivate, setIsPrivate] = useState(false);"
);

// Create the new header menu HTML
const newMenuHtml = `        {isCreator && (
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-300 hover:bg-white/10 rounded-full transition-colors"
            >
              <MoreVertical size={20} />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#2a3942] rounded-xl shadow-2xl py-2 z-50 border border-slate-700 animate-in fade-in zoom-in-95 origin-top-left">
                  
                  <button 
                    onClick={() => { setIsPrivate(true); setIsMenuOpen(false); alert('تم تحويل القناة إلى خاصة'); }}
                    className="w-full text-right px-4 py-3 flex items-center justify-between text-[#e9edef] hover:bg-white/5 transition-colors"
                  >
                    <span>خاص</span>
                    {isPrivate && <span className="text-[#00a884] text-xs">مفعل</span>}
                    {!isPrivate && <Lock size={16} className="text-slate-400" />}
                  </button>

                  <button 
                    onClick={() => { setIsPrivate(false); setIsMenuOpen(false); alert('تم تحويل القناة إلى عامة'); }}
                    className="w-full text-right px-4 py-3 flex items-center justify-between text-[#e9edef] hover:bg-white/5 transition-colors"
                  >
                    <span>عام</span>
                    {!isPrivate && <span className="text-[#00a884] text-xs">مفعل</span>}
                    {isPrivate && <Globe size={16} className="text-slate-400" />}
                  </button>
                  
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('تم نسخ رابط الدعوة!');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-right px-4 py-3 flex items-center justify-between text-[#e9edef] hover:bg-white/5 transition-colors"
                  >
                    <span>دعوة</span>
                    <Share2 size={16} className="text-slate-400" />
                  </button>

                  <div className="h-px bg-slate-700 my-1 mx-2" />

                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleDeleteCommunity();
                    }}
                    className="w-full text-right px-4 py-3 flex items-center justify-between text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <span>حذف القناة</span>
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}`;

// Replace old trash button
const oldTrashRegex = /\{\s*isCreator && \(\s*<button[\s\S]*?onClick=\{handleDeleteCommunity\}[\s\S]*?<\/button>\s*\)\s*\}/;
content = content.replace(oldTrashRegex, newMenuHtml);

fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
