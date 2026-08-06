'use client';


import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Users, LogIn, UserCircle, Globe, RefreshCcw } from 'lucide-react';

export default function RetroEntryPage() {
  const router = useRouter();
  const { slug } = useParams();
  
  const [server, setServer] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let token = null;
    try { token = localStorage.getItem('token'); } catch(e) {}
    if (!token) return router.push('/');
    try {
      const base64Url = token.split('.')[1];
      const payload = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
      setCurrentUser(payload);
    } catch(e) {}

    fetch(`${API_URL}/community/${slug}`)
      .then(res => res.json())
      .then(data => {
        setServer(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [slug, router]);

  const handleJoin = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/community/${slug}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        router.push(`/c/${slug}/chat`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#E5E4E2]"><div className="animate-spin"><RefreshCcw size={32} className="text-[#8B5A2B]"/></div></div>;
  }

  if (!server) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#E5E4E2] font-sans" dir="rtl">
        <div className="text-red-600 font-bold mb-4">تعذر الاتصال بالخادم. قد يكون غير متصل (أو في وضع النوم).</div>
        <button onClick={() => window.location.reload()} className="bg-[#8B5A2B] text-white px-4 py-2 rounded-sm shadow">إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF5E6] font-sans flex justify-center py-4 sm:py-10" dir="rtl">
      {/* Classic Chat Container */}
      <div className="w-full max-w-[800px] bg-white border-2 border-[#8B5A2B] shadow-2xl rounded-sm overflow-hidden flex flex-col sm:flex-row">
        
        {/* Left Side: Online Users List (similar to classic chats on the right/left) */}
        <div className="w-full sm:w-[250px] bg-[#F5F5DC] border-b sm:border-b-0 sm:border-l border-[#8B5A2B] flex flex-col order-2 sm:order-1 h-[400px] sm:h-auto overflow-hidden">
          <div className="bg-[#8B5A2B] text-white p-2 font-bold text-center border-b border-[#6E4823] flex justify-between items-center">
            <span>المتصلين</span>
            <span className="bg-green-600 px-2 rounded-sm text-sm">{server._count?.members || 0}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {server.members?.map((member: any) => (
              <div key={member.id} className="flex items-center space-x-2 space-x-reverse p-1 hover:bg-[#EAEAD2] cursor-default border-b border-dashed border-[#D2B48C]">
                <div className="w-8 h-8 rounded-sm bg-white border border-[#8B5A2B] overflow-hidden flex items-center justify-center flex-shrink-0">
                  {member.user.profile?.avatarUrl ? (
                    <img src={member.user.profile.avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={20} className="text-[#8B5A2B]" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-[#8B5A2B] text-sm flex items-center">
                    {member.user.username}
                    {member.role === 'ADMIN' && <span className="text-[10px] bg-red-600 text-white px-1 rounded-sm mr-1">إدارة</span>}
                  </div>
                  {member.user.profile?.bio && (
                    <div className="text-[10px] text-gray-500 line-clamp-1">{member.user.profile.bio}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Login & Banner (order-1 on mobile) */}
        <div className="flex-1 flex flex-col order-1 sm:order-2 bg-[#FFF8DC]">
          
          {/* Header Banner */}
          <div className="h-32 bg-[#D2B48C] relative border-b-2 border-[#8B5A2B] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
            <div className="relative z-10 text-center drop-shadow-md">
              <h1 className="text-3xl font-extrabold text-[#5C4033] mb-1">شات {server.name}</h1>
              <p className="text-[#8B5A2B] font-bold text-sm tracking-widest flex items-center justify-center">
                <Globe size={14} className="ml-1" />
                شات كل العرب
              </p>
            </div>
          </div>

          {/* Login Form Area */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            
            {/* Tabs (Visual only to match the retro vibe) */}
            <div className="flex w-full max-w-sm mb-4 border border-[#8B5A2B] rounded-sm overflow-hidden text-sm font-bold shadow-sm">
              <div className="flex-1 bg-[#8B5A2B] text-white py-2 text-center flex justify-center items-center">
                <LogIn size={16} className="ml-1" /> دخول الأعضاء
              </div>
              <div className="flex-1 bg-[#F5DEB3] text-[#8B5A2B] py-2 text-center border-r border-[#8B5A2B] hover:bg-[#EED5A9] cursor-pointer transition-colors">
                تسجيل عضوية
              </div>
              <div className="flex-1 bg-[#F5DEB3] text-[#8B5A2B] py-2 text-center border-r border-[#8B5A2B] hover:bg-[#EED5A9] cursor-pointer transition-colors">
                دخول الزوار
              </div>
            </div>

            <div className="w-full max-w-sm bg-white border border-[#D2B48C] p-6 shadow-inner rounded-sm relative">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Globe size={64} />
              </div>
              
              <div className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-bold text-[#8B5A2B] mb-1">اسم المستخدم</label>
                  <input 
                    type="text" 
                    value={currentUser?.username || ''}
                    disabled
                    className="w-full border border-[#D2B48C] p-2 bg-[#FDF5E6] text-[#5C4033] font-bold text-center rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B5A2B] mb-1">كلمة المرور</label>
                  <input 
                    type="password" 
                    value="********"
                    disabled
                    className="w-full border border-[#D2B48C] p-2 bg-[#FDF5E6] text-center rounded-sm tracking-widest"
                  />
                </div>
                
                <button 
                  onClick={handleJoin}
                  className="w-full mt-4 bg-[#8B5A2B] hover:bg-[#5C4033] text-white font-bold py-3 text-lg border-2 border-[#5C4033] rounded-sm shadow-md transition-colors flex justify-center items-center"
                >
                  دخول للشات
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 relative z-10">
               <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full font-bold shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform border border-gray-700">
                  <span className="text-xl leading-none font-serif">𝕏</span> 
                  <span className="text-sm">تابع مجتمعنا على إكس</span>
               </a>
               <div className="text-xs text-[#8B5A2B] text-center font-bold bg-white/50 px-4 py-1 rounded-full">
                 جميع الحقوق محفوظة © 2026 - شات {server.name}
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
