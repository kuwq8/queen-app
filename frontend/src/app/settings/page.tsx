'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, User, Lock, Bell, Shield, Star, ChevronRight, LogOut, Loader2, ArrowRight } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  // Settings State
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }
      setSession(session);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePrivacy = async (field: string, value: any) => {
    if (!profile) return;
    const previousProfile = { ...profile };
    try {
      setIsSaving(true);
      setProfile({ ...profile, [field]: value }); // Optimistic update
      
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', profile.id);
        
      if (error) {
        setProfile(previousProfile); // Rollback on error
        console.error(error);
      }
    } catch (err) {
      console.error(err);
      setProfile(previousProfile); // Rollback on exception
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSignOutOtherSessions = async () => {
    try {
      setIsSaving(true);
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut({ scope: 'others' });
      alert('تم تسجيل الخروج من الأجهزة الأخرى بنجاح');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen bg-black text-slate-200 font-sans">
      <div className="w-full max-w-2xl bg-black border-x border-slate-800 min-h-screen flex flex-col relative pb-20 sm:pb-0">
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-slate-800 p-3 px-4 flex items-center gap-4">
          <button onClick={() => router.back()} aria-label="الرجوع" className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowRight size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">الإعدادات</h2>
            <p className="text-xs text-slate-500">@{profile?.username}</p>
          </div>
        </header>

        <div className="flex flex-col sm:flex-row flex-1">
          {/* Tabs / Sidebar */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-l border-slate-800 p-2 overflow-x-auto flex sm:flex-col gap-1 hide-scrollbar">
            <button 
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'account' ? 'bg-cyan-500/10 text-cyan-500 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <User size={18} /> <span>حسابك</span>
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'privacy' ? 'bg-cyan-500/10 text-cyan-500 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Lock size={18} /> <span>الخصوصية والأمان</span>
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'notifications' ? 'bg-cyan-500/10 text-cyan-500 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Bell size={18} /> <span>الإشعارات</span>
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'security' ? 'bg-cyan-500/10 text-cyan-500 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Shield size={18} /> <span>الأمان</span>
            </button>
            <button 
              onClick={() => setActiveTab('premium')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'premium' ? 'bg-yellow-500/10 text-yellow-500 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Star size={18} /> <span>الاشتراك</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4">
            
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">حسابك</h3>
                  <p className="text-sm text-slate-400 mb-6">إعدادات ملفك الشخصي ومعلومات الحساب الأساسية.</p>
                </div>

                <div className="bg-[#111] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                  <Link href={`/${profile?.username}`} className="flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors">
                    <div>
                      <h4 className="font-bold text-white text-[15px]">تعديل الملف الشخصي</h4>
                      <p className="text-slate-500 text-xs mt-1">تغيير الصورة، الغلاف، النبذة والاسم</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </Link>
                  <div className="flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors cursor-not-allowed opacity-70">
                    <div>
                      <h4 className="font-bold text-white text-[15px]">اسم المستخدم</h4>
                      <p className="text-slate-500 text-xs mt-1">@{profile?.username}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors cursor-not-allowed opacity-70">
                    <div>
                      <h4 className="font-bold text-white text-[15px]">البريد الإلكتروني</h4>
                      <p className="text-slate-500 text-xs mt-1">{session?.user?.email}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-bold hover:bg-red-500/10 rounded-2xl transition-colors mt-8"
                >
                  <LogOut size={18} /> تسجيل الخروج
                </button>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">الخصوصية والأمان</h3>
                  <p className="text-sm text-slate-400 mb-6">تحكم في من يمكنه رؤية محتواك والتواصل معك.</p>
                </div>

                <div className="bg-[#111] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-[15px]">حساب خاص (Private Account)</h4>
                      <p className="text-slate-500 text-xs mt-1 max-w-[250px]">عند التفعيل، لن يرى منشوراتك سوى متابعيك، ويجب الموافقة على أي متابعة جديدة.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={profile?.is_private || false}
                        onChange={(e) => handleUpdatePrivacy('is_private', e.target.checked)}
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-[15px]">إخفاء حالة النشاط</h4>
                      <p className="text-slate-500 text-xs mt-1">منع الآخرين من معرفة متى تكون متصلاً.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={profile?.hide_activity || false}
                        onChange={(e) => handleUpdatePrivacy('hide_activity', e.target.checked)}
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                </div>

                <h4 className="font-bold text-slate-300 mt-6 mb-2 px-1 text-sm uppercase tracking-wider">التواصل والتفاعل</h4>
                <div className="bg-[#111] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                  <div className="p-4 flex flex-col gap-2">
                    <h4 className="font-bold text-white text-[15px]">من يمكنه مراسلتي؟</h4>
                    <select 
                      value={profile?.allow_messages || 'everyone'} 
                      onChange={(e) => handleUpdatePrivacy('allow_messages', e.target.value)}
                      disabled={isSaving}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                    >
                      <option value="everyone">الجميع</option>
                      <option value="followers">المتابعون فقط</option>
                      <option value="nobody">لا أحد</option>
                    </select>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-2">
                    <h4 className="font-bold text-white text-[15px]">من يمكنه الاتصال بي (صوت/فيديو)؟</h4>
                    <select 
                      value={profile?.allow_calls || 'everyone'} 
                      onChange={(e) => handleUpdatePrivacy('allow_calls', e.target.value)}
                      disabled={isSaving}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                    >
                      <option value="everyone">الجميع</option>
                      <option value="followers">المتابعون فقط</option>
                      <option value="nobody">لا أحد</option>
                    </select>
                  </div>

                  <div className="p-4 flex flex-col gap-2">
                    <h4 className="font-bold text-white text-[15px]">من يمكنه التعليق على منشوراتي؟</h4>
                    <select 
                      value={profile?.allow_comments || 'everyone'} 
                      onChange={(e) => handleUpdatePrivacy('allow_comments', e.target.value)}
                      disabled={isSaving}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                    >
                      <option value="everyone">الجميع</option>
                      <option value="followers">المتابعون فقط</option>
                      <option value="nobody">لا أحد</option>
                    </select>
                  </div>

                  <div className="p-4 flex flex-col gap-2">
                    <h4 className="font-bold text-white text-[15px]">من يمكنه التفاعل مع منشوراتي (إعجاب)؟</h4>
                    <select 
                      value={profile?.allow_interactions || 'everyone'} 
                      onChange={(e) => handleUpdatePrivacy('allow_interactions', e.target.value)}
                      disabled={isSaving}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                    >
                      <option value="everyone">الجميع</option>
                      <option value="followers">المتابعون فقط</option>
                      <option value="nobody">لا أحد</option>
                    </select>
                  </div>
                </div>

              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">الأمان</h3>
                  <p className="text-sm text-slate-400 mb-6">حافظ على أمان حسابك والجلسات النشطة.</p>
                </div>

                <div className="bg-[#111] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                  <div className="p-4 flex items-center justify-between hover:bg-slate-900/50 transition-colors cursor-not-allowed opacity-70">
                    <div>
                      <h4 className="font-bold text-white text-[15px]">تغيير كلمة المرور</h4>
                      <p className="text-slate-500 text-xs mt-1">قم بتحديث كلمة المرور الخاصة بك</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>
                </div>

                <div className="bg-[#111] border border-slate-800 rounded-2xl overflow-hidden mt-6 p-4">
                  <h4 className="font-bold text-white text-[15px]">الجلسات النشطة</h4>
                  <p className="text-slate-500 text-xs mt-1 mb-4">تسجيل الخروج من جميع الأجهزة الأخرى المتصلة بحسابك حالياً.</p>
                  
                  <button 
                    onClick={handleSignOutOtherSessions}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center py-2.5 rounded-lg border border-red-500/30 text-red-500 font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    تسجيل الخروج من الأجهزة الأخرى
                  </button>
                </div>
              </div>
            )}

            {/* Premium Tab */}
            {activeTab === 'premium' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                    <Star size={40} className="text-white drop-shadow-md" fill="white" />
                  </div>
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 mb-2">Gemini Premium</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">ارتقِ بتجربتك واحصل على ميزات حصرية مصممة لصناع المحتوى المميزين.</p>
                </div>

                <div className="bg-gradient-to-b from-[#1a1500] to-black border border-yellow-500/20 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                  
                  <h4 className="font-bold text-white text-lg mb-4 relative z-10">الميزات الحصرية:</h4>
                  <ul className="space-y-3 relative z-10">
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><Star size={12} className="text-yellow-500" fill="currentColor"/></div>
                      شارة التوثيق الذهبية بجوار اسمك
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><Star size={12} className="text-yellow-500" fill="currentColor"/></div>
                      أولوية في ظهور المنشورات (Boost)
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><Star size={12} className="text-yellow-500" fill="currentColor"/></div>
                      مكالمات فيديو بدقة 4K
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><Star size={12} className="text-yellow-500" fill="currentColor"/></div>
                      إحصائيات متقدمة لحسابك
                    </li>
                  </ul>

                  <button className="w-full mt-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-lg transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] relative z-10">
                    الترقية الآن - $9.99 / شهر
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">الإشعارات</h3>
                  <p className="text-sm text-slate-400 mb-6">إعدادات الإشعارات قيد التطوير.</p>
                </div>
              </div>
            )}

          </div>
        </div>
        
        <BottomNav activeTab={'' as any} />
      </div>
    </div>
  );
}
