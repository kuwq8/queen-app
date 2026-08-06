'use client';


import { API_URL } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Sparkles, User, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const bodyPayload = isLogin ? { email, password } : { email, username, password };
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        setSuccessMsg(isLogin ? 'تم تسجيل الدخول بنجاح! أهلاً بعودتك.' : 'تم إنشاء الحساب بنجاح!');
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      } else {
        setErrorMsg(data.message || 'فشلت عملية المصادقة');
      }
    } catch (err) {
      setErrorMsg('خطأ في الشبكة، يرجى التأكد من تشغيل الخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black font-sans">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel w-full max-w-md p-8 relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 mb-4 ring-1 ring-cyan-500/20">
            <Sparkles className="w-8 h-8 text-cyan-500" />
          </div>
          <h1 className="text-3xl font-bold text-cyan-500">
            Gemini Social
          </h1>
          <p className="text-slate-400 mt-2">
            {isLogin ? 'سجل دخولك لاكتشاف العالم' : 'أنشئ حساباً جديداً لتنضم إلينا'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">اسم المستخدم</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="input-field pr-11 pl-4"
                  placeholder="اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                className="input-field pr-11 pl-4 text-left"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">كلمة المرور</label>
              {isLogin && <a href="#" className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors">نسيت كلمة المرور؟</a>}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                className="input-field pr-11 pl-4 text-left tracking-widest"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="animate-pulse">{isLogin ? 'جاري التحقق...' : 'جاري إنشاء الحساب...'}</span>
            ) : (
              <>
                {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
                {/* ArrowLeft is used because in RTL, we point to the left to go "forward" */}
                <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{' '}
          <button 
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }} 
            className="text-cyan-500 hover:text-cyan-400 font-medium transition-colors"
          >
            {isLogin ? 'أنشئ حساباً مجاناً' : 'سجل دخولك بدلاً من ذلك'}
          </button>
        </p>
      </div>
    </main>
  );
}
