'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err) {
      setErrorMsg('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      
      if (authMode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        });
        if (error) throw error;
        // If no email confirmation required, redirect.
        if (data.session) {
          router.push('/home');
        } else {
          setErrorMsg('يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (data.session) {
          router.push('/home');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black font-sans">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel w-full max-w-md p-8 relative z-10 animate-fade-in-up text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 mb-4 ring-1 ring-cyan-500/20">
            <Sparkles className="w-8 h-8 text-cyan-500" />
          </div>
          <h1 className="text-3xl font-bold text-cyan-500">
            Gemini Social
          </h1>
          <p className="text-slate-400 mt-2">
            مرحباً بك في مجتمعنا! سجل دخولك للمتابعة
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-right">
            {errorMsg}
          </div>
        )}

        {/* Tabs for Login/Register */}
        <div className="flex gap-2 mb-6 bg-slate-900 p-1 rounded-lg">
          <button 
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${authMode === 'login' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            تسجيل الدخول
          </button>
          <button 
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${authMode === 'register' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6 text-right">
          <div>
            <input 
              type="email" 
              placeholder="البريد الإلكتروني" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-right"
              required
            />
          </div>
          
          {authMode === 'register' && (
            <div>
              <input 
                type="text" 
                placeholder="اسم المستخدم (بدون مسافات)" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-right"
                required
              />
            </div>
          )}

          <div>
            <input 
              type="password" 
              placeholder={authMode === 'register' ? "كلمة المرور (6 أحرف على الأقل)" : "كلمة المرور"} 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-right"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-70"
          >
            {isLoading ? 'جاري التحميل...' : (authMode === 'register' ? 'إنشاء الحساب' : 'تسجيل الدخول')}
          </button>
        </form>

        <div className="relative flex items-center py-2 mb-6">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">أو</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-70"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            {isLoading ? 'جاري التحويل...' : 'الدخول باستخدام Google'}
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          </button>
        </div>
      </div>
    </main>
  );
}
