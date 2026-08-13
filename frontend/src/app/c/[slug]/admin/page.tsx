'use client';


import { API_URL, getToken } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Settings, Users, UserPlus, ShieldAlert, ArrowRight, Save, X, Search, Check, Ban, MessageSquare, Type, Bot, Gift, Globe, Lock, Clock, Smile, Image as ImageIcon } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { slug } = useParams();
  
  const [activeTab, setActiveTab] = useState<'settings' | 'requests' | 'members' | 'logs' | 'audit' | 'messages' | 'permissions' | 'shortcuts' | 'filters' | 'rooms' | 'bots' | 'gifts' | 'domains' | 'roles' | 'fake-users' | 'bans' | 'emojis' | 'google-index' | 'coming_soon'>('settings');
  const [indexingStatus, setIndexingStatus] = useState<'INDEXED' | 'PENDING' | 'FAILED'>('PENDING');
  const [indexingReason, setIndexingReason] = useState<string>('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'غير معروف';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (hours < 1) return 'قبل أقل من ساعة';
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days === 1) return 'منذ يوم';
    if (days === 2) return 'منذ يومين';
    return `منذ ${days} أيام`;
  };
  
  // Mock Data
  const [server, setServer] = useState({
    name: 'شات الود',
    slug: slug,
    description: 'شات كل العرب',
    isPrivate: false,
    bannerUrl: ''
  });

  const [settings, setSettings] = useState({
    primaryColor: '#5C4033',
    secondaryColor: '#8B5A2B',
    backgroundColor: '#EAEAD2',
    isMarqueeEnabled: true,
    marqueeText: 'عامل الناس بما تحب أن تعامل ... مرحباً بكم في شاتنا ... نرجو الالتزام بالقوانين وعدم الإساءة للآخرين ...',
    areAddonsEnabled: true,
    likesForGeneral: 0,
    likesForWall: 0,
    likesForPrivate: 0,
    likesForMedia: 0
  });

  const [shortcuts, setShortcuts] = useState<any[]>([]);
  const [bots, setBots] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState({ domain: '', seoTitle: '', seoDescription: '', seoKeywords: '' });
  const [fakeUsers, setFakeUsers] = useState<any[]>([]);
  const [newFakeUser, setNewFakeUser] = useState({ name: '', status: 'متصل', avatarUrl: '', roleId: '' });
  const [filters, setFilters] = useState<any[]>([]);
  const [newFilter, setNewFilter] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoom, setNewRoom] = useState({ name: '', isPrivate: false, password: '' });
  
  useEffect(() => {
    if (activeTab === 'settings') {
      const token = getToken();
      if (token) {
        fetch(`${API_URL}/community/${slug}/fake-users`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).then(data => setFakeUsers(data || []));
      }
    }
  }, [activeTab, slug]);
  const [likesThresholds, setLikesThresholds] = useState({ publicChat: 0, privateChat: 0, alert: 0, wall: 0, media: 0 });

  useEffect(() => {
    const savedLikes = localStorage.getItem(`likes_thresholds_${slug}`);
    if (savedLikes) {
      try {
        setLikesThresholds(JSON.parse(savedLikes));
      } catch(e) {}
    }
    
    fetch(`${API_URL}/community/${slug}/settings`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setSettings(data);
      }).catch(err => console.error(err));

    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/community/${slug}/shortcuts`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/community/${slug}/bots`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/community/${slug}/gifts`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/community/${slug}/banners`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/community/${slug}/domains`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/community/${slug}/roles`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/community/${slug}/logs`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/community/${slug}/bans`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/community/${slug}/members`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/community/${slug}/emojis`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/community/${slug}/rooms`, { headers }).then(res => res.json()).catch(() => []),
      fetch(`${API_URL}/community/${slug}/filters`, { headers }).then(res => res.json()).catch(() => [])
    ]).then(([sData, bData, gData, bnData, dData, rData, lData, baData, mData, eData, roomsData, filtersData]) => {
      if(Array.isArray(sData)) setShortcuts(sData);
      if(Array.isArray(bData)) setBots(bData);
      if(Array.isArray(gData)) setGifts(gData);
      if(Array.isArray(bnData)) setBanners(bnData);
      if(Array.isArray(dData)) setDomains(dData);
      if(Array.isArray(rData)) setRoles(rData);
      if(Array.isArray(lData)) setLogs(lData.sort((a:any, b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      if(Array.isArray(baData)) setBans(baData);
      if(Array.isArray(mData)) setMembers(mData);
      if(Array.isArray(eData)) setEmojis(eData);
      if(Array.isArray(roomsData)) setRooms(roomsData);
      if(Array.isArray(filtersData)) setFilters(filtersData);
    }).catch(console.error);

    const initIndexing = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.from('channels').select('indexing_status, indexing_reason').eq('id', slug as string).single();
      if (data) {
        setIndexingStatus(data.indexing_status || 'PENDING');
        setIndexingReason(data.indexing_reason || '');
      }
    };
    initIndexing();
  }, [slug]);

  const requestReindex = async () => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.from('channels').update({ indexing_status: 'PENDING', indexing_reason: null }).eq('id', slug as string);
    setIndexingStatus('PENDING');
    setIndexingReason('');
    alert('تم إرسال طلب إعادة الفهرسة بنجاح!');
  };

  const handleSaveSettings = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/community/${slug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        localStorage.setItem(`likes_thresholds_${slug}`, JSON.stringify(likesThresholds));
        window.dispatchEvent(new Event('likesThresholdsUpdated'));
        alert('تم حفظ الإعدادات بنجاح!');
      } else {
        alert('حدث خطأ أثناء الحفظ (تأكد من تسجيل الدخول بحساب المالك)');
      }
    } catch (e) {
      console.error(e);
      alert('خطأ في الاتصال بالسيرفر');
    }
  };

  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [editingRole, setEditingRole] = useState<any>(null);

  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [emojis, setEmojis] = useState<any[]>([]);

  return (
    <div className="h-[100dvh] overflow-hidden bg-gray-50 flex font-sans w-full" dir="rtl">
      
      {/* Sidebar (Order 2 -> Left side in RTL) */}
      <div className="w-32 md:w-40 flex-shrink-0 h-full bg-white flex flex-col z-50 border-r border-gray-300 shadow-sm overflow-y-auto order-2 relative">
        <div className="flex justify-end p-1 border-b border-gray-200">
          <button onClick={() => window.location.reload()} className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white p-1 rounded-sm shadow-sm transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
        
        <div className="flex flex-col py-2 font-bold text-[13px] md:text-sm text-[#005599]">
          <button onClick={() => setActiveTab('logs')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'logs' ? 'bg-gray-100' : ''}`}>السجل</button>
          <button onClick={() => setActiveTab('audit')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'audit' ? 'bg-gray-100' : ''}`}>الحالات</button>
          <button onClick={() => setActiveTab('bans')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'bans' ? 'bg-gray-100' : ''}`}>الحظر</button>
          <button onClick={() => setActiveTab('members')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'members' ? 'bg-gray-100' : ''}`}>الأعضاء</button>
          <button onClick={() => setActiveTab('roles')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'roles' ? 'bg-gray-100' : ''}`}>الصلاحيات</button>
          <button onClick={() => setActiveTab('filters')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'filters' ? 'bg-gray-100' : ''}`}>فلتر</button>
          <button onClick={() => setActiveTab('rooms')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'rooms' ? 'bg-gray-100' : ''}`}>الغرف</button>
          <button onClick={() => setActiveTab('shortcuts')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'shortcuts' ? 'bg-gray-100' : ''}`}>الإختصارات</button>
          <button onClick={() => setActiveTab('coming_soon')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'coming_soon' ? 'bg-gray-100' : ''}`}>الإشتراكات</button>
          <button onClick={() => setActiveTab('messages')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'messages' ? 'bg-gray-100' : ''}`}>الرسائل</button>
          <button onClick={() => setActiveTab('fake-users')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'fake-users' ? 'bg-gray-100' : ''}`}>الهميين (Bots)</button>
          <button onClick={() => setActiveTab('requests')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'requests' ? 'bg-gray-100' : ''}`}>غرفة الانتظار</button>
          <button onClick={() => setActiveTab('settings')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'settings' ? 'bg-gray-100' : ''}`}>الإعدادات العامة</button>
          <button onClick={() => setActiveTab('coming_soon')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'coming_soon' ? 'bg-gray-100' : ''}`}>الصفحات</button>
          <button onClick={() => setActiveTab('emojis')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'emojis' ? 'bg-gray-100' : ''}`}>الرموز</button>
          <button onClick={() => setActiveTab('domains')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'domains' ? 'bg-gray-100' : ''}`}>النطاقات</button>
          <button onClick={() => setActiveTab('google-index')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'google-index' ? 'bg-gray-100' : ''}`}>فهرسة قوقل</button>
          <button onClick={() => setActiveTab('coming_soon')} className={`text-right px-3 md:px-4 py-1.5 hover:bg-gray-100 ${activeTab === 'coming_soon' ? 'bg-gray-100' : ''}`}>الإحصائيات</button>
        </div>
      </div>

      {/* Main Content Area (Order 1 -> Right side) */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden order-1 bg-gray-50 relative min-w-0">
        <button onClick={() => router.push(`/c/${slug}/chat`)} className="w-full shrink-0 flex flex-row-reverse items-center justify-between px-4 py-3 bg-[#d9534f] hover:bg-[#c9302c] text-white transition-colors font-bold text-sm shadow-md">
          <div className="flex items-center gap-2" dir="ltr">
            <span>العودة للشات</span> <ArrowRight size={16} />
          </div>
          <div></div>
        </button>
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-[#5C4033]">
            {activeTab === 'settings' && 'الإعدادات العامة'}
            {activeTab === 'requests' && 'طلبات الانضمام المعلقة'}
            {activeTab === 'members' && 'إدارة الأعضاء'}
            {activeTab === 'logs' && 'سجل الدخول والخروج'}
            {activeTab === 'audit' && 'سجل الإشراف (الحالات)'}
            {activeTab === 'roles' && 'إدارة الصلاحيات والمجموعات'}
            {activeTab === 'permissions' && 'إعدادات اللايكات'}
            {activeTab === 'filters' && 'الكلمات الممنوعة (الفلتر)'}
            {activeTab === 'rooms' && 'إدارة الغرف (الرومات)'}
            {activeTab === 'shortcuts' && 'إدارة اختصارات الكلمات'}
            {activeTab === 'bots' && 'إعدادات البوتات'}
            {activeTab === 'fake-users' && 'العضويات الوهمية'}
            {activeTab === 'messages' && 'الرسائل التلقائية والترحيب'}
            {activeTab === 'gifts' && 'الهدايا والبنرات الإعلانية'}
            {activeTab === 'domains' && 'النطاقات المستضافة (SEO)'}
            {activeTab === 'bans' && 'قائمة الحظر'}
            {activeTab === 'emojis' && 'إدارة الفيسات (Emojis)'}
            {activeTab === 'google-index' && 'فهرسة قوقل'}
            {activeTab === 'coming_soon' && 'قريباً'}
          </h1>
        </div>

        {/* Content Area */}
        <div className="p-3 md:p-8 max-w-5xl mx-auto flex-1 w-full">
          
          {/* Coming Soon Tab */}
          {activeTab === 'coming_soon' && (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-500 mb-2">هذه الخاصية قيد التطوير</h2>
              <p className="text-gray-400">سيتم تفعيل هذه الميزة قريباً لتكون متاحة للاستخدام.</p>
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">اسم الشات</label>
                  <input type="text" value={server.name} onChange={e => setServer({...server, name: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 focus:border-[#5C4033] focus:ring-1 focus:ring-[#5C4033] outline-none font-bold text-black" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رابط الشات (Slug)</label>
                  <input type="text" value={server.slug as string} disabled className="w-full border border-gray-300 bg-gray-100 text-gray-500 rounded-md p-2.5 cursor-not-allowed font-bold text-black" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">وصف الشات (يظهر في جوجل للـ SEO)</label>
                  <textarea value={server.description} onChange={e => setServer({...server, description: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 h-24 resize-none focus:border-[#5C4033] focus:ring-1 focus:ring-[#5C4033] outline-none font-bold text-black"></textarea>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">صورة الموقع الخارجية (رابط مباشر)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={server.bannerUrl || ''} onChange={e => setServer({...server, bannerUrl: e.target.value})} placeholder="https://example.com/image.png" className="w-full border border-gray-300 rounded-md p-2.5 focus:border-[#5C4033] focus:ring-1 focus:ring-[#5C4033] outline-none font-bold text-black text-left" dir="ltr" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="banner-upload-input" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if(!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        const token = getToken();
                        try {
                          const res = await fetch(`${API_URL}/chat/media`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData
                          });
                          if(res.ok) {
                            const data = await res.json();
                            setServer({...server, bannerUrl: data.mediaUrl});
                          } else {
                            alert('فشل رفع الصورة');
                          }
                        } catch(err) {
                          alert('خطأ في الاتصال');
                        }
                      }} 
                    />
                    <button onClick={() => document.getElementById('banner-upload-input')?.click()} className="bg-gray-100 text-gray-800 px-4 py-2.5 rounded-md font-bold hover:bg-gray-200 w-full sm:w-auto shrink-0 border border-gray-300 flex items-center justify-center gap-1 whitespace-nowrap">
                       <ImageIcon size={16} /> من الاستديو
                    </button>
                    <button onClick={async () => {
                      const token = getToken();
                      try {
                        const res = await fetch(`${API_URL}/community/${slug}/banner`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ bannerUrl: server.bannerUrl })
                        });
                        if (res.ok) alert('تم حفظ صورة الموقع الخارجية بنجاح!');
                        else alert('حدث خطأ أثناء الحفظ');
                      } catch (e) { console.error(e); alert('خطأ في الاتصال'); }
                    }} className="bg-[#5C4033] text-white px-4 py-2.5 rounded-md font-bold hover:bg-[#3e2b22] w-full sm:w-auto shrink-0 whitespace-nowrap">حفظ الصورة</button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">تظهر هذه الصورة كغلاف وشعار خارجي لموقعك في قائمة (اكتشف المواقع).</p>
                </div>
                
                <div className="md:col-span-2 p-4 bg-yellow-50 rounded-md border border-yellow-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-yellow-800 text-lg">نظام الخصوصية</h3>
                    <p className="text-yellow-700 text-sm mt-1 font-bold">عند تفعيل الخاص، لن يتمكن الزوار من الدخول إلا بعد موافقتك على طلب الانضمام.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={server.isPrivate} onChange={e => setServer({...server, isPrivate: e.target.checked})} />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                
                {/* Advanced Settings */}
                <div className="md:col-span-2 mt-4">
                  <h2 className="text-xl font-extrabold text-[#5C4033] mb-4 border-b pb-2">التصميم والمظهر</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">اللون الرئيسي (الشريط العلوي)</label>
                      <input type="color" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})} className="w-full h-10 border border-gray-300 rounded-md cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">اللون الثانوي (الأزرار)</label>
                      <input type="color" value={settings.secondaryColor} onChange={e => setSettings({...settings, secondaryColor: e.target.value})} className="w-full h-10 border border-gray-300 rounded-md cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">لون الخلفية (للشات)</label>
                      <input type="color" value={settings.backgroundColor} onChange={e => setSettings({...settings, backgroundColor: e.target.value})} className="w-full h-10 border border-gray-300 rounded-md cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-lg">الرسالة المتحركة (التوجيه الإداري)</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.isMarqueeEnabled} onChange={e => setSettings({...settings, isMarqueeEnabled: e.target.checked})} />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                  {settings.isMarqueeEnabled && (
                    <input type="text" value={settings.marqueeText} onChange={e => setSettings({...settings, marqueeText: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 focus:border-[#5C4033] focus:ring-1 focus:ring-[#5C4033] outline-none font-bold text-black" />
                  )}
                </div>

                <div className="md:col-span-2 mt-2 p-4 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">الإضافات والألعاب (Ludo, XO)</h3>
                    <p className="text-gray-500 text-sm mt-1 font-bold">تفعيل الألعاب في الشريط الجانبي للشات</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.areAddonsEnabled} onChange={e => setSettings({...settings, areAddonsEnabled: e.target.checked})} />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {/* Move Likes Settings Here */}
                <div className="md:col-span-2 mt-4">
                  <h2 className="text-xl font-extrabold text-[#5C4033] mb-4 border-b pb-2">صلاحيات اللايكات (0 = مسموح للجميع)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                      <span className="font-bold text-gray-700 text-sm">الكتابة في الشات العام</span>
                      <input type="number" min="0" value={likesThresholds.publicChat} onChange={e => setLikesThresholds({...likesThresholds, publicChat: Number(e.target.value) || 0})} className="w-24 p-1.5 text-center text-black font-bold border border-gray-300 rounded-md outline-none focus:border-[#5C4033]" />
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                      <span className="font-bold text-gray-700 text-sm">المحادثات الخاصة</span>
                      <input type="number" min="0" value={likesThresholds.privateChat} onChange={e => setLikesThresholds({...likesThresholds, privateChat: Number(e.target.value) || 0})} className="w-24 p-1.5 text-center text-black font-bold border border-gray-300 rounded-md outline-none focus:border-[#5C4033]" />
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                      <span className="font-bold text-gray-700 text-sm">نشر في الحائط</span>
                      <input type="number" min="0" value={likesThresholds.wall} onChange={e => setLikesThresholds({...likesThresholds, wall: Number(e.target.value) || 0})} className="w-24 p-1.5 text-center text-black font-bold border border-gray-300 rounded-md outline-none focus:border-[#5C4033]" />
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                      <span className="font-bold text-gray-700 text-sm">رابط وسائط (صور/فيديو)</span>
                      <input type="number" min="0" value={likesThresholds.media} onChange={e => setLikesThresholds({...likesThresholds, media: Number(e.target.value) || 0})} className="w-24 p-1.5 text-center text-black font-bold border border-gray-300 rounded-md outline-none focus:border-[#5C4033]" />
                    </div>
                  </div>
                </div>

              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => { if(confirm('هل أنت متأكد من حذف الشات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) alert('تم حذف الشات.'); }} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-md font-bold flex items-center gap-2 shadow-md transition-colors">
                  إلغاء أو حذف الشات
                </button>
                <button onClick={handleSaveSettings} className="bg-[#5C4033] hover:bg-[#3e2b22] text-white px-6 py-2.5 rounded-md font-bold flex items-center gap-2 shadow-md transition-colors">
                  <Save size={18} /> حفظ التغييرات
                </button>
              </div>
            </div>
            </div>
            )}
          

           {/* Shortcuts Section */}
          {activeTab === 'shortcuts' && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <h3 className="text-lg font-bold text-[#5C4033] mb-4">إضافة اختصار جديد</h3>
               <div className="flex flex-col sm:flex-row gap-4 sm:items-end mb-8">
                 <div className="flex-1 w-full">
                   <label className="block text-sm font-bold text-gray-700 mb-1">الاختصار (مثال: س1)</label>
                   <input type="text" className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033]" placeholder="الكلمة المختصرة" />
                 </div>
                 <div className="flex-[3]">
                   <label className="block text-sm font-bold text-gray-700 mb-1">الكلمة البديلة (مثال: السلام عليكم ورحمة الله)</label>
                   <input type="text" className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033]" placeholder="النص الكامل" />
                 </div>
                 <button onClick={() => alert('تمت إضافة الاختصار بنجاح وسيبدأ العمل به بعد الحفظ.')} className="bg-green-600 text-white p-2 px-6 rounded-md font-bold hover:bg-green-700 w-full sm:w-auto mt-4 sm:mt-0">إضافة</button>
               </div>
               
               <h3 className="text-lg font-bold text-[#5C4033] mb-4">الاختصارات الحالية</h3>
               <div className="overflow-hidden border border-gray-200 rounded-md">
                 <table className="w-full text-sm text-right">
                   <thead className="bg-gray-50 text-gray-700 font-bold">
                     <tr><th className="p-3">الاختصار</th><th className="p-3">النص الكامل</th><th className="p-3 w-20">إجراء</th></tr>
                   </thead>
                   <tbody>
                     <tr className="border-t border-gray-200">
                       <td className="p-3 font-bold">س1</td>
                       <td className="p-3">السلام عليكم ورحمة الله وبركاته</td>
                       <td className="p-3"><button className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"><Ban size={16}/></button></td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>
          )}

           {/* Bots Section */}
          {/* Messages Tab (Formerly Bots) */}
          {activeTab === 'messages' && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
               <div>
                 <h3 className="text-lg font-bold text-[#5C4033] mb-4">رسالة الترحيب</h3>
                 <textarea className="w-full border border-gray-300 rounded-md p-3 outline-none focus:border-[#5C4033] min-h-[80px]" defaultValue="أهلاً بك في الشات!" />
                 <button onClick={() => alert('تم حفظ رسالة الترحيب!')} className="bg-[#5C4033] text-white py-1.5 px-6 rounded-md hover:bg-[#3e2b22] mt-2 font-bold text-sm">حفظ الترحيب</button>
               </div>
               
               <div className="border-t border-gray-200 pt-6">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-bold text-[#5C4033]">رسائل النظام التلقائية (كل 10 دقائق)</h3>
                   <label className="flex items-center gap-2 cursor-pointer font-bold">
                     <input type="checkbox" className="w-5 h-5 rounded text-[#5C4033] focus:ring-[#5C4033]" /> تفعيل
                   </label>
                 </div>
                 <textarea className="w-full border border-gray-300 rounded-md p-3 outline-none focus:border-[#5C4033] min-h-[80px]" placeholder="أدخل الرسائل المجدولة هنا (رسالة في كل سطر)..." />
                 <button onClick={() => alert('تم حفظ إعدادات الرسائل!')} className="bg-[#5C4033] text-white py-1.5 px-6 rounded-md hover:bg-[#3e2b22] mt-2 font-bold text-sm">حفظ الرسائل</button>
               </div>
             </div>
          )}

           {/* Gifts & Banners Tab */}
          {activeTab === 'gifts' && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
               <div>
                 <h3 className="text-lg font-bold text-[#5C4033] mb-4">إدارة الهدايا</h3>
                 <div className="flex gap-4">
                   <button className="bg-[#5C4033] text-white py-2 px-6 rounded-md hover:bg-[#3e2b22] font-bold text-sm flex items-center gap-2">رفع صورة هدية جديدة</button>
                 </div>
                 <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 mt-6">
                   {/* Mock Gift */}
                   <div className="relative group border border-gray-200 rounded-md p-2 flex flex-col items-center justify-center gap-2">
                     <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">🎁</div>
                     <span className="text-xs font-bold">هدية 1</span>
                     <button className="absolute top-1 right-1 bg-red-500 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                   </div>
                 </div>
               </div>

               <div className="border-t border-gray-200 pt-6">
                 <h3 className="text-lg font-bold text-[#5C4033] mb-4">إدارة البنرات الإعلانية</h3>
                 <div className="flex gap-4">
                   <button className="bg-[#8B5A2B] text-white py-2 px-6 rounded-md hover:bg-[#6E4823] font-bold text-sm flex items-center gap-2">رفع صورة بانر جديد</button>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                   <div className="relative group border border-gray-200 rounded-md h-24 bg-gray-100 flex items-center justify-center text-gray-400">
                     <span>لا يوجد بانرات حالياً</span>
                   </div>
                 </div>
               </div>
             </div>
          )}

           {/* Domains Section */}
          {activeTab === 'domains' && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <h3 className="text-lg font-bold text-[#5C4033] mb-2">إدارة النطاقات المتعددة</h3>
               <p className="text-sm text-gray-500 mb-6">يمكنك ربط هذا السيرفر بنطاقات أخرى، وتخصيص أرشفة محركات البحث (SEO) لكل نطاق بشكل مستقل.</p>
               
               <h4 className="font-bold text-gray-700 mb-4">النطاقات المتوفرة للحجز</h4>
               <div className="flex gap-2 mb-8 flex-wrap">
                 {['chat-ksa.com', 'arab-chat.net', 'gulf-chat.org', 'social-chat.io'].map(d => (
                   <div key={d} className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2">
                     <Globe size={14} className="text-gray-500" /> <span dir="ltr">{d}</span>
                     <button onClick={() => alert('تم اختيار النطاق: ' + d)} className="text-green-600 hover:text-green-800 mr-2 border-r border-gray-300 pr-2">حجز</button>
                   </div>
                 ))}
               </div>

               <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-8">
                 <h4 className="font-bold text-gray-700 mb-4">ربط نطاق جديد</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">اسم النطاق (مثال: chat-ksa.com)</label>
                     <input type="text" value={newDomain.domain} onChange={e => setNewDomain({...newDomain, domain: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033]" dir="ltr" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">عنوان الصفحة (SEO Title)</label>
                     <input type="text" value={newDomain.seoTitle} onChange={e => setNewDomain({...newDomain, seoTitle: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033]" />
                   </div>
                 </div>
                 <div className="mb-4">
                   <label className="block text-sm font-bold text-gray-700 mb-1">وصف الصفحة (SEO Description)</label>
                   <textarea value={newDomain.seoDescription} onChange={e => setNewDomain({...newDomain, seoDescription: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033] min-h-[60px]" />
                 </div>
                 <div className="mb-4">
                   <label className="block text-sm font-bold text-gray-700 mb-1">الكلمات المفتاحية (SEO Keywords)</label>
                   <input type="text" value={newDomain.seoKeywords} onChange={e => setNewDomain({...newDomain, seoKeywords: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033]" placeholder="شات، تعارف، دردشة..." />
                 </div>
                 <button onClick={async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/community/${slug}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newDomain)
      });
      if(res.ok) {
        const saved = await res.json();
        setDomains([...domains, saved]);
        setNewDomain({ domain: '', seoTitle: '', seoDescription: '', seoKeywords: '' });
        alert('تم إضافة النطاق بنجاح!');
      } else {
        alert('حدث خطأ أثناء إضافة النطاق (تأكد من صحة النطاق وعدم تكراره)');
      }
    } catch(e) { alert('خطأ في الاتصال بالسيرفر'); }
  }} className="bg-green-600 text-white p-2 px-6 rounded-md font-bold hover:bg-green-700 w-full md:w-auto">حفظ وإضافة النطاق</button>
               </div>

               <h4 className="font-bold text-gray-700 mb-4">النطاقات المربوطة</h4>
               <div className="overflow-hidden border border-gray-200 rounded-md">
                 <table className="w-full text-sm text-right">
                   <thead className="bg-gray-50 text-gray-700 font-bold">
                     <tr>
                       <th className="p-3">النطاق</th>
                       <th className="p-3">العنوان (Title)</th>
                       <th className="p-3 w-20">إجراء</th>
                     </tr>
                   </thead>
                   <tbody>
                     {domains.length === 0 ? (
                        <tr className="border-t border-gray-200 text-center text-gray-500">
                          <td colSpan={3} className="p-4">لا توجد نطاقات مربوطة حالياً.</td>
                        </tr>
                      ) : (
                        domains.map(d => (
                          <tr key={d.id} className="border-t border-gray-200 text-center">
                            <td className="p-3 text-left pl-4 font-bold" dir="ltr">{d.domain}</td>
                            <td className="p-3 text-gray-600 font-bold">{d.seoTitle || '-'}</td>
                            <td className="p-3">
                              <button onClick={async () => {
                                if(confirm('هل أنت متأكد من حذف هذا النطاق؟')) {
                                  const token = getToken();
                                  await fetch(`${API_URL}/community/${slug}/domains/${d.id}`, {
                                    method: 'DELETE',
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  setDomains(domains.filter(x => x.id !== d.id));
                                }
                              }} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"><Ban size={16}/></button>
                            </td>
                          </tr>
                        ))
                      )}
                   </tbody>
                 </table>
               </div>
            </div>
            )}

{/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {requests.length === 0 ? (
                <div className="p-12 text-center text-gray-500 font-bold">لا توجد طلبات انضمام معلقة.</div>
              ) : (
                <table className="w-full text-right">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                    <tr>
                      <th className="p-4">العضو</th>
                      <th className="p-4">تاريخ الطلب</th>
                      <th className="p-4 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img src={req.avatar} className="w-10 h-10 rounded-full bg-gray-200 shadow-sm" />
                          <span className="font-bold text-[#5C4033]">{req.username}</span>
                        </td>
                        <td className="p-4 text-gray-500 text-sm font-bold">{req.date}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1 shadow-sm"><Check size={14}/> قبول</button>
                            <button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1 shadow-sm"><X size={14}/> رفض</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Fake Users Tab */}
          {activeTab === 'fake-users' && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-[#5C4033] mb-4">إضافة عضوية وهمية (Bot)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">اسم العضو</label>
                      <input type="text" value={newFakeUser.name} onChange={e => setNewFakeUser({...newFakeUser, name: e.target.value})} className="w-full border border-gray-300 rounded p-2 outline-none focus:border-[#5C4033]" placeholder="مثال: أحمد" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">الحالة (Status)</label>
                      <input type="text" value={newFakeUser.status} onChange={e => setNewFakeUser({...newFakeUser, status: e.target.value})} className="w-full border border-gray-300 rounded p-2 outline-none focus:border-[#5C4033]" placeholder="مثال: متصل، مشغول..." />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">صورة العرض (رابط أو رفع)</label>
                      <div className="flex gap-2">
                        <input type="text" value={newFakeUser.avatarUrl} onChange={e => setNewFakeUser({...newFakeUser, avatarUrl: e.target.value})} className="w-full border border-gray-300 rounded p-2 outline-none focus:border-[#5C4033]" placeholder="https://..." dir="ltr" />
                        <input type="file" id="fake-avatar-upload" className="hidden" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if(file) {
                            const formData = new FormData();
                            formData.append('file', file);
                            const res = await fetch(`${API_URL}/chat/media`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
                            if (res.ok) {
                              const data = await res.json();
                              setNewFakeUser({...newFakeUser, avatarUrl: data.url});
                            }
                          }
                        }} />
                        <button onClick={() => document.getElementById('fake-avatar-upload')?.click()} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 rounded font-bold text-xs whitespace-nowrap">من الاستديو</button>
                      </div>
                    </div>
                  </div>
                  <button onClick={async () => {
                    if (!newFakeUser.name) return alert('أدخل الاسم');
                    const res = await fetch(`${API_URL}/community/${slug}/fake-users`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                      body: JSON.stringify(newFakeUser)
                    });
                    if (res.ok) {
                      const added = await res.json();
                      setFakeUsers([...fakeUsers, added]);
                      setNewFakeUser({ name: '', status: 'متصل', avatarUrl: '', roleId: '' });
                    }
                  }} className="bg-[#5C4033] text-white py-2 px-6 rounded-md hover:bg-[#3e2b22] font-bold text-sm mt-4">إضافة العضو</button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-[#5C4033] mb-4">قائمة العضويات الوهمية</h3>
                  <table className="w-full text-right border-t border-gray-200">
                    <thead className="bg-gray-50 text-gray-700 font-bold">
                      <tr>
                        <th className="p-3">العضو</th>
                        <th className="p-3">الحالة (Status)</th>
                        <th className="p-3 w-20">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fakeUsers.length === 0 ? (
                        <tr><td colSpan={3} className="text-center p-4 text-gray-500 font-bold">لا يوجد عضويات وهمية مضافة.</td></tr>
                      ) : fakeUsers.map((fu: any) => (
                        <tr key={fu.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-bold flex items-center gap-3">
                            <img src={fu.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + fu.name} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                            {fu.name}
                          </td>
                          <td className="p-3 font-bold text-gray-600">{fu.status || 'متصل'}</td>
                          <td className="p-3">
                            <button onClick={async () => {
                              if(confirm('متأكد من الحذف؟')) {
                                await fetch(`${API_URL}/community/${slug}/fake-users/${fu.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
                                setFakeUsers(fakeUsers.filter(f => f.id !== fu.id));
                              }
                            }} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"><Ban size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

          {/* Filters Tab */}
          {activeTab === 'filters' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
               <h3 className="text-lg font-bold text-[#5C4033] mb-2">إدارة الفلتر (الكلمات الممنوعة)</h3>
               <p className="text-sm text-gray-500 mb-4 font-bold">الكلمات المضافة هنا سيتم تصفيتها وتحويلها إلى (***) تلقائياً لمنع الإساءة في الشات.</p>
               
               <div className="flex gap-2 mb-6">
                 <input type="text" value={newFilter} onChange={e => setNewFilter(e.target.value)} placeholder="أدخل كلمة لمنعها..." className="border border-gray-300 rounded p-2 outline-none focus:border-[#5C4033] w-full max-w-sm font-bold" />
                 <button onClick={async () => {
                   if(newFilter.trim()){
                     const token = getToken();
                     try {
                        const res = await fetch(`${API_URL}/community/${slug}/filters`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ word: newFilter.trim() })
                        });
                        if (res.ok) {
                          const nf = await res.json();
                          setFilters([...filters, nf]);
                          setNewFilter('');
                        }
                     } catch(e) {}
                   }
                 }} className="bg-[#5C4033] text-white py-2 px-6 rounded-md hover:bg-[#3e2b22] font-bold text-sm whitespace-nowrap">إضافة الكلمة</button>
               </div>
               
               <div className="flex flex-wrap gap-2">
                 {filters.length === 0 ? (
                   <span className="text-gray-400 text-sm font-bold">لا توجد كلمات ممنوعة حتى الآن.</span>
                 ) : filters.map((filter: any) => (
                   <div key={filter.id} className="bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 flex items-center gap-2 group">
                     <span className="font-bold text-gray-700">{filter.word}</span>
                     <button onClick={async () => {
                       if(confirm('متأكد من حذف هذه الكلمة؟')) {
                          try {
                            await fetch(`${API_URL}/community/${slug}/filters/${filter.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
                            setFilters(filters.filter(f => f.id !== filter.id));
                          } catch(e) {}
                       }
                     }} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* Rooms Tab */}
          {activeTab === 'rooms' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6 flex flex-col gap-6">
               <h3 className="text-lg font-bold text-[#5C4033] mb-4">إدارة الغرف (الرومات)</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
                 <div className="md:col-span-2">
                   <label className="block text-sm font-bold text-gray-700 mb-2">اسم الغرفة الجديدة</label>
                   <input type="text" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} className="w-full border border-gray-300 rounded p-2 outline-none focus:border-[#5C4033]" placeholder="مثال: روم السوالف" />
                 </div>
                 <div>
                   <label className="flex items-center gap-2 cursor-pointer font-bold h-[42px] mt-6 bg-gray-50 border border-gray-200 rounded px-3">
                     <input type="checkbox" checked={newRoom.isPrivate} onChange={e => setNewRoom({...newRoom, isPrivate: e.target.checked})} className="w-4 h-4 rounded text-[#5C4033]" /> خاصة بكلمة مرور
                   </label>
                 </div>
                 <div>
                   <button onClick={async () => {
                     if(newRoom.name.trim()) {
                        const token = getToken();
                        try {
                           const res = await fetch(`${API_URL}/community/${slug}/rooms`, {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                             body: JSON.stringify(newRoom)
                           });
                           if(res.ok) {
                             const created = await res.json();
                             setRooms([...rooms, created]);
                             setNewRoom({ name: '', isPrivate: false, password: '' });
                           }
                        } catch(e) {}
                     }
                   }} className="bg-[#5C4033] text-white py-2 px-6 rounded-md hover:bg-[#3e2b22] font-bold text-sm w-full h-[42px]">إضافة غرفة</button>
                 </div>
                 {newRoom.isPrivate && (
                   <div className="md:col-span-4 mt-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور للغرفة</label>
                      <input type="text" value={newRoom.password} onChange={e => setNewRoom({...newRoom, password: e.target.value})} className="w-full border border-gray-300 rounded p-2 outline-none focus:border-[#5C4033]" placeholder="أدخل كلمة المرور..." />
                   </div>
                 )}
               </div>

               <table className="w-full text-right border-t border-gray-200 mt-4">
                 <thead className="bg-gray-50 text-gray-700 font-bold">
                   <tr>
                     <th className="p-3">الغرفة</th>
                     <th className="p-3">النوع</th>
                     <th className="p-3 w-20">إجراء</th>
                   </tr>
                 </thead>
                 <tbody>
                   {rooms.length === 0 ? (
                      <tr><td colSpan={3} className="text-center p-4 text-gray-500 font-bold">لا يوجد غرف مضافة حالياً.</td></tr>
                   ) : rooms.map((room: any) => (
                      <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-bold text-[#5C4033]">{room.name}</td>
                        <td className="p-3">
                          {room.isPrivate ? (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold border border-red-200 flex items-center gap-1 w-max"><Lock size={12}/> خاصة</span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded font-bold border border-green-200 flex items-center gap-1 w-max"><Globe size={12}/> عامة</span>
                          )}
                        </td>
                        <td className="p-3">
                           <button onClick={async () => {
                             if(confirm('متأكد من حذف الغرفة؟ سيتم حذف رسائلها.')) {
                                try {
                                  await fetch(`${API_URL}/community/${slug}/rooms/${room.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
                                  setRooms(rooms.filter(r => r.id !== room.id));
                                } catch(e) {}
                             }
                           }} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"><Ban size={16}/></button>
                        </td>
                      </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          )}

          {/* Emojis Tab */}
          {activeTab === 'emojis' && (
            <div className="flex flex-col gap-6">
              {/* Emojis Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6">
                 <h3 className="text-lg font-bold text-[#5C4033] mb-4">إدارة الفيسات (Emojis)</h3>
                 <p className="text-sm text-gray-500 mb-6 font-bold">الفيسات سيتم تحويلها تلقائياً في الشات عند كتابة اختصارها (مثلاً: ف1, ف2...).</p>
                 
                 <div className="flex gap-4 mb-6">
                   <button 
                     onClick={() => {
                       const url = prompt('أدخل رابط الفيس:');
                       if (url) {
                         fetch(`${API_URL}/community/${slug}/emojis`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                           body: JSON.stringify({ url, type: 'EMOJI' })
                         }).then(r => r.json()).then(newEmoji => {
                           setEmojis(prev => [...prev, newEmoji]);
                         });
                       }
                     }}
                     className="bg-[#5C4033] text-white py-2 px-6 rounded-md hover:bg-[#3e2b22] font-bold text-sm flex items-center gap-2 shadow-sm">
                     <Smile size={18} /> إضافة فيس جديد
                   </button>
                 </div>
                 
                 <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                   {emojis.filter((e:any) => e.type === 'EMOJI').map((emoji: any) => (
                     <div key={emoji.id} className="relative group border border-gray-200 rounded-md p-2 flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition-colors">
                       <img src={emoji.url} alt="Emoji" className="w-8 h-8 object-contain" />
                       <div className="text-[10px] text-gray-400 mt-2 font-bold">{emoji.shortcut || ''}</div>
                       <button 
                         onClick={() => {
                           if(confirm('هل أنت متأكد من حذف هذا الفيس؟')) {
                             fetch(`${API_URL}/community/${slug}/emojis/${emoji.id}`, {
                               method: 'DELETE',
                               headers: { Authorization: `Bearer ${getToken()}` }
                             }).then(() => {
                               setEmojis(prev => prev.filter(e => e.id !== emoji.id));
                             });
                           }
                         }}
                         className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                         <X size={12} />
                       </button>
                     </div>
                   ))}
                   {emojis.filter((e:any) => e.type === 'EMOJI').length === 0 && (
                     <div className="col-span-full text-center py-4 text-gray-500 font-bold text-sm">
                       لا توجد فيسات مضافة.
                     </div>
                   )}
                 </div>
              </div>

              {/* Stickers Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6">
                 <h3 className="text-lg font-bold text-[#5C4033] mb-4">إدارة الملصقات (Stickers)</h3>
                 <p className="text-sm text-gray-500 mb-6 font-bold">الملصقات تظهر في القائمة الجانبية في الشات وتُرسل كصورة كبيرة مباشرة.</p>
                 
                 <div className="flex gap-4 mb-6">
                   <button 
                     onClick={() => {
                       const url = prompt('أدخل رابط الملصق (يفضل أن يكون بخلفية شفافة أو GIF):');
                       if (url) {
                         fetch(`${API_URL}/community/${slug}/emojis`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                           body: JSON.stringify({ url, type: 'STICKER' })
                         }).then(r => r.json()).then(newEmoji => {
                           setEmojis(prev => [...prev, newEmoji]);
                         });
                       }
                     }}
                     className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 font-bold text-sm flex items-center gap-2 shadow-sm">
                     <ImageIcon size={18} /> إضافة ملصق جديد
                   </button>
                 </div>
                 
                 <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                   {emojis.filter((e:any) => e.type === 'STICKER').map((emoji: any) => (
                     <div key={emoji.id} className="relative group border border-gray-200 rounded-md p-2 flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition-colors">
                       <img src={emoji.url} alt="Sticker" className="w-16 h-16 object-contain" />
                       <div className="text-[10px] text-gray-400 mt-2 font-bold">ملصق</div>
                       <button 
                         onClick={() => {
                           if(confirm('هل أنت متأكد من حذف هذا الملصق؟')) {
                             fetch(`${API_URL}/community/${slug}/emojis/${emoji.id}`, {
                               method: 'DELETE',
                               headers: { Authorization: `Bearer ${getToken()}` }
                             }).then(() => {
                               setEmojis(prev => prev.filter(e => e.id !== emoji.id));
                             });
                           }
                         }}
                         className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                         <X size={12} />
                       </button>
                     </div>
                   ))}
                   {emojis.filter((e:any) => e.type === 'STICKER').length === 0 && (
                     <div className="col-span-full text-center py-4 text-gray-500 font-bold text-sm">
                       لا توجد ملصقات مضافة.
                     </div>
                   )}
                 </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div className="relative w-64">
                  <input type="text" placeholder="ابحث عن عضو..." className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:border-[#5C4033] focus:ring-1 focus:ring-[#5C4033] outline-none text-sm font-bold" />
                  <Search size={16} className="absolute right-3 top-2.5 text-gray-400" />
                </div>
              </div>
              <table className="w-full text-right">
                <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 font-bold text-sm">
                  <tr>
                    <th className="p-4">العضو</th>
                    <th className="p-4">الرتبة</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-[#5C4033]">
                        {member.user?.username || member.name || 'عضو'}
                        <div className="text-[10px] text-gray-400">آخر ظهور: {formatTimeAgo(member.lastSeen)}</div>
                        <div className="text-[10px] text-gray-400">IP: {member.lastIp || 'غير معروف'}</div>
                        <div className="text-[10px] text-gray-400">الجهاز: {member.device || 'غير معروف'}</div>
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-sm font-bold border border-gray-200">
                          {member.role?.name || 'بدون رتبة'}
                        </span>
                      </td>
                      <td className="p-4">
                        {member.status === 'APPROVED' ? (
                           <span className="text-green-600 font-bold text-sm flex items-center gap-1"><Check size={14}/> نشط</span>
                        ) : (
                           <span className="text-red-600 font-bold text-sm flex items-center gap-1"><Ban size={14}/> محظور (باند)</span>
                        )}
                      </td>
                      <td className="p-4 text-center relative">
                        <div className="flex items-center justify-center">
                            <button onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition-colors border border-gray-200">
                               <Settings size={16} />
                            </button>
                            
                            {openMenuId === member.id && (
                              <div className="absolute left-6 top-10 bg-white border border-gray-200 shadow-xl rounded-md w-36 z-50 flex flex-col overflow-hidden text-sm font-bold">
                                <button onClick={async () => {
                                  setOpenMenuId(null);
                                  const newPass = prompt('أدخل كلمة المرور الجديدة:');
                                  if (newPass && newPass.trim() !== '') {
                                    const token = getToken();
                                    try {
                                      const res = await fetch(`${API_URL}/community/${slug}/members/${member.id}/password`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                        body: JSON.stringify({ newPassword: newPass })
                                      });
                                      if (res.ok) alert('تم تغيير كلمة المرور بنجاح');
                                      else alert('خطأ في تغيير كلمة المرور');
                                    } catch(e) { alert('خطأ في الاتصال'); }
                                  }
                                }} className="p-2.5 text-blue-600 hover:bg-blue-50 text-right w-full border-b border-gray-100 transition-colors">تغيير الرقم السري</button>
                                <button onClick={async () => {
                                  setOpenMenuId(null);
                                  if(confirm('هل أنت متأكد من حذف هذه العضوية بالكامل؟')) {
                                    const token = getToken();
                                    try {
                                      const res = await fetch(`${API_URL}/community/${slug}/members/${member.id}`, {
                                        method: 'DELETE',
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      if (res.ok) {
                                        setMembers(members.filter(m => m.id !== member.id));
                                        alert('تم حذف العضوية بنجاح');
                                      } else alert('خطأ في الحذف');
                                    } catch(e) { alert('خطأ في الاتصال'); }
                                  }
                                }} className="p-2.5 text-red-600 hover:bg-red-50 text-right w-full transition-colors">حذف عضوية</button>
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
                {logs.filter(l => l.action?.includes('دخول') || l.action?.includes('خروج') || l.action === 'LOGIN' || l.action === 'LOGOUT').length === 0 ? (
                  <div className="text-center text-gray-500 font-bold p-6">لا يوجد سجل دخول وخروج حالياً</div>
                ) : (
                  logs.filter(l => l.action?.includes('دخول') || l.action?.includes('خروج') || l.action === 'LOGIN' || l.action === 'LOGOUT').map((log: any) => {
                    const isLogin = log.action?.includes('دخول') || log.action === 'LOGIN';
                    return (
                      <div key={log.id} className="flex items-start justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
                         <div className="flex items-start gap-3">
                           <div className={`p-2 rounded-full text-white ${isLogin ? 'bg-green-500' : 'bg-red-500'}`}>
                             {isLogin ? <ArrowRight size={16}/> : <X size={16}/>}
                           </div>
                           <div>
                             <p className="text-sm font-bold text-gray-800">{log.user?.username || 'العضو'} قام بـ {isLogin ? 'تسجيل الدخول' : 'تسجيل الخروج'}</p>
                             <p className="text-xs text-gray-500 mt-1 font-bold">IP: {log.ipAddress || 'غير معروف'} - الجهاز: {log.device || 'غير معروف'}</p>
                           </div>
                         </div>
                         <div className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-sm">
                           {formatTimeAgo(log.createdAt)}
                         </div>
                      </div>
                    );
                  })
                )}
             </div>
          )}

          {/* Audit Tab */}
          {activeTab === 'audit' && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
                {logs.filter(l => !(l.action?.includes('دخول') || l.action?.includes('خروج') || l.action === 'LOGIN' || l.action === 'LOGOUT')).length === 0 ? (
                  <div className="text-center text-gray-500 font-bold p-6">لا توجد حالات سجل إشراف حالياً</div>
                ) : (
                  logs.filter(l => !(l.action?.includes('دخول') || l.action?.includes('خروج') || l.action === 'LOGIN' || l.action === 'LOGOUT')).map((log: any) => (
                    <div key={log.id} className="flex items-start justify-between p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors">
                       <div className="flex items-start gap-3">
                         <div className="bg-blue-100 p-2 rounded-full text-blue-600 border border-blue-200"><ShieldAlert size={16}/></div>
                         <div>
                           <p className="text-sm font-bold text-gray-800">{log.action}</p>
                           <p className="text-xs text-gray-500 mt-1 font-bold">المشرف: {log.user?.username || 'النظام'} | IP: {log.ipAddress || 'غير معروف'}</p>
                         </div>
                       </div>
                       <div className="text-xs font-bold text-gray-500">
                         {formatTimeAgo(log.createdAt)}
                       </div>
                    </div>
                  ))
                )}
             </div>
          )}

          {/* Bans Tab */}
          {activeTab === 'bans' && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-gray-800 text-lg text-right" dir="rtl">إضافة حظر جديد (آي بي أو جهاز)</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" id="ban-ip" placeholder="عنوان IP" className="border border-gray-300 rounded p-2 outline-none w-full" />
                    <input type="text" id="ban-device" placeholder="معرف الجهاز" className="border border-gray-300 rounded p-2 outline-none w-full" />
                    <button onClick={async () => {
                      const ip = (document.getElementById('ban-ip') as HTMLInputElement).value;
                      const device = (document.getElementById('ban-device') as HTMLInputElement).value;
                      if (!ip && !device) return alert('يجب إدخال IP أو جهاز');
                      const token = getToken();
                      try {
                        const res = await fetch(`${API_URL}/community/${slug}/bans`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ ipAddress: ip, device })
                        });
                        if (res.ok) {
                          const newBan = await res.json();
                          setBans([newBan, ...bans]);
                          (document.getElementById('ban-ip') as HTMLInputElement).value = '';
                          (document.getElementById('ban-device') as HTMLInputElement).value = '';
                        }
                      } catch (e) { alert('خطأ في الاتصال'); }
                    }} className="bg-red-600 text-white font-bold py-2 px-6 rounded hover:bg-red-700 w-full sm:w-auto">حظر</button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold text-gray-800 mb-4 text-lg">قائمة المحظورين</h3>
                  {bans.length === 0 ? (
                    <div className="text-center text-gray-500 font-bold p-6">لا يوجد محظورين</div>
                  ) : (
                    <table className="w-full text-right">
                      <thead className="bg-gray-100 border-b font-bold text-sm">
                        <tr><th className="p-3">IP / الجهاز</th><th className="p-3">التاريخ</th><th className="p-3 w-20">إجراء</th></tr>
                      </thead>
                      <tbody>
                        {bans.map(ban => (
                          <tr key={ban.id} className="border-b">
                            <td className="p-3 font-bold text-red-600" dir="ltr">{ban.ipAddress || ban.device}</td>
                            <td className="p-3 text-sm text-gray-600">{new Date(ban.createdAt).toLocaleDateString()}</td>
                            <td className="p-3">
                              <button onClick={async () => {
                                const token = getToken();
                                await fetch(`${API_URL}/community/${slug}/bans/${ban.id}`, {
                                  method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
                                });
                                setBans(bans.filter(b => b.id !== ban.id));
                              }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded font-bold text-xs">فك الحظر</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
           )}

          {/* Roles / Group Permissions Tab */}
          {activeTab === 'roles' && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
                
                {/* Header & Selector */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-gray-200 pb-4">
                  <div className="flex-1 w-full flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="font-bold text-gray-700 whitespace-nowrap">قائمة المجموعات:</label>
                    <select 
                      className="w-full border border-gray-300 rounded-md p-2 font-bold text-[#5C4033] outline-none focus:border-[#2b6cb0]"
                      value={selectedRoleId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedRoleId(val);
                        if(val === 'new') {
                          setEditingRole({ name: '', priority: 0, iconUrl: '', canKick: false, canKickRoom: false, canDeleteWall: false, canMuteWall: false, canLikeWall: true, canCommentWall: true, canQuickChat: false, canSendAlerts: false, canChangeOthersNicks: false, canChangeOwnNick: false, canBan: false, canPostAnnouncements: false, canOpenPrivate: false, canMoveUsers: false, canManageRooms: false, canCreateRooms: false, canEnterLockedRooms: false, canManageRoles: false, canMute: false, canEditLikes: false, canManageFilter: false, canManageSubscriptions: false });
                        } else if (val) {
                          setEditingRole(roles.find(r => r.id === val));
                        } else {
                          setEditingRole(null);
                        }
                      }}
                    >
                      <option value="">-- اختر المجموعة للتعديل --</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>[{r.priority}] {r.name}</option>
                      ))}
                      <option value="new" className="text-green-600 font-bold">+ إنشاء مجموعة جديدة</option>
                    </select>
                  </div>
                  
                  {editingRole && selectedRoleId !== 'new' && (
                    <button onClick={async () => {
                      if(confirm('هل أنت متأكد من حذف هذه المجموعة؟')) {
                        const token = getToken();
                        try {
                          await fetch(`${API_URL}/community/${slug}/roles/${selectedRoleId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                          setRoles(roles.filter(r => r.id !== selectedRoleId));
                          setSelectedRoleId('');
                          setEditingRole(null);
                          alert('تم الحذف بنجاح');
                        } catch(e) { alert('خطأ في الحذف'); }
                      }
                    }} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md flex items-center gap-1 shadow-sm">
                      حذف &times;
                    </button>
                  )}
                </div>

                {editingRole && (
                  <>
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="flex items-center">
                         <span className="w-32 bg-[#5C4033] text-white font-bold p-2 text-center rounded-r-md border border-[#5C4033]">الترتيب</span>
                         <input type="number" value={editingRole.priority} onChange={e => setEditingRole({...editingRole, priority: Number(e.target.value)})} className="flex-1 border border-gray-300 p-2 rounded-l-md outline-none font-bold text-center" />
                       </div>
                       <div className="flex items-center">
                         <span className="w-32 bg-[#5C4033] text-white font-bold p-2 text-center rounded-r-md border border-[#5C4033]">اسم المجموعة</span>
                         <input type="text" value={editingRole.name} onChange={e => setEditingRole({...editingRole, name: e.target.value})} className="flex-1 border border-gray-300 p-2 rounded-l-md outline-none font-bold text-center" />
                       </div>
                       <div className="flex items-center md:col-span-2">
                         <span className="w-32 bg-[#5C4033] text-white font-bold p-2 text-center rounded-r-md border border-[#5C4033]">الأيقونة</span>
                         <input type="text" placeholder="رابط صورة الأيقونة (اختياري)" value={editingRole.iconUrl || ''} onChange={e => setEditingRole({...editingRole, iconUrl: e.target.value})} className="flex-1 border border-gray-300 p-2 rounded-l-md outline-none font-bold text-left" dir="ltr" />
                       </div>
                    </div>

                    {/* Permissions */}
                    <div className="mt-4">
                      <h3 className="text-xl font-extrabold text-[#5C4033] mb-4 border-b pb-2">قائمة الصلاحيات</h3>
                      
      
                <label className="flex items-center gap-2 mt-4 text-[#5C4033] font-bold">
                  <input type="checkbox" checked={editingRole.isDefault || false} onChange={e => setEditingRole({...editingRole, isDefault: e.target.checked})} className="w-5 h-5 accent-[#5C4033]" />
                  رتبة افتراضية (تُعطى تلقائياً للأعضاء الجدد)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { key: 'canKick', label: 'الطرد' },
                          { key: 'canKickRoom', label: 'طرد من الغرفة' },
                          { key: 'canDeleteWall', label: 'حذف الحائط' },
                          { key: 'canMuteWall', label: 'إسكات حائط' },
                          { key: 'canLikeWall', label: 'الإعجاب بالحائط' },
                          { key: 'canCommentWall', label: 'التعليق بالحائط' },
                          { key: 'canQuickChat', label: 'الدردشة السريعة' },
                          { key: 'canSendAlerts', label: 'التنبيهات' },
                          { key: 'canChangeOthersNicks', label: 'تغيير النك (للغير)' },
                          { key: 'canChangeOwnNick', label: 'تغيير النكات (شخصي)' },
                          { key: 'canBan', label: 'الباند' },
                          { key: 'canPostAnnouncements', label: 'الإعلانات' },
                          { key: 'canOpenPrivate', label: 'فتح الخاص' },
                          { key: 'canMoveUsers', label: 'نقل من الغرفة' },
                          { key: 'canManageRooms', label: 'إدارة الغرفة' },
                          { key: 'canCreateRooms', label: 'إنشاء الغرف' },
                          { key: 'canEnterLockedRooms', label: 'الغرف (المقفلة)' },
                          { key: 'canManageRoles', label: 'إدارة العضويات' },
                          { key: 'canMute', label: 'إسكات العضو' },
                          { key: 'canEditLikes', label: 'تعديل لايكات العضو' },
                          { key: 'canManageFilter', label: 'الفلتر' },
                          { key: 'canManageSubscriptions', label: 'الاشتراكات' },
                        ].map(perm => (
                          <div key={perm.key} className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                            <div className="w-32 bg-[#4a3b32] text-white font-bold p-2 text-center text-[13px] border-l border-gray-200 flex-shrink-0">
                              {perm.label}
                            </div>
                            <label className="flex-1 p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                              <input 
                                type="checkbox" 
                                checked={editingRole[perm.key]} 
                                onChange={e => setEditingRole({...editingRole, [perm.key]: e.target.checked})}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                              />
                              <span className="font-bold text-sm text-gray-700 select-none">تفعيل</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end">
                      <button onClick={async () => {
                         const token = getToken();
                         try {
                           let res;
                           if (selectedRoleId === 'new') {
                             res = await fetch(`${API_URL}/community/${slug}/roles`, {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                               body: JSON.stringify(editingRole)
                             });
                           } else {
                             res = await fetch(`${API_URL}/community/${slug}/roles/${selectedRoleId}`, {
                               method: 'PATCH',
                               headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                               body: JSON.stringify(editingRole)
                             });
                           }
                           
                           if(res.ok) {
                             const savedRole = await res.json();
                             if (selectedRoleId === 'new') {
                               setRoles([...roles, savedRole]);
                               setSelectedRoleId(savedRole.id);
                             } else {
                               setRoles(roles.map(r => r.id === savedRole.id ? savedRole : r));
                             }
                             alert('تم حفظ الصلاحيات بنجاح!');
                           } else {
                             alert('حدث خطأ أثناء الحفظ');
                           }
                         } catch(e) { alert('خطأ في الاتصال'); }
                      }} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-md shadow-md text-lg">
                        حفظ جميع التعديلات
                      </button>
                    </div>
                  </>
                )}
             </div>
          )}

          {/* Google Index Tab */}
          {activeTab === 'google-index' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#5C4033] mb-2 flex items-center gap-2">
                  <Globe className="text-blue-500" />
                  حالة أرشفة الشات في قوقل
                </h2>
                <p className="text-gray-600 text-sm">
                  هذه الصفحة توضح ما إذا كان الشات الخاص بك يظهر في محركات البحث.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {indexingStatus === 'INDEXED' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <Check className="text-green-500 w-16 h-16 mb-2" />
                    <h3 className="text-xl font-bold text-green-700">تمت الفهرسة بنجاح</h3>
                    <p className="text-green-600 mt-2">اسم الشات يظهر الآن في نتائج بحث قوقل ويمكن للزوار العثور عليه.</p>
                  </div>
                )}
                
                {indexingStatus === 'PENDING' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <Clock className="text-blue-500 w-16 h-16 mb-2" />
                    <h3 className="text-xl font-bold text-blue-700">الشات جديد ولم يتفهرس بعد</h3>
                    <p className="text-blue-600 mt-2">روبوتات قوقل لم تقم بزيارة وفهرسة غرفتك حتى الآن. قد يستغرق الأمر بعض الوقت.</p>
                  </div>
                )}

                {indexingStatus === 'FAILED' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <ShieldAlert className="text-red-500 w-16 h-16 mb-2" />
                    <h3 className="text-xl font-bold text-red-700">تعذر فهرسة القناة</h3>
                    <p className="text-red-600 mt-2 font-bold">{indexingReason || 'سبب غير معروف.'}</p>
                    <p className="text-red-500 mt-1 text-sm">يرجى حل المشكلة ومن ثم طلب إعادة الفهرسة.</p>
                    
                    <button 
                      onClick={requestReindex}
                      className="mt-6 bg-red-600 text-white px-6 py-2 rounded font-bold hover:bg-red-700 transition-colors shadow-sm"
                    >
                      طلب إعادة الفهرسة
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
                  </div>
      </div>
    </div>
  );
}
