'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, Globe, Sparkles, MessageCircle } from 'lucide-react';

export default function CreateChatPage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/?redirect=/create-chat');
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!slug) {
      setIsAvailable(null);
      return;
    }
    
    // Validate slug format (only english letters, numbers, hyphens)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setIsAvailable(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data } = await supabase
          .from('channels')
          .select('id')
          .eq('slug', slug)
          .single();
        
        // If data exists, it's taken. If not, it's available.
        setIsAvailable(!data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable || !name || !slug) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('يجب تسجيل الدخول أولاً');
        return;
      }
      
      const { data: channel, error: insertError } = await supabase
        .from('channels')
        .insert({
           name,
           slug,
           is_group: true,
           is_private: false,
           created_by: session.user.id
        })
        .select()
        .single();
        
      if (insertError) {
         setError(insertError.message || 'حدث خطأ أثناء الإنشاء');
         return;
      }
      
      if (channel) {
         await supabase.from('channel_members').insert({
            channel_id: channel.id,
            user_id: session.user.id,
            role: 'owner'
         });
         router.push(`/c/${slug}/entry`);
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF5E6] flex flex-col items-center justify-center p-4 font-sans" dir="rtl">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#D2B48C]">
        <div className="bg-[#5C4033] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <Sparkles size={120} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 relative z-10">أطلق شاتك الخاص الآن 🚀</h1>
          <p className="text-[#FDF5E6] opacity-90 relative z-10">
            احجز الرابط الخاص بك وابدأ ببناء قناةك في ثوانٍ.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[#5C4033] mb-2">اسم الشات (الاسم الذي سيظهر للأعضاء)</label>
            <div className="relative">
              <MessageCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: شات سوالفنا"
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-4 focus:ring-[#8B5A2B]/10 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#5C4033] mb-2">الرابط المخصص (الدومين الخاص بك)</label>
            <div className="relative flex items-center">
              <div className="absolute right-3 text-gray-400">
                <Globe size={20} />
              </div>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="my-chat"
                className={`w-full pr-10 pl-24 py-3 rounded-xl border-2 transition-all outline-none text-left ${
                  slug ? (isAvailable ? 'border-green-500 focus:ring-green-500/10' : (isAvailable === false ? 'border-red-500 focus:ring-red-500/10' : 'border-[#8B5A2B] focus:ring-[#8B5A2B]/10')) : 'border-gray-200 focus:border-[#8B5A2B] focus:ring-[#8B5A2B]/10'
                }`}
                required
                dir="ltr"
              />
              <div className="absolute left-3 text-gray-400 text-sm font-medium pointer-events-none" dir="ltr">
                .yourdomain.com
              </div>
            </div>
            
            {/* Availability Indicator */}
            <div className="mt-2 flex items-center text-sm font-bold h-5">
              {isChecking && (
                <div className="flex items-center text-gray-500">
                  <Loader2 size={14} className="animate-spin ml-1" />
                  جاري التحقق من الرابط...
                </div>
              )}
              {!isChecking && slug && isAvailable === true && (
                <div className="flex items-center text-green-600">
                  <Check size={16} className="ml-1" />
                  الرابط متاح! مبروك.
                </div>
              )}
              {!isChecking && slug && isAvailable === false && (
                <div className="flex items-center text-red-500">
                  <X size={16} className="ml-1" />
                  عذراً، هذا الرابط محجوز أو غير صالح.
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isAvailable || !name || isSubmitting}
            className="w-full bg-[#5C4033] hover:bg-[#8B5A2B] text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
          >
            {isSubmitting ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              'إنشاء الشات الآن'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
