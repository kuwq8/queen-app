'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ImagePlus } from 'lucide-react';
import Link from 'next/link';

export default function CreateCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      // Insert Community
      const { data: community, error: insertError } = await supabase
        .from('communities')
        .insert({
          name: name.trim(),
          description: description.trim(),
          creator_id: session.user.id,
          // members_count will be handled by trigger when we insert the member!
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
           throw new Error('يوجد قناة بهذا الاسم مسبقاً.');
        }
        throw insertError;
      }

      if (community) {
        // Automatically add creator as an admin member
        await supabase
          .from('community_members')
          .insert({
            community_id: community.id,
            user_id: session.user.id,
            role: 'admin'
          });

        router.push(`/communities/${community.id}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء إنشاء القناة.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-black font-sans text-right">
      <div className="w-full max-w-[600px] flex flex-col relative border-x border-slate-800 min-h-screen bg-black">
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-slate-800 p-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-white">
            <ArrowRight size={20} />
          </button>
          <h2 className="text-lg font-bold text-white">إنشاء قناة جديد</h2>
        </header>

        <main className="p-4 flex-1">
          <form onSubmit={handleCreate} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-white font-bold text-sm block">اسم القناة</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: مبرمجون العرب"
                maxLength={50}
                required
                className="w-full bg-[#111] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <p className="text-slate-500 text-xs">يجب أن يكون الاسم فريداً وقصيراً.</p>
            </div>

            <div className="space-y-2">
              <label className="text-white font-bold text-sm block">الوصف (اختياري)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="عن ماذا يتحدث هذا القناة؟"
                maxLength={200}
                rows={4}
                className="w-full bg-[#111] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-bold text-sm block">الصور</label>
              <div className="p-6 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 bg-[#0a0a0f]">
                <ImagePlus size={32} className="mb-2" />
                <p className="text-sm font-bold">إضافة صورة غلاف أو شعار</p>
                <p className="text-xs mt-1">الميزة قيد التطوير وستتوفر قريباً!</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm font-bold text-center">
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-slate-800">
              <button 
                type="submit" 
                disabled={!name.trim() || isLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'جاري الإنشاء...' : 'إنشاء القناة'}
              </button>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}
