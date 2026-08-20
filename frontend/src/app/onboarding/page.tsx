'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_onboarded, username')
        .eq('id', session.user.id)
        .single();
        
      if (profile?.is_onboarded) {
        router.push('/home');
      } else {
        // Pre-fill username if it's reasonable
        if (profile?.username && !profile.username.startsWith('user_') && !profile.username.startsWith('debug')) {
          setUsername(profile.username);
        }
        setIsLoading(false);
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!username || username.trim() === '') {
      setErrorMsg('اسم المستخدم مطلوب');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setErrorMsg('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط');
      return;
    }
    if (username.length < 3) {
      setErrorMsg('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return;
    }
    
    setIsSaving(true);
    
    // Check uniqueness
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', session.user.id)
      .maybeSingle();
      
    if (existingUser) {
      setErrorMsg('اسم المستخدم محجوز، يرجى اختيار اسم آخر');
      setIsSaving(false);
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        first_name: firstName,
        last_name: lastName,
        bio,
        is_onboarded: true
      })
      .eq('id', session.user.id);
      
    if (error) {
      setErrorMsg('حدث خطأ أثناء حفظ البيانات: ' + error.message);
      setIsSaving(false);
    } else {
      router.push('/home');
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-black text-white"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
  }

  return (
    <div className="flex h-screen bg-black text-white items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-2">مرحباً بك في Gemini Social 👋</h1>
        <p className="text-slate-400 mb-6 text-sm">دعنا نكمل إعداد حسابك قبل البدء في استخدام التطبيق.</p>
        
        {errorMsg && (
          <div className="bg-red-900/30 text-red-400 p-3 rounded-xl mb-6 text-sm border border-red-900/50">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">اسم المستخدم (مطلوب)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500" dir="ltr">@</div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 pl-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="username"
                dir="ltr"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">الاسم الأول (اختياري)</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="أحمد"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">الاسم الأخير (اختياري)</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="محمد"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">النبذة (اختياري)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[80px] resize-none"
              placeholder="اكتب شيئاً عن نفسك..."
            />
          </div>
          
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-6"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'إكمال الإعداد'}
          </button>
        </form>
      </div>
    </div>
  );
}
