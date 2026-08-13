const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'src/app/c/[slug]/chat/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Right Sidebar width
content = content.replace(
    "w-[360px] max-w-full bg-[#FDFDFD]",
    "w-[68%] max-w-[68%] sm:w-[320px] sm:max-w-[320px] bg-[#FDFDFD]"
);

// 2. Fix all pane headers
// Using regex to match most headers:
const pattern = /<div className="h-8 bg-[^>]*? flex-shrink-0 shadow-md">\s*<span[^>]*>(.*?)<\/span>\s*<button onClick=\{\(\) => setActivePane\(null\)\}.*?<X size=\{14\} \/><\/button>\s*<\/div>/g;

content = content.replace(pattern, (match, title) => {
    let finalTitle = title;
    if (title.includes("غرف الدردشه :")) {
        finalTitle = "{`غرف الدردشه : ${server?.rooms?.length || 0}`}";
    }
    
    return `<div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">${finalTitle}</span>
                </div>`;
});

// Wall header
const wallPattern = /<div className="h-\[40px\] bg-primary text-white flex items-center justify-between px-3 font-bold text-\[13px\] border-b border-\[#3e2b22\] flex-shrink-0 shadow-md">\s*<span.*?>الحائط<\/span>\s*<button onClick=\{\(\) => setActivePane\(null\)\}.*?<X size=\{14\} strokeWidth=\{2.5\}\/><\/button>\s*<\/div>/g;
content = content.replace(wallPattern, () => {
    return `<div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => setActivePane(null)} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">الحائط</span>
                </div>`;
});

// Private header
const privatePattern = /<div className="h-8 bg-primary text-white flex items-center justify-between px-2 font-bold text-\[13px\] border-b border-\[#3e2b22\] flex-shrink-0 shadow-md">\s*<span class.*?المحادثات الخاصة<\/span>\s*<button onClick=\{\(\) => togglePane\('private'\)\}.*?<X size=\{14\}\/><\/button>\s*<\/div>/g;
content = content.replace(privatePattern, () => {
    return `<div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={() => togglePane('private')} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={18} strokeWidth={2.5} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">المحادثات الخاصة</span>
                </div>`;
});

// Also replace the Members header back to the big one
const membersPattern = /<div className="h-8 bg-primary text-white flex items-center justify-between px-2 font-bold text-\[13px\] border-b border-\[#3e2b22\] flex-shrink-0 shadow-md">\s*<span>المتواجدين<\/span>\s*<button\s*onClick=\{\(\) => setActivePane\(null\)\}\s*className="bg-\[#d9534f\] hover:bg-\[#c9302c\] rounded-sm w-5 h-5 flex items-center justify-center font-bold border border-\[#d43f3a\]"\s*>\s*<X size=\{14\} \/>\s*<\/button>\s*<\/div>/g;
content = content.replace(membersPattern, () => {
    return `<div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
            <button 
              onClick={() => setActivePane(null)} 
              className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
            <span className="text-white px-2 font-bold text-[15px]">المتواجدين</span>
          </div>`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log("Done");
