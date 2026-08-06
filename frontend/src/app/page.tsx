'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://queen-app-six.vercel.app/auth/callback',
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

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            {isLoading ? 'جاري التحويل...' : 'تسجيل الدخول باستخدام Google'}
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          </button>
        </div>
      </div>
    </main>
  );
}
