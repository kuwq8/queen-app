import { useState } from 'react';
import { Users, LogIn, UserPlus, Eye, Compass, Feather } from 'lucide-react';

interface ServerCardProps {
  server: any;
  isJoined: boolean;
  onJoin: (slug: string) => void;
  currentUser: any;
}

export default function ServerCard({ server, isJoined, onJoin, currentUser }: ServerCardProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'register' | 'visitors'>('members');
  const [visitorName, setVisitorName] = useState('');
  const [regName, setRegName] = useState('');
  const [regPass, setRegPass] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isInvisible, setIsInvisible] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(server.slug);
  };

  return (
    <div 
      className="relative mx-auto flex flex-col font-sans overflow-hidden shadow-xl border border-gray-400 bg-[#e8e8e8] rounded-md transition-all hover:shadow-2xl" 
      style={{ 
        width: '407px', 
        height: '215px', 
        fontFamily: 'Tahoma, Arial, sans-serif'
      }}
      dir="rtl"
    >
      {/* Header: 95px */}
      <div 
        className="relative w-full border-b-[2px] border-gray-300 flex-shrink-0" 
        style={{ 
          height: '95px', 
          background: 'linear-gradient(to bottom, #fdfbf7, #e8dfd3)', 
          borderRadius: '4px 4px 0 0' 
        }}
      >
        {/* Ornaments / Faded Background Icons */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <Compass size={60} className="mr-8 text-amber-900" />
          <Feather size={60} className="ml-8 text-amber-900" />
        </div>

        {/* Right Logo Area */}
        <div className="absolute right-4 top-2 flex flex-col items-center z-10" style={{ width: '160px', height: '55px' }}>
          <h1 className="text-3xl font-extrabold text-[#4a3b32] tracking-wider drop-shadow-sm" style={{ fontFamily: 'Tahoma' }}>
            {server.name}
          </h1>
          <span className="text-[9px] text-[#5a4b3d] mt-1 font-bold tracking-widest whitespace-nowrap">
            نسخة مطورة - جوائز - هدايا - مسابقات
          </span>
        </div>
        
        {/* Middle Link */}
        <div className="absolute top-[72px] left-1/2 -translate-x-1/2 text-[10px] text-gray-700 tracking-wider font-bold z-10">
          www.{server.slug}.com
        </div>

        {/* Left Image Area (Ship placeholder) */}
        <div className="absolute left-2 bottom-0 z-10 flex items-end justify-center" style={{ width: '95px', height: '70px' }}>
          {server.bannerUrl ? (
            <img src={server.bannerUrl} alt="Banner" className="w-full h-full object-contain" />
          ) : (
            <div className="text-[50px] opacity-20">⛵</div>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 flex flex-col items-center justify-start gap-1.5 pt-2 px-2 relative z-10">
        
        {/* 3 Tabs */}
        <div className="flex justify-center gap-1.5 w-full px-1">
          {/* تسجيل عضوية */}
          <button 
            onClick={(e) => { e.stopPropagation(); setActiveTab('register'); }}
            className={`flex items-center justify-center gap-1 font-bold text-[11px] shadow-sm transition-colors border ${activeTab === 'register' ? 'border-gray-500 bg-gray-100 text-[#153a5b]' : 'border-gray-300 bg-gradient-to-b from-white to-gray-50 text-[#1f4e79] hover:bg-gray-100'}`}
            style={{ width: '128px', height: '28px', borderRadius: '15px' }}
          >
            <span>تسجيل عضويه</span>
            <UserPlus size={14} className="text-[#1f4e79]" />
          </button>

          {/* دخول الاعضاء */}
          <button 
            onClick={(e) => { e.stopPropagation(); setActiveTab('members'); }}
            className={`flex items-center justify-center gap-1 font-bold text-[11px] shadow-sm transition-colors border ${activeTab === 'members' ? 'border-gray-500 bg-gray-100 text-[#153a5b]' : 'border-gray-300 bg-gradient-to-b from-white to-gray-50 text-[#1f4e79] hover:bg-gray-100'}`}
            style={{ width: '128px', height: '28px', borderRadius: '15px' }}
          >
            <span>دخول الاعضاء</span>
            <LogIn size={14} className="text-[#1f4e79]" />
          </button>
          
          {/* دخول الزوار */}
          <button 
            onClick={(e) => { e.stopPropagation(); setActiveTab('visitors'); }}
            className={`flex items-center justify-center gap-1 font-bold text-[11px] shadow-sm transition-colors border ${activeTab === 'visitors' ? 'border-gray-500 bg-gray-100 text-[#153a5b]' : 'border-gray-300 bg-gradient-to-b from-white to-gray-50 text-[#1f4e79] hover:bg-gray-100'}`}
            style={{ width: '128px', height: '28px', borderRadius: '15px' }}
          >
            <span>دخول الزوار</span>
            <Users size={14} className="text-[#1f4e79]" />
          </button>
        </div>

        {/* Inputs Area */}
        <div className="flex justify-center gap-2 mt-0.5 w-full">
          {activeTab === 'members' && (
            <>
              {/* Note: the user said 2 inputs 188px each, RTL means first is right (username), second is left (password). */}
              <input 
                type="text" 
                disabled
                value={currentUser?.username || ''}
                className="text-center font-bold text-gray-700 shadow-inner focus:outline-none border border-gray-400 bg-white"
                style={{ width: '188px', height: '30px', borderRadius: '16px' }}
              />
              <input 
                type="password" 
                placeholder="••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="text-center font-bold text-gray-700 shadow-inner focus:outline-none border border-gray-400 bg-white"
                style={{ width: '188px', height: '30px', borderRadius: '16px' }}
              />
            </>
          )}
          {activeTab === 'register' && (
            <>
              <input type="text" placeholder="الاسم الجديد" value={regName} onChange={(e)=>setRegName(e.target.value)} className="text-center font-bold text-gray-700 shadow-inner focus:outline-none border border-gray-400 bg-white" style={{ width: '188px', height: '30px', borderRadius: '16px' }} />
              <input type="password" placeholder="كلمة المرور" value={regPass} onChange={(e)=>setRegPass(e.target.value)} className="text-center font-bold text-gray-700 shadow-inner focus:outline-none border border-gray-400 bg-white" style={{ width: '188px', height: '30px', borderRadius: '16px' }} />
            </>
          )}
          {activeTab === 'visitors' && (
            <input type="text" placeholder="الاسم المستعار" value={visitorName} onChange={(e)=>setVisitorName(e.target.value)} className="text-center font-bold text-gray-700 shadow-inner focus:outline-none border border-gray-400 bg-white" style={{ width: '385px', height: '30px', borderRadius: '16px' }} />
          )}
        </div>

        {/* Login Button */}
        <div className="mt-0.5 w-full flex justify-center relative">
          <button 
            onClick={(e) => { e.stopPropagation(); handleSubmit(e); }}
            className="relative font-bold text-white shadow-md border border-[#4a3b32] flex items-center justify-center transition-opacity hover:opacity-90 text-[13px]"
            style={{ 
              width: '385px', 
              height: '30px', 
              borderRadius: '18px', 
              background: 'linear-gradient(to bottom, #8a7360, #5a4b3d)' 
            }}
          >
            <span>دخول</span>
            
            {/* Eye icon in far right */}
            {activeTab === 'members' && (
              <div 
                onClick={(e) => { e.stopPropagation(); setIsInvisible(!isInvisible); }}
                className={`absolute right-2 w-[18px] h-[18px] rounded-full flex items-center justify-center cursor-pointer transition-colors border border-[#4a3b32] ${isInvisible ? 'bg-gray-300' : 'bg-white'}`}
                title="دخول مخفي"
              >
                <Eye size={11} className="text-[#5a4b3d]" />
              </div>
            )}
          </button>
        </div>

        {/* Online Badge - Bottom Left */}
        <div className="absolute left-3 bottom-3 z-20 flex items-center gap-1.5 bg-[#121212] shadow-sm px-3 py-1 rounded-full border border-gray-700 text-gray-200">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold tracking-wide font-sans text-gray-300">
            {server.users || Math.floor(Math.random() * 300) + 50} متواجد
          </span>
        </div>

      </div>
    </div>
  );
}
