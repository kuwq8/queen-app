import re

file_path = r"C:\Users\DELL\.gemini\antigravity\scratch\gemini_social\frontend\src\app\c\[slug]\chat\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix Right Sidebar width
# old: <div className={`${activePane && activePane !== 'members' ? 'flex' : 'hidden'} absolute sm:relative right-0 inset-y-0 w-[360px] max-w-full bg-[#FDFDFD] flex-shrink-0 flex-col border-l border-[#D2B48C] shadow-[-5px_0_15px_rgba(0,0,0,0.1)] sm:shadow-none z-20`}>
content = content.replace(
    "w-[360px] max-w-full bg-[#FDFDFD]",
    "w-[68%] max-w-[68%] sm:w-[320px] sm:max-w-[320px] bg-[#FDFDFD]"
)

# 2. Fix all pane headers
def header_replacer(match):
    title = match.group(1)
    if "غرف الدردشه :" in title:
        title = "{`غرف الدردشه : ${server?.rooms?.length || 0}`}"
    
    # Check if the title is plain text or has JSX
    if "{" in title and not title.startswith("{`"):
        pass # Handle carefully if needed
        
    return f'''<div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={{() => setActivePane(null)}} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={{18}} strokeWidth={{2.5}} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">{title}</span>
                </div>'''

# Regex to match the standard pane headers.
# They look like: <div className="h-8 bg-... text-white flex items-center justify-between px-2 font-bold text-[13px] border-b border-[#...] flex-shrink-0 shadow-md">
#                   <span>TITLE</span>
#                   <button onClick={() => setActivePane(null)} className="..."><X size={14} /></button>
#                 </div>

pattern = re.compile(
    r'<div className="h-8 bg-[^>]*? flex-shrink-0 shadow-md">\s*<span[^>]*>(.*?)</span>\s*<button onClick=\{\(\) => setActivePane\(null\)\}.*?<X size=\{14\} /></button>\s*</div>',
    re.DOTALL
)

content = pattern.sub(header_replacer, content)

# Wall header has h-[40px] and toggle buttons
def wall_replacer(match):
    return f'''<div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={{() => setActivePane(null)}} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={{18}} strokeWidth={{2.5}} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">الحائط</span>
                </div>'''

wall_pattern = re.compile(
    r'<div className="h-\[40px\] bg-primary text-white flex items-center justify-between px-3 font-bold text-\[13px\] border-b border-\[#3e2b22\] flex-shrink-0 shadow-md">\s*<span.*?>الحائط</span>\s*<button onClick=\{\(\) => setActivePane\(null\)\}.*?<X size=\{14\} strokeWidth=\{2.5\}/></button>\s*</div>',
    re.DOTALL
)
content = wall_pattern.sub(wall_replacer, content)

# Private chat pane header
def private_replacer(match):
    return f'''<div className="flex items-center justify-between bg-[#4a4641] w-full h-11 px-2 shrink-0 border-b border-[#3e2b22]">
                  <button onClick={{() => togglePane('private')}} className="bg-[#d9534f] hover:bg-[#c9302c] w-8 h-8 flex items-center justify-center text-white shrink-0 m-0 rounded-[4px] border border-[#2b2b2b] shadow-sm"><X size={{18}} strokeWidth={{2.5}} /></button>
                  <span className="text-white px-2 font-bold text-[15px]">المحادثات الخاصة</span>
                </div>'''

private_pattern = re.compile(
    r'<div className="h-8 bg-primary text-white flex items-center justify-between px-2 font-bold text-\[13px\] border-b border-\[#3e2b22\] flex-shrink-0 shadow-md">\s*<span class.*?المحادثات الخاصة</span>\s*<button onClick=\{\(\) => togglePane\(\'private\'\)\}.*?<X size=\{14\}/></button>\s*</div>',
    re.DOTALL
)
content = private_pattern.sub(private_replacer, content)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done replacing headers.")
